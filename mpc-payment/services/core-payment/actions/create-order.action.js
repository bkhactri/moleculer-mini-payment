const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");
const uuid = require("uuid");
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const accountId = _.get(ctx.meta.auth, "_id");

		const accountInfo = await this.broker.call("v1.account.model.findOne", [
			{ _id: ObjectId(accountId) },
		]);

		if (!_.get(accountInfo, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		// Prepare order information
		const fee =
			payload.paymentMethod === PaymentConstant.ORDER_PAY_METHOD.ATM_CARD
				? 5000
				: 0;
		const total = payload.amount + fee;
		const transaction = uuid.v4();

		// Create order object
		const order = {
			...payload,
			status: PaymentConstant.ORDER_STATE.PENDING,
			accountId,
			transaction,
			fee,
			total,
		};

		const newOrder = await this.broker.call("v1.order.model.create", [
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
					"total",
					"fee",
					"paymentMethod",
					"state",
					"currency",
					"note",
					"description",
				]),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Payment->Create Order]: ${err.message}`);
	}
};
