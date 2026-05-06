const config = require('../../config.json');

module.exports = {
    name: 'messageCreate',

    async execute(message) {

        if (message.author.bot || !message.guild) return;

        const member = message.member;

        // 🚫 BLACKLIST HARD
        if (member.roles.cache.has(config.blacklistRoleId)) {

            await message.delete().catch(() => {});

            await member.send("🚫 Tu es blacklist du serveur.").catch(() => {});

            return;
        }
    }
};
