const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	const orderId = ctx.params.id;

	const lock = await this.tryLock(orderId);

	console.log("params", ctx.params);

	try {
		const result = await this.broker.call(
			"v1.orderModel.updateOne",
			ctx.params.data
		);

		await this.unlock(lock.key);

		return result;
	} catch (error) {
		await this.unlock(lock.key);

		if (error.name === "MoleculerError") {
			throw error;
		}

		throw new MoleculerError(
			`[Payment->Update Async Order]: ${error.message}`
		);
	}
};
