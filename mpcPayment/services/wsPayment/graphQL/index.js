const gql = require("moleculer-apollo-server").moleculerGql;

module.exports.query = {
	wb: gql`WebSocket: WebSocket`,
};

module.exports.subscription = {
	SocketAPP: gql`PaymentAPP(input: SocketAPPInput!): PaymentAPP`,
};

// Config graphql cho cấp global
module.exports.graphql = {
	type: require("./typeDefs/type"),
	input: require("./typeDefs/input"),
	enum: require("./typeDefs/enum"),
	resolvers: {
		// Socket
		PaymentAPP: {
			payment: {
				context: true,
				action: "v1.wsPayment.socketPayment",
			},
		},
	},
};
