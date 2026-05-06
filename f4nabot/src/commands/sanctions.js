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
            sub.setName('blacklist')
                .setDescription('Blacklist un utilisateur')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unblacklist')
                .setDescription('Retirer blacklist')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        if (!user) {
            return interaction.reply({ content: "❌ Utilisateur introuvable", ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: "❌ Membre introuvable", ephemeral: true });
        }

        const role = interaction.guild.roles.cache.get(config.blacklistRoleId);

        if (!role) {
            return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });
        }

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!logChannel) {
            return interaction.reply({ content: "❌ Channel logs introuvable", ephemeral: true });
        }

        let title = "";
        let color = "#2b2d31";
        let icon = "";

        try {

            if (sub === "blacklist") {
                await member.roles.add(role);
                title = "Blacklist";
                icon = "🚫";
                color = "#000000";
            }

            if (sub === "unblacklist") {
                await member.roles.remove(role);
                title = "Unblacklist";
                icon = "✅";
                color = "#57F287";
            }

            // 🎨 EMBED PRO
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: `${icon} ${title}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setDescription(`> **${user.username}** a été ${title.toLowerCase()}`)
                .addFields(
                    {
                        name: "👤 Utilisateur",
                        value: `<@${user.id}>`,
                        inline: true
                    },
                    {
                        name: "👮 Staff",
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    },
                    {
                        name: "🕒 Date",
                        value: `<t:${Math.floor(Date.now() / 1000)}:f>`,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Système de modération • ${interaction.guild.name}`
                });

            // 📤 LOG UNIQUEMENT
            await logChannel.send({ embeds: [embed] });

            // 👻 MESSAGE TEMPORAIRE
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
