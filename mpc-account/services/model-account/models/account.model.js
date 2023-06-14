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

AccountSchema.pre("save", function (next) {
	const user = this;

	if (!user.isModified("password")) {
		return next();
	}

	bcrypt.genSalt(10, function (err, salt) {
		if (err) {
			return next(err);
		}

		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) {
				return next(err);
			}

			user.password = hash;
			next();
		});
	});
});

module.exports = mongoose.model(
	AccountSchema.options.collection,
	AccountSchema
);
