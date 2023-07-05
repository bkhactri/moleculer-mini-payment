/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const axios = require("axios");
const uniqid = require("uniqid");

module.exports = async function (ctx) {
	try {
		setTimeout(() => {
			// Handle pay FAKE PAY BY ATM CARD
			// => ...

			const { orderId, transaction, amount, notifyUrl } = ctx.params.body;

			const atmTransaction = uniqid();

			console.log({
				transaction,
				atmTransaction,
				orderId,
				amount,
				state: "SUCCESS",
			});
			// Handle IPN

			axios.post(notifyUrl, {
				transaction,
				atmTransaction,
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
// {
//   transaction: '00af5cd4-e22b-4f2f-9243-b64f92703674',
//   atmTransaction: '3qxtuumqvljpgw60p',
//   orderId: 5,
//   amount: 120000,
//   state: 'SUCCESS'
// }
