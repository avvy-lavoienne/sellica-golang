/**
 * PM2 Ecosystem Configuration for SELLY AI
 * Development, Staging, and Production deployment configuration
 */
module.exports = {
  apps: [
    {
      // Development Application Configuration
      name: 'sellica-development',
      script: 'pnpm',
      args: 'dev',
      cwd: 'C:\\Users\\MyPC PRO\\Documents\\Firman\\Project\\sellica-golang\\frontend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
        GO_ENV: 'development',
      },
      watch: ['src', 'public', '..\\backend\\cmd', '..\\backend\\internal'],
      ignore_watch: ['node_modules', '.next', '..\\backend\\vendor'],
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 1000,
      log_file: 'C:\\Users\\MyPC PRO\\Documents\\Firman\\Project\\sellica-golang\\logs\\dev-combined.log',
      out_file: 'C:\\Users\\MyPC PRO\\Documents\\Firman\\Project\\sellica-golang\\logs\\dev-out.log',
      error_file: 'C:\\Users\\MyPC PRO\\Documents\\Firman\\Project\\sellica-golang\\logs\\dev-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      autorestart: true,
    },
    {
      // Staging Application Configuration
      name: 'sellica-staging',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sellica',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      env_staging: {
        NODE_ENV: 'production',
        DEPLOYMENT_ENV: 'staging',
        STAGING: 'true',
        PORT: 3000,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'true',
        NEXT_PUBLIC_ENABLE_TENSORFLOW: 'true',
        ENABLE_DEBUG_LOGGING: 'true',
        PERFORMANCE_SAMPLE_RATE: '1.0',
        TENSORFLOW_DEBUG_LOGGING: 'true',
        LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'true',
        NEXT_PUBLIC_ENABLE_TENSORFLOW: 'true',
        ENABLE_DEBUG_LOGGING: 'false',
        PERFORMANCE_SAMPLE_RATE: '0.1',
        TENSORFLOW_DEBUG_LOGGING: 'false',
        LOG_LEVEL: 'warn'
      },
      monitoring: true,
      pmx: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      max_memory_restart: '1G',
      log_file: '/var/log/sellica/combined.log',
      out_file: '/var/log/sellica/out.log',
      error_file: '/var/log/sellica/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ],
      source_map_support: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '.next',
        'public/models'
      ],
      kill_timeout: 5000,
      listen_timeout: 3000,
      env_file: '.env.staging',
      cron_restart: '0 3 * * *',
      instance_var: 'INSTANCE_ID',
      interpreter: 'node',
      interpreter_args: '--harmony',
      autorestart: true,
      time: true,
      force: true,
      disable_reloading: false
    },
    {
      // Production Application Configuration (Frontend)
      name: 'sellica-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sellica/frontend', // Updated for Linux server
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'true',
        NEXT_PUBLIC_ENABLE_TENSORFLOW: 'true',
        ENABLE_DEBUG_LOGGING: 'false',
        PERFORMANCE_SAMPLE_RATE: '0.01',
        TENSORFLOW_DEBUG_LOGGING: 'false',
        LOG_LEVEL: 'warn'
      },
      monitoring: true,
      pmx: true,
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 10000,
      max_memory_restart: '2G',
      log_file: '/var/log/sellica/production-combined.log',
      out_file: '/var/log/sellica/production-out.log',
      error_file: '/var/log/sellica/production-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      node_args: [
        '--max-old-space-size=4096',
        '--optimize-for-size'
      ],
      source_map_support: false,
      watch: false,
      env_file: '.env.production',
      cron_restart: '0 2 * * 0',
      instance_var: 'INSTANCE_ID',
      autorestart: true,
      time: true,
      force: true
    },
    {
      // Production Backend Configuration
      name: 'sellica-production-backend',
      script: 'go',
      args: 'run ./cmd/server/main.go',
      cwd: '/var/www/sellica/backend', // Updated for Linux server
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        GO_ENV: 'production',
        PORT: 8080 // Adjust to your backend port
      },
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 10000,
      log_file: '/var/log/sellica/production-backend-combined.log',
      out_file: '/var/log/sellica/production-backend-out.log',
      error_file: '/var/log/sellica/production-backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      autorestart: true,
      time: true
    }
  ],
  deploy: {
    staging: {
      user: 'deploy',
      host: 'staging.sellica.com',
      ref: 'origin/staging',
      repo: 'git@github.com:sellica/sellica-prop.git',
      path: '/var/www/sellica',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    },
    production: {
      user: 'deploy',
      host: 'production.sellica.com',
      ref: 'origin/main',
      repo: 'git@github.com:sellica/sellica-prop.git',
      path: '/var/www/sellica',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install --frozen-lockfile --production && pnpm build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};