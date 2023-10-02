const gql = require("moleculer-apollo-server").moleculerGql;

module.exports.subscription = {
	SocketAPP: gql`PaymentSocket(input: SocketAPPInput!): PaymentAPP`,
};

// Config graphql cho cấp global
module.exports.graphql = {
	type: require("./typeDefs/type"),
	input: require("./typeDefs/input"),
	enum: require("./typeDefs/enum"),
	resolvers: {
		// Socket
		PaymentSocket: {
			payment: {
				context: true,
				action: "v1.wsPayment.socketPayment"
			}
		},
	}
};
