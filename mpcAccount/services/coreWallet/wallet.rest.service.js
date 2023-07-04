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
	name: "wallet",
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
		getBalance: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "GET",
				path: "/balance",
			},
			handler: require("./actions/getAccountBalance.action"),
		},

		updateBalance: {
			params: {
				accountId: "number",
				transaction: "number",
				description: "string",
				amount: "number",
				fee: {
					type: "number",
					required: false,
				},
				action: {
					type: "string",
					enum: ["ADD", "SUBTRACT"],
				},
			},
			handler: require("./actions/updateAccountBalance.action"),
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
