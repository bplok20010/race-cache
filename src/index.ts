import _cache from "./cache";
import isPromise from "is-promise";

type GetPromiseResolveType<T> = T extends Promise<infer U> ? U : never;

export interface RaceInfo<T = Promise<any>> {
	// 数据正常返回
	ok?: boolean;
	// 超时返回
	timeout?: boolean;
	// 异常返回
	error?: any;
	// 返回数据
	data: GetPromiseResolveType<T>;
}

export interface RaceCacheOptions<T = Promise<any>> {
	// 内置缓存超时时间，单位：ms
	// 默认：3600 * 24 * 365 * 1000
	expire?: number;
	// 等待外部响应时间，超时后走缓存数据，单位：ms
	// 默认：0
	waitTime?: number;
	// 是否忽略promise的异常catch，并使用缓存数据
	// 默认：true
	ignoreError?: boolean;
	// 获取内部状态信息，如数据是否超时、异常或正常的返回
	raceCallback?: (raceInfo: RaceInfo<T>) => void;
	// 自定义缓存接口：get,set
	cache?: {
		get: typeof _cache.get;
		set: typeof _cache.set;
	};
}

const version = "%VERSION%";

export { _cache as cache, version };

export function raceCache<T extends Promise<any>>(
	key: string,
	promise: T,
	options: RaceCacheOptions<T> = {}
): Promise<GetPromiseResolveType<T>> {
	const { waitTime = 0, expire, ignoreError = true, raceCallback, cache = _cache } = options;
	let p = isPromise(promise) ? promise : Promise.resolve(promise as any);
	let hasCall = false;

	const setRaceInfo = (info: RaceInfo<T>) => {
		if (raceCallback && !hasCall) {
			hasCall = true;
			raceCallback(info);
		}
	};

	const cp: Promise<GetPromiseResolveType<T>> = new Promise(resolve => {
		setTimeout(() => {
			cache.get(key).then(ret => {
				if (ret != null) {
					setRaceInfo({
						timeout: true,
						data: ret,
					});
					resolve(ret);
				}
			});
		}, waitTime || 0);
	});

	p = p.then(ret => {
		cache.set(key, ret, {
			expire,
		});
		setRaceInfo({
			ok: true,
			data: ret,
		});
		return ret;
	});

	if (ignoreError) {
		p = p.catch((e: any) => {
			return cache.get(key).then(ret => {
				if (ret != null) {
					setRaceInfo({
						error: e,
						data: ret,
					});
					return ret;
				}

				throw e;
			});
		});
	}

	return Promise.race([p, cp]);
}

export function raceCacheWithInfo<T extends Promise<any>>(
	key: string,
	promise: T,
	options: Omit<RaceCacheOptions<T>, "raceCallback"> = {}
): Promise<RaceInfo<T>> {
	let info: RaceInfo<T>;
	return raceCache(key, promise, {
		...options,
		raceCallback(r) {
			info = r;
		},
	}).then(() => info);
}

export default raceCache;