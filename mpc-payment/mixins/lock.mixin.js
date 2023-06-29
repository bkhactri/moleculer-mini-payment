module.exports = {
	name: "lock",
	settings: {
		lock: {
			ttl: 1000,
		},
	},
	methods: {
		/**
		 * Try lock key
		 * @param {String} key
		 * @param {Object} opts
		 * @return {Promise<void>}
		 */
		async tryLock(key, opts = {}) {
			key =
				this.broker.cacher.prefix +
				[this.fullName, key, "lock"].filter((v) => !!v).join("-");

			this.logger.debug("Check locked...", key);

			if (this.locks.has(key)) {
				return this.locks.get(key);
			}

			this.logger.debug("Await locking...", key);

			const client =
				"retryCount" in opts && opts.retryCount === 0
					? "redlockNonBlocking"
					: "redlock";

			const lock = await this[client].lockWithOptions(
				key,
				this.settings.lock.ttl,
				opts
			);

			lock.key = key;
			this.locks.set(key, lock);
			this.logger.debug(key, "Locked!");
			return lock;
		},

		/**
		 * Unlock
		 * @param key
		 * @return {Promise<*>}
		 */
		async unlock(key) {
			const lock = this.locks.get(key);
			if (!lock) throw new Error(`Unlock key not found ${key}`);
			return lock.unlock().then(() => {
				this.locks.delete(key);
				return key;
			});
		},

		/**
		 * Retry
		 * @param {Function} fn
		 * @param {Number} timeout
		 * @return {Promise<*>}
		 */
		async retry(fn, timeout = 0) {
			try {
				return fn();
			} catch (e) {
				await new Promise((resolve) =>
					setTimeout(() => resolve(), timeout)
				);
				return this.retry(fn);
			}
		},

		/**
		 * Get locks
		 * @return {*}
		 */
		getLocked() {
			return this.locks;
		},
	},

	created() {
		if (!this.broker.cacher.redlock) {
			this.broker.fatal("Redlock is not available");
		}
		this.redlock = this.broker.cacher.redlock;
		this.redlockNonBlocking = this.broker.cacher.redlockNonBlocking;
		this.locks = new Map();
	},

	async started() {
		const shift = this.settings.lock.ttl - this.settings.lock.ttl * 0.1;

		this.intervalLock = setInterval(async () => {
			const results = await Promise.all(
				[...this.locks.values()].map((lock) =>
					lock.extend(this.settings.lock.ttl)
				)
			).catch((e) => {
				this.broker.fatal(e);
			});
			if (results.length)
				this.logger.debug("Lock extended", this.settings.lock.ttl);
		}, shift);
	},

	async stopped() {
		this.logger.debug("stopped...");
		if (this.intervalLock) {
			clearInterval(this.intervalLock);
			this.logger.debug("clear interval lock");
		}

		const doUnlock = [...this.locks.values()].map((lock) => lock.unlock());

		return this.locks.size
			? Promise.allSettled(doUnlock)
			: Promise.resolve();
	},
};
