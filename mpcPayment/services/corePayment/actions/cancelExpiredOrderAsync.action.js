const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const result = await this.broker.call("v1.orderModel.updateOne", [
			{ id: ctx.params.id },
			{
				$set: {
					state: "CANCELLED",
				},
			},
		]);

		return result;
	} catch (error) {
		if (error.name === "MoleculerError") {
			throw error;
		}

		throw new MoleculerError(
			`[Payment->Update Async Order]: ${error.message}`
		);
	}
};
