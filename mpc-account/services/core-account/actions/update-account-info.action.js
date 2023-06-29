const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;

		if (_.isEmpty(payload)) {
			throw new MoleculerError("Update data is empty", 400);
		}

		const accountId = _.get(ctx.meta.auth, "_id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId != queryId) {
			throw new MoleculerError(
				"Update failed. Please try again later",
				400
			);
		}

		const account = await this.broker.call("v1.accountModel.findOne", [
			{ _id: queryId },
		]);

		if (!_.get(account, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		const updateInfo = await this.broker.call("v1.accountModel.updateOne", [
			{ _id: queryId },
			{ $set: payload },
		]);

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
		}

		throw new MoleculerError("Update failed. Please try again later", 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Account->Update Account Info]: ${err.message}`
		);
	}
};
