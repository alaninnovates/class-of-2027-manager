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
