const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
	enum OrderState {
		PENDING
		SUCCEEDED
		FAILED
		CANCELLED
	}
`;
