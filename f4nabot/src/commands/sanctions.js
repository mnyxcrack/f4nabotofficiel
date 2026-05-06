const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const config = require('../../config.json');

const LOG_CHANNEL_ID = "1501388106736074772";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanctions')
        .setDescription('Gestion des sanctions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub =>
            sub.setName('mute')
                .setDescription('Mute un utilisateur')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison'))
        )

        .addSubcommand(sub =>
            sub.setName('unmute')
                .setDescription('Unmute un utilisateur')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('Ban un utilisateur')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison'))
        )

        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('Kick un utilisateur')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('blacklist')
                .setDescription('Blacklist')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unblacklist')
                .setDescription('Unblacklist')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison') || "Aucune raison";
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!logChannel) {
            return interaction.reply({ content: "❌ Log channel introuvable", ephemeral: true });
        }

        let color = '#2b2d31';
        let title = '';
        let icon = '';

        try {

            // =====================
            // ACTIONS
            // =====================

            if (sub === 'mute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.add(role);
                color = '#5865F2';
                title = 'Mute';
                icon = '🔇';
            }

            if (sub === 'unmute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.remove(role);
                color = '#57F287';
                title = 'Unmute';
                icon = '🔊';
            }

            if (sub === 'ban') {
                await member.ban({ reason });
                color = '#ED4245';
                title = 'Ban';
                icon = '🔨';
            }

            if (sub === 'kick') {
                await member.kick(reason);
                color = '#FEE75C';
                title = 'Kick';
                icon = '👢';
            }

            if (sub === 'blacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.add(role);
                color = '#000000';
                title = 'Blacklist';
                icon = '🚫';
            }

            if (sub === 'unblacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.remove(role);
                color = '#00ffcc';
                title = 'Unblacklist';
                icon = '✅';
            }

            // =====================
            // EMBED STYLE PRO
            // =====================

            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: `${icon} ${title}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setDescription(`**${user.username}** a été ${title.toLowerCase()}`)
                .addFields(
                    {
                        name: "👤 Utilisateur",
                        value: `<@${user.id}>`,
                        inline: true
                    },
                    {
                        name: "📄 Raison",
                        value: reason,
                        inline: true
                    },
                    {
                        name: "👮 Staff",
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Modération • ${interaction.guild.name}`
                })
                .setTimestamp();

            // 📤 LOG UNIQUEMENT
            await logChannel.send({ embeds: [embed] });

            // 👻 MESSAGE TEMPORAIRE
            const reply = await interaction.reply({
                content: `✅ ${title} effectué`,
                ephemeral: true
            });

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 4000);

        } catch (err) {
            console.error(err);

            return interaction.reply({
                content: "❌ Erreur lors de la sanction.",
                ephemeral: true
            });
        }
    }
};
