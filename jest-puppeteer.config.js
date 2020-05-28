module.exports = {
  server: {
    port: 8080,
    launchTimeout: 10000,
    command: `echo 'hello!'`
  },
  launch: {
    dumpio: false,
    headless: process.env.HEADLESS !== 'false'
  },
  browser: 'chromium',
  browserContext: 'default'
}
