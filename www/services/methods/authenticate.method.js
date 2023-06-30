const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx, route, req) {
	let authMode = "";
	const headerAuth = req.headers.authorization;

	if (_.has(req, "$action.rest.auth")) {
		authMode = _.get(req, "$action.rest.auth.mode");
	}

	if (headerAuth && headerAuth.startsWith("Bearer")) {
		const token = headerAuth.slice(7);

		if (!_.isEmpty(authMode)) {
			try {
				const validate = await ctx.broker.call(
					"v1.account.verifyToken",
					{
						token,
						userAgent: req.headers["user-agent"],
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

				return validate.decodedToken ? { ...payload, token } : null;
			} catch (error) {
				throw new MoleculerError(error.message, 401, null, error.data);
			}
		} else {
			return { token };
		}
	}

	return null;
};
