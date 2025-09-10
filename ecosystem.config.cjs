module.exports = {
  apps: [{
    name: 'ncmpro-app',
    script: 'serve',
    args: '-s dist -l 3000 -n',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
