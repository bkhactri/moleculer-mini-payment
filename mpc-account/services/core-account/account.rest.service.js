"use strict";

/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: "account",
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
			},
			handler: require("./actions/verify-token.action"),
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
			handler: require("./actions/forgot-password.action"),
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
			handler: require("./actions/reset-password.action"),
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
			handler: require("./actions/get-account-info.action"),
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
			handler: require("./actions/update-account-info.action"),
		},

		getBalance: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "GET",
				path: "/balance",
			},
			handler: require("./actions/get-account-balance.action"),
		},

		updateBalance: {
			params: {
				accountId: "number",
				newBalance: {
					type: "number",
				},
			},
			handler: require("./actions/update-account-balance.action"),
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
