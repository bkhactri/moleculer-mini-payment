const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, accountIds, exportExcel } = ctx.params.query;

		console.log("exportExcel", exportExcel);

		const matchQuery = {
			$expr: {
				$and: [
					{
						$gte: [
							"$createdAt",
							{
								$dateFromString: {
									dateString: moment(fromDate).toISOString(),
								},
							},
						],
					},
					{
						$lte: [
							"$createdAt",
							{
								$dateFromString: {
									dateString: moment(toDate).toISOString(),
								},
							},
						],
					},
				],
			},
		};

		if (accountIds && accountIds.length) {
			matchQuery.accountId = {
				$in: accountIds.split(",").map((e) => Number(e)),
			};
		}

		const statisticsDataByDate = await this.broker.call(
			"v1.historyModel.aggregate",
			[
				[
					{
						$match: matchQuery,
					},
					{
						$project: {
							_id: 0,
							userId: "$accountId",
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
							_id: "$userId",
							totalTransaction: {
								$sum: 1,
							},
							totalSuccess: {
								$sum: "$completedCount",
							},
							totalPending: {
								$sum: "$pendingCount",
							},
							totalFailed: {
								$sum: "$failedCount",
							},
						},
					},
					{
						$lookup: {
							from: "Account",
							localField: "_id",
							foreignField: "id",
							as: "account",
						},
					},
					{
						$unwind: {
							path: "$account",
						},
					},
					{
						$project: {
							_id: 0,
							userName: "$account.fullName",
							userId: "$account.id",
							email: "$account.email",
							total: "$totalTransaction",
							success: "$totalSuccess",
							pending: "$totalPending",
							failed: "$totalFailed",
						},
					},
					{
						$sort: {
							totalTransaction: -1,
							totalSuccess: -1,
							totalPending: -1,
						},
					},
				],
			],
			{ retries: 3, delay: 500 }
		);

		if (exportExcel === "true") {
			const fields = [
				{ header: "User", key: "userName", width: 10 },
				{ header: "User Id", key: "userId", width: 10 },
				{ header: "User Email", key: "email", width: 10 },
				{
					header: "Total transactions",
					key: "total",
					width: 10,
				},
				{
					header: "Total completed transactions",
					key: "success",
					width: 20,
				},
				{
					header: "Total pending transactions",
					key: "pending",
					width: 20,
				},
				{
					header: "Total failed transactions",
					key: "failed",
					width: 20,
				},
			];

			return this.exportStatistics(
				ctx,
				`Payment statistic from ${fromDate.replaceAll(
					"/",
					"-"
				)} to ${toDate.replaceAll("/", "-")}`,
				`payment-statistics-by-customer-${fromDate.replaceAll(
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
