/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstants = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const supplierResponse = { ...ctx.params.body, receivedAt: new Date() };
		const { partnerTransaction, orderId, state } = supplierResponse;

		// Checking order
		const order = await this.broker.call("v1.orderModel.findOne", [
			{ id: orderId },
		]);

		if (order.state === PaymentConstants.ORDER_STATE.PENDING) {
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
				throw new MoleculerError(
					this.t(ctx, "fail.atmCardPayOrder"),
					500
				);
			}

			const updatedHistory = await this.broker.call(
				"v1.historyModel.updateOne",
				[
					{ orderId },
					{
						$set: {
							partnerTransaction,
							completedAt: new Date(),
							state:
								state === "SUCCESS"
									? PaymentConstants.HISTORY_STATE.COMPLETED
									: PaymentConstants.HISTORY_STATE.FAILED,
						},
						$push: {
							supplierResponses: supplierResponse,
						},
					},
				],
				{ retries: 3, delay: 300 }
			);

			const socketParams = {};
			socketParams.orderId = orderId;
			socketParams.transactionId = partnerTransaction;

			if (!_.get(updatedHistory, "ok")) {
				socketParams.state = "FAILED";
			} else {
				socketParams.state = "SUCCEEDED";
			}

			this.broker.broadcast("graphql.publish", {
				tag: "PAYMENT-APP",
				payload: socketParams,
			});

			return { ok: 1 };
		} else {
			// Order state is not PENDING
			if (order.state === PaymentConstants.ORDER_STATE.SUCCEEDED) {
				this.logger.warn(
					this.t(ctx, "warn.IpnDuplicateCompletedOrder")
				);

				return { ok: 1 };
			} else {
				this.logger.error(this.t(ctx, "error.canNotProcessIPN"));
				throw new MoleculerError(
					this.t(ctx, "error.canNotProcessIPN"),
					500
				);
			}
		}
	} catch (error) {
		console.log(error);
		throw new MoleculerError(`[Payment -> IPN Handler]: ${error.message}`);
	}
};
