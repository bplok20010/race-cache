import cache from "./cacheAdapter";
import LRUCache from "./LRUCache";

interface CacheOptions {
	// 缓存超时时间，单位：ms
	expire?: number;
}

const version = "%VERSION%";
const LRU_SIZE = 99;
const LRU_CACHE_KEY = "__@@RACE_CACHE_INDEX@@__";
let lruCache: Promise<LRUCache>;

function safeParser<T>(value: string, defaultValue: T): T {
	let p = defaultValue;
	try {
		p = JSON.parse(value);
	} catch (e) {}

	return p;
}

function saveLRUCache() {
	getLRUCache().then(lruCache => {
		cache.set(LRU_CACHE_KEY, JSON.stringify(lruCache.toData()));
	});
}

function getLRUCache() {
	if (lruCache) return lruCache;

	return (lruCache = cache.get(LRU_CACHE_KEY).then(value => {
		let lruOpts = {
			setCapacity: LRU_SIZE,
			list: [],
			cache: Object.create(null),
		};

		if (value) {
			lruOpts = safeParser(value, lruOpts);
		}

		return new LRUCache({
			...lruOpts,
			onItemRemove(key: string) {
				cache.unset(key);
			},
		});
	}));
}

// 初始化
getLRUCache();

const setCapacity = (capacity: number) => {
	return getLRUCache()
		.then(lruCache => lruCache.setCapacity(capacity))
		.then(saveLRUCache);
};

const get = (key: string) => {
	getLRUCache()
		.then(lruCache => lruCache.get(key))
		.then(saveLRUCache);

	return cache.get(key).then(value => {
		if (value == null) return null;

		const data = safeParser(value, { expire: 0, meta: null } as { expire: number; meta: any }); //JSON.parse(value) as { expire: number; meta: any };
		const now = Date.now();
		const expire = data?.expire || 0;

		return now > expire ? (unset(key), null) : data?.meta;
	});
};

const set = (key: string, value: any, options?: CacheOptions) => {
	const now = Date.now();
	const expire = options?.expire || 3600 * 24 * 365 * 1000;

	getLRUCache()
		.then(lruCache => lruCache.set(key, expire))
		.then(saveLRUCache);

	return cache.set(
		key,
		JSON.stringify({
			version,
			created: now,
			expire: now + expire,
			meta: value,
		})
	);
};

const unset = (key: string) => {
	getLRUCache()
		.then(lruCache => lruCache.unset(key))
		.then(saveLRUCache);

	return cache.unset(key);
};

const size = () => getLRUCache().then(lruCache => lruCache.size());

const clear = () => {
	getLRUCache()
		.then(lruCache => lruCache.clear())
		.then(saveLRUCache);

	return cache.clear();
};

const refresh = () => {
	return getLRUCache()
		.then(lruCache => lruCache.refresh())
		.then(saveLRUCache);
};

export default {
	getLRUCache,
	setCapacity,
	get,
	set,
	unset,
	size,
	clear,
	refresh,
	LRU_SIZE,
	LRU_CACHE_KEY,
	cache,
};
