/* eslint-disable no-unused-vars */
/* eslint-disable indent */
const _ = require("lodash");

module.exports = async function (ctx) {
    try {
        const { payload, input } = this;
        if (_.get(input, "orderId") !== _.get(payload, "orderId")) return null;
        const response = { ...payload };
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
};
