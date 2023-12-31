const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const uuid = require("uuid");
const PaymentConstant = require("../constants/payment.constant");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const accountId = _.get(ctx.meta.auth, "id");

		const accountInfo = await this.broker.call("v1.accountModel.findOne", [
			{ id: accountId },
		]);

		if (!_.get(accountInfo, "id")) {
			throw new MoleculerError(this.t(ctx, "auth.accountNotFound"), 404);
		}

		const transaction = uuid.v4();

		// Create order object
		const order = {
			...payload,
			status: PaymentConstant.ORDER_STATE.PENDING,
			ownerId: accountId,
			transaction,
		};

		const newOrder = await this.broker.call("v1.orderModel.create", [
			order,
		]);

		if (!_.get(newOrder, "id")) {
			throw new MoleculerError(this.t(ctx, "fail.createOrder"), 400);
		}

		return {
			code: 201,
			data: {
				message: this.t(ctx, "success.createOrder"),
				urlPath: `payment/order?transaction=${transaction}`,
				order: _.pick(newOrder, [
					"id",
					"transaction",
					"amount",
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
