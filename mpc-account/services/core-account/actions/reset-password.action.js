const _ = require("lodash");
const bcrypt = require("bcrypt");
const { MoleculerError } = require("moleculer").Errors;
const JWT = require("jsonwebtoken");

module.exports = async function (ctx) {
	try {
		const { fpToken, oldPassword, newPassword } = ctx.params.body;
		const secretKey = await this.broker.cacher.get(`fp.${fpToken}`);

		if (!secretKey) {
			throw new MoleculerError("fpToken invalid. Please try again", 400);
		}

		const decoded = JWT.verify(fpToken, secretKey);

		if (!decoded) {
			throw new MoleculerError("fpToken invalid. Please try again", 400);
		}

		const account = await this.broker.call("v1.accountModel.findOne", [
			{ _id: decoded._id },
		]);

		if (!_.get(account, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		if (!bcrypt.compareSync(oldPassword, account.password)) {
			throw new MoleculerError("Old password incorrect", 400);
		}

		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(newPassword, salt);

		const updateInfo = await this.broker.call("v1.accountModel.updateOne", [
			{ _id: account._id },
			{ $set: { password: hashedPassword } },
		]);

		if (updateInfo.ok) {
			// Clean cache key after update password successfully
			this.broker.cacher.del(`fp.${fpToken}`);

			return {
				code: 200,
				data: {
					message: "Reset password successfully",
				},
			};
		}
		throw new MoleculerError(
			"Reset password failed. Please try again later",
			400
		);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Reset Password]: ${err.message}`);
	}
};
