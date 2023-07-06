const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (
	ctx,
	{ orderId, transaction, description, amount, currency }
) {
	try {
		// Find any pending history with order transaction
		let history = await this.broker.call("v1.historyModel.findOne", [
			{ orderId, state: "PENDING" },
		]);

		if (!_.get(history, "id")) {
			// Create transaction history
			history = await this.broker.call(
				"v1.historyModel.create",
				[
					{
						paymentMethod: "ATM_CARD",
						state: "PENDING",
						orderId,
						transaction,
						description,
						amount,
						currency,
						total: amount,
					},
				],
				{ retries: 3, delay: 200 }
			);
		}

		if (!_.get(history, "id")) {
			throw new MoleculerError(
				this.t(ctx, "fail.createPaymentHistory"),
				400
			);
		}

		const redirectUrl = `${process.env.WEB_HOST}/p/result?orderId=${orderId}`;
		const ipnUrl = `${process.env.API_HOST}/api/v1/payment/ipn`;

		const updatedOrder = await this.broker.call(
			"v1.orderModel.updateOne",
			[
				{
					id: orderId,
				},
				{
					$set: {
						paymentMethod: "ATM_CARD",
						redirectUrl,
						ipnUrl,
					},
				},
			],
			{ retries: 3, delay: 200 }
		);

		if (!_.get(updatedOrder, "ok")) {
			throw new MoleculerError(
				this.t(ctx, "fail.createPaymentHistory"),
				400
			);
		}

		return {
			ok: 1,
			data: {
				message: this.t(ctx, "success.createPaymentHistory"),
				detail: {
					orderId,
					transaction,
					redirectUrl,
					ipnUrl,
				},
			},
		};
	} catch (error) {
		if (error.name === "MoleculerError") {
			throw error;
		}

		throw new MoleculerError(
			`[Payment->Create Atm Card Transaction]: ${error.message}`
		);
	}
};
