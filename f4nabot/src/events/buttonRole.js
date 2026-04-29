const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        // ❌ Ignore si pas bouton
        if (!interaction.isButton()) return;

        // ❌ Ignore autres boutons
        if (interaction.customId !== 'accept_reglement') return;

        const member = interaction.member;
        const role = interaction.guild.roles.cache.get(config.reglementRoleId);

        // ❌ rôle introuvable
        if (!role) {
            return interaction.reply({
                content: "❌ Rôle introuvable, contacte un staff.",
                ephemeral: true
            });
        }

        // 🔒 déjà accepté
        if (member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: "✅ Tu as déjà accepté le règlement.",
                ephemeral: true
            });
        }

        try {

            // ✅ ajout rôle
            await member.roles.add(role);

            // ✅ embed confirmation
            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle("✅ Règlement accepté")
                .setDescription("Tu as maintenant accès au serveur ! 🔓")
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            // 📊 LOG (optionnel si channel configuré)
            const logChannel = interaction.guild.channels.cache.get(config.logChannelId);

            if (logChannel) {
                logChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(0x5865F2)
                            .setTitle("LOG • Règlement accepté")
                            .addFields(
                                { name: "Utilisateur", value: `${member.user.tag} (${member.id})` },
                                { name: "Rôle donné", value: `${role.name}` }
                            )
                            .setTimestamp()
                    ]
                });
            }

        } catch (err) {

            console.error(err);

            return interaction.reply({
                content: "❌ Erreur lors de l'attribution du rôle.",
                ephemeral: true
            });
        }
    }
};
