const _ = require("lodash");
const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");
const UserTokenConstants = require("../constants/user-token.constant");

autoIncrement.initialize(mongoose);

const UserTokenSchema = mongoose.Schema(
	{
		token: {
			type: String,
			require: true,
		},
		expiration: {
			type: Date,
			require: true,
		},
		accountId: {
			type: Number,
			required: true,
		},
		deviceId: {
			type: String,
			required: true,
		},
		state: {
			type: String,
			required: true,
			enum: _.values(UserTokenConstants.STATE),
		},
	},
	{
		collection: "UserToken",
		versionKey: false,
		timestamps: true,
	}
);

UserTokenSchema.plugin(autoIncrement.plugin, {
	model: `${UserTokenSchema.options.collection}-id`,
	field: "id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(
	UserTokenSchema.options.collection,
	UserTokenSchema
);
