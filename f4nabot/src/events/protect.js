const config = require('../../config.json');

const spamMap = new Map();
const userInfractions = new Map();

//
// 🔒 MUTE SIMPLE (RAPIDE)
//
async function applyMute(member) {
    const role = member.guild.roles.cache.get(config.muteRoleId);
    if (!role) return;

    await member.roles.add(role).catch(() => {});
}

//
// 🧹 SUPPRIMER SPAM
//
async function deleteRecentMessages(channel, member) {
    const messages = await channel.messages.fetch({ limit: 20 });
    const userMessages = messages.filter(m => m.author.id === member.id);

    channel.bulkDelete(userMessages, true).catch(() => {});
}

//
// ⚖️ SANCTIONS
//
async function handleSanction(member, logChannel, reason) {

    const infractions = (userInfractions.get(member.id) || 0) + 1;
    userInfractions.set(member.id, infractions);

    // DM
    await member.send({
        embeds: [{
            color: 0xff0000,
            title: "Avertissement",
            description: `Raison : ${reason}\nInfractions : ${infractions}/3`
        }]
    }).catch(() => {});

    // MUTE
    if (infractions === 3) {
        await applyMute(member);
    }

    // KICK
    if (infractions >= 4) {
        await member.kick().catch(() => {});
    }

    // LOG
    logChannel?.send({
        embeds: [{
            color: 0xff0000,
            title: "LOG • Sanction",
            description: `${member.user.tag} | ${reason} | ${infractions}`,
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

        // 🔥 BLOQUE DIRECT SI MUTE (ULTRA IMPORTANT)
        if (member.roles.cache.has(config.muteRoleId)) {
            await message.delete().catch(() => {});
            return;
        }

        const content = message.content.toLowerCase();

        // ==========================
        // 🔗 LIENS
        // ==========================

        if (/(https?:\/\/|discord\.gg)/gi.test(content)) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "Lien");
            return;
        }

        // ==========================
        // @everyone
        // ==========================

        if (message.mentions.everyone) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "@everyone");
            return;
        }

        // ==========================
        // CAPS
        // ==========================

        if (message.content.length > 12 && message.content === message.content.toUpperCase()) {
            await message.delete().catch(() => {});
            await handleSanction(member, logChannel, "Caps");
            return;
        }

        // ==========================
        // DUPLICATE
        // ==========================

        if (!spamMap.has(member.id)) {
            spamMap.set(member.id, { last: content, count: 1, time: Date.now() });
        } else {
            const data = spamMap.get(member.id);

            if (data.last === content) {
                data.count++;

                if (data.count >= 3) {
                    await message.delete().catch(() => {});
                    await handleSanction(member, logChannel, "Spam répétitif");
                    return;
                }
            }

            // SPAM RAPIDE
            if (Date.now() - data.time < 5000) {
                data.count++;

                if (data.count >= 5) {
                    await deleteRecentMessages(message.channel, member);
                    await handleSanction(member, logChannel, "Spam");
                    return;
                }
            } else {
                data.count = 1;
            }

            data.last = content;
            data.time = Date.now();
            spamMap.set(member.id, data);
        }
    }
};