// файл настройки менеджера процессов pm2
module.exports = {
    apps : [{
	name   : "print-server",
        script : "./server.mjs",
        watch: true,
        // Delay between restart
        // watch_delay: 1000,
        ignore_watch : ["node_modules", "acts", "\\.git", "*.log","package-lock.json","package.json"],
  }]
}