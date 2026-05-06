const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/warns.json');

if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "{}");
}

function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
        return {};
    }
}

function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Gestion des avertissements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Ajouter un warn')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur à warn') // 🔥 FIX
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('raison')
                        .setDescription('Raison du warn') // 🔥 FIX
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Voir les warns')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur') // 🔥 FIX
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Supprimer les warns')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur') // 🔥 FIX
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison');

        let data = loadData();
        if (!data[user.id]) data[user.id] = [];

        if (sub === "add") {
            const warn = {
                reason,
                staff: interaction.user.tag,
                date: new Date().toLocaleString()
            };

            data[user.id].push(warn);
            saveData(data);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('⚠️ Warn')
                        .setDescription(`> ${user.tag} a été averti`)
                        .addFields(
                            { name: "Raison", value: reason },
                            { name: "Staff", value: interaction.user.tag },
                            { name: "Total", value: `${data[user.id].length}` }
                        )
                ]
            });
        }

        if (sub === "list") {
            if (!data[user.id].length) {
                return interaction.reply({ content: "Aucun warn", ephemeral: true });
            }

            const list = data[user.id]
                .map((w, i) => `#${i + 1} • ${w.reason}`)
                .join("\n");

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#5865F2')
                        .setTitle(`Warns de ${user.tag}`)
                        .setDescription(list)
                ],
                ephemeral: true
            });
        }

        if (sub === "clear") {
            data[user.id] = [];
            saveData(data);

            return interaction.reply({
                content: `Warns supprimés pour ${user.tag}`,
                ephemeral: true
            });
        }
    }
};
