"use strict";
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const RedLockMixin = require("../../mixins/lock.mixin");
const { I18nMixin } = require("@codeyard/moleculer-i18n");
const Polyglot = require("node-polyglot");

/** @type {ServiceSchema} */
module.exports = {
	name: "payment",
	version: 1,

	/**
	 * Mixins
	 */
	mixins: [RedLockMixin, I18nMixin],

	/**
	 * Settings
	 */
	settings: {
		i18n: {
			dirName: "translations",
			languages: ["en", "vi"],
			polyglot: new Polyglot(),
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
					note: {
						type: "string",
						optional: true,
					},
				},
			},
			handler: require("./actions/createOrder.action"),
		},

		getOrderInformation: {
			rest: {
				method: "GET",
				path: "/order/:transaction",
			},
			params: {},
			handler: require("./actions/getOrderInformation.action"),
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
			handler: require("./actions/payOrder.action"),
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
			handler: require("./actions/cancelOrder.action"),
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
