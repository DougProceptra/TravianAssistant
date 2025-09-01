const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    content: './src/content/index-enhanced.ts',
    background: './src/background-enhanced.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
