/**
 * 简易 lru cache
 */

export interface LRUCacheOptions {
	capacity?: number;
	cache?: Record<string, { expire: number }>;
	list?: string[];
	onItemRemove?: (key: string) => void;
}

export class LRUCache {
	protected version = "%VERSION%";
	protected capacity: number;
	protected cache: Record<string, { expire: number }>;
	protected list: string[];
	protected options: LRUCacheOptions;
	constructor(options: LRUCacheOptions = {}) {
		this.capacity = options.capacity || 99;
		this.cache = options.cache || Object.create(null);
		this.list = options.list || [];
		this.options = options;
	}

	protected triggerRemove(key: string) {
		const onItemRemove = this.options.onItemRemove;
		onItemRemove && onItemRemove(key);
	}

	get(key: string) {
		const cache = this.cache[key];
		if (!cache) return null;

		const now = Date.now();

		if (now > cache.expire) {
			this.unset(key);
			return null;
		}

		const newList = [key];
		const len = this.list.length;

		for (let i = 0; i < len; i++) {
			const k = this.list[i];
			if (k === key) continue;

			const c = this.cache[k];
			// 检测缓存失效
			if (!c || now > c.expire) {
				delete this.cache[k];
				this.triggerRemove(k);
				continue;
			}
			newList.push(k);
		}

		this.list = newList;

		return cache;
	}

	set(key: string, expire: number) {
		const now = Date.now();

		this.cache[key] = {
			expire: now + expire,
		};

		let counter = 1;
		const newList = [key];
		const len = this.list.length;

		for (let i = 0; i < len; i++) {
			const k = this.list[i];
			if (k === key) continue;

			const _c = counter;

			// 超出容量
			if (_c >= this.capacity) {
				delete this.cache[k];
				this.triggerRemove(k);
				continue;
			}

			const c = this.cache[k];
			// 检测缓存失效
			if (!c || now > c.expire) {
				delete this.cache[k];
				this.triggerRemove(k);
				continue;
			}

			newList.push(k);
			counter++;
		}

		this.list = newList;

		return true;
	}

	unset(key: string) {
		const c = this.cache[key];
		if (c) {
			c.expire = 0;
			this.refresh();
		}
	}

	clear() {
		this.list.forEach(key => {
			this.triggerRemove(key);
		});
		this.cache = Object.create(null);
		this.list = [];
	}

	setCapacity(capacity: number) {
		this.capacity = capacity;

		let len = this.list.length;

		while (len > capacity) {
			const key = this.list[len - 1];

			this.list.pop();
			delete this.cache[key];

			this.triggerRemove(key);

			len--;
		}
	}

	size() {
		return this.list.length;
	}

	refresh() {
		const now = Date.now();
		const len = this.list.length;

		if (!len) {
			return;
		}

		const newList: string[] = [];

		for (let i = 0; i < len; i++) {
			const k = this.list[i];
			const c = this.cache[k];
			// 检测缓存失效
			if (!c || now > c.expire) {
				delete this.cache[k];
				this.triggerRemove(k);
				continue;
			}

			newList.push(k);
		}

		this.list = newList;
	}

	toData() {
		return {
			version: this.version,
			capacity: this.capacity,
			list: this.list,
			cache: this.cache,
		};
	}
}

export default LRUCache;
