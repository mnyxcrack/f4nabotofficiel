const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regle')
        .setDescription('Afficher le règlement Automatique'),

    async execute(interaction) {

        // 🔥 ID de ton emoji
        const emoji = "<:3dgifmaker67250:1497090036708151346>"; 
        // ⚠️ remplace par TON ID

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

                `Clique sur :3dgifmaker67250: pour accepter le règlement.`
            )
            .setImage('attachment://bannier.png');

        const msg = await interaction.reply({
            embeds: [embed],
            files: [file],
            fetchReply: true
        });

        // 🔥 REACTION AVEC ID
        await msg.react("1497090036708151346"); // même ID que l'emoji
    }
};
