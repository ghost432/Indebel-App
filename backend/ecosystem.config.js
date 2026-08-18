module.exports = {
  apps: [{
    name: 'indebel-api',
    script: 'server.js',
    cwd: '/var/www/vhosts/indebel.be/pro.indebel.be/api',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'indebel_belgium_secret_key_2024_dreambis_production_secure_token_272829',
      JWT_EXPIRE: '7d',
      CORS_ORIGINS: 'https://pro.indebel.be,https://www.indebel.be,https://indebel.be,https://pro.indebel.be/api'
    },
    env_file: '.env',
    error_file: '/var/www/vhosts/indebel.be/pro.indebel.be/api/logs/pm2-error.log',
    out_file: '/var/www/vhosts/indebel.be/pro.indebel.be/api/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
