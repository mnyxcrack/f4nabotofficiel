const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sanctions')
        .setDescription('🔧 Gestion des sanctions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub =>
            sub.setName('ban')
                .setDescription('🔨 Bannir')
                .addUserOption(opt => opt.setName('user').setRequired(true))
                .addStringOption(opt => opt.setName('raison'))
        )

        .addSubcommand(sub =>
            sub.setName('kick')
                .setDescription('👢 Kick')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('mute')
                .setDescription('🔇 Mute')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unmute')
                .setDescription('🔊 Unmute')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('blacklist')
                .setDescription('🚫 Blacklist')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        )

        .addSubcommand(sub =>
            sub.setName('unblacklist')
                .setDescription('✅ Unblacklist')
                .addUserOption(opt => opt.setName('user').setRequired(true))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison') || "Aucune raison";
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setFooter({ text: `Modération • ${interaction.guild.name}` })
            .setTimestamp();

        try {

            // 🔨 BAN
            if (sub === 'ban') {
                await member.ban({ reason });

                embed
                    .setColor('#ff0000')
                    .setTitle('🔨 Bannissement')
                    .setDescription(`**${user.tag}** a été banni`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "📄 Raison", value: reason, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            // 👢 KICK
            if (sub === 'kick') {
                await member.kick(reason);

                embed
                    .setColor('#ff8800')
                    .setTitle('👢 Expulsion')
                    .setDescription(`**${user.tag}** a été expulsé`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            // 🔇 MUTE
            if (sub === 'mute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle mute introuvable", ephemeral: true });

                await member.roles.add(role);

                embed
                    .setColor('#5865F2')
                    .setTitle('🔇 Mute')
                    .setDescription(`**${user.tag}** a été mute`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            // 🔊 UNMUTE
            if (sub === 'unmute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle mute introuvable", ephemeral: true });

                await member.roles.remove(role);

                embed
                    .setColor('#57F287')
                    .setTitle('🔊 Unmute')
                    .setDescription(`**${user.tag}** a été unmute`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            // 🚫 BLACKLIST
            if (sub === 'blacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });

                await member.roles.add(role);

                embed
                    .setColor('#000000')
                    .setTitle('🚫 Blacklist')
                    .setDescription(`**${user.tag}** est blacklist`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            // ✅ UNBLACKLIST
            if (sub === 'unblacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                if (!role) return interaction.reply({ content: "❌ Rôle blacklist introuvable", ephemeral: true });

                await member.roles.remove(role);

                embed
                    .setColor('#00ffcc')
                    .setTitle('✅ Unblacklist')
                    .setDescription(`**${user.tag}** n'est plus blacklist`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                        { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                    );
            }

            await interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.error(err);

            return interaction.reply({
                content: "❌ Erreur lors de la sanction.",
                ephemeral: true
            });
        }
    }
};
