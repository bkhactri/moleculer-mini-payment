const _ = require("lodash");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;
const { ObjectId } = require("mongodb");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;

		if (_.isEmpty(payload)) {
			throw new MoleculerError("Update data is empty", 400);
		}

		const decodedToken = JWT.verify(
			_.get(ctx, "meta.auth.token"),
			process.env.JWT_AUTH_TOKEN
		);

		const accountId = _.get(decodedToken, "_id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId !== queryId) {
			throw new MoleculerError(
				"Update failed. Please try again later",
				400
			);
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

		if (updateInfo.ok) {
			return {
				code: 200,
				data: {
					message: "Updated successfully",
					account: {
						..._.pick(account, [
							"fullName",
							"phone",
							"email",
							"gender",
						]),
						...payload,
					},
				},
			};
		} else {
			throw new MoleculerError(
				"Update failed. Please try again later",
				400
			);
		}
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Account->Update Account Info]: ${err.message}`
		);
	}
};
