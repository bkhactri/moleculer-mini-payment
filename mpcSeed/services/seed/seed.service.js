"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const bcrypt = require("bcrypt");

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
		const count = await this.adapter.count();
		if (!count) {
			for (let i = 118663; i <= 120000; i++) {
				const user = await this.broker.call("fake.user");
				const salt = bcrypt.genSaltSync(10);
				const hashedPassword = bcrypt.hashSync(user.password, salt);

				// Create user
				const newUser = await this.broker.call(
					"v1.accountModel.create",
					[
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
					]
				);

				// Create wallet
				await this.broker.call("v1.walletModel.create", [
					{ accountId: newUser.id },
				]);

				console.log(`Completed #${i}`, user);
			}
		}
	},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
};
