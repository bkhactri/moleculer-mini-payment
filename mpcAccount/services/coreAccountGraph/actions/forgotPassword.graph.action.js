const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const uuid = require("uuid");
const JWT = require("jsonwebtoken");

module.exports = async function (ctx) {
	try {
		const { email } = ctx.params.input;
		const account = await this.broker.call("v1.accountModel.findOne", [
			{ email },
		]);

		if (!_.get(account, "id")) {
			throw new MoleculerError(this.t(ctx, "auth.accountNotFound"), 404);
		}

		const secretKey = uuid.v4();

		const fpToken = JWT.sign(
			{
				..._.pick(account, ["id", "phone", "email"]),
				server_env: process.env.NODE_ENV,
			},
			secretKey,
			{ expiresIn: "1h" }
		);

		await this.broker.cacher.set(
			`fp.${fpToken}`,
			secretKey,
			process.env.JWT_FORGOT_PASSWORD_TTL
		);

		return {
			message: this.t(ctx, "auth.forgotPassHint"),
			urlPath: `/forgot-password/${fpToken}`,
			fpToken,
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Forgot Password]: ${err.message}`);
	}
};
