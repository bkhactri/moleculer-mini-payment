const Moment = require("moment");
const { GraphQLScalarType, Kind } = require("graphql");
const BigInt = require("apollo-type-bigint").default;
const { GraphQLUpload } = require("moleculer-apollo-server");

module.exports = {
	DateTime: new GraphQLScalarType({
		name: "DateTime",
		description: "DateTime",
		serialize(value) {
			const dateTime = new Moment(value, true);

			if (dateTime.isValid() === true) {
				return dateTime.toISOString();
			}

			throw new TypeError(
				`DateTime cannot represent non-dateTime value: ${value}`
			);
		},

		parseValue(value) {
			const dateTime = new Moment(value, true);

			if (dateTime.isValid() === true) {
				return dateTime;
			}

			throw new TypeError(
				`DateTime cannot represent non-dateTime value: ${value}`
			);
		},

		parseLiteral(ast) {
			if (ast.kind === Kind.STRING) {
				const dateTime = new Moment(ast.value, true);

				if (dateTime.isValid() === true) {
					return dateTime;
				}

				throw new TypeError(
					`DateTime cannot represent non-dateTime value: ${ast.value}`
				);
			}
		},
	}),
	BigInt: new BigInt("safe"),
	Upload: GraphQLUpload,
};
