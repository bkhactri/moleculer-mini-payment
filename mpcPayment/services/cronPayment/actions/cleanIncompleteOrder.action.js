const _ = require("lodash");
const CronPaymentConstants = require("../constants/cronPayment.constant");
const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
		const expiredOrders = await ctx.broker.call("v1.orderModel.findMany", [
			{
				createdAt: { $lte: twoHoursAgo },
				state: CronPaymentConstants.ORDER_STATE.PENDING,
			},
		]);

		console.log("Expired Orders: ", expiredOrders);

		if (expiredOrders.length) {
			for (let i = 0; i <= expiredOrders.length - 1; i++) {
				await ctx.broker.call("v1.payment.updateAsyncOrder", {
					id: _.get(expiredOrders[i], "id"),
					data: [
						{ id: _.get(expiredOrders[i], "id") },
						{
							$set: {
								state: CronPaymentConstants.ORDER_STATE
									.CANCELLED,
							},
						},
					],
				});

				console.log(`Cancelled Order Id #${i}`);
			}
		}
	} catch (error) {
		throw new MoleculerError(error.message, 400, null, error.data);
	}
};
