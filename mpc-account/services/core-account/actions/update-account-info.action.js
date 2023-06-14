const _ = require("lodash");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;

		const decodedToken = JWT.verify(
			_.get(ctx, "meta.auth.token"),
			process.env.JWT_AUTH_TOKEN
		);

		const accountId = _.get(decodedToken, "_id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId !== queryId) {
			throw new MoleculerError("Can not get data", 400);
		}

		const account = await this.broker.call("v1.account.model.findOne", [
			{ _id: ObjectId(queryId) },
		]);

		if (!_.get(account, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		const updateInfo = await this.broker.call(
			"v1.account.model.updateOne",
			[{ _id: queryId }, { $set: payload }]
		);

		return {
			code: 200,
			data: {
				message: "Updated successfully",
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Logout]: ${err.message}`);
	}
};
