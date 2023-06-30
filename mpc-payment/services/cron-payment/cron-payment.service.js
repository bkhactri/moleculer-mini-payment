"use strict";
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const Cron = require("moleculer-cron");

/** @type {ServiceSchema} */
module.exports = {
	name: "paymentCronJob",
	version: 1,

	/**
	 * Mixins
	 */
	mixins: [Cron],

	/**
	 * Settings
	 */

	crons: [
		{
			name: "CleanIncompleteOrder",
			cronTime: "0 */2 * * *", // Every two hours
			onTick: require("./actions/clean-incomplete-order.action"),
			runOnInit: function () {
				console.log("🚀🚀 CleanIncompleteOrder JOB is created 🚀🚀");
			},
			timezone: "Asia/Ho_Chi_Minh",
		},
	],

	settings: {},

	/**
	 * Dependencies
	 */
	dependencies: [],

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
	async started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
};
