# race-cache

确保依赖数据的高可用缓存函数。

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

async function fetchList(url){
  const data = await raceCache(url /*缓存 Key*/, fetch(url))
  // or
  const info = await raceCacheWithInfo(url /*缓存 Key*/, fetch(url))
  // info?.ok info?.timeout info?.error info.data
}
```

> 内置缓存在浏览器环境使用 `localStorage`，在 node.js 环境使用的原生 `Map`，可通过 `cache` 参数进行自定义缓存接口。

## API

```ts
import { raceCache, raceCacheWithInfo, cache } from 'race-cache'

raceCache(key, promise[, RaceCacheOptions])
// or
raceCacheWithInfo(key, promise[, RaceCacheOptions])

// 内置缓存对象 cache
cache.get
cache.set
cache.unset
cache.clear
cache.setCapacity
...
```

**注：** 内置缓存 LRU 容量默认为：99

## Interfaces 

```ts
interface RaceCacheOptions<T> {
  // 内置缓存超时时间，单位：ms
  // 默认：3600 * 24 * 365 * 1000
  expire?: number;
  // 等待外部响应时间，超时后走缓存数据，单位：ms
  // 默认：0
  waitTime?: number;
  // 超时状态下，当缓存无数据时调用
	getInitialValue?: () => Promise<GetPromiseResolveType<T>> | GetPromiseResolveType<T>;
  // 是否忽略 promise 的异常 catch，并使用缓存数据
  // 如果缓存不存在则抛出异常
  // 默认：true
  ignoreError?: boolean;
  // ignoreError 为 true 的情况下生效
  // 传入的 promise 触发 reject 且无缓存的情况下会调用 fallback
  // 如果 fallback 也未设置在则直接抛异常
  fallback?: () => Promise<GetPromiseResolveType<T>> | GetPromiseResolveType<T>;
  // 获取内部状态信息，如：数据是否超时、异常或正常的返回
  raceCallback?: (raceInfo: RaceInfo<T>) => void;
  // 自定义缓存接口：get,set
  cache?: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, options?: CacheOptions | undefined) => Promise<void>;
  };
  // 超时触发回调，只在缓存存在的情况下触发
  onTimeout?: (value: GetPromiseResolveType<T>) => void;
  // 传入的 promise 触发 resolve 时调用
  onFulfilled?: (value: GetPromiseResolveType<T>) => void;
  // 传入的 promise 触发 reject 时调用
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