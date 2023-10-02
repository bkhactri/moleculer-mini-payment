const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
    input SocketAPPInput {
        orderId: Int
    }
`;
