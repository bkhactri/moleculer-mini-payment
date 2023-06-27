const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const { startSession } = require("mongoose");

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "_id");
		const { transaction, payment } = ctx.params.body;

		const order = await this.broker.call("v1.orderModel.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "_id")) {
			throw new MoleculerError("Order not found", 404);
		}

		const wallet = await this.broker.call("v1.walletModel.findOne", [
			{ accountId: accountId },
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

			if (wallet.balance < order.amount) {
				throw new MoleculerError("Wallet balance not enough", 400);
			}

			const session = await startSession();

			try {
				session.startTransaction();

				// Calculate payment
				const balanceBefore = wallet.balance;
				const balanceAfter = wallet.balance - order.amount;

				await this.broker.call("v1.account.updateBalance", [
					{
						accountId,
						transactionAmount: total,
						currency: order.currency,
						action: "SUBTRACT",
					},
				]);

				await session.commitTransaction();
			} catch (error) {
				await session.abortTransaction();
			} finally {
				session.endSession();
			}
		}

		if (payment.method === PaymentConstant.ORDER_PAY_METHOD.ATM_CARD) {
			throw new MoleculerError(
				"We do support this payment method yet",
				400
			);
		}

		return true;
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Payment->Pay Order]: ${err.message}`);
	}
};
