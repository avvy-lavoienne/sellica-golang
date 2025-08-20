/**
 * PM2 Ecosystem Configuration for SELLY AI
 * Staging and Production deployment configuration
 */

module.exports = {
  apps: [
    {
      // Staging Application Configuration
      name: 'sellica-staging',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sellica',
      instances: 2,
      exec_mode: 'cluster',
      
      // Environment configuration
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
      
      // Performance monitoring
      monitoring: true,
      pmx: true,
      
      // Auto-restart configuration
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Memory management
      max_memory_restart: '1G',
      
      // Logging configuration
      log_file: '/var/log/sellica/combined.log',
      out_file: '/var/log/sellica/out.log',
      error_file: '/var/log/sellica/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Advanced Node.js options
      node_args: [
        '--max-old-space-size=2048',
        '--optimize-for-size'
      ],
      source_map_support: true,
      
      // File watching (disabled in production)
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '.next',
        'public/models'
      ],
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Custom environment file
      env_file: '.env.staging',
      
      // Cron restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
      
      // Instance variables for load balancing
      instance_var: 'INSTANCE_ID',
      
      // Interpreter options
      interpreter: 'node',
      interpreter_args: '--harmony',
      
      // Process title
      name: 'sellica-staging',
      
      // Autorestart
      autorestart: true,
      
      // Time zone
      time: true,
      
      // Force process to stay alive
      force: true,
      
      // Disable auto exit
      disable_reloading: false
    },
    
    {
      // Production Application Configuration
      name: 'sellica-production',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sellica',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      
      // Environment configuration
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: 'true',
        NEXT_PUBLIC_ENABLE_TENSORFLOW: 'true',
        ENABLE_DEBUG_LOGGING: 'false',
        PERFORMANCE_SAMPLE_RATE: '0.01',
        TENSORFLOW_DEBUG_LOGGING: 'false',
        LOG_LEVEL: 'warn'
      },
      
      // Performance monitoring
      monitoring: true,
      pmx: true,
      
      // Auto-restart configuration
      max_restarts: 5,
      min_uptime: '30s',
      restart_delay: 10000,
      
      // Memory management
      max_memory_restart: '2G',
      
      // Logging configuration
      log_file: '/var/log/sellica/production-combined.log',
      out_file: '/var/log/sellica/production-out.log',
      error_file: '/var/log/sellica/production-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Health monitoring
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: true,
      
      // Advanced Node.js options
      node_args: [
        '--max-old-space-size=4096',
        '--optimize-for-size'
      ],
      source_map_support: false,
      
      // File watching (disabled in production)
      watch: false,
      
      // Graceful shutdown
      kill_timeout: 10000,
      listen_timeout: 5000,
      
      // Custom environment file
      env_file: '.env.production',
      
      // Cron restart (restart weekly on Sunday at 2 AM)
      cron_restart: '0 2 * * 0',
      
      // Instance variables
      instance_var: 'INSTANCE_ID',
      
      // Process configuration
      name: 'sellica-production',
      autorestart: true,
      time: true,
      force: true
    }
  ],
  
  // Deployment configuration
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
