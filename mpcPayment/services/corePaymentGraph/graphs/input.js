const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	input MiniPaymentCreateOrderInput {
		amount: Int
		currency: MoneyCurrency
		description: String
	}

	input MiniPaymentGetOrderInput {
		transaction: String
	}

	input MiniPaymentPayOrderInput {
		transaction: String
		payment: PaymentInformationInput
	}

	input MiniPaymentCancelOrderInput {
		transaction: String
	}

	input PaymentInformationInput {
		method: PaymentMethod
		cardNumber: String
		cardOwnerName: String
		effectiveDate: String
	}
`;
