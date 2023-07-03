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
				code: 200,
				data: {
					message: this.t(ctx, "success.updatedBalance"),
				},
			};
		}

		throw new MoleculerError(this.t(ctx, "fail.updatedBalance"), 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Update Balance]: ${err.message}`);
	}
};
