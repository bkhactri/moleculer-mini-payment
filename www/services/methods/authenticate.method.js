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
		const validate = await ctx.broker.call("v1.account.verifyToken", {
			token,
		});

		if (!_.isEmpty(authMode) && !validate.isValid) {
			throw new MoleculerError("Invalid credentials", 401);
		}

		const payload = _.pick(validate.decoded, ["id", "phone", "email"]);

		return validate.decoded ? { ...payload, token } : null;
	}

	return null;
};
