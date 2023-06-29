module.exports = async function (ctx, route, req) {
	ctx.meta.auth = ctx.meta.user;
	ctx.meta.locale = req.headers["locale"];
	ctx.meta.userAgent = req.headers["user-agent"];
	delete ctx.meta.user;
};
