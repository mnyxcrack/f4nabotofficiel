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

        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setFooter({ text: `Modération • ${interaction.guild.name}` })
            .setTimestamp();

        try {

            let action = "";

            // 🔨 BAN
            if (sub === 'ban') {
                await member.ban({ reason });
                action = "BANNI";

                embed.setColor('#ff0000').setTitle('🔨 Bannissement');
            }

            // 👢 KICK
            if (sub === 'kick') {
                await member.kick(reason);
                action = "KICK";

                embed.setColor('#ff8800').setTitle('👢 Expulsion');
            }

            // 🔇 MUTE
            if (sub === 'mute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.add(role);
                action = "MUTE";

                embed.setColor('#5865F2').setTitle('🔇 Mute');
            }

            // 🔊 UNMUTE
            if (sub === 'unmute') {
                const role = interaction.guild.roles.cache.get(config.muteRoleId);
                await member.roles.remove(role);
                action = "UNMUTE";

                embed.setColor('#57F287').setTitle('🔊 Unmute');
            }

            // 🚫 BLACKLIST
            if (sub === 'blacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.add(role);
                action = "BLACKLIST";

                embed.setColor('#000000').setTitle('🚫 Blacklist');
            }

            // ✅ UNBLACKLIST
            if (sub === 'unblacklist') {
                const role = interaction.guild.roles.cache.get(config.blacklistRoleId);
                await member.roles.remove(role);
                action = "UNBLACKLIST";

                embed.setColor('#00ffcc').setTitle('✅ Unblacklist');
            }

            // 📌 EMBED USER
            embed.setDescription(`**${user.tag}**`)
                .addFields(
                    { name: "👤 Utilisateur", value: `<@${user.id}>`, inline: true },
                    { name: "📄 Raison", value: reason, inline: true },
                    { name: "👮 Staff", value: `<@${interaction.user.id}>`, inline: true }
                );

            await interaction.reply({ embeds: [embed] });

            // 📊 LOG EMBED (PLUS DÉTAILLÉ)
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle(`📊 LOG • ${action}`)
                    .addFields(
                        { name: "👤 Utilisateur", value: `${user.tag} (${user.id})` },
                        { name: "👮 Staff", value: `${interaction.user.tag}` },
                        { name: "📄 Raison", value: reason }
                    )
                    .setTimestamp();

                logChannel.send({ embeds: [logEmbed] });
            }

        } catch (err) {
            console.error(err);

            return interaction.reply({
                content: "❌ Erreur lors de la sanction.",
                ephemeral: true
            });
        }
    }
};
