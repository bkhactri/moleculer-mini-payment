const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = async function (ctx) {
	const { accountId, transaction, description, amount, fee, action } =
		ctx.params;

	const lock = await this.tryLock(accountId);

	await delay(Math.floor(Math.random() * 1000));

	try {
		const accountWallet = await this.broker.call("v1.wallet.getBalance", {
			accountId,
		});

		if (!_.get(accountWallet, "data.wallet")) {
			throw new MoleculerError(this.t(ctx, "fail.updatedBalance"), 400);
		}

		let total = 0;
		let balanceCurrency = _.get(accountWallet, "data.wallet.currency");
		let balanceBefore = _.get(accountWallet, "data.wallet.balance");
		let balanceAfter = 0;

		if (action === "ADD") {
			total = amount;
			balanceAfter += total;
		}

		if (action === "SUBTRACT") {
			total = amount + fee;
			if (balanceBefore < total) {
				throw new MoleculerError(
					this.t(ctx, "error.balanceNotEnough"),
					400
				);
			} else {
				balanceAfter = balanceBefore - amount;
			}
		}

		// Calculate the increase amount (may negative) of the balance
		let balanceIncrease = balanceAfter - balanceBefore;

		// Create history to tracking
		const history = await this.broker.call(
			"v1.historyModel.create",
			[
				{
					accountId,
					paymentMethod: "WALLET",
					transaction,
					description,
					currency: balanceCurrency,
					balanceBefore,
					balanceAfter,
					amount,
					total,
					fee,
					state: "PENDING",
				},
			],
			{ retries: 3, delay: 200 }
		);

		if (!_.get(history, "id")) {
			throw new MoleculerError(
				this.t(ctx, "fail.createPaymentHistory"),
				400
			);
		}

		// If create history success process to update account balance
		const updateAccountBalance = await this.broker.call(
			"v1.walletModel.updateOne",
			[{ accountId }, { $inc: { balance: balanceIncrease } }],
			{ retries: 5, delay: 500 }
		);

		if (!updateAccountBalance.ok) {
			throw new MoleculerError(
				this.t(ctx, "fail.createAtmTransaction"),
				400
			);
		}

		// Update history
		const updatedHistory = await this.broker.call(
			"v1.historyModel.updateOne",
			[
				{ id: history.id },
				{
					$set: {
						state: "COMPLETED",
						completedAt: new Date(),
					},
				},
			],
			{ retries: 3, delay: 200 }
		);

		if (!updatedHistory.ok) {
			throw new MoleculerError(
				this.t(ctx, "fail.createAtmTransaction"),
				400
			);
		}

		await this.unlock(lock.key);

		return {
			ok: 1,
			data: {
				message: this.t(ctx, "success.createAtmTransaction"),
				detail: {
					accountId,
					transaction,
					balanceBefore,
					balanceAfter,
					action,
				},
			},
		};
	} catch (err) {
		await this.unlock(lock.key);

		if (err.name === "MoleculerError") {
			throw err;
		}

		throw new MoleculerError(`[Account->Update Balance]: ${err.message}`);
	}
};
