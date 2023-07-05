/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstants = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const { atmTransaction, orderId, state } = ctx.params.body;

		const updatedOrder = await this.broker.call(
			"v1.orderModel.updateOne",
			[
				{ id: orderId },
				{
					$set: {
						state:
							state === "SUCCESS"
								? PaymentConstants.ORDER_STATE.SUCCEEDED
								: PaymentConstants.ORDER_STATE.FAILED,
					},
				},
			],
			{ retries: 3, delay: 300 }
		);

		if (!_.get(updatedOrder, "ok")) {
			throw new MoleculerError(this.t(ctx, "fail.atmCardPayOrder"), 500);
		}

		const updatedHistory = await this.broker.call(
			"v1.historyModel.updateOne",
			[
				{ orderId },
				{
					$set: {
						atmTransactionId: atmTransaction,
						state:
							state === "SUCCESS"
								? PaymentConstants.HISTORY_STATE.COMPLETED
								: PaymentConstants.HISTORY_STATE.FAILED,
					},
				},
			],
			{ retries: 3, delay: 300 }
		);

		if (!_.get(updatedHistory, "ok")) {
			throw new MoleculerError(this.t(ctx, "fail.atmCardPayOrder"), 500);
		}

		return { ok: 1 };
	} catch (error) {
		console.log(error);
		throw new MoleculerError(`[Payment -> IPN Handler]: ${error.message}`);
	}
};
