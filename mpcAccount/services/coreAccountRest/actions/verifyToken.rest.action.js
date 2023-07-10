const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");
const moment = require("moment");
const AuthConstants = require("../constants/authenticate.constant");

module.exports = async function (ctx) {
	try {
		const { token, userAgent } = ctx.params;
		const decodedToken = JWT.verify(token, process.env.JWT_AUTH_TOKEN, {
			ignoreExpiration: true,
		});

		const accountId = decodedToken.id;

		const session = await this.broker.call("v1.userSessionModel.findOne", [
			{ $and: [{ accountId }, { logoutAt: null }] },
		]);

		if (!_.get(session, "id")) {
			throw new MoleculerError(this.t(ctx, "error.sessionNotFound"), 400);
		}

		const userToken = await this.broker.call("v1.userTokenModel.findOne", [
			{
				$and: [
					{ id: session.tokenId },
					{ state: AuthConstants.TOKEN_STATE.ACTIVE },
				],
			},
		]);

		if (
			_.isEmpty(userToken) ||
			userToken.token !== token ||
			userToken.userAgent !== userAgent ||
			_.get(decodedToken, "server_env") !== process.env.NODE_ENV
		) {
			throw new MoleculerError(
				this.t(ctx, "auth.invalidCredentials"),
				401
			);
		}

		// Expire handle
		if (
			moment(new Date()).isAfter(moment(new Date(userToken.expiration)))
		) {
			const archivedToken = await this.broker.call(
				"v1.userTokenModel.updateOne",
				[
					{ id: userToken.id },
					{ $set: { state: AuthConstants.TOKEN_STATE.ARCHIVED } },
				]
			);

			if (archivedToken.ok) {
				// Closed session
				await this.broker.call("v1.userSessionModel.updateOne", [
					{ id: session.id },
					{ $set: { logoutAt: userToken.expiration } },
				]);
			}

			throw new MoleculerError(
				this.t(ctx, "auth.invalidCredentials"),
				401
			);
		}

		return {
			isValid: true,
			decodedToken,
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Verify Token]: ${err.message}`);
	}
};
