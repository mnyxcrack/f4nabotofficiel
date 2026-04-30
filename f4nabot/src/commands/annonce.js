const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('annonce')
        .setDescription('Créer une annonce stylée'),

    async execute(interaction) {

        const modal = new ModalBuilder()
            .setCustomId('annonceModal')
            .setTitle('📢 Nouvelle annonce');

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

        const image = new TextInputBuilder()
            .setCustomId('image')
            .setLabel('URL image (mini affiche)')
            .setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titre),
            new ActionRowBuilder().addComponents(sousTitre),
            new ActionRowBuilder().addComponents(description),
            new ActionRowBuilder().addComponents(image)
        );

        await interaction.showModal(modal);
    }
};
