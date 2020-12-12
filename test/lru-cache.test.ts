import { LRUCache } from "../src/LRUCache";
import { cache } from "../src";

function sleep(time = 0) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), time);
	});
}

test("lru-cache basic", async () => {
	const onItemRemove = jest.fn();
	const cache = new LRUCache({
		capacity: 3,
		onItemRemove,
	});

	// a
	cache.set("a", 500);
	// b a
	cache.set("b", 400);
	// c b a
	cache.set("c", 300);

	expect(cache.size()).toEqual(3);

	// d c b
	cache.set("d", 50);

	expect(onItemRemove).toBeCalledTimes(1);
	expect(cache.size()).toEqual(3);

	expect(cache.get("a")).toBe(null);

	expect(cache.get("b")).not.toBe(null);

	// e b d
	cache.set("e", 50);
	expect(onItemRemove).toBeCalledTimes(2);
	expect(cache.toData().list).toEqual(["e", "b", "d"]);

	expect(cache.get("c")).toBe(null);

	cache.get("d");
	expect(cache.toData().list).toEqual(["d", "e", "b"]);

	await sleep(60);

	expect(cache.get("e")).toBe(null);
	expect(onItemRemove).toBeCalledTimes(4);
	expect(cache.toData().list).toEqual(["b"]);

	cache.set("f", 50);
	expect(cache.toData().list).toEqual(["f", "b"]);

	await sleep(60);
	expect(cache.toData().list).toEqual(["f", "b"]);
	cache.refresh();
	expect(onItemRemove).toBeCalledTimes(5);
	expect(cache.toData().list).toEqual(["b"]);

	cache.set("g", 100);

	cache.unset("b");
	expect(onItemRemove).toBeCalledTimes(6);
	expect(cache.toData().list).toEqual(["g"]);

	cache.clear();
	expect(onItemRemove).toBeCalledTimes(7);
	expect(cache.toData().list).toEqual([]);
});

test("lru-cache setCapacity", async () => {
	const onItemRemove = jest.fn();
	const cache = new LRUCache({
		capacity: 5,
		onItemRemove,
	});

	cache.set("a", 500);
	cache.set("b", 400);
	cache.set("c", 300);
	cache.set("d", 300);
	cache.set("e", 300);

	expect(cache.size()).toEqual(5);

	cache.setCapacity(3);
	expect(onItemRemove).toBeCalledTimes(2);
	expect(cache.size()).toEqual(3);
	expect(cache.toData().list).toEqual(["e", "d", "c"]);
});

test("race-cache lru-cache", async () => {
	await cache.setCapacity(20);
	for (let i = 0; i < 21; i++) {
		cache.set(i + "", 50);
	}

	const size = await cache.size();

	expect(size).toEqual(20);
	expect(await cache.get("0")).toBe(null);
	expect(await cache.get("10")).not.toBe(null);

	await cache.setCapacity(99);
});
