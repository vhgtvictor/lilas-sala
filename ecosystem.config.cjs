module.exports = {
  apps: [
    {
      name: "sala-lilas",
      script: "./backend/src/index.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
