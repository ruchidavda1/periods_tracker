module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'backend/dist/index.js',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
