/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const Numeral = require("numeral");
const axios = require("axios");

module.exports = async function (ctx) {
	try {
		const accountId = _.get(ctx.meta.auth, "id");
		const { transaction, payment } = ctx.params.input;

		const order = await this.broker.call("v1.orderModel.findOne", [
			{ transaction },
		]);

		if (!_.get(order, "id")) {
			throw new MoleculerError(this.t(ctx, "error.orderNotFound"), 404);
		}

		if (_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING) {
			throw new MoleculerError(
				this.t(ctx, "error.orderNotAvailableToPay"),
				400
			);
		}

		let fee = 0;

		if (payment.method === PaymentConstant.ORDER_PAY_METHOD.WALLET) {
			// Example fee and calculate total base on fee and amount
			fee = 2000;
			const processTransaction = await this.broker.call(
				"v1.wallet.updateBalance",
				{
					accountId,
					transaction: order.transaction,
					description: order.description,
					amount: order.amount,
					fee,
					action: "SUBTRACT",
				},
				{ retries: 5, delay: 500, meta: { locale: ctx.meta.locale } }
			);

			if (!_.get(processTransaction, "ok")) {
				await this.broker.call(
					"v1.orderModel.updateOne",
					[
						{ id: order.id },
						{
							$set: {
								paymentMethod:
									PaymentConstant.ORDER_PAY_METHOD.WALLET,
								state: PaymentConstant.ORDER_STATE.FAILED,
								completedAt: null,
							},
						},
					],
					{ retries: 2, delay: 100 }
				);

				throw new MoleculerError(
					this.t(ctx, "fail.walletPayOrder"),
					500
				);
			} else {
				const updateOrderInfo = await this.broker.call(
					"v1.orderModel.updateOne",
					[
						{ id: order.id },
						{
							$set: {
								paymentMethod:
									PaymentConstant.ORDER_PAY_METHOD.WALLET,
								state: PaymentConstant.ORDER_STATE.SUCCEEDED,
								completedAt: new Date(),
							},
						},
					],
					{ retries: 3, delay: 500 }
				);

				if (!_.get(updateOrderInfo, "ok")) {
					// Refund transaction
					await this.broker.call(
						"v1.wallet.updateBalance",
						{
							accountId,
							transaction: order.transaction,
							description: order.description,
							amount: order.amount,
							fee,
							action: "ADD",
						},
						{
							retries: 5,
							delay: 500,
							meta: { locale: ctx.meta.locale },
						}
					);

					throw new MoleculerError(
						this.t(ctx, "fail.updateOrder"),
						500
					);
				}
			}

			return {
				code: 200,
				data: {
					message: this.t(ctx, "success.payOrder", {
						amount: `${Numeral(order.amount).format("0,0")} ${
							order.currency
						}`,
					}),
					order: _.pick(order, ["id", "transaction", "amount"]),
				},
			};
		}

		if (payment.method === PaymentConstant.ORDER_PAY_METHOD.ATM_CARD) {
			// cardNumber, cardOwnerName, effectiveDate
			const createAtmCardTransaction =
				await this.createAtmCardTransaction(ctx, {
					orderId: _.get(order, "id"),
					transaction: _.get(order, "transaction"),
					description: _.get(order, "description"),
					amount: _.get(order, "amount"),
					currency: _.get(order, "currency"),
				});

			if (!_.get(createAtmCardTransaction, "ok")) {
				await this.broker.call(
					"v1.orderModel.updateOne",
					[
						{ id: order.id },
						{
							$set: {
								state: PaymentConstant.ORDER_STATE.FAILED,
								completedAt: null,
							},
						},
					],
					{ retries: 2, delay: 100 }
				);

				throw new MoleculerError(
					this.t(ctx, "fail.atmCardPayOrder"),
					500
				);
			}

			const { redirectUrl, ipnUrl, transaction } = _.get(
				createAtmCardTransaction,
				"data.detail"
			);

			// Pay through fake ATM Card service
			const result = await axios.post("http://localhost:3001/atm/pay", {
				body: {
					payment,
					orderId: order.id,
					amount: order.amount,
					notifyUrl: ipnUrl,
					redirectUrl,
					transaction,
				},
			});

			console.log("result", result);

			if (!_.get(result, "data.ok")) {
				throw new MoleculerError(
					this.t(ctx, "fail.atmCardPayOrder"),
					500
				);
			}

			return {
				message: this.t(ctx, "success.processPayAtmOrder", {
					amount: `${Numeral(order.amount).format("0,0")} ${
						order.currency
					}`,
				}),
				order: {
					id: order.id,
					transaction,
					redirectUrl,
					ipnUrl,
				},
			};
		}
	} catch (err) {
		if (err.name === "MoleculerError") {
			throw err;
		}

		throw new MoleculerError(`[Payment->Pay Order]: ${err.message}`);
	}
};
