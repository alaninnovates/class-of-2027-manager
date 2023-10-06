import 'dotenv/config';
import { promises as fs } from 'fs';
import { Client, Events, GatewayIntentBits, Partials } from 'discord.js';
import { System } from './types';
import { log } from './utils';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction,
		Partials.GuildMember,
	],
});

const systems: System[] = [];
const loadSystems = async () => {
	const systemFiles = await fs.readdir('./src/systems');
	for await (const systemFile of systemFiles.map((f) => f.split('.')[0])) {
		const system = await import(`./systems/${systemFile}`);
		systems.push(system.default);
	}
};

client.once(Events.ClientReady, async (c) => {
	for (const system of systems) {
		log.info('bot', `Loading system ${system.name}`);
		if (system.init) system.init(client);
		for (const [event, handler] of Object.entries(system.events)) {
			client.on(event, handler);
		}
	}
	log.info('bot', `Ready! Logged in as ${c.user?.tag}`);
});

const start = async () => {
	await loadSystems();
	await client.login(process.env.DISCORD_TOKEN!);
};

start();
