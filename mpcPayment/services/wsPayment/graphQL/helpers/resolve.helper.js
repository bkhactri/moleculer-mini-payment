module.exports.resolver = (action, opts = { dataloader: false }) => ({
	action,
	dataLoader: opts.dataloader,
	rootParams: { resolve: "rootParams" },
	params: {
		isResolve: true
	}
});
