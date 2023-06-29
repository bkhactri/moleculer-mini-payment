const _ = require("lodash");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const WalletConstants = require("../constants/wallet.constant");

autoIncrement.initialize(mongoose);

const WalletSchema = mongoose.Schema(
	{
		accountId: {
			type: Number,
			require: true,
			unique: true,
		},
		balance: {
			type: Number,
			default: 0,
		},
		currency: {
			type: String,
			enum: _.values(WalletConstants.CURRENCY),
			default: "VND",
		},
	},
	{
		collection: "Wallet",
		versionKey: false,
		timestamps: true,
	}
);

WalletSchema.plugin(autoIncrement.plugin, {
	model: `${WalletSchema.options.collection}-id`,
	field: "_id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(WalletSchema.options.collection, WalletSchema);
