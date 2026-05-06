const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const config = require('../../config.json');

const LOG_CHANNEL_ID = "1501388106736074772";

// sauvegarde temporaire des rôles
const savedRoles = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanctions')
        .setDescription('Gestion sanctions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub =>
            sub.setName('blacklist')
                .setDescription('Mettre en prison')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unblacklist')
                .setDescription('Sortir de prison')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ Membre introuvable", ephemeral: true });

        const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!role) return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });

        try {

            let title = "";
            let icon = "";
            let color = "#2b2d31";

            // =====================
            // BLACKLIST (PRISON)
            // =====================
            if (sub === "blacklist") {

                // sauvegarde rôles actuels
                savedRoles.set(member.id, member.roles.cache.map(r => r.id));

                // retire tous les rôles sauf @everyone
                await member.roles.set([]);

                // ajoute blacklist
                await member.roles.add(role);

                title = "Blacklist";
                icon = "🚫";
                color = "#000000";
            }

            // =====================
            // UNBLACKLIST
            // =====================
            if (sub === "unblacklist") {

                const oldRoles = savedRoles.get(member.id);

                if (oldRoles) {
                    await member.roles.set(oldRoles).catch(() => {});
                    savedRoles.delete(member.id);
                } else {
                    await member.roles.remove(role).catch(() => {});
                }

                title = "Unblacklist";
                icon = "✅";
                color = "#57F287";
            }

            // =====================
            // EMBED LOG
            // =====================
            const embed = new EmbedBuilder()
                .setColor(color)
                .setAuthor({
                    name: `${icon} ${title}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setDescription(`> **${user.username}** a été ${title.toLowerCase()}`)
                .addFields(
                    { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                    { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "🕒 Date", value: `<t:${Math.floor(Date.now()/1000)}:f>` }
                )
                .setFooter({ text: `Modération • ${interaction.guild.name}` });

            if (logChannel) {
                logChannel.send({ embeds: [embed] });
            }

            // message temporaire
            await interaction.reply({
                content: `✅ ${title} effectué`,
                ephemeral: true
            });

            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 4000);

        } catch (err) {
            console.error(err);

            interaction.reply({
                content: "❌ Erreur",
                ephemeral: true
            });
        }
    }
};
