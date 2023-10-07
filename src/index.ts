import 'dotenv/config';
import { promises as fs } from 'fs';
import {
	Client,
	Events,
	GatewayIntentBits,
	Partials,
	Routes,
} from 'discord.js';
import { System } from './types';
import { getProgramArguments, log } from './utils';

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

// todo: not working
const eventErrorWrapper = (
	systemName: string,
	handler: (...args: any[]) => Promise<void>,
) => {
	return (...args: any[]) => {
		handler(...args).catch((err) => {
			log.error(systemName, `Error: ${err.stack}`);
		});
	};
};

client.once(Events.ClientReady, async (c) => {
	const programArgs = getProgramArguments();
	if (programArgs.includes('--register-cmds')) {
		log.info('bot', 'Registering slash commands');
		const cmdArrJson = [];
		for (const system of systems) {
			if (!system.commands) continue;
			for (const command of system.commands) {
				cmdArrJson.push(command.toJSON());
			}
		}
		await c.rest.put(Routes.applicationCommands(c.user!.id), {
			body: cmdArrJson,
		});
		log.info('bot', `Registered ${cmdArrJson.length} slash commands`);
	}
	for (const system of systems) {
		log.info('bot', `Loading system ${system.name}`);
		if (system.init) system.init(client);
		for (const [event, handler] of Object.entries(system.events)) {
			client.on(event, eventErrorWrapper(system.name, handler));
		}
	}
	log.info('bot', `Ready! Logged in as ${c.user?.tag}`);
});

const start = async () => {
	await loadSystems();
	await client.login(process.env.DISCORD_TOKEN!);
};

start();
