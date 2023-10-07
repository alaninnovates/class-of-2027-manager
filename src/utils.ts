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
		return `${colors.blue(
			`[${new Date().toISOString()}]`,
		)} ${colors.magenta(`[${sender}]`)} ${args.join(' ')}`;
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

export const getEnvArray = (key: string) => {
	return process.env[key]?.split(',') ?? [];
};

export const getProgramArguments = () => {
	return process.argv.slice(2);
};

export const colors = {
	green: (str: string) => `\x1b[32m${str}\x1b[0m`,
	red: (str: string) => `\x1b[31m${str}\x1b[0m`,
	yellow: (str: string) => `\x1b[33m${str}\x1b[0m`,
	blue: (str: string) => `\x1b[34m${str}\x1b[0m`,
	magenta: (str: string) => `\x1b[35m${str}\x1b[0m`,
	cyan: (str: string) => `\x1b[36m${str}\x1b[0m`,
	white: (str: string) => `\x1b[37m${str}\x1b[0m`,
};
