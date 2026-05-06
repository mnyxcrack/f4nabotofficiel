const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const mongoose = require("mongoose")
const config = require("../config.json")

// ===== MODEL =====
const User = mongoose.model("User", new mongoose.Schema({
    userId: String,
    guildId: String,
    blacklist: { type: Boolean, default: false },
    stats: {
        bans: { type: Number, default: 0 },
        kicks: { type: Number, default: 0 },
        mutes: { type: Number, default: 0 }
    }
}))

// ===== LOG =====
async function log(client, msg) {
    const channel = client.channels.cache.get(config.logChannelId)
    if (channel) channel.send(msg)
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sanction")
        .setDescription("Système de sanctions")
        
        .addSubcommand(cmd =>
            cmd.setName("ban")
            .setDescription("Ban un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("unban")
            .setDescription("Unban un utilisateur")
            .addStringOption(o => o.setName("id").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("kick")
            .setDescription("Kick un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("mute")
            .setDescription("Mute un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
            .addIntegerOption(o => o.setName("minutes").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("unmute")
            .setDescription("Unmute un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("blacklist")
            .setDescription("Blacklist un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
        )

        .addSubcommand(cmd =>
            cmd.setName("unblacklist")
            .setDescription("Unblacklist un utilisateur")
            .addUserOption(o => o.setName("user").setRequired(true))
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand()

        // ===== BAN =====
        if (sub === "ban") {
            const user = interaction.options.getUser("user")

            await interaction.guild.members.ban(user.id)

            let data = await User.findOne({ userId: user.id, guildId: interaction.guild.id })
            if (!data) data = new User({ userId: user.id, guildId: interaction.guild.id })

            data.stats.bans++
            await data.save()

            log(interaction.client, `🔨 Ban : ${user.tag}`)
            return interaction.reply(`🔨 ${user.tag} banni`)
        }

        // ===== UNBAN =====
        if (sub === "unban") {
            const id = interaction.options.getString("id")

            await interaction.guild.members.unban(id)

            log(interaction.client, `🔓 Unban : ${id}`)
            return interaction.reply("✅ Débanni")
        }

        // ===== KICK =====
        if (sub === "kick") {
            const member = interaction.options.getMember("user")

            await member.kick()

            let data = await User.findOne({ userId: member.id, guildId: interaction.guild.id })
            if (!data) data = new User({ userId: member.id, guildId: interaction.guild.id })

            data.stats.kicks++
            await data.save()

            log(interaction.client, `👢 Kick : ${member.user.tag}`)
            return interaction.reply(`👢 ${member.user.tag} kick`)
        }

        // ===== MUTE =====
        if (sub === "mute") {
            const member = interaction.options.getMember("user")
            const minutes = interaction.options.getInteger("minutes")

            await member.timeout(minutes * 60000)

            log(interaction.client, `🔇 Mute : ${member.user.tag}`)
            return interaction.reply(`🔇 ${member.user.tag} mute`)
        }

        // ===== UNMUTE =====
        if (sub === "unmute") {
            const member = interaction.options.getMember("user")

            await member.timeout(null)

            log(interaction.client, `🔊 Unmute : ${member.user.tag}`)
            return interaction.reply(`🔊 ${member.user.tag} unmute`)
        }

        // ===== BLACKLIST =====
        if (sub === "blacklist") {
            const user = interaction.options.getUser("user")

            let data = await User.findOne({ userId: user.id, guildId: interaction.guild.id })
            if (!data) data = new User({ userId: user.id, guildId: interaction.guild.id })

            data.blacklist = true
            await data.save()

            log(interaction.client, `🚫 Blacklist : ${user.tag}`)
            return interaction.reply(`🚫 ${user.tag} blacklist`)
        }

        // ===== UNBLACKLIST =====
        if (sub === "unblacklist") {
            const user = interaction.options.getUser("user")

            let data = await User.findOne({ userId: user.id, guildId: interaction.guild.id })
            if (!data) return interaction.reply("Pas blacklist")

            data.blacklist = false
            await data.save()

            log(interaction.client, `✅ Unblacklist : ${user.tag}`)
            return interaction.reply(`✅ ${user.tag} retiré`)
        }
    }
}