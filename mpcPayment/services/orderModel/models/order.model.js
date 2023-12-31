const _ = require("lodash");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const OrderConstants = require("../constants/order.constant");

autoIncrement.initialize(mongoose);

const OrderSchema = mongoose.Schema(
	{
		ownerId: {
			type: Number,
			require: true,
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
		currency: {
			type: String,
			enum: ["VND", "USD"],
			default: "VND",
		},
		description: {
			type: String,
			required: false,
		},
		state: {
			type: String,
			enum: _.values(OrderConstants.ORDER_STATE),
			default: OrderConstants.ORDER_STATE.PENDING,
		},
		redirectUrl: {
			type: String,
			default: null,
		},
		ipnUrl: {
			type: String,
			default: null,
		},
		completedAt: {
			type: Date,
			required: false,
			default: null,
		},
		paymentMethod: {
			type: String,
			enum: _.values(OrderConstants.ORDER_PAY_METHOD),
			require: false,
		},
	},
	{
		collection: "Order",
		versionKey: false,
		timestamps: true,
	}
);

OrderSchema.plugin(autoIncrement.plugin, {
	model: `${OrderSchema.options.collection}-id`,
	field: "id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(OrderSchema.options.collection, OrderSchema);
