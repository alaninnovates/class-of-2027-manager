export const parseCustomId = (customId: string) => {
	const [scope, ...args] = customId.split(':');
	return { scope, args };
};

export const choose = <T>(...args: T[]) => {
	return args[Math.floor(Math.random() * args.length)];
};

export const log = {
	info: (sender: string, ...args: any[]) => {
		console.log(log.format(sender, ...args));
	},
	error: (sender: string, ...args: any[]) => {
		console.error(log.format(sender, ...args));
	},
	format: (sender: string, ...args: any[]) => {
		return `[${new Date().toISOString()}] [${sender}] ${args.join(' ')}`;
	},
};

export const retry = (
	fn: Function,
	systemName: string,
	retriesLeft: number = 5,
	interval: number = 1000,
) => {
	return new Promise((resolve, reject) => {
		fn()
			.then(resolve)
			.catch((error: any) => {
				log.error(
					systemName,
					`error: ${error.message} - retrying ${retriesLeft} more times`,
				);
				setTimeout(() => {
					if (retriesLeft === 1) {
						reject(error);
						return;
					}
					retry(fn, systemName, retriesLeft - 1, interval).then(
						resolve,
						reject,
					);
				}, interval);
			});
	});
};
