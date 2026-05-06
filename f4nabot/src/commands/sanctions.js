const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanctions')
        .setDescription('Gérer les sanctions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('Ban un utilisateur')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unban')
                .setDescription('Unban un utilisateur')
                .addStringOption(opt => opt.setName('id').setDescription('ID utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('Kick un utilisateur')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('mute')
                .setDescription('Mute un utilisateur')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unmute')
                .setDescription('Unmute un utilisateur')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('blacklist')
                .setDescription('Blacklist un utilisateur')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unblacklist')
                .setDescription('Retirer blacklist')
                .addUserOption(opt => opt.setName('user').setDescription('Utilisateur').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const member = user ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTimestamp();

        try {

            // 🔨 BAN
            if (sub === 'ban') {
                await member.ban({ reason: "Sanction staff" });

                embed.setDescription(`🔨 ${user.tag} a été ban.`);
            }

            // 🔓 UNBAN
            if (sub === 'unban') {
                const id = interaction.options.getString('id');

                await interaction.guild.members.unban(id);

                embed.setDescription(`🔓 Utilisateur ${id} unban.`);
            }

            // 👢 KICK
            if (sub === 'kick') {
                await member.kick();

                embed.setDescription(`👢 ${user.tag} a été kick.`);
            }

            // 🔇 MUTE
            if (sub === 'mute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle mute introuvable", ephemeral: true });

                await member.roles.add(role);

                embed.setDescription(`🔇 ${user.tag} a été mute.`);
            }

            // 🔊 UNMUTE
            if (sub === 'unmute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle mute introuvable", ephemeral: true });

                await member.roles.remove(role);

                embed.setDescription(`🔊 ${user.tag} a été unmute.`);
            }

            // 🚫 BLACKLIST
            if (sub === 'blacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });

                await member.roles.add(role);

                embed.setDescription(`🚫 ${user.tag} est blacklist.`);
            }

            // ✅ UNBLACKLIST
            if (sub === 'unblacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });

                await member.roles.remove(role);

                embed.setDescription(`✅ ${user.tag} retiré de blacklist.`);
            }

            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);

            interaction.reply({
                content: "❌ Erreur lors de la sanction.",
                ephemeral: true
            });
        }
    }
};
