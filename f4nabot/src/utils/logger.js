const chalk = require('chalk');

module.exports = {
    success: (msg) => console.log(chalk.green(msg)),
    error: (msg) => console.log(chalk.red(msg)),
    warn: (msg) => console.log(chalk.yellow(msg)), // ✅ AJOUT ICI
    info: (msg) => console.log(chalk.blue(msg))
};
