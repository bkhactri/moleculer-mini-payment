"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const bcrypt = require("bcrypt");
const { faker } = require("@faker-js/faker");
const uuid = require("uuid");

/** @type {ServiceSchema} */
module.exports = {
	name: "seed",

	/**
	 * Settings
	 */
	settings: {},

	/**
	 * Dependencies
	 */
	dependencies: ["fake"],

	/**
	 * Actions
	 */
	actions: {},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {
		for (let i = 100001; i < 200001; i++) {
			const user = await this.broker.call("fake.user");
			const salt = bcrypt.genSaltSync(10);
			const hashedPassword = bcrypt.hashSync(user.password, salt);

			// Create user
			const newUser = await this.broker.call("v1.accountModel.create", [
				{
					fullName: `${user.firstName} ${user.lastName}`,
					password: hashedPassword,
					phone: `${user.phone}${i}`,
					email: `${user.email.split("@")[0]}${i}@${
						user.email.split("@")[1]
					}`,
					avatar: user.avatar,
					gender: i % 2 ? "MALE" : "FEMALE",
				},
			]);

			let defaultBalance = 2000000;
			let amount = 200000;

			// // // Create wallet
			// await this.broker.call("v1.walletModel.create", [
			// 	{ accountId: newUser.id, balance: defaultBalance },
			// ]);

			// // Generate order and history to match user id
			// for (let j = 1; j <= 10; j++) {
			// 	let balanceBefore = defaultBalance;
			// 	let balanceAfter = defaultBalance - amount;
			// 	defaultBalance = balanceAfter;

			// 	const createDate = faker.date.between({
			// 		from: new Date("2022/06/01"),
			// 		to: new Date("2022/08/01"),
			// 	});

			// 	const completeDate = faker.date.between({
			// 		from: new Date("2022/08/01"),
			// 		to: new Date("2023/01/01"),
			// 	});

			// 	let order = null;
			// 	const transaction = uuid.v4();
			// 	const description = faker.commerce.productDescription();

			// 	if (i % 2) {
			// 		order = {
			// 			ownerId: "123456", // All records fake this id,
			// 			paymentMethod: "WALLET",
			// 			transaction: transaction,
			// 			amount: amount,
			// 			description: description,
			// 			createdAt: createDate,
			// 			updatedAt: createDate,
			// 			completedAt: completeDate,
			// 			state: "SUCCEEDED",
			// 		};
			// 	} else {
			// 		order = {
			// 			ownerId: "123456", // All records fake this id,
			// 			paymentMethod: "WALLET",
			// 			transaction: transaction,
			// 			amount: amount,
			// 			description: description,
			// 			createdAt: createDate,
			// 			updatedAt: createDate,
			// 			state: "PENDING",
			// 		};
			// 	}

			// 	const newOrder = await this.broker.call(
			// 		"v1.orderModel.create",
			// 		[order]
			// 	);

			// 	await this.broker.call("v1.historyModel.create", [
			// 		{
			// 			orderId: newOrder.id,
			// 			accountId: newUser.id,
			// 			amount: amount,
			// 			fee: 0,
			// 			total: amount,
			// 			balanceBefore: balanceBefore,
			// 			balanceAfter: balanceAfter,
			// 			paymentMethod: "WALLET",
			// 			transaction: transaction,
			// 			description: description,
			// 			createdAt: createDate,
			// 			updatedAt: createDate,
			// 			completedAt: i % 2 ? completeDate : null,
			// 			state: j % 2 ? "COMPLETED" : "PENDING",
			// 		},
			// 	]);

			// 	console.log(`Generated order #${1} for user #${i}`);
			// }

			// Log to complete
			console.log(`In Seeding progress #${i}`);
		}
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
};
