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
                .setDescription('Mute')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison'))
        )

        .addSubcommand(sub =>
            sub.setName('unmute')
                .setDescription('Unmute')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('Ban')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison'))
        )

        .addSubcommand(sub =>
            sub.setName('unban')
                .setDescription('Unban via ID')
                .addStringOption(opt => opt.setName('id').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('Kick')
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
        const userId = interaction.options.getString('id');
        const reason = interaction.options.getString('raison') || "Aucune raison";

        const member = user
            ? await interaction.guild.members.fetch(user.id).catch(() => null)
            : null;

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!logChannel) {
            return interaction.reply({ content: "❌ Channel logs introuvable", ephemeral: true });
        }

        let title = "";
        let color = "#2b2d31";
        let icon = "";

        try {

            // ===== ACTIONS =====

            if (sub === "mute") {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.add(role);
                title = "Mute"; icon = "🔇"; color = "#5865F2";
            }

            if (sub === "unmute") {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.remove(role);
                title = "Unmute"; icon = "🔊"; color = "#57F287";
            }

            if (sub === "ban") {
                await member.ban({ reason });
                title = "Ban"; icon = "🔨"; color = "#ED4245";
            }

            if (sub === "unban") {
                try {
                    await interaction.guild.members.unban(userId);
                    title = "Unban"; icon = "🔓"; color = "#57F287";
                } catch {
                    return interaction.reply({
                        content: "❌ ID invalide ou utilisateur non banni",
                        ephemeral: true
                    });
                }
            }

            if (sub === "kick") {
                await member.kick(reason);
                title = "Kick"; icon = "👢"; color = "#FEE75C";
            }

            if (sub === "blacklist") {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.add(role);
                title = "Blacklist"; icon = "🚫"; color = "#000000";
            }

            if (sub === "unblacklist") {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.remove(role);
                title = "Unblacklist"; icon = "✅"; color = "#00ffcc";
            }

            // ===== EMBED =====

            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: `${icon} ${title}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setDescription(
                    sub === "unban"
                        ? `Utilisateur **${userId}** débanni`
                        : `**${user.username}** a été ${title.toLowerCase()}`
                )
                .addFields(
                    sub !== "unban"
                        ? { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true }
                        : { name: "👤 ID", value: userId, inline: true },

                    { name: "📄 Raison", value: reason, inline: true },
                    { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                )
                .setFooter({ text: `Modération • ${interaction.guild.name}` })
                .setTimestamp();

            // 📤 LOG UNIQUEMENT
            await logChannel.send({ embeds: [embed] });

            // 👻 CONFIRMATION TEMPORAIRE
            await interaction.reply({
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
