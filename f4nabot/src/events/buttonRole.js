const config = require('../../config.json');

module.exports = {
    name: 'messageReactionAdd',

    async execute(reaction, user) {

        if (user.bot) return;

        // 🔥 fix Railway / cache
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        // 🔥 TON EMOJI
        if (reaction.emoji.name !== "3dgifmaker67250") return;

        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.get(config.reglementRoleId);

        if (!role) return;

        if (member.roles.cache.has(role.id)) return;

        await member.roles.add(role).catch(() => {});
    }
};
