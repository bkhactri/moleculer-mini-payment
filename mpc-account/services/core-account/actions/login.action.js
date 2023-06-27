const _ = require("lodash");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const { account, password } = payload;

		const acc = await this.broker.call("v1.accountModel.findOne", [
			{ $or: [{ email: account }, { phone: account }] },
		]);

		if (!acc || !bcrypt.compareSync(password, acc.password)) {
			return {
				code: 400,
				data: {
					message: "Invalid credentials",
				},
			};
		}

		const accessToken = JWT.sign(
			{
				..._.pick(acc, ["_id", "phone", "email"]),
				server_env: process.env.NODE_ENV,
			},
			process.env.JWT_AUTH_TOKEN,
			{ expiresIn: "1h" }
		);

		return {
			code: 200,
			data: {
				message: "Logged in successfully",
				accessToken,
			},
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Login]: ${err.message}`);
	}
};
