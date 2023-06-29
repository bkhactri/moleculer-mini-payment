const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	const lock = await this.tryLock(_.get(ctx.meta.auth, "_id"));

	try {
		try {
			const accountId = _.get(ctx.meta.auth, "_id");
			const { transaction, note, payment } = ctx.params.body;

			const order = await this.broker.call("v1.orderModel.findOne", [
				{ transaction },
			]);

			if (!_.get(order, "_id")) {
				throw new MoleculerError("Order not found", 404);
			}

			if (_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING) {
				throw new MoleculerError("Order not available to pay", 400);
			}

			const wallet = await this.broker.call("v1.walletModel.findOne", [
				{ accountId },
			]);

			if (!_.get(wallet, "_id")) {
				throw new MoleculerError(
					"Wallet not found. Please contact for support",
					404
				);
			}

			let fee = 0;
			let total = 0;

			if (payment.method === PaymentConstant.ORDER_PAY_METHOD.WALLET) {
				fee = 5000;
				total = order.amount + fee;

				if (wallet.balance < total) {
					throw new MoleculerError(
						"Wallet balance not enough to complete the transaction",
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
							orderId: order._id,
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
						{ _id: order._id },
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

					if (!paidResult.ok) {
						// Restore action
						await this.broker.call("v1.orderModel.updateOne", [
							{ _id: order._id },
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
							message: "Paid successfully",
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
					"We do support this payment method yet",
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
