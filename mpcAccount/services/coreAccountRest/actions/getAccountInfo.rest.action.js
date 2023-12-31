const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "id");
		const queryId = _.get(ctx.params.params, "id");

		if (accountId != queryId) {
			throw new MoleculerError(this.t(ctx, "auth.notAuthorize"), 401);
		}

		const accountInfo = await this.broker.call("v1.accountModel.findOne", [
			{ id: queryId },
		]);

		if (!_.get(accountInfo, "id")) {
			throw new MoleculerError(this.t(ctx, "auth.accountNotFound"), 404);
		}

		return {
			code: 200,
			data: {
				message: this.t(ctx, "success.getAccount"),
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
