const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('Créer une annonce'),

    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('annonceModal')
            .setTitle('Créer une annonce');

        const titre = new TextInputBuilder()
            .setCustomId('titre')
            .setLabel('Titre')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const sousTitre = new TextInputBuilder()
            .setCustomId('sousTitre')
            .setLabel('Sous-titre')
            .setStyle(TextInputStyle.Short);

        const description = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titre),
            new ActionRowBuilder().addComponents(sousTitre),
            new ActionRowBuilder().addComponents(description)
        );

        await interaction.showModal(modal);
    }
};
