const _ = require("lodash");
const bcrypt = require("bcrypt");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");

module.exports = async function (ctx) {
	try {
		const { fpToken, newPassword } = ctx.params.input;
		const secretKey = await this.broker.cacher.get(`fp.${fpToken}`);

		if (!secretKey) {
			throw new MoleculerError(
				this.t(ctx, "field.invalid", { field: "fpToken" }),
				400
			);
		}

		const decoded = JWT.verify(fpToken, secretKey);

		if (!decoded) {
			throw new MoleculerError(
				this.t(ctx, "field.invalid", { field: "fpToken" }),
				400
			);
		}

		const account = await this.broker.call("v1.accountModel.findOne", [
			{ id: decoded.id },
		]);

		if (!_.get(account, "id")) {
			throw new MoleculerError(this.t(ctx, "auth.accountNotFound"), 404);
		}

		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(newPassword, salt);

		const updateInfo = await this.broker.call("v1.accountModel.updateOne", [
			{ id: account.id },
			{ $set: { password: hashedPassword } },
		]);

		if (updateInfo.ok) {
			// Clean cache key after update password successfully
			this.broker.cacher.del(`fp.${fpToken}`);

			return {
				message: this.t(ctx, "auth.resetPassSuccess"),
			};
		}
		throw new MoleculerError(this.t(ctx, "auth.resetPassFail"), 400);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Reset Password]: ${err.message}`);
	}
};
