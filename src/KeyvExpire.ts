import Keyv from 'keyv';
import EventEmitter from 'node:events';

export class KeyvExpire extends EventEmitter {
	constructor(private db: Keyv) {
		super();
		setInterval(async () => {
			for await (const [key, value] of this.db.iterator(
				db.opts.namespace,
			)) {
				if (value.ttl < Date.now()) {
					this.emit('expire', key, value);
					await this.db.delete(key);
				}
			}
		}, 1000);
	}

	public async set(key: string, value: any, ttl?: number) {
		const obj = {
			value,
		} as any;
		if (ttl) {
			obj['ttl'] = Date.now() + ttl;
		}
		await this.db.set(key, obj);
	}

	public async get(key: string) {
		const value = await this.db.get(key);
		if (value) {
			return value.value;
		}
		return undefined;
	}

	public async delete(key: string) {
		await this.db.delete(key);
	}
}
