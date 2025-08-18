module.exports = {
  module: {
    rules: [
      {
        test: /\.(html|css)$/,
        use: 'raw-loader'
      }
    ]
  }
}