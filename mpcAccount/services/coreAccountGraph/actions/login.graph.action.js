const _ = require("lodash");
const moment = require("moment");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.input;
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

		let completed = false;
		let loginAt = new Date();
		let accessToken = JWT.sign(
			{
				..._.pick(acc, ["id", "phone", "email"]),
				userAgent,
				server_env: process.env.NODE_ENV,
			},
			process.env.JWT_AUTH_TOKEN,
			{ expiresIn: process.env.JWT_ACCESS_TTL }
		);

		// If user login on another device while still save session on other,
		if (!_.isEmpty(session)) {
			// Update token by session id
			const updatedToken = await this.broker.call(
				"v1.userTokenModel.updateOne",
				[
					{ id: session.tokenId },
					{
						$set: {
							token: accessToken,
							expiration: moment(loginAt).add(
								process.env.JWT_ACCESS_TTL,
								"seconds"
							),
							userAgent: userAgent,
						},
					},
				]
			);

			if (updatedToken.ok) {
				if (_.get(session, "userAgent") !== userAgent) {
					// Mark old session as completed (logout)
					await this.broker.call("v1.userSessionModel.updateOne", [
						{ id: session.id },
						{ $set: { logoutAt: new Date() } },
					]);

					// Create new session
					const newSession = await this.broker.call(
						"v1.userSessionModel.create",
						[
							{
								tokenId: session.tokenId,
								accountId: acc.id,
								userAgent: userAgent,
								loginAt: new Date(),
							},
						]
					);

					if (_.get(newSession, "id")) {
						completed = true;
					}
				} else {
					// Update login time
					const updatedSession = await this.broker.call(
						"v1.userSessionModel.updateOne",
						[{ id: session.id }, { $set: { loginAt: new Date() } }]
					);

					if (updatedSession.ok) {
						completed = true;
					}
				}
			}
		} else {
			// If user have not had valid session then register new token and session
			const registeredToken = await this.broker.call(
				"v1.userTokenModel.create",
				[
					{
						token: accessToken,
						expiration: moment(loginAt).add(
							process.env.JWT_ACCESS_TTL,
							"seconds"
						),
						accountId: acc.id,
						userAgent: userAgent,
						state: "ACTIVE",
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
							userAgent: userAgent,
							loginAt,
						},
					]
				);
			}

			if (_.get(registeredSession, "id")) {
				completed = true;
			}
		}

		if (completed) {
			return {
				message: this.t(ctx, "auth.loginSuccess"),
				accessToken,
			};
		}

		throw new MoleculerError(this.t(ctx, "auth.loginFail"), 500);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Login Graph]: ${err.message}`);
	}
};
