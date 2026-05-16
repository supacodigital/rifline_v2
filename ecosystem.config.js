module.exports = {
  apps: [
    {
      name: 'rifline-api',
      script: './server/index.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
  ],
};
