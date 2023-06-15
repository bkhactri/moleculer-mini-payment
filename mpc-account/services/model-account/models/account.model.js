const _ = require("lodash");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserConstants = require("../constants/account.constant");

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
		collection: "Service_MpcUser",
		versionKey: false,
		timestamps: true,
	}
);

module.exports = mongoose.model(
	AccountSchema.options.collection,
	AccountSchema
);
