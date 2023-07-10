/* eslint-disable no-unused-vars */

module.exports = {
	name: "accountGraph",
	version: 1,

	mixins: [],

	/**
	 * Settings
	 */
	settings: {
		graphql: {
			type: require("./graphs/type"),
			input: require("./graphs/input"),
			enum: require("./graphs/enum"),
			resolvers: {
				MiniPaymentAccount: {
					HelloWorld: {
						action: "v1.accountGraph.helloWorld",
					},
				},
			},
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
		helloWorld: {
			params: {
				input: {
					$$type: "object",
					name: "string",
				},
			},
			handler: require("./actions/helloWorld.graph.action"),
		},
		MiniPaymentAccount: {
			graphql: {
				mutation: "MiniPayment: MiniPaymentAccount",
			},
			handler(ctx) {
				return true;
			},
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
