const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const AccountWalletConstant = require("../constants/account-wallet.constant");

module.exports = async function (ctx) {
	try {
		const { accountId, transactionAmount, action } = ctx.params.body;
		const account = await this.broker.call("v1.accountModel.findOne", [
			{ _id: accountId },
		]);

		if (!_.get(account, "_id")) {
			throw new MoleculerError("Account not found", 404);
		}

		const wallet = await this.broker.call("v1.walletModel.findOne", [
			{ accountId: accountId },
		]);

		if (!_.get(wallet, "_id")) {
			throw new MoleculerError(
				"Wallet not found. Please contact for support",
				404
			);
		}

		if (
			wallet.balance < transactionAmount &&
			action === AccountWalletConstant.UPDATE_BALANCE_ACTION.SUBTRACT
		) {
			throw new MoleculerError(
				"Wallet balance not enough to complete the transaction",
				400
			);
		}

		const newBalance =
			wallet.balance +
			(action === AccountWalletConstant.UPDATE_BALANCE_ACTION.ADD
				? Math.abs(transactionAmount)
				: -Math.abs(transactionAmount));

		const updateAccountBalance = await this.broker.call(
			"v1.walletModel.updateOne",
			[{ accountId: accountId }, { $set: { balance: newBalance } }]
		);

		if (updateAccountBalance.ok) {
			return {
				code: 200,
				data: {
					message: "Updated account balance successfully",
				},
			};
		}

		throw new MoleculerError(
			"Update account balance failed. Please try again later",
			400
		);
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account->Update Balance]: ${err.message}`);
	}
};
