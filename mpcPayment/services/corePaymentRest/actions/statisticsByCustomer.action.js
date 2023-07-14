const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, accountIds } = ctx.params.query;

		const matchQuery = {
			createdAt: {
				$gte: new Date(fromDate),
				$lte: new Date(toDate),
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
											$eq: ["$state", "COMPLETED"],
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
											$eq: ["$state", "PENDING"],
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
											$eq: ["$state", "FAILED"],
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
