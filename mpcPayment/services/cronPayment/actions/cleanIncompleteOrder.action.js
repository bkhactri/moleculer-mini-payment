const _ = require("lodash");
const CronPaymentConstants = require("../constants/cronPayment.constant");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	// Wait payment service
	await ctx.broker.waitForServices({ name: "payment", version: 1 });

	try {
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
		const expiredOrders = await ctx.broker.call("v1.orderModel.findMany", [
			{
				createdAt: { $lte: twoHoursAgo },
				state: CronPaymentConstants.ORDER_STATE.PENDING,
			},
			{},
			// Every cron trigger only get 100 order that match condition and process to set those state as Cancelled
			{ skip: 0, limit: 100 },
		]);

		console.log("Expired Orders: ", expiredOrders);

		if (expiredOrders.length) {
			for (let i = 0; i <= expiredOrders.length - 1; i++) {
				ctx.broker.call("v1.payment.cancelExpiredOrderAsync.async", {
					params: {
						id: _.get(expiredOrders[i], "id"),
					},
					options: {
						timeout: 2000,
					},
				});

				console.log(`Cancelled Order #${i}`);
			}
		}
	} catch (error) {
		throw new MoleculerError(error.message, 500, null, error.data);
	}
};
