const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const transaction = _.get(ctx.params.params, "transaction");

		const order = await this.broker.call("v1.orderModel.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "_id")) {
			throw new MoleculerError(this.t(ctx, "error.orderNotFound"), 404);
		}

		return {
			code: 200,
			data: {
				message: this.t(ctx, "success.getOrder"),
				order: _.pick(order, [
					"transaction",
					"amount",
					"total",
					"fee",
					"state",
					"currency",
					"note",
					"description",
				]),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Payment->Get Order Information]: ${err.message}`
		);
	}
};
