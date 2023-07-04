"use strict";
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */
const QueueMixin = require("moleculer-rabbitmq");
const Cron = require("moleculer-cron");

const queueMixin = QueueMixin({
	connection: process.env.RABBITMQ_URI,
	asyncActions: true,
});

/** @type {ServiceSchema} */
module.exports = {
	name: "paymentCron",
	version: 1,

	/**
	 * Mixins
	 */
	mixins: [Cron, queueMixin],

	/**
	 * Settings
	 */

	crons: [
		{
			name: "CleanIncompleteOrder",
			cronTime: "* * * * *", // Every minute
			onTick: async function () {
				console.log("🚀🚀 CleanIncompleteOrder JOB ticked 🚀🚀");
				const services = this.getLocalService("paymentCron", 1);
				await services.actions.cleanOrder();
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
	actions: {
		cleanOrder: {
			queue: {
				amqp: {
					queueAssert: {
						durable: true,
					},
					consume: {
						noAck: false,
					},
					prefetch: 0,
				},
			},
			params: {},
			handler: require("./actions/cleanIncompleteOrder.action"),
		},
	},

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
