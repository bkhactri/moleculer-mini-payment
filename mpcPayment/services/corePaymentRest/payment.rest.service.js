"use strict";
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const RedLockMixin = require("../../mixins/lock.mixin");
const { I18nMixin } = require("@codeyard/moleculer-i18n");
const QueueMixin = require("moleculer-rabbitmq");

const queueMixin = QueueMixin({
	connection: process.env.RABBITMQ_URI,
	asyncActions: true,
});

/** @type {ServiceSchema} */
module.exports = {
	name: "payment",
	version: 1,

	/**
	 * Mixins
	 */
	mixins: [RedLockMixin, I18nMixin, queueMixin],

	/**
	 * Settings
	 */
	settings: {
		i18n: {
			dirName: "translations",
			languages: ["en", "vi"],
		},
	},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		createOrder: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "POST",
				path: "/order",
			},
			params: {
				body: {
					$$type: "object",
					amount: {
						type: "number",
						min: 10000,
					},
					currency: {
						type: "string",
						enum: ["VND", "USD"],
					},
					description: {
						type: "string",
						optional: true,
					},
				},
			},
			handler: require("./actions/createOrder.rest.action"),
		},

		getOrderInformation: {
			rest: {
				method: "GET",
				path: "/order/:transaction",
			},
			params: {},
			handler: require("./actions/getOrderInformation.rest.action"),
		},

		payOrder: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "POST",
				path: "/order/pay",
			},
			params: {
				body: {
					$$type: "object",
					transaction: {
						type: "string",
					},
					payment: "object",
				},
			},
			handler: require("./actions/payOrder.rest.action"),
		},

		cancelOrder: {
			auth: {
				mode: "required",
			},
			rest: {
				method: "POST",
				path: "/order/cancel",
			},
			params: {
				body: {
					$$type: "object",
					transaction: "string",
				},
			},
			handler: require("./actions/cancelOrder.rest.action"),
		},

		cancelExpiredOrderAsync: {
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
				dedupHash: (ctx) => ctx.params.id,
			},
			params: {
				id: "number",
			},
			handler: require("./actions/cancelExpiredOrderAsync.rest.action"),
		},

		ipn: {
			rest: {
				method: "POST",
				path: "/ipn",
			},
			params: {
				body: {
					$$type: "object",
					orderId: "number",
					transaction: "string",
					amount: "number",
					partnerTransaction: "string",
					state: "string",
				},
			},
			handler: require("./actions/ipnHandler.rest.action"),
		},
	},

	/**
	 * Events
	 */
	events: {},

	/**
	 * Methods
	 */
	methods: {
		createAtmCardTransaction: require("./methods/createAtmCardTransaction.method"),
	},

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
