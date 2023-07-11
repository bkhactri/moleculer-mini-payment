const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	type MiniPaymentLoginOutput {
		message: String
		accessToken: String
	}

	type MiniPaymentLogoutOutput {
		message: String
	}

	type MiniPaymentRegisterOutput {
		message: String
		user: UserPublicInfo
	}

	type MiniPaymentForgotPasswordOutput {
		message: String
		urlPath: String
		fpToken: String
	}

	type MiniPaymentResetPasswordOutput {
		message: String
	}

	type MiniPaymentGetAccountInfoOutput {
		message: String
		account: UserPublicInfo
	}

	type MiniPaymentUpdateAccountInfoOutput {
		message: String
		account: UserPublicInfo
	}

	type UserPublicInfo {
		fullName: String
		email: String
		phone: String
		gender: Gender
	}
`;
