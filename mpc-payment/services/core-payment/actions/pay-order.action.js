/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");

function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = async function (ctx) {
	const accountId = _.get(ctx.meta.auth, "id");

	const lock = await this.tryLock(accountId);

	await delay(Math.floor(Math.random() * 1000));

	try {
		try {
			const accountId = _.get(ctx.meta.auth, "id");
			const { transaction, note, payment } = ctx.params.body;

			const order = await this.broker.call("v1.orderModel.findOne", [
				{ transaction },
			]);

			if (!_.get(order, "id")) {
				throw new MoleculerError(
					this.t(ctx, "error.orderNotFound"),
					404
				);
			}

			if (_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING) {
				throw new MoleculerError(
					this.t(ctx, "error.orderNotAvailableToPay"),
					400
				);
			}

			let fee = 0;
			let total = 0;

			if (payment.method === PaymentConstant.ORDER_PAY_METHOD.WALLET) {
				const wallet = await this.broker.call(
					"v1.walletModel.findOne",
					[{ accountId }]
				);

				if (!_.get(wallet, "id")) {
					throw new MoleculerError(
						this.t(ctx, "error.walletNotFound"),
						404
					);
				}

				fee = 5000;
				total = order.amount + fee;

				if (wallet.balance < total) {
					throw new MoleculerError(
						this.t(ctx, "error.balanceNotEnough"),
						400
					);
				}

				const balanceBefore = wallet.balance;
				const balanceAfter = wallet.balance - total;

				try {
					// Tracking history
					await this.broker.call("v1.historyModel.create", [
						{
							accountId,
							orderId: order.id,
							..._.pick(order, [
								"transaction",
								"description",
								"currency",
								"note",
								"amount",
							]),
							paymentMethod: payment.method,
							balanceBefore,
							balanceAfter,
							total,
							fee,
							note,
						},
					]);

					// Mark order as complete
					await this.broker.call("v1.orderModel.updateOne", [
						{ id: order.id },
						{
							$set: {
								state: PaymentConstant.ORDER_STATE.SUCCEEDED,
							},
						},
					]);

					// Update balance
					const paidResult = await this.broker.call(
						"v1.account.updateBalance",
						{
							accountId,
							newBalance: balanceAfter,
						}
					);

					if (paidResult.code !== 200) {
						// Restore action
						await this.broker.call("v1.orderModel.updateOne", [
							{ id: order.id },
							{
								$set: {
									state: PaymentConstant.ORDER_STATE.FAILED,
								},
							},
						]);

						await this.broker.call("v1.historyModel.deleteOne", {
							transaction,
						});
					}

					return {
						code: 200,
						data: {
							message: this.t(ctx, "success.payOrder"),
						},
					};
				} catch (error) {
					// Log and throw error
					console.error(error);
					throw error;
				}
			}

			if (payment.method === PaymentConstant.ORDER_PAY_METHOD.ATM_CARD) {
				throw new MoleculerError(
					this.t(ctx, "error.paymentMethodNotSupport"),
					400
				);
			}
		} catch (err) {
			if (err.name === "MoleculerError") throw err;
			throw new MoleculerError(`[Payment->Pay Order]: ${err.message}`);
		}
	} finally {
		await this.unlock(lock.key);
	}
};
