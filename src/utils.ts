export const parseCustomId = (customId: string) => {
	const [scope, ...args] = customId.split(':');
	return { scope, args };
};
