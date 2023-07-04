"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

const { I18nMixin } = require("@codeyard/moleculer-i18n");
const Polyglot = require("node-polyglot");

/** @type {ServiceSchema} */
module.exports = {
	name: "account",
	version: 1,

	/**
	 * Mixins
	 */
	mixins: [I18nMixin],

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
		register: {
			rest: {
				method: "POST",
				path: "/register",
			},
			params: {
				body: {
					$$type: "object",
					fullName: { type: "string" },
					password: { type: "string", min: 6 },
					phone: { type: "string" },
					email: { type: "email" },
					gender: {
						type: "string",
						enum: ["MALE", "FEMALE", "OTHER"],
					},
				},
			},
			handler: require("./actions/register.action"),
		},

		login: {
			rest: {
				method: "POST",
				path: "/login",
			},
			params: {
				body: {
					$$type: "object",
					account: { type: "string" }, // Phone or email
					password: { type: "string", min: 6 },
				},
			},
			handler: require("./actions/login.action"),
		},

		logout: {
			rest: {
				method: "POST",
				path: "/logout",
			},
			handler: require("./actions/logout.action"),
		},

		verifyToken: {
			params: {
				token: "string",
				userAgent: "string",
			},
			handler: require("./actions/verifyToken.action"),
		},

		forgotPassword: {
			rest: {
				method: "POST",
				path: "/forgot-password",
			},
			params: {
				body: {
					$$type: "object",
					email: { type: "email" },
				},
			},
			handler: require("./actions/forgotPassword.action"),
		},

		resetPassword: {
			rest: {
				method: "PUT",
				path: "/reset-password",
			},
			params: {
				body: {
					$$type: "object",
					fpToken: "string",
					newPassword: "string",
				},
			},
			handler: require("./actions/resetPassword.action"),
		},

		getAccountInfo: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "GET",
				path: "/:id",
			},
			params: {},
			handler: require("./actions/getAccountInfo.action"),
		},

		updateAccountInfo: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "PUT",
				path: "/:id",
			},
			params: {
				body: {
					$$type: "object",
					fullName: { type: "string", optional: true },
					phone: { type: "string", optional: true },
					email: { type: "email", optional: true },
					gender: {
						type: "string",
						enum: ["MALE", "FEMALE", "OTHER"],
						optional: true,
					},
				},
			},
			handler: require("./actions/updateAccountInfo.action"),
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
