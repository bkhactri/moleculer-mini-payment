const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, paymentMethod } = ctx.params.query;

		const statisticsDataByDate = await this.broker.call(
			"v1.historyModel.aggregate",
			[
				[
					{
						$match: {
							createdAt: {
								$gte: new Date(
									moment(fromDate)
										.startOf("days")
										.toISOString()
								),
								$lte: new Date(
									moment(toDate).startOf("days").toISOString()
								),
							},
							paymentMethod,
						},
					},
					{
						$project: {
							_id: 0,
							date: {
								$dateToString: {
									format: "%Y/%m/%d",
									date: "$createdAt",
								},
							},
							completedCount: {
								$sum: {
									$cond: [
										{
											$eq: [
												"$state",
												PaymentConstant.HISTORY_STATE
													.COMPLETED,
											],
										},
										1,
										0,
									],
								},
							},
							pendingCount: {
								$sum: {
									$cond: [
										{
											$eq: [
												"$state",
												PaymentConstant.HISTORY_STATE
													.PENDING,
											],
										},
										1,
										0,
									],
								},
							},
							failedCount: {
								$sum: {
									$cond: [
										{
											$eq: [
												"$state",
												PaymentConstant.HISTORY_STATE
													.FAILED,
											],
										},
										1,
										0,
									],
								},
							},
						},
					},
					{
						$group: {
							_id: "$date",
							totalTransaction: { $sum: 1 },
							totalSuccess: { $sum: "$completedCount" },
							totalPending: { $sum: "$pendingCount" },
							totalFailed: { $sum: "$failedCount" },
						},
					},
					{
						$sort: {
							_id: 1,
						},
					},
				],
			]
		);

		return {
			code: 200,
			data: statisticsDataByDate,
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Payment->Statistics By Day]: ${err.message}`
		);
	}
};
