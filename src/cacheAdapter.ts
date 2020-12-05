function getMemoryCache() {
	let data = new Map();

	return {
		get(key: string) {
			return Promise.resolve(data.get(key));
		},
		set(key: string, value: string) {
			return Promise.resolve(void data.set(key, value));
		},
		unset(key: string) {
			data.delete(key);
			return Promise.resolve(void data.delete(key));
		},
		clear() {
			return Promise.resolve(data.clear());
		},
	};
}

function getBrowserCache() {
	return {
		get(key: string): Promise<string | null> {
			return Promise.resolve(localStorage.getItem(key));
		},
		set(key: string, value: string) {
			return Promise.resolve(localStorage.setItem(key, value));
		},
		unset(key: string) {
			return Promise.resolve(localStorage.removeItem(key));
		},
		clear() {
			return Promise.resolve(localStorage.clear());
		},
	};
}

export default typeof window === "undefined" ? getMemoryCache() : getBrowserCache();
