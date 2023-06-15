const _ = require("lodash");
const bcrypt = require("bcrypt");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const { email, phone } = payload;

		const existedUser = await this.broker.call("v1.account.model.findOne", [
			{ $or: [{ email }, { phone }] },
		]);

		if (existedUser) {
			return {
				code: 400,
				data: {
					message: "Email or phone has linked with another account",
				},
			};
		}

		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(payload.password, salt);

		const newUser = await this.broker.call("v1.account.model.create", [
			{ ...payload, password: hashedPassword },
		]);

		if (_.get(newUser, "_id")) {
			// Create account wallet
			const wallet = await this.broker.call("v1.wallet.model.create", [
				{ accountId: newUser._id },
			]);

			if (_.get(wallet, "_id")) {
				return {
					code: 201,
					data: {
						message: "User registered successfully",
						user: _.pick(newUser, [
							"fullName",
							"email",
							"phone",
							"gender",
						]),
						wallet: _.pick(wallet, ["_id", "balance", "currency"]),
					},
				};
			} else {
				throw new MoleculerError(
					"Register wallet failed. Please try again later",
					400
				);
			}
		} else {
			throw new MoleculerError(
				"Register account failed. Please try again later",
				400
			);
		}
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Register]: ${err.message}`);
	}
};
