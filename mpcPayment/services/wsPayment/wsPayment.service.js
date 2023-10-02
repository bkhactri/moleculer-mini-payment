/* eslint-disable no-unused-vars */
/* eslint-disable indent */
const _ = require("lodash");
const { query, graphql, subscription } = require("./graphQL");

module.exports = {
	name: "wsPayment",
	version: 1,

	mixins: [],

	hooks: {
		error: {
			"get*": function (ctx, error) {
				return null;
			},
		},
	},

	/**
	 * Settings
	 */
	settings: {
		graphql,
		actionNoAuth: [
			"v1.wsPayment.SocketGraphQL",
			"v1.wsPayment.socketPayment",
			"v1.wsPayment.filterAccountId",
		],
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
		WebSocket: {
			graphql: {
				query: query.wb,
			},
			handler(ctx) {
				return true;
			},
		},
		SocketGraphQL: {
			graphql: {
				subscription: subscription.SocketAPP,
				filter: "v1.wsPayment.filterAccountId",
				tags: ["PAYMENT-APP"],
			},
			handler(ctx) {
				_.set(this, "payload", ctx.params.payload);
				_.set(this, "input", ctx.params.input);
				return ctx;
			},
		},
		filterAccountId: {
			handler(ctx) {
				const { input, payload } = ctx.params;
				return _.get(input, "orderId") === _.get(payload, "orderId");
			},
		},
		socketPayment: {
			handler: require("./actions/socketPayment.action"),
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

	started() {},
};
