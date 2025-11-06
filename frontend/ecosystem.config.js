module.exports = {
  apps: [
    {
      name: 'sellica-development',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev',
      cwd: './',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '.pm2/logs/sellica-error.log',
      out_file: '.pm2/logs/sellica-out.log',
      log_file: '.pm2/logs/sellica-combined.log',
      time: true,
    },
  ],
};
