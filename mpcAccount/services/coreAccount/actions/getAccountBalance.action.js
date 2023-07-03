const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "id");
		const wallet = await this.broker.call("v1.walletModel.findOne", [
			{ accountId },
		]);

		if (!_.get(wallet, "id")) {
			throw new MoleculerError(this.t(ctx, "error.walletNotFound"), 400);
		}

		return {
			code: 200,
			data: {
				message: this.t(ctx, "success.getBalance"),
				wallet: _.pick(wallet, ["balance", "currency"]),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Get Balance]: ${err.message}`);
	}
};
