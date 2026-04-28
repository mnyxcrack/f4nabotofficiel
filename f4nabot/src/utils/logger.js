const chalk = require('chalk');
const gradient = require('gradient-string');

module.exports = {
    start: (msg) => console.log(gradient.pastel(`[START] ${msg}`)),
    success: (msg) => console.log(chalk.green(`✔ ${msg}`)),
    error: (msg) => console.log(chalk.red(`✖ ${msg}`)),
    info: (msg) => console.log(chalk.cyan(`➜ ${msg}`))
};