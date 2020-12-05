import raceCache, { cache, raceCacheWithInfo } from "../src";

function sleep(time = 0) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), time);
	});
}

test("race-cache default", async () => {
	const key = "race-cache default";

	let value = 1;

	let data = await raceCache(key, Promise.resolve(value));
	expect(data).toEqual(1);
	expect(await cache.get(key)).toEqual(1);

	value = 2;
	data = await raceCache(key, Promise.resolve(value));
	expect(await cache.get(key)).toEqual(2);
	expect(data).toEqual(2);

	value = 3;
	data = await raceCache(key, Promise.resolve(value));
	expect(await cache.get(key)).toEqual(3);
	expect(data).toEqual(3);

	value = 4;
	data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(data).toEqual(3);
});

test("race-cache expire", async () => {
	const key = "race-cache expire";
	let value = 5;
	let data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		}),
		{
			expire: 10,
		}
	);
	expect(data).toEqual(5);

	await sleep(20);
	expect(await cache.get(key)).toEqual(null);

	value = 6;
	data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		}),
		{
			waitTime: 60,
		}
	);

	expect(data).toEqual(6);

	await sleep(60);
	expect(await cache.get(key)).toEqual(6);
});

test("race-cache timeout", async () => {
	const key = "race-cache timeout";
	let value = 5;
	let data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(data).toEqual(5);

	value = 6;
	data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(data).toEqual(5);
});

test("race-cache custom cache", async () => {
	const key = "race-cache custom cache";
	let cacheValue: any = {};
	let value = 5;
	let data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		}),
		{
			cache: {
				get: k => Promise.resolve(cacheValue[k]),
				set: (k, v) => Promise.resolve((cacheValue[k] = v * 2)),
			},
		}
	);

	expect(cacheValue[key]).toEqual(5 * 2);
	expect(data).toEqual(5);

	await sleep(60);

	value = 6;
	data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		}),
		{
			cache: {
				get: k => Promise.resolve(cacheValue[k]),
				set: (k, v) => Promise.resolve((cacheValue[k] = v * 2)),
			},
		}
	);

	expect(data).toEqual(5 * 2);
	await sleep(60);
	expect(cacheValue[key]).toEqual(6 * 2);
});

test("race-cache catch error", async () => {
	const key = "race-cache catch error";
	let value = 5;
	let data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(data).toEqual(5);

	value = 6;
	data = await raceCache(
		key,
		new Promise<number>((_, reject) => {
			setTimeout(() => {
				reject();
			}, 50);
		})
	);
	expect(data).toEqual(5);
});

test("race-cache ignore error", async () => {
	const key = "race-cache ignore error";
	let value = 5;
	let data = await raceCache(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(data).toEqual(5);

	value = 6;
	try {
		await raceCache(
			key,
			new Promise<number>((_, reject) => {
				setTimeout(() => {
					reject("err");
				}, 50);
			}),
			{
				waitTime: 100,
				ignoreError: false,
			}
		);
	} catch (err) {
		expect(err).toEqual("err");
	}
});

test("race-cache race info default", async () => {
	const key = "race-cache race info default";
	let value = 5;
	let info = await raceCacheWithInfo(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(info.ok).toEqual(true);
	expect(info.data).toEqual(5);

	value = 6;
	try {
		await raceCache(
			key,
			new Promise<number>((_, reject) => {
				setTimeout(() => {
					reject("err");
				}, 50);
			}),
			{
				waitTime: 100,
				ignoreError: false,
			}
		);
	} catch (err) {
		expect(err).toEqual("err");
	}
});

test("race-cache race info timeout", async () => {
	const key = "race-cache race info timeout";
	let value = 5;
	let info = await raceCacheWithInfo(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(info.ok).toEqual(true);
	expect(info.data).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(5);

	value = 6;
	info = await raceCacheWithInfo(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);

	expect(info.timeout).toEqual(true);
	expect(info.data).toEqual(5);
	expect(await cache.get(key)).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(6);
});

test("race-cache race info catch", async () => {
	const key = "race-cache race info catch";
	let value = 5;
	let info = await raceCacheWithInfo(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(info.ok).toEqual(true);
	expect(info.data).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(5);

	value = 6;
	info = await raceCacheWithInfo(
		key,
		new Promise<number>((_, reject) => {
			setTimeout(() => {
				reject("error");
			}, 20);
		}),
		{
			waitTime: 30,
		}
	);

	expect(info.error).toEqual("error");
	expect(info.data).toEqual(5);
	expect(await cache.get(key)).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(5);
});

test("race-cache race info allow error", async () => {
	const key = "race-cache race info allow error";
	let value = 5;
	let info = await raceCacheWithInfo(
		key,
		new Promise<number>(resolve => {
			setTimeout(() => {
				resolve(value);
			}, 50);
		})
	);
	expect(info.ok).toEqual(true);
	expect(info.data).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(5);

	value = 6;
	try {
		info = await raceCacheWithInfo(
			key,
			new Promise<number>((_, reject) => {
				setTimeout(() => {
					reject("error");
				}, 20);
			}),
			{
				waitTime: 30,
				ignoreError: false,
			}
		);
	} catch (e) {
		expect(e).toEqual("error");
	}

	expect(await cache.get(key)).toEqual(5);

	await sleep(60);
	expect(await cache.get(key)).toEqual(5);
});
