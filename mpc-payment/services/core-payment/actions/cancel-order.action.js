const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const { transaction } = ctx.params.body;

		const order = await this.broker.call("v1.orderModel.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "_id")) {
			throw new MoleculerError("Order not found", 404);
		}

		if (_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING) {
			throw new MoleculerError(
				"Can not cancel order for some reason",
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
					message: "Order cancelled",
				},
			};
		}

		throw new MoleculerError("Cancel order failed. Please try again", 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Payment->Cancel Order]: ${err.message}`);
	}
};
