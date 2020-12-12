# race-cache

确保依赖数据高可用性的缓存函数，如：网络环境差或临时断网的情况。

执行步骤如下：
![race-cache](https://images-cdn.shimo.im/Go5Nqi6uWM6Vivdo__thumbnail.png)

## Install

```sh
npm install --save race-cache
```

## Usage

[![Edit race-cache-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/holy-rain-3lebf?fontsize=14&hidenavigation=1&theme=dark)

```ts
import { raceCache, raceCacheWithInfo } from 'race-cache'

async function getList(url){
  const data = await raceCache(url /*缓存Key*/, fetch(url))
  // or
  const info = await raceCacheWithInfo(url /*缓存Key*/, fetch(url))
  // info?.ok info?.timeout info?.error info.data
}
```

> 内置缓存在浏览器环境使用`localStorage`，在node.js环境使用的原生`Map`，可通过`cache`参数进行自定义缓存接口。

## API

```ts
import { raceCache, raceCacheWithInfo, cache } from 'race-cache'

raceCache(key, promise[, option])
// or
raceCacheWithInfo(key, promise[, options])

// 内置缓存对象cache
cache.get
cache.set
cache.unset
cache.clear
...
```

## interfaces 

```ts
interface RaceCacheOptions<T> {
	// 内置缓存超时时间，单位：ms
	// 默认：3600 * 24 * 365 * 1000
	expire?: number;
	// 等待外部响应时间，超时后走缓存数据，单位：ms
	// 默认：0
	waitTime?: number;
	// 是否忽略promise的异常catch，并使用缓存数据
	// 默认：true
	ignoreError?: boolean;
	// 获取内部状态信息，如：数据是否超时、异常或正常的返回
	raceCallback?: (raceInfo: RaceInfo<T>) => void;
	// 自定义缓存接口：get,set
	cache?: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any, options?: CacheOptions | undefined) => Promise<void>;
  };
  // 超时触发回调，只在缓存存在的区情况下触发
	onTimeout?: (value: GetPromiseResolveType<T>) => void;
	// 传入的promise触发resolve时调用
	onFulfilled?: (value: GetPromiseResolveType<T>) => void;
	// 传入的promise触发reject时调用
	onRejected?: (reason: any) => void;
}

interface RaceInfo<T> {
    // 正常返回标识
    ok?: boolean;
    // 超时返回标识
    timeout?: boolean;
    // 异常返回标识
    error?: any;
    // 返回数据
    data: GetPromiseResolveType<T>;
}

interface CacheOptions {
	// 缓存超时时间，单位：ms
	expire?: number;
}
```