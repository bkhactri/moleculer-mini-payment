const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "_id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId !== queryId) {
			throw new MoleculerError(
				"Get data failed. Please try again later",
				401
			);
		}

		const accountInfo = await this.broker.call("v1.account.model.findOne", [
			{ _id: ObjectId(queryId) },
		]);

		if (!_.get(accountInfo, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		return {
			code: 200,
			data: {
				message: "Success",
				account: {
					..._.pick(accountInfo, [
						"email",
						"fullName",
						"phone",
						"gender",
					]),
				},
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Get Account Info]: ${err.message}`);
	}
};
