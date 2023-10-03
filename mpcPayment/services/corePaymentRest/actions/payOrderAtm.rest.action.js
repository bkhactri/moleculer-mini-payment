/* eslint-disable indent */
/* eslint-disable no-async-promise-executor */
const _ = require("lodash");
const { MoleculerError } = require("moleculer").Errors;
const PaymentConstant = require("../constants/payment.constant");
const Numeral = require("numeral");
const axios = require("axios");

module.exports = async function (ctx) {
    try {
        // cardNumber, cardOwnerName, effectiveDate
        const { transaction, payment } = ctx.params.body;

        const order = await this.broker.call("v1.orderModel.findOne", [
            { transaction },
        ]);

        if (!_.get(order, "id")) {
            throw new MoleculerError(this.t(ctx, "error.orderNotFound"), 404);
        }

        if (_.get(order, "state") !== PaymentConstant.ORDER_STATE.PENDING) {
            throw new MoleculerError(
                this.t(ctx, "error.orderNotAvailableToPay"),
                400
            );
        }

        const createAtmCardTransaction =
            await this.createAtmCardTransaction(ctx, {
                orderId: _.get(order, "id"),
                transaction: _.get(order, "transaction"),
                description: _.get(order, "description"),
                amount: _.get(order, "amount"),
                currency: _.get(order, "currency"),
            });

        if (!_.get(createAtmCardTransaction, "ok")) {
            await this.broker.call(
                "v1.orderModel.updateOne",
                [
                    { id: order.id },
                    {
                        $set: {
                            state: PaymentConstant.ORDER_STATE.FAILED,
                            completedAt: null,
                        },
                    },
                ],
                { retries: 2, delay: 100 }
            );

            throw new MoleculerError(
                this.t(ctx, "fail.atmCardPayOrder"),
                500
            );
        }

        const { redirectUrl, ipnUrl } = _.get(
            createAtmCardTransaction,
            "data.detail"
        );

        // Pay through fake ATM Card service
        const result = await axios.post("http://localhost:3001/atm/pay", {
            body: {
                payment,
                orderId: order.id,
                amount: order.amount,
                notifyUrl: ipnUrl,
                redirectUrl,
                transaction,
            },
        });

        if (!_.get(result, "data.ok")) {
            throw new MoleculerError(
                this.t(ctx, "fail.atmCardPayOrder"),
                500
            );
        }

        return {
            code: 100,
            data: {
                message: this.t(ctx, "success.processPayAtmOrder", {
                    amount: `${Numeral(order.amount).format("0,0")} ${order.currency}`,
                }),
                order: {
                    id: order.id,
                    transaction,
                    redirectUrl,
                    ipnUrl,
                },
            },
        };

    } catch (err) {
        if (err.name === "MoleculerError") {
            throw err;
        }

        throw new MoleculerError(`[Payment->Pay Order]: ${err.message}`);
    }
};
