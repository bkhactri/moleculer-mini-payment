const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	enum PaymentState {
		SUCCEEDED
		FAILED
	}
`;
