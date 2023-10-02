const gql = require("moleculer-apollo-server").moleculerGql;

module.exports = gql`
    type PaymentAPP {
        payment: PaymentResult
    }

    type PaymentResult {
       historyId: Int
       transactionId: String
    }
`;
