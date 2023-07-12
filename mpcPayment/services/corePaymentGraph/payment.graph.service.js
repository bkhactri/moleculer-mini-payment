/* eslint-disable no-unused-vars */
const { I18nMixin } = require("@codeyard/moleculer-i18n");

module.exports = {
	name: "paymentGraph",
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
		createOrder: {
			graphql: {
				mutation:
					"createOrder(input: MiniPaymentCreateOrderInput!): MiniPaymentCreateOrderOutput",
				auth: "required",
			},
			params: {
				input: {
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
			handler: require("./actions/createOrder.graph.action"),
		},

		orderInformation: {
			graphql: {
				query: "orderInformation(input: MiniPaymentGetOrderInput!): MiniPaymentGetOrderOutput",
			},
			params: {
				input: {
					$$type: "object",
					transaction: "string",
				},
			},
			handler: require("./actions/getOrderInformation.graph.action"),
		},

		payOrder: {
			graphql: {
				mutation:
					"payOrder(input: MiniPaymentPayOrderInput!): MiniPaymentPayOrderOutput",
				auth: "required",
			},
			params: {
				input: {
					$$type: "object",
					transaction: "string",
					payment: "object",
				},
			},
			handler: require("./actions/payOrder.graph.action"),
		},

		cancelOrder: {
			graphql: {
				mutation:
					"cancelOrder(input: MiniPaymentCancelOrderInput!): MiniPaymentCancelOrderOutput",
				auth: "required",
			},
			params: {
				input: {
					$$type: "object",
					transaction: "string",
				},
			},
			handler: require("./actions/cancelOrder.graph.action"),
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
