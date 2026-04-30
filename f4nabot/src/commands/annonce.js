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

        const miniImage = new TextInputBuilder()
            .setCustomId('miniImage')
            .setLabel('Mini affiche (petite image)')
            .setStyle(TextInputStyle.Short);

        const bigImage = new TextInputBuilder()
            .setCustomId('bigImage')
            .setLabel('Grande affiche (image principale)')
            .setStyle(TextInputStyle.Short);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titre),
            new ActionRowBuilder().addComponents(sousTitre),
            new ActionRowBuilder().addComponents(description),
            new ActionRowBuilder().addComponents(miniImage),
            new ActionRowBuilder().addComponents(bigImage)
        );

        await interaction.showModal(modal);
    }
};
