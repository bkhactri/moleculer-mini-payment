const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;

		if (_.isEmpty(payload)) {
			throw new MoleculerError(this.t(ctx, "auth.payloadEmpty"), 400);
		}

		const accountId = _.get(ctx.meta.auth, "_id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId != queryId) {
			throw new MoleculerError(this.t(ctx, "auth.notAuthorize"), 400);
		}

		const account = await this.broker.call("v1.accountModel.findOne", [
			{ _id: queryId },
		]);

		if (!_.get(account, "_id")) {
			throw new MoleculerError(this.t(ctx, "auth.accountNotFound"), 404);
		}

		const updateInfo = await this.broker.call("v1.accountModel.updateOne", [
			{ _id: queryId },
			{ $set: payload },
		]);

		if (updateInfo.ok) {
			return {
				code: 200,
				data: {
					message: this.t(ctx, "success.updated"),
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

		throw new MoleculerError(this.t(ctx, "fail.updated"), 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Account->Update Account Info]: ${err.message}`
		);
	}
};
