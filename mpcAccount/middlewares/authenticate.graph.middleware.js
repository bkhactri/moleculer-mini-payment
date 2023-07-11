const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = {
	localAction(next, action) {
		return async function (ctx) {
			if (
				_.has(action, "graphql") &&
				_.get(action, "graphql.auth") === "required"
			) {
				try {
					const validate = await ctx.call(
						"v1.account.verifyToken",
						{
							token: ctx.meta.auth.token,
							userAgent: ctx.meta.userAgent,
						},
						{
							meta: { locale: ctx.meta.locale },
						}
					);

					const payload = _.pick(validate.decodedToken, [
						"id",
						"phone",
						"email",
					]);

					ctx.meta.auth = validate.decodedToken
						? { ...payload, token: ctx.meta.auth.token }
						: null;

					return next(ctx);
				} catch (error) {
					throw new MoleculerError(
						error.message,
						401,
						null,
						error.data
					);
				}
			}

			return next(ctx);
		};
	},
};
