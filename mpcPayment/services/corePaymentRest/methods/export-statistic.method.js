const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const excel = require("exceljs");

module.exports = async function (ctx, sheetName, fileName, fields, data) {
	try {
		let workbook = new excel.Workbook(); // Creating workbook
		let worksheet = workbook.addWorksheet(sheetName); // Creating worksheet

		worksheet.columns = fields;

		worksheet.addRows(data);

		ctx.meta.$responseHeaders = {
			"Content-Type": "text/csv",
			"Content-Disposition": `attachment; filename="${fileName}"`,
		};

		const result = await workbook.xlsx.writeBuffer();

		return result;
	} catch (error) {
		if (error.name === "MoleculerError") {
			throw error;
		}

		throw new MoleculerError(
			`[Payment->Export Statistics]: ${error.message}`
		);
	}
};
