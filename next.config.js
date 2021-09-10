const PROD = process.env.NODE_ENV === 'production';

module.exports = {
  assetPrefix: PROD ? 'https://chanzuckerberg.github.io/napari.github.io' : '',

  webpack(config) {
    // Sets BABEL_ENV to `client` or `server` depending on the Next.js build.
    // This is required for the Material UI + babel import plugin to work.
    process.env.BABEL_ENV = config.name;

    return config;
  },
};
