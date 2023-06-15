const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const transaction = _.get(ctx.params.params, "transaction");
		console.log("transaction", transaction);

		const order = await this.broker.call("v1.order.model.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "_id")) {
			throw new MoleculerError("Order not found", 404);
		}

		return {
			code: 200,
			data: {
				message: "Success",
				order: _.pick(order, [
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
		throw new MoleculerError(
			`[Payment->Get Order Information]: ${err.message}`
		);
	}
};
