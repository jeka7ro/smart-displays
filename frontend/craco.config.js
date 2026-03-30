module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Disable ForkTsCheckerWebpackPlugin — incompatible with Node 24 (ajv-keywords crash)
      webpackConfig.plugins = (webpackConfig.plugins || []).filter(
        p => p.constructor && p.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      // Remove ModuleScopePlugin so imports outside /src work
      webpackConfig.resolve.plugins = (webpackConfig.resolve.plugins || []).filter(
        p => p.constructor && p.constructor.name !== 'ModuleScopePlugin'
      );
      return webpackConfig;
    },
  },
};
