const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	# Login
	input MiniPaymentLoginInput {
		account: String
		password: String
	}

	# Register
	input MiniPaymentRegisterInput {
		fullName: String
		password: String
		phone: String
		email: String
		gender: Gender
	}

	# Forgot Password
	input MiniPaymentForgotPasswordInput {
		email: String
	}

	# Reset Password
	input MiniPaymentResetPasswordInput {
		fpToken: String
		newPassword: String
	}

	# Get Account Information
	input MiniPaymentGetAccountInfoInput {
		id: String
	}

	# Update Account Information
	input MiniPaymentUpdateAccountInfoInput {
		fullName: String
		phone: String
		email: String
		gender: Gender
	}
`;
