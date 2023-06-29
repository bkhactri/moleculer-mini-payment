const _ = require("lodash");
const bcrypt = require("bcrypt");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const payload = ctx.params.body;
		const { email, phone } = payload;

		const existedUser = await this.broker.call("v1.accountModel.findOne", [
			{ $or: [{ email }, { phone }] },
		]);

		if (existedUser) {
			return {
				code: 400,
				data: {
					message: this.t(ctx, "auth.duplicateCredentials"),
				},
			};
		}

		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(payload.password, salt);

		const newUser = await this.broker.call("v1.accountModel.create", [
			{ ...payload, password: hashedPassword },
		]);

		if (_.get(newUser, "_id")) {
			// Create account wallet
			const wallet = await this.broker.call("v1.walletModel.create", [
				{ accountId: newUser._id },
			]);

			if (_.get(wallet, "_id")) {
				return {
					code: 201,
					data: {
						message: this.t(ctx, "auth.registerSuccess"),
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
					this.t(ctx, "auth.registerWalletFail"),
					400
				);
			}
		} else {
			throw new MoleculerError(
				this.t(ctx, "auth.registerAccountFail"),
				400
			);
		}
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Register]: ${err.message}`);
	}
};
