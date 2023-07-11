/* eslint-disable no-unused-vars */
const { I18nMixin } = require("@codeyard/moleculer-i18n");

module.exports = {
	name: "accountGraph",
	version: 1,

	mixins: [I18nMixin],

	/**
	 * Settings
	 */
	settings: {
		i18n: {
			dirName: "translations",
			languages: ["en", "vi"],
		},
		graphql: {
			type: require("./graphs/type"),
			input: require("./graphs/input"),
			enum: require("./graphs/enum"),
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
		login: {
			graphql: {
				query: "login(input: MiniPaymentLoginInput!): MiniPaymentLoginOutput",
			},
			params: {
				input: {
					$$type: "object",
					account: { type: "string" }, // Phone or email
					password: { type: "string", min: 6 },
				},
			},
			handler: require("./actions/login.graph.action"),
		},

		logout: {
			graphql: {
				query: "logout: MiniPaymentLogoutOutput",
			},
			handler: require("./actions/logout.graph.action"),
		},

		register: {
			graphql: {
				mutation:
					"register(input: MiniPaymentRegisterInput!): MiniPaymentRegisterOutput",
			},
			params: {
				input: {
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
			handler: require("./actions/register.graph.action"),
		},

		forgotPassword: {
			graphql: {
				query: "forgotPassword(input: MiniPaymentForgotPasswordInput!): MiniPaymentForgotPasswordOutput",
			},
			params: {
				input: {
					$$type: "object",
					email: { type: "email" },
				},
			},
			handler: require("./actions/forgotPassword.graph.action"),
		},

		resetPassword: {
			graphql: {
				mutation:
					"resetPassword(input: MiniPaymentResetPasswordInput!): MiniPaymentResetPasswordOutput",
			},
			params: {
				input: {
					$$type: "object",
					fpToken: "string",
					newPassword: "string",
				},
			},
			handler: require("./actions/resetPassword.graph.action"),
		},

		getAccountInfo: {
			graphql: {
				query: "getAccountInfo(input: MiniPaymentGetAccountInfoInput!): MiniPaymentGetAccountInfoOutput",
				auth: "required",
			},
			handler: require("./actions/getAccountInfo.graph.action"),
		},

		updateAccountInfo: {
			graphql: {
				mutation:
					"updateAccountInfo(input: MiniPaymentUpdateAccountInfoInput!): MiniPaymentUpdateAccountInfoOutput",
				auth: "required",
			},
			params: {
				input: {
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
			handler: require("./actions/updateAccountInfo.graph.action"),
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
