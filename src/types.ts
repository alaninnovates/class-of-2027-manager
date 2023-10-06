import { Client, ClientEvents } from 'discord.js';

export interface System {
	name: string;
	init?: (client: Client) => void;
	events: {
		[K in keyof ClientEvents]?: (...args: ClientEvents[K]) => void;
	};
}
