const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	type MiniPaymentAccount {
		"Hello world"
		HelloWorld(
			input: MiniPaymentHelloWorldInput!
		): MiniPaymentHelloWorldResponse
	}

	type MiniPaymentHelloWorldResponse {
		status: Number
		message: String
	}
`;
