const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('Envoyer une annonce'),

    async execute(interaction) {
        await interaction.reply('Annonce envoyée !');
    }
};
