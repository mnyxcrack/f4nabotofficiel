const config = require('../../config.json');

module.exports = {
    name: 'guildMemberAdd',

    async execute(member) {

        const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);

        if (accountAge < config.minAccountAgeDays) {

            await member.kick("Compte trop récent").catch(() => {});

            const logChannel = member.guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                logChannel.send(`🚨 ${member.user.tag} kick (compte récent)`);
            }
        }
    }
};