const _ = require("lodash");
const moment = require("moment");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;
const AuthConstants = require("../constants/authenticate.constant");

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const userAgent = ctx.meta.userAgent;

		const { account, password } = payload;

		const acc = await this.broker.call("v1.accountModel.findOne", [
			{ $or: [{ email: account }, { phone: account }] },
		]);

		if (!acc || !bcrypt.compareSync(password, acc.password)) {
			return {
				code: 400,
				data: {
					message: this.t(ctx, "auth.invalidCredentials"),
				},
			};
		}

		// Get valid session
		const session = await this.broker.call("v1.userSessionModel.findOne", [
			{ $and: [{ accountId: acc.id }, { logoutAt: null }] },
		]);

		// If user login on another device while still save session on other,
		// => Terminate current session and token
		if (!_.isEmpty(session) && _.get(session, "deviceId") !== userAgent) {
			// Mark current token as archived
			const archivedToken = await this.broker.call(
				"v1.userTokenModel.updateOne",
				[
					{ id: session.tokenId },
					{ $set: { state: AuthConstants.TOKEN_STATE.ARCHIVED } },
				]
			);

			if (archivedToken.ok) {
				// Mark current session as completed (logout)
				await this.broker.call("v1.userSessionModel.updateOne", [
					{ id: session.id },
					{ $set: { logoutAt: new Date() } },
				]);
			}
		}

		// Register new token
		const accessToken = JWT.sign(
			{
				..._.pick(acc, ["id", "phone", "email"]),
				userAgent,
				server_env: process.env.NODE_ENV,
			},
			process.env.JWT_AUTH_TOKEN,
			{ expiresIn: process.env.JWT_ACCESS_TTL }
		);

		const registeredToken = await this.broker.call(
			"v1.userTokenModel.create",
			[
				{
					token: accessToken,
					expiration: moment(new Date()).add(
						process.env.JWT_ACCESS_TTL,
						"seconds"
					),
					accountId: acc.id,
					deviceId: userAgent,
					state: AuthConstants.TOKEN_STATE.ACTIVE,
				},
			]
		);

		let registeredSession = null;

		if (_.get(registeredToken, "id")) {
			// Register new session
			registeredSession = await this.broker.call(
				"v1.userSessionModel.create",
				[
					{
						tokenId: _.get(registeredToken, "id"),
						accountId: acc.id,
						deviceId: userAgent,
						loginAt: new Date(),
					},
				]
			);
		}

		if (_.get(registeredSession, "id")) {
			return {
				code: 200,
				data: {
					message: this.t(ctx, "auth.loginSuccess"),
					accessToken,
				},
			};
		}

		throw new MoleculerError(this.t(ctx, "auth.loginFail"), 500);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Login]: ${err.message}`);
	}
};
