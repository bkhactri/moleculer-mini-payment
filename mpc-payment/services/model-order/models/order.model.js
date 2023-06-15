const _ = require("lodash");
const mongoose = require("mongoose");
const OrderConstants = require("../constants/order.constant");

const OrderSchema = mongoose.Schema(
	{
		accountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Service_MpcUser",
		},
		transaction: {
			type: String,
			require: true,
			unique: true,
		},
		amount: {
			type: Number,
			require: true,
		},
		fee: {
			type: Number,
			require: true,
			default: 0,
		},
		total: {
			type: Number,
			require: true,
		},
		currency: {
			type: String,
			enum: ["VND", "USD"],
			default: "VND",
		},
		description: {
			type: String,
			required: false,
		},
		note: {
			type: String,
			required: false,
		},
		state: {
			type: String,
			enum: _.values(OrderConstants.ORDER_STATE),
			default: OrderConstants.ORDER_STATE.PENDING,
		},
		paymentMethod: {
			type: String,
			enum: _.values(OrderConstants.ORDER_PAY_METHOD),
			required: true,
		},
	},
	{
		collection: "Service_MpcOrder",
		versionKey: false,
		timestamps: true,
	}
);

module.exports = mongoose.model(OrderSchema.options.collection, OrderSchema);
