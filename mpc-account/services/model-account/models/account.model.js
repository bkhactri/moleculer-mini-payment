const _ = require("lodash");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const UserConstants = require("../constants/account.constant");

autoIncrement.initialize(mongoose);

const AccountSchema = mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		phone: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		avatar: {
			type: String,
			required: false,
			default: null,
		},
		gender: {
			type: String,
			required: true,
			enum: _.values(UserConstants.GENDER),
		},
	},
	{
		collection: "Account",
		versionKey: false,
		timestamps: true,
	}
);

AccountSchema.plugin(autoIncrement.plugin, {
	model: `${AccountSchema.options.collection}-id`,
	field: "_id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(
	AccountSchema.options.collection,
	AccountSchema
);
