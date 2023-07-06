const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

autoIncrement.initialize(mongoose);

const UserSessionSchema = mongoose.Schema(
	{
		tokenId: {
			type: Number,
			require: true,
		},
		accountId: {
			type: Number,
			required: true,
		},
		userAgent: {
			type: String,
			required: true,
		},
		loginAt: {
			type: Date,
			require: true,
		},
		logoutAt: {
			type: Date,
			default: null,
		},
	},
	{
		collection: "UserSession",
		versionKey: false,
		timestamps: true,
	}
);

UserSessionSchema.plugin(autoIncrement.plugin, {
	model: `${UserSessionSchema.options.collection}-id`,
	field: "id",
	startAt: 1,
	incrementBy: 1,
});

module.exports = mongoose.model(
	UserSessionSchema.options.collection,
	UserSessionSchema
);
