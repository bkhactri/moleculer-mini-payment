const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");

module.exports = async function (ctx) {
	try {
		const accountToken = _.get(ctx, "meta.auth.token");

		const decoded = JWT.verify(accountToken, process.env.JWT_AUTH_TOKEN);
		const ttl = decoded.exp - Math.floor(Date.now() / 1000);

		await this.broker.cacher.set(`token.${accountToken}`, "revoked", ttl);

		return {
			code: 200,
			data: {
				message: this.t(ctx, "auth.logoutSuccess"),
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Logout]: ${err.message}`);
	}
};
