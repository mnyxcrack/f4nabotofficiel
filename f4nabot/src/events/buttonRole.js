const config = require('../../config.json');

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        if (!interaction.isButton()) return;

        if (interaction.customId === 'accept_reglement') {

            const role = interaction.guild.roles.cache.get(config.reglementRoleId);

            if (!role) {
                return interaction.reply({
                    content: "❌ Rôle introuvable",
                    ephemeral: true
                });
            }

            if (interaction.member.roles.cache.has(role.id)) {
                return interaction.reply({
                    content: "✅ Tu as déjà accepté",
                    ephemeral: true
                });
            }

            await interaction.member.roles.add(role);

            await interaction.reply({
                content: "✅ Règlement accepté ! Accès débloqué 🔓",
                ephemeral: true
            });
        }
    }
};