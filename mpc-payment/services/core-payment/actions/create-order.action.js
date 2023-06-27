const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const uuid = require("uuid");
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const accountId = _.get(ctx.meta.auth, "_id");

		const accountInfo = await this.broker.call("v1.accountModel.findOne", [
			{ _id: accountId },
		]);

		if (!_.get(accountInfo, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		const transaction = uuid.v4();

		// Create order object
		const order = {
			...payload,
			status: PaymentConstant.ORDER_STATE.PENDING,
			accountId,
			transaction,
		};

		const newOrder = await this.broker.call("v1.orderModel.create", [
			order,
		]);

		if (!_.get(newOrder, "_id")) {
			throw new MoleculerError("Create order failed", 400);
		}

		return {
			code: 201,
			data: {
				message: "Order created successfully",
				path: `payment/order?transaction=${transaction}`,
				order: _.pick(newOrder, [
					"transaction",
					"amount",
					"paymentMethod",
					"state",
					"currency",
					"description",
				]),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Payment->Create Order]: ${err.message}`);
	}
};
