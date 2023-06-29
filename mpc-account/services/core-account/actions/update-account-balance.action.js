const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const { accountId, newBalance } = ctx.params;

		const updateAccountBalance = await this.broker.call(
			"v1.walletModel.updateOne",
			[{ accountId }, { $set: { balance: newBalance } }]
		);

		if (updateAccountBalance.ok) {
			return {
				ok: 1,
				code: 200,
				data: {
					message: "Updated account balance successfully",
				},
			};
		}

		throw new MoleculerError(
			"Update account balance failed. Please try again later",
			400
		);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Update Balance]: ${err.message}`);
	}
};
