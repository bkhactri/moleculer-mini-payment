module.exports = async function (ctx, route, req) {
	ctx.meta.auth = ctx.meta.user;
	ctx.meta.locale = req.headers["locale"];
	delete ctx.meta.user;
};
