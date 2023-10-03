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

		payOrderWallet: {
			rest: {
				auth: {
					mode: "required",
				},
				method: "POST",
				path: "/order/pay/wallet",
			},
			params: {
				body: {
					$$type: "object",
					transaction: {
						type: "string",
					}
				},
			},
			handler: require("./actions/payOrderWallet.rest.action"),
		},

		payOrderAtm: {
			rest: {
				method: "POST",
				path: "/order/pay/atm",
			},
			params: {
				body: {
					$$type: "object",
					transaction: {
						type: "string",
					},
					payment: {
						$$type: "object",
						cardNumber: {
							type: "string",
							optional: false,
							example: "21864431004",
							description: "Card number"
						},
						cardNameHolder: {
							type: "string",
							optional: false,
							example: "James Cameron",
							description: "Card name holder"
						},
						expiredDate: {
							type: "string",
							example: "03/2023",
							optional: true,
							description: "Ngày hết hạng, MM/YYYY"
						},
						cvc: {
							type: "number",
							optional: false,
							example: 356,
							min: 100,
							max: 999,
							description: "CVC Secret number"
						},
					},
				},
			},
			handler: require("./actions/payOrderAtm.rest.action"),
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

		statisticsByDay: {
			rest: {
				method: "GET",
				path: "/statistics/time",
			},
			params: {
				query: {
					$$type: "object",
					fromDate: "string",
					toDate: "string",
					paymentMethod: {
						type: "string",
						optional: true,
						enum: ["WALLET", "ATM_CARD"],
					},
					exportExcel: {
						type: "string",
						optional: true,
					},
				},
			},
			handler: require("./actions/statisticsByDay.action"),
		},

		statisticsByCustomer: {
			rest: {
				method: "GET",
				path: "/statistics/customer",
			},
			params: {
				query: {
					$$type: "object",
					fromDate: "string",
					toDate: "string",
					accountIds: {
						type: "string",
						optional: true,
					},
					exportExcel: {
						type: "string",
						optional: true,
					},
				},
			},
			handler: require("./actions/statisticsByCustomer.action"),
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
		exportStatistics: require("./methods/export-statistic.method"),
		createAtmCardTransaction: require("./methods/createAtmCardTransaction.method"),
	},

	/**
	 * Service created lifecycle event handler
	 */
	created() { },

	/**
	 * Service started lifecycle event handler
	 */
	async started() { },

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() { },
};
