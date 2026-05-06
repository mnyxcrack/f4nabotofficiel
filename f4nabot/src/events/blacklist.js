const config = require('../../config.json');

module.exports = {
    name: 'messageCreate',

    async execute(message) {

        if (!message.guild || message.author.bot) return;

        const member = message.member;
        if (!member) return;

        // 🚫 BLOQUE SI BLACKLIST
        if (member.roles.cache.has(config.blacklistRoleId)) {

            await message.delete().catch(() => {});

            return;
        }
    }
};
