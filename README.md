# race-cache

确保依赖数据的高可用性缓存工具，如：网络环境差或临时断网的情况。

执行步骤如下：
![race-cache](https://images-cdn.shimo.im/Go5Nqi6uWM6Vivdo__thumbnail.png)

## Install

```sh
npm install --save race-cache
```


## Usage

[![Edit race-cache-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/holy-rain-3lebf?fontsize=14&hidenavigation=1&theme=dark)

```ts
import raceCache, { raceCacheWithInfo } from 'race-cache'

async function getList(url){
  const data = await raceCache(url /*缓存Key*/, fetch(url))
  // or
  const info = await raceCacheWithInfo(url /*缓存Key*/, fetch(url))
  // info?.ok info?.timeout info?.error info.data
}
```

## API

```ts
import raceCache, { raceCacheWithInfo } from 'race-cache'

raceCache(key, promise[, option])
// or
raceCacheWithInfo(key, promise[, options])
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