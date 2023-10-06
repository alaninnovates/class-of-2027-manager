import 'dotenv/config';
import {
	Client,
	Colors,
	EmbedBuilder,
	Events,
	GatewayIntentBits,
	GuildMemberRoleManager,
	MessageType,
	Partials,
	TextChannel,
	bold,
} from 'discord.js';
import {
	CensoredEmojis,
	HighSchoolRoles,
	LAHSKeywords,
	MVHSKeywords,
	MiddleSchoolRoles,
} from './config';
import { parseCustomId } from './utils';
import Keyv from 'keyv';
import { KeyvExpire } from './KeyvExpire';

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

const countingStrikeDb = new KeyvExpire(
	new Keyv<number>('sqlite://./data/database.db', {
		namespace: 'countingStrike',
	}),
);
const csDelDb = new KeyvExpire(
	new Keyv('sqlite://./data/database.db', {
		namespace: 'csDel',
	}),
);

client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	// const rrChannel = (await c.channels.fetch(
	// 	process.env.RR_CHANNEL_ID!,
	// )) as TextChannel;
	// rrChannel.send(HighSchoolReactionRoleMessage);
	// rrChannel.send(MiddleSchoolReactionRoleMessage);
});

const welcomeEmojis = ['👋', '🎉', '🙌', '📚'];

client.on(Events.MessageCreate, (message) => {
	if (message.author.bot) return;
	if (message.channelId === process.env.INTRO_CHANNEL_ID) {
		message.react(welcomeEmojis.random());
		let school = '';
		const roles = message.member?.roles as GuildMemberRoleManager;
		if (
			!roles.cache.hasAny(
				process.env.MVHS_ROLE_ID!,
				process.env.LAHS_ROLE_ID!,
			)
		) {
			if (
				MVHSKeywords.some((s) =>
					message.content.toLowerCase().includes(s),
				)
			) {
				message.member?.roles.add(process.env.MVHS_ROLE_ID!);
				school = 'Mountain View High School';
			} else if (
				LAHSKeywords.some((s) =>
					message.content.toLowerCase().includes(s),
				)
			) {
				message.member?.roles.add(process.env.LAHS_ROLE_ID!);
				school = 'Los Altos High School';
			}
		}
		message.author
			.send(
				`Welcome to the MVLA Class of 2027 Discord Server!${
					school
						? `\n\nYou have been added to the ${school} role. If this is not your school, please contact an admin!`
						: ''
				}`,
			)
			.catch((_) => _);
	} else if (message.channelId === process.env.SUGGESTION_CHANNEL_ID) {
		if (message.type !== MessageType.Default) return;
		message.react('✅');
		message.react('❌');
		message.startThread({
			name: 'Discussion',
		});
	}
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
	if (reaction.partial) await reaction.fetch();
	if (CensoredEmojis.some((e) => reaction.emoji.name === e)) {
		reaction.remove();
		const logChan = (await client.channels.fetch(
			process.env.LOGS_CHANNEL_ID!,
		)) as TextChannel;
		logChan?.send({
			embeds: [
				new EmbedBuilder()
					.setDescription(
						bold(
							`Reaction Removed in <#${reaction.message.channelId}> [Jump to Message](${reaction.message.url})`,
						),
					)
					.setAuthor({
						name: user.tag!,
						iconURL: user.displayAvatarURL(),
					})
					.addFields([
						{
							name: 'User',
							value: `<@${user.id}>`,
						},
						{
							name: 'Emoji',
							value: reaction.emoji.name!,
						},
					])
					.setColor(Colors.Red)
					.setFooter({
						text: `Reacter: ${user.id} | Messsage ID: ${reaction.message.id}`,
					})
					.setTimestamp(),
			],
		});
	}
});

// users who have not selected their HS yet
const nonRoleUsers: {
	[id: string]: NodeJS.Timer;
} = {};

client.on(Events.GuildMemberAdd, (member) => {
	nonRoleUsers[member.id] = setTimeout(() => {
		console.log(
			`Sending message to ${member.user.tag} reguarding reaction roles`,
		);
		member
			.send(
				"We hope you have been enjoying your time in the MVLA Class of 2027 Discord Server! We noticed you haven't selected a high school role yet. Please select your high school in <#1119993465640591440>. Thank you!",
			)
			.catch((_) => _);
	}, 24 * 60 * 60 * 1000);
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
	if (newMember.nickname?.toLowerCase().includes('fuck')) {
		if (oldMember.nickname?.toLowerCase().includes('fuck')) {
			newMember.setNickname('No swears');
		}
		newMember.setNickname(oldMember.nickname);
	}
	if (
		newMember.roles.cache.hasAny(
			process.env.MVHS_ROLE_ID!,
			process.env.LAHS_ROLE_ID!,
		)
	) {
		if (nonRoleUsers[newMember.id]) {
			clearTimeout(nonRoleUsers[newMember.id]);
		}
	}
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isStringSelectMenu()) return;
	const { scope, args } = parseCustomId(interaction.customId);
	if (scope === 'rr') {
		await interaction.deferReply({
			ephemeral: true,
		});
		const selectType = args[0];
		const roleList: { [key: string]: string } =
			selectType === 'highschool' ? HighSchoolRoles : MiddleSchoolRoles;
		const roleType =
			selectType === 'highschool' ? 'High School' : 'Middle School';

		const roles = interaction.member?.roles as GuildMemberRoleManager;
		if (roles.cache.hasAny(...Object.values(roleList))) {
			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Error!')
						.setDescription(
							`You already have a ${roleType} role! If your current role is not accurate, please contact an administrator.`,
						)
						.setColor(Colors.Red),
				],
			});
			return;
		}
		const selectedRole = interaction.values[0];
		const roleId = roleList[selectedRole];
		roles.add(roleId);
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Success!')
					.setDescription(
						`You have recieved the <@&${roleId}> (${selectedRole.toUpperCase()}) role!`,
					)
					.setColor(Colors.Green),
			],
		});
	}
});

client.on(Events.MessageDelete, async (message) => {
	if (message.channelId !== process.env.COUNTING_CHANNEL_ID) return;
	if (!message || !message.author) return;
	handleCount(message.author.id, 'you deleted a message');
});
client.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
	if (newMessage.channelId !== process.env.COUNTING_CHANNEL_ID) return;
	if (!newMessage || !newMessage.author) return;
	handleCount(newMessage.author.id, 'you edited a message');
});
client.on(Events.MessageCreate, async (message) => {
	if (message.channelId !== process.env.COUNTING_CHANNEL_ID) return;
	if (
		message.content.includes('RUINED IT AT') &&
		message.author.id === '510016054391734273'
	) {
		await handleCount(
			message.mentions.users.first()!.id,
			'you said the wrong number',
		);
	}
});

const handleCount = async (authorId: string, reason: string) => {
	const existing = await countingStrikeDb.get(authorId);
	const member = await (
		await client.guilds.fetch(process.env.GUILD_ID!)
	).members.fetch(authorId);
	if (existing) {
		if (existing + 1 >= 3) {
			console.log('adding role to user:', authorId);
			await countingStrikeDb.delete(authorId);
			member.roles.add(process.env.COUNTING_MUTE_ROLE_ID!);
			await csDelDb.set(authorId, 1, 1000 * 60 * 60);
			member
				.send(
					`You have been muted in the counting channel for one hour because **${reason}**!`,
				)
				.catch((_) => _);
			return;
		}
		console.log('adding strike to user:', authorId);
		await countingStrikeDb.set(authorId, existing + 1, 1000 * 60 * 30);
		member
			.send(
				`You have been striked in the counting channel because **${reason}**! You now have ${
					existing + 1
				} strikes. If you get 3 strikes, you will be muted in the counting channel for one hour.\nNote: strikes reset every 30 minutes.`,
			)
			.catch((_) => _);
	} else {
		console.log('adding first strike to user:', authorId);
		await countingStrikeDb.set(authorId, 1, 1000 * 60 * 30);
		member
			.send(
				`You have been striked in the counting channel because **${reason}**! You now have 1 strike. If you get 3 strikes, you will be muted in the counting channel for one hour.\nNote: strikes reset every 30 minutes.`,
			)
			.catch((_) => _);
	}
};

csDelDb.on('expire', async (key, _value) => {
	const member = await (
		await client.guilds.fetch('1074907579890810880')
	).members.fetch(key);
	member.roles.remove(process.env.COUNTING_MUTE_ROLE_ID!);
});

const start = async () => {
	client.login(process.env.DISCORD_TOKEN!);
};

start();

declare global {
	interface Array<T> {
		random(): T;
	}
}

Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)];
};
