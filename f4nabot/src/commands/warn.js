const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../data/warns.json');

// CREATE FILE SI EXISTE PAS
if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "{}");
}

// LOAD SAFE
function loadData() {
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
        return {};
    }
}

// SAVE
function saveData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Système d’avertissement')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        // ADD
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Ajouter un avertissement')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur')
                        .setRequired(true)
                )
                .addStringOption(opt =>
                    opt.setName('raison')
                        .setDescription('Raison')
                        .setRequired(true)
                )
        )

        // LIST
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('Voir les avertissements')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur')
                        .setRequired(true)
                )
        )

        // CLEAR
        .addSubcommand(sub =>
            sub.setName('clear')
                .setDescription('Supprimer les avertissements')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('Utilisateur')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('raison');

        let data = loadData();
        if (!data[user.id]) data[user.id] = [];

        // ADD
        if (sub === "add") {

            const warn = {
                reason,
                staff: interaction.user.tag,
                date: new Date().toLocaleString()
            };

            data[user.id].push(warn);
            saveData(data);

            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('⚠️ Avertissement')
                .setDescription(`> ${user.tag} a reçu un avertissement`)
                .addFields(
                    { name: "📄 Raison", value: reason },
                    { name: "👮 Staff", value: interaction.user.tag },
                    { name: "📊 Total", value: `${data[user.id].length}` }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // LIST
        if (sub === "list") {

            if (!data[user.id].length) {
                return interaction.reply({
                    content: "✅ Aucun avertissement",
                    ephemeral: true
                });
            }

            const list = data[user.id]
                .map((w, i) =>
                    `**#${i + 1}** • ${w.reason}\n👮 ${w.staff} | 🕒 ${w.date}`
                )
                .join("\n\n");

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📊 Warns de ${user.tag}`)
                .setDescription(list);

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        }

        // CLEAR
        if (sub === "clear") {

            data[user.id] = [];
            saveData(data);

            return interaction.reply({
                content: `🧹 Warns supprimés pour ${user.tag}`,
                ephemeral: true
            });
        }
    }
};
