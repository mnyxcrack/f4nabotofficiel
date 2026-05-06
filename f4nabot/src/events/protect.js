const config = require('../../config.json');
const mongoose = require("mongoose");

// ===== DB =====
const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    userId: String,
    guildId: String,
    blacklist: { type: Boolean, default: false }
}));

const spamMap = new Map();
const userInfractions = new Map();

//
// 🔒 MUTE
//
async function applyMute(member) {
    const role = member.guild.roles.cache.get(config.muteRoleId);
    if (!role) return;

    if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
    }
}

//
// 🧹 SUPPRIMER SPAM
//
async function deleteRecentMessages(channel, member) {
    const messages = await channel.messages.fetch({ limit: 15 });
    const userMessages = messages.filter(m => m.author.id === member.id);

    if (userMessages.size > 1) {
        channel.bulkDelete(userMessages, true).catch(() => {});
    }
}

//
// ⚖️ SANCTIONS
//
async function handleSanction(member, logChannel, reason) {

    let infractions = userInfractions.get(member.id) || 0;
    infractions++;
    userInfractions.set(member.id, infractions);

    // 📩 MP
    await member.send({
        embeds: [{
            color: 0xff0000,
            title: "⚠️ Avertissement",
            description:
                `Raison : **${reason}**\n` +
                `Infractions : **${infractions}/7**`
        }]
    }).catch(() => {});

    // 🔇 MUTE
    if (infractions === 3) {
        await applyMute(member);

        await member.send({
            embeds: [{
                color: 0xff0000,
                title: "🔇 Mute",
                description: "Tu as été mute."
            }]
        }).catch(() => {});
    }

    // 👢 KICK
    if (infractions === 5) {
        await member.kick("Trop d'infractions").catch(() => {});
    }

    // 🚫 BLACKLIST
    if (infractions >= 7) {
        let data = await User.findOne({
            userId: member.id,
            guildId: member.guild.id
        });

        if (!data) {
            data = new User({
                userId: member.id,
                guildId: member.guild.id
            });
        }

        data.blacklist = true;
        await data.save();

        await member.send("🚫 Tu es blacklist du serveur").catch(() => {});
    }

    // 📊 LOG
    logChannel?.send({
        embeds: [{
            color: 0xff0000,
            title: "🛡️ Protection",
            fields: [
                { name: "👤 Utilisateur", value: member.user.tag, inline: true },
                { name: "📌 Raison", value: reason, inline: true },
                { name: "⚠️ Infractions", value: `${infractions}/7`, inline: true }
            ],
            timestamp: new Date()
        }]
    });
}

module.exports = {
    name: 'messageCreate',

    async execute(message) {

        if (message.author.bot || !message.guild) return;

        const member = await message.guild.members.fetch(message.author.id);
        const logChannel = message.guild.channels.cache.get(config.logChannelId);

        // 🚫 BLACKLIST BLOCK
        const userData = await User.findOne({
            userId: message.author.id,
            guildId: message.guild.id
        });

        if (userData?.blacklist) {
            await message.delete().catch(() => {});
            return;
        }

        // 🚫 BYPASS STAFF
        if (member.roles.cache.has(config.roleBypass)) return;

        // 🔇 MUTE BLOCK
        if (member.roles.cache.has(config.muteRoleId)) {
            await message.delete().catch(() => {});
            return;
        }

        const content = message.content.toLowerCase();

        // 🔗 LIENS
        if (/(https?:\/\/|discord\.gg)/gi.test(content)) {
            await message.delete().catch(() => {});
            return handleSanction(member, logChannel, "Lien interdit");
        }

        // @everyone
        if (message.mentions.everyone) {
            await message.delete().catch(() => {});
            return handleSanction(member, logChannel, "@everyone");
        }

        // CAPS
        const isCaps =
            message.content.length > 15 &&
            message.content === message.content.toUpperCase();

        if (isCaps) {
            await message.delete().catch(() => {});
            return handleSanction(member, logChannel, "Majuscules abusives");
        }

        // 💬 SPAM
        const now = Date.now();

        if (!spamMap.has(member.id)) {
            spamMap.set(member.id, {
                lastMessage: content,
                count: 1,
                lastTime: now
            });
        } else {
            const data = spamMap.get(member.id);

            // répétitif
            if (data.lastMessage === content) {
                data.count++;

                if (data.count >= 4) {
                    await message.delete().catch(() => {});
                    return handleSanction(member, logChannel, "Spam répétitif");
                }
            }

            // rapide
            if (now - data.lastTime < 3000) {
                data.count++;

                if (data.count >= 6) {
                    await deleteRecentMessages(message.channel, member);
                    return handleSanction(member, logChannel, "Spam rapide");
                }
            } else {
                data.count = 1;
            }

            data.lastMessage = content;
            data.lastTime = now;
            spamMap.set(member.id, data);
        }
    }
};
