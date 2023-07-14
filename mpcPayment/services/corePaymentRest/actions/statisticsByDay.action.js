const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, paymentMethod, exportExcel } =
			ctx.params.query;

		console.log("exportExcel", exportExcel);

		const statisticsDataByDate = await this.broker.call(
			"v1.historyModel.aggregate",
			[
				[
					{
						$match: {
							$expr: {
								$and: [
									{
										$gte: [
											"$createdAt",
											{
												$dateFromString: {
													dateString:
														moment(
															fromDate
														).toISOString(),
												},
											},
										],
									},
									{
										$lte: [
											"$createdAt",
											{
												$dateFromString: {
													dateString:
														moment(
															toDate
														).toISOString(),
												},
											},
										],
									},
								],
							},
							paymentMethod: paymentMethod || "WALLET",
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
			],
			{ retries: 3, delay: 500 }
		);

		if (exportExcel === "true") {
			const fields = [
				{ header: "Date", key: "_id", width: 10 },
				{
					header: "Total transactions",
					key: "totalTransaction",
					width: 10,
				},
				{
					header: "Total completed transactions",
					key: "totalSuccess",
					width: 20,
				},
				{
					header: "Total pending transactions",
					key: "totalPending",
					width: 20,
				},
				{
					header: "Total failed transactions",
					key: "totalFailed",
					width: 20,
				},
			];

			return this.exportStatistics(
				ctx,
				`Payment statistic from ${fromDate.replaceAll(
					"/",
					"-"
				)} to ${toDate.replaceAll("/", "-")}`,
				`payment-statistics-by-date-${fromDate.replaceAll(
					"/",
					"-"
				)}-${toDate.replaceAll("/", "-")}.xlsx`,
				fields,
				statisticsDataByDate
			);
		} else {
			return {
				code: 200,
				data: statisticsDataByDate,
			};
		}
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Payment->Statistics By Day]: ${err.message}`
		);
	}
};
