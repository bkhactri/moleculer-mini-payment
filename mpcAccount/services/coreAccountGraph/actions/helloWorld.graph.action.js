const { MoleculerError } = require("moleculer").Errors;

module.exports = async function (ctx) {
	try {
		return {
			status: 200,
			message: `Hello ${ctx.params.input.name}`,
		};
	} catch (err) {
		if (err.name === "MoleculerError") throw err;
		throw new MoleculerError(`[Account] Hello World Graph: ${err.message}`);
	}
};
