import { Client, ClientEvents, SlashCommandBuilder } from 'discord.js';

export interface System {
	name: string;
	commands?: SlashCommandBuilder[];
	init?: (client: Client) => void;
	events: {
		[K in keyof ClientEvents]?: (...args: ClientEvents[K]) => Promise<void>;
	};
}
