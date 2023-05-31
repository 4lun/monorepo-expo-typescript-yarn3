const { createWebpackConfigAsync } = require('./webpack/createWebpackConfigAsync');

module.exports = async function(env, argv) {
  const config = await createWebpackConfigAsync(env, argv);
  return config;
};
