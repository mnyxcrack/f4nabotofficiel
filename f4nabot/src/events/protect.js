const config = require('../../config.json');

const spamMap = new Map();
const userInfractions = new Map();

// 🔒 MUTE
async function applyMute(member) {
    const role = member.guild.roles.cache.get(config.muteRoleId);
    if (!role) return;

    if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
    }
}

// 🧹 SUPPRIMER SPAM
async function deleteRecentMessages(channel, member) {
    const messages = await channel.messages.fetch({ limit: 15 });
    const userMessages = messages.filter(m => m.author.id === member.id);

    if (userMessages.size > 1) {
        channel.bulkDelete(userMessages, true).catch(() => {});
    }
}

// ⚖️ SANCTIONS
async function handleSanction(member, logChannel, reason) {
    let infractions = userInfractions.get(member.id) || 0;
    infractions++;
    userInfractions.set(member.id, infractions);

    // 📩 MESSAGE PRIVÉ
    await member.send({
        embeds: [{
            color: 0xff0000,
            title: "⚠️ Avertissement",
            description: `Raison : **${reason}**
Infractions : **${infractions}/3**

Merci de respecter le serveur.`
        }]
    }).catch(() => {});

    // 🔇 MUTE au 3ème
    if (infractions === 3) {
        await applyMute(member);

        await member.send({
            embeds: [{
                color: 0xff0000,
                title: "🔇 Sanction",
                description: "Tu as été **mute** suite à plusieurs infractions."
            }]
        }).catch(() => {});
    }

    // 🚫 KICK à partir de 5
    if (infractions >= 5) {
        await member.kick("Trop d'infractions").catch(() => {});
    }

    // 📊 LOG
    logChannel?.send({
        embeds: [{
            color: 0xff0000,
            title: "📊 LOG • Protection",
            fields: [
                { name: "Utilisateur", value: `${member.user.tag}`, inline: true },
                { name: "Raison", value: reason, inline: true },
                { name: "Infractions", value: `${infractions}`, inline: true }
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

        if (member.roles.cache.has(config.roleBypass)) return;

        const logChannel = message.guild.channels.cache.get(config.logChannelId);

        // 🔒 BLOQUE SI MUTE
        if (member.roles.cache.has(config.muteRoleId)) {
            await message.delete().catch(() => {});
            return;
        }

        const content = message.content.toLowerCase();

        // 🔗 LIENS
        if (/(https?:\/\/|discord\.gg)/gi.test(content)) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "Lien interdit");
            return;
        }

        // @everyone
        if (message.mentions.everyone) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "@everyone");
            return;
        }

        // CAPS
        const isCaps = message.content.length > 15 && message.content === message.content.toUpperCase();

        if (isCaps) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "Majuscules abusives");
            return;
        }

        // 💬 ANTI SPAM
        const now = Date.now();

        if (!spamMap.has(member.id)) {
            spamMap.set(member.id, {
                lastMessage: content,
                count: 1,
                lastTime: now
            });
        } else {
            const data = spamMap.get(member.id);

            // Spam répétitif
            if (data.lastMessage === content) {
                data.count++;

                if (data.count >= 4) {
                    await message.delete().catch(() => {});
                    await handleSanction(member, logChannel, "Spam répétitif");
                    return;
                }
            }

            // Spam rapide
            if (now - data.lastTime < 3000) {
                data.count++;

                if (data.count >= 6) {
                    await deleteRecentMessages(message.channel, member);
                    await handleSanction(member, logChannel, "Spam rapide");
                    return;
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
