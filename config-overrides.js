const path = require("path");

module.exports = function override(config, env) {
  // Disable source-map-loader for blockly
  config.module.rules = config.module.rules.map(rule => {
    if (rule.enforce === 'pre' && rule.use && rule.use.includes('source-map-loader')) {
      return {
        ...rule,
        exclude: /node_modules\/blockly/
      };
    }
    return rule;
  });

  // Add a new rule for blockly files
  config.module.rules.push({
    test: /\.js$/,
    enforce: 'pre',
    include: /node_modules\/blockly/,
    use: [{
      loader: 'source-map-loader',
      options: {
        filterSourceMappingUrl: () => false
      }
    }]
  });

  return config;
};
