const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	type WebSocket {
		id: Int
	}
	type PaymentAPP {
		payment: PaymentResult
	}

	type PaymentResult {
		state: PaymentState
		transactionId: String
	}
`;
