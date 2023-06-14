const _ = require("lodash");
const mongoose = require("mongoose");
const WalletConstants = require("../constants/wallet.constant");

const WalletSchema = mongoose.Schema(
	{
		accountId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Service_MpcUser",
		},
		total: {
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
		collection: "Service_MpcWallet",
		versionKey: false,
		timestamps: true,
	}
);

module.exports = mongoose.model(WalletSchema.options.collection, WalletSchema);
