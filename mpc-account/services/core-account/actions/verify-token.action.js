const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");

module.exports = async function (ctx) {
	try {
		const accountToken = ctx.params.token;
		const decoded = JWT.verify(accountToken, process.env.JWT_AUTH_TOKEN);

		const revokedToken = await this.broker.cacher.get(
			`token.${accountToken}`
		);

		return {
			isValid:
				decoded &&
				_.isEmpty(revokedToken) &&
				_.get(decoded, "server_env") === process.env.NODE_ENV,
			decoded,
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Verify Token]: ${err.message}`);
	}
};
