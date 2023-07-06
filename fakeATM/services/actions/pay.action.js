/* eslint-disable no-async-promise-executor */
const { MoleculerError } = require("moleculer").Errors;
const axios = require("axios");
const uniqid = require("uniqid");

module.exports = async function (ctx) {
	try {
		// Simulator pay handler and call IPN
		setTimeout(() => {
			// Handle pay FAKE PAY BY ATM CARD
			// => ...
			const { orderId, transaction, amount, notifyUrl } = ctx.params.body;

			const partnerTransaction = uniqid();

			console.log({
				transaction,
				partnerTransaction,
				orderId,
				amount,
				state: "SUCCESS",
			});

			// 	Handle IPN
			axios.post(notifyUrl, {
				transaction,
				partnerTransaction,
				orderId,
				amount,
				state: "SUCCESS",
			});
		}, 10000);

		return {
			ok: 1,
			message: "Working on it",
			data: {
				orderId: ctx.params.orderId,
				amount: ctx.params.amount,
			},
		};
	} catch (error) {
		console.log(JSON.stringify(error));
		throw new MoleculerError(`[Fake ATM->Pay Action]: ${error.message}`);
	}
};
