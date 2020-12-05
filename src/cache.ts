import cache from "./cacheAdapter";

interface CacheOptions {
	// 缓存超时时间，单位：ms
	expire?: number;
}

const get = (key: string) =>
	cache.get(key).then(value => {
		if (value == null) return null;
		const data = JSON.parse(value) as { expire: number; meta: any };
		const now = Date.now();
		const expire = data?.expire || 0;

		return now > expire ? null : data?.meta;
	});

const set = (key: string, value: any, options?: CacheOptions) => {
	const expire = (options?.expire || 3600 * 24 * 365 * 1000) + Date.now();
	return cache.set(
		key,
		JSON.stringify({
			created: Date.now(),
			expire,
			meta: value,
		})
	);
};

const unset = (key: string) => cache.unset(key);

const clear = () => cache.clear();

export default {
	get,
	set,
	unset,
	clear,
};
