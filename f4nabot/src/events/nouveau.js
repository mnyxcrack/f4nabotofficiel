const config = require('../../config.json');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    name: 'guildMemberAdd',

    async execute(member) {

        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!channel) return;

        const bannerPath = path.join(__dirname, '../../img/bannier.png');

        const banner = new AttachmentBuilder(
            bannerPath,
            { name: 'bannier.png' }
        );

        channel.send({
            files: [banner],
            embeds: [
                {
                    color: 0x2b2d31,

                    description:
                        `${member} vient de rejoindre\n` + 
                        `Bienvenue sur **${member.guild.name}**`,

                    image: {
                        url: "attachment://bannier.png"
                    },

                    footer: {
                        text: `${member.guild.memberCount} membres`
                    },

                    timestamp: new Date()
                }
            ]
        });
    }
};