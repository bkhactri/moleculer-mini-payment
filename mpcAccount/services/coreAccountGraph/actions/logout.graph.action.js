const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const token = _.get(ctx, "meta.auth.token");
		const decodedToken = JWT.verify(token, process.env.JWT_AUTH_TOKEN, {
			ignoreExpiration: true,
		});

		const accountId = decodedToken.id;

		// Get valid session
		const session = await this.broker.call("v1.userSessionModel.findOne", [
			{ $and: [{ accountId }, { logoutAt: null }] },
		]);

		if (!_.get(session, "id")) {
			throw new MoleculerError(this.t(ctx, "error.sessionNotFound"), 400);
		}

		const userToken = await this.broker.call("v1.userTokenModel.findOne", [
			{
				$and: [{ id: session.tokenId }, { state: "ACTIVE" }],
			},
		]);

		if (
			_.isEmpty(userToken) ||
			userToken.token !== token ||
			moment(new Date()).isAfter(moment(new Date(userToken.expiration)))
		) {
			throw new MoleculerError(this.t(ctx, "error.sessionNotValid"), 400);
		}

		// Archived token
		const archivedToken = await this.broker.call(
			"v1.userTokenModel.updateOne",
			[{ id: userToken.id }, { $set: { state: "ARCHIVED" } }]
		);

		if (archivedToken.ok) {
			// Closed session
			const closedSession = await this.broker.call(
				"v1.userSessionModel.updateOne",
				[{ id: session.id }, { $set: { logoutAt: new Date() } }]
			);

			if (closedSession.ok) {
				return {
					message: this.t(ctx, "auth.logoutSuccess"),
				};
			}
		}

		throw new MoleculerError(this.t(ctx, "auth.logoutFail"), 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Logout]: ${err.message}`);
	}
};
