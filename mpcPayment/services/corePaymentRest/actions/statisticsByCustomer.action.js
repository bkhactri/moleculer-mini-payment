const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, accountIds } = ctx.params.query;

		const matchQuery = {
			createdAt: {
				$gte: new Date(moment(fromDate).startOf("days").toISOString()),
				$lte: new Date(moment(toDate).startOf("days").toISOString()),
			},
		};

		if (accountIds.length) {
			matchQuery.accountId = {
				$in: accountIds,
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
