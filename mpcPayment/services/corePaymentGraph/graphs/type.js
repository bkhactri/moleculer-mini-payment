const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	type MiniPaymentCreateOrderOutput {
		message: String
		urlPath: String
		order: Order
	}

	type MiniPaymentGetOrderOutput {
		message: String
		order: Order
	}

	type MiniPaymentPayOrderOutput {
		message: String
		order: Order
	}

	type MiniPaymentCancelOrderOutput {
		message: String
		order: Order
	}

	type Order {
		id: String
		transaction: String
		amount: Int
		state: OrderState
		currency: MoneyCurrency
		description: String
		redirectUrl: String
		ipnUrl: String
	}
`;
