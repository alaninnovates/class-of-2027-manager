import { MessageType } from 'discord.js';
import { System } from '../types';
import { log } from '../utils';

export default {
	name: 'suggestions',
	events: {
		messageCreate: async (message) => {
			if (message.channelId !== process.env.SUGGESTION_CHANNEL_ID) return;
			if (message.type !== MessageType.Default) return;
			try {
				await message.react('✅');
				await message.react('❌');
				await message.startThread({
					name: 'Discussion',
				});
			} catch (e) {
				log.error('suggestions', 'error handling suggestion:', e);
			}
		},
	},
} as System;
