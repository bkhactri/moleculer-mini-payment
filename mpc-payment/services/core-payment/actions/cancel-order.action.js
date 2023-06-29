const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "id");
		const { transaction } = ctx.params.body;

		const order = await this.broker.call("v1.orderModel.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "id")) {
			throw new MoleculerError(this.t(ctx, "error.orderNotFound"), 404);
		}

		if (
			_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING ||
			accountId !== _.get(order, "ownerId")
		) {
			throw new MoleculerError(
				this.t(ctx, "error.canNotCancelOrder"),
				400
			);
		}

		const cancelOrder = await this.broker.call("v1.orderModel.updateOne", [
			{ transaction },
			{ $set: { state: PaymentConstant.ORDER_STATE.CANCELLED } },
		]);

		if (cancelOrder.ok) {
			return {
				code: 200,
				data: {
					message: this.t(ctx, "success.cancelOrder"),
				},
			};
		}

		throw new MoleculerError(this.t(ctx, "fail.cancelOrder"), 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Payment->Cancel Order]: ${err.message}`);
	}
};
