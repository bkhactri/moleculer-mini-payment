const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "_id");
		const wallet = await this.broker.call("v1.wallet.model.findOne", [
			{ accountId: ObjectId(accountId) },
		]);

		if (!_.get(wallet, "_id")) {
			throw new MoleculerError(
				"Account wallet not found. Please contact for support",
				400
			);
		}

		return {
			code: 200,
			data: {
				message: "Success",
				wallet: _.pick(wallet, ["balance", "currency"]),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Get Balance]: ${err.message}`);
	}
};
