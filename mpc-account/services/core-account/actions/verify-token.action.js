const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");
const moment = require("moment");

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
			{ id: session.tokenId },
		]);

		if (
			userToken.token !== token ||
			userToken.deviceId !== userAgent ||
			_.get(decodedToken, "server_env") !== process.env.NODE_ENV ||
			moment(new Date()).isAfter(moment(new Date(userToken.expiration)))
		) {
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
