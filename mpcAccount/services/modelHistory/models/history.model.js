const _ = require("lodash");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const HistoryConstants = require("../constants/history.constant");

autoIncrement.initialize(mongoose);

const HistorySchema = mongoose.Schema(
	{
		accountId: {
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
		fee: {
			type: Number,
			require: false,
			default: 0,
		},
		total: {
			type: Number,
			require: true,
		},
		balanceBefore: {
			type: Number,
			require: true,
		},
		balanceAfter: {
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
		paymentMethod: {
			type: String,
			enum: _.values(HistoryConstants.HISTORY_PAY_METHOD),
			required: true,
		},
	},
	{
		collection: "History",
		versionKey: false,
		timestamps: true,
	}
);

HistorySchema.plugin(autoIncrement.plugin, {
	model: `${HistorySchema.options.collection}-id`,
	field: "id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(
	HistorySchema.options.collection,
	HistorySchema
);
