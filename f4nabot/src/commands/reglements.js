const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reglements')
        .setDescription('Afficher le règlement du serveur'),

    async execute(interaction) {

        // 🔥 charge image
        const file = new AttachmentBuilder(
            path.join(__dirname, '../../img/bannier.png')
        );

        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setTitle("Règlement du serveur")
            .setDescription(
                "Respect des membres\n" +
                "Le respect est obligatoire envers tous les membres.\n\n" +

                "Pas de spam\n" +
                "Le spam est interdit sous toutes ses formes.\n\n" +

                "Pas de publicité\n" +
                "Toute publicité est interdite sans autorisation.\n\n" +

                "Contenu interdit\n" +
                "NSFW, contenu illégal ou dangereux interdit.\n\n" +

                "Respect des salons\n" +
                "Utilise les salons correctement.\n\n" +

                "Respect du staff\n" +
                "Les décisions du staff doivent être respectées.\n\n" +

                "Sanctions\n" +
                "Avertissement, mute, kick ou bannissement.\n\n" +

                "Réagis avec l’emoji ci-dessous pour accepter."
            )
            .setImage('attachment://bannier.png'); // 🔥 IMPORTANT

        const msg = await interaction.reply({
            embeds: [embed],
            files: [file], // 🔥 OBLIGATOIRE
            fetchReply: true
        });

        // 🔥 MET TON ID ICI
        await msg.react("123456789012345678");
    }
};
