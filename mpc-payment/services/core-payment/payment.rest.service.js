"use strict";
const _ = require("lodash");

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "payment",
	version: 1,
	/**
	 * Settings
	 */
	settings: {},

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
					paymentMethod: {
						type: "string",
						enum: ["WALLET", "ATM_CARD"],
					},
				},
			},
			handler: require("./actions/create-order.action"),
		},

		getOrderInformation: {
			rest: {
				method: "GET",
				path: "/order/:transaction",
			},
			params: {},
			handler: require("./actions/get-order-information.action"),
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
					note: {
						type: "string",
						optional: true,
					},
					payment: "object",
				},
			},
			handler: require("./actions/pay-order.action"),
		},

		cancelOrder: {
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
			handler: require("./actions/cancel-order.action"),
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
