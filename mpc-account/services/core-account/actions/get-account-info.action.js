const _ = require("lodash");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");

module.exports = async function (ctx) {
	try {
		const decodedToken = JWT.verify(
			_.get(ctx, "meta.auth.token"),
			process.env.JWT_AUTH_TOKEN
		);

		const accountId = _.get(decodedToken, "_id");
		const queryId = _.get(ctx.params.params, "id");

		console.log("queryId", queryId);

		if (accountId !== queryId) {
			throw new MoleculerError("Can not get data", 401);
		}

		const accountInfo = await this.broker.call("v1.account.model.findOne", [
			{ _id: ObjectId(queryId) },
		]);

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
		throw new MoleculerError(`[Account->Logout]: ${err.message}`);
	}
};
