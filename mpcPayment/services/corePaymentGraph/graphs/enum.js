const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	enum MoneyCurrency {
		VND
		USD
	}

	enum OrderState {
		PENDING
		SUCCEEDED
		FAILED
		CANCELLED
	}

	enum PaymentMethod {
		WALLET
		ATM_CARD
	}
`;
