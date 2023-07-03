const { MoleculerError } = require("moleculer").Errors;
const CronPaymentConstants = require("../constants/cronPayment.constant");

module.exports = function () {
	try {
		console.log("🚀🚀 CleanIncompleteOrder JOB ticked 🚀🚀");

		// Enhance later
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
		this.broker.call("v1.orderModel.updateMany", [
			{
				createdAt: { $lte: twoHoursAgo },
				state: { $ne: CronPaymentConstants.ORDER_STATE.PENDING },
			},
			{
				$set: { status: CronPaymentConstants.ORDER_STATE.CANCELLED },
			},
		]);
	} catch (error) {
		throw new MoleculerError(error.message, 401, null, error.data);
	}
};
