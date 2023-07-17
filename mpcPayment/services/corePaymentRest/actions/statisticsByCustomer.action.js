const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const moment = require("moment");

module.exports = async function (ctx) {
	try {
		const { fromDate, toDate, accountIds, exportExcel } = ctx.params.query;
		const count = await this.broker.call("v1.historyModel.countRow", []);

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

		const statisticsTransByAccountId = await this.broker.call(
			"v1.historyModel.aggregate",
			[
				[
					{
						$match: matchQuery,
					},
					// {
					// 	$limit: 100000,
					// },
					{
						$group: {
							_id: "$accountId",
							totalTransaction: {
								$sum: 1,
							},
							totalSuccess: {
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
							totalPending: {
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
							totalFailed: {
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
					// {
					// 	$lookup: {
					// 		from: "Account",
					// 		localField: "_id",
					// 		foreignField: "id",
					// 		as: "account",
					// 	},
					// },
					// {
					// 	$unwind: {
					// 		path: "$account",
					// 	},
					// },
					// {
					// 	$project: {
					// 		userName: "$account.fullName",
					// 		userId: "$account.id",
					// 		email: "$account.email",
					// 		total: "$totalTransaction",
					// 		success: "$totalSuccess",
					// 		pending: "$totalPending",
					// 		failed: "$totalFailed",
					// 	},
					// },
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

		const groupedAccountIds = statisticsTransByAccountId.map((tran) =>
			_.get(tran, "_id")
		);

		const groupedAccountInfos = await this.broker.call(
			"v1.accountModel.findMany",
			[
				{
					id: {
						$in: groupedAccountIds,
					},
				},
			]
		);

		const hashMap = new Map();
		groupedAccountInfos.forEach((acc) => {
			hashMap.set(acc.id, acc);
		});

		const completeStatistics = statisticsTransByAccountId.map((tran) => {
			const info = hashMap.get(_.get(tran, "_id"));

			return {
				...tran,
				..._.pick(info, ["email", "fullName"]),
			};
		});

		if (exportExcel === "true") {
			const fields = [
				{ header: "User", key: "fullName", width: 10 },
				{ header: "User Id", key: "_id", width: 10 },
				{ header: "User Email", key: "email", width: 10 },
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

			return await this.exportStatistics(
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
				completeStatistics
			);
		} else {
			return {
				code: 200,
				count,
				data: completeStatistics,
			};
		}
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(
			`[Payment->Statistics By Day]: ${err.message}`
		);
	}
};
