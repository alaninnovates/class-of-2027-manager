import {
	EmbedBuilder,
	Colors,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	MessageCreateOptions,
} from 'discord.js';

export const MVHSKeywords = ['mv', 'mvhs', 'mountain view'];
export const LAHSKeywords = ['lahs', 'los altos'];
export const CensoredEmojis = ['🍆'];

export const HighSchoolReactionRoleMessage = {
	embeds: [
		new EmbedBuilder()
			.setTitle('Select your high school!')
			.setColor(Colors.Green),
	],
	components: [
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('rr:highschool')
				.setMaxValues(1)
				.setOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel('LAHS')
						.setValue('lahs')
						.setDescription('Los Altos High School')
						.setEmoji('<:lahs:1121447247570292787>'),
					new StringSelectMenuOptionBuilder()
						.setLabel('MVHS')
						.setValue('mvhs')
						.setDescription('Mountain View High School')
						.setEmoji('<:mvhs:1121447249851981934>'),
				),
		),
	],
} as MessageCreateOptions;
export const HighSchoolRoles = {
	mvhs: process.env.MVHS_ROLE_ID!,
	lahs: process.env.LAHS_ROLE_ID!,
};

export const MiddleSchoolReactionRoleMessage = {
	embeds: [
		new EmbedBuilder()
			.setTitle('Select your middle school! (Optional)')
			.setColor(Colors.Blue),
	],
	components: [
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('rr:middleschool')
				.setMaxValues(1)
				.setOptions(
					new StringSelectMenuOptionBuilder()
						.setLabel('Egan')
						.setValue('egan')
						.setDescription('Egan Junior High School'),
					new StringSelectMenuOptionBuilder()
						.setLabel('Blach')
						.setValue('blach')
						.setDescription('Blach Intermediate School'),
					new StringSelectMenuOptionBuilder()
						.setLabel('Graham')
						.setValue('graham')
						.setDescription('Graham Middle School'),
					new StringSelectMenuOptionBuilder()
						.setLabel('CMS')
						.setValue('cms')
						.setDescription('Crittenden Middle School'),
					new StringSelectMenuOptionBuilder()
						.setLabel('BCS')
						.setValue('bcs')
						.setDescription('Bullis Charter School'),
				),
		),
	],
} as MessageCreateOptions;
export const MiddleSchoolRoles = {
	egan: process.env.EGAN_ROLE_ID!,
	blach: process.env.BLACH_ROLE_ID!,
	graham: process.env.GRAHAM_ROLE_ID!,
	cms: process.env.CMS_ROLE_ID!,
	bcs: process.env.BCS_ROLE_ID!,
};
