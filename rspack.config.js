const rspack = require('@rspack/core')
const refreshPlugin = require('@rspack/plugin-react-refresh')
const Dotenv = require('dotenv-webpack');
const isDev = process.env.NODE_ENV === 'development'
const path = require('path');
require('dotenv').config();
const deps = require("./package.json").dependencies;

const printCompilationMessage = require('./compilation.config.js');
const { DEFAULT_ID_INTERPOLATION_PATTERN } = require('babel-plugin-formatjs');

console.log(`CHECK ENV: `, process.env, process.env.NODE_ENV);

/**
 * @type {import('@rspack/cli').Configuration}
 */
module.exports = {
  context: __dirname,
  entry: "./src/hostApp.js",
  output: {
    uniqueName: 'host',
  },
  ignoreWarnings: [/warning from compiler/, warning => true],
  devServer: {
    port: 3003,
    historyApiFallback: true,
    hot: 'only',
    watchFiles: [path.resolve(__dirname, 'src')],
    static: {
      directory: path.join(__dirname, 'src/public'),
    },
    compress: true,
    onListening: function (devServer) {
      const port = devServer.server.address().port

      printCompilationMessage('compiling', port)

      devServer.compiler.hooks.done.tap('OutputMessagePlugin', (stats) => {
        setImmediate(() => {
          if (stats.hasErrors()) {
            printCompilationMessage('failure', port)
          } else {
            printCompilationMessage('success', port)
          }
        })
      })
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
              implementation: require.resolve('sass-embedded'),
            },
          },
        ],
        type: 'css/auto',
      },
      {
        test: /\.(js|jsx|ts|tsx)$/, // Xử lý file JS, JSX, TS, TSX
        exclude: /node_modules/,    // Bỏ qua thư mục node_modules
        use: {
          loader: 'babel-loader',   // Sử dụng babel-loader thay vì swc-loader
          options: {
            presets: [
              '@babel/preset-env',  // Sử dụng preset-env để biên dịch ES6+
              '@babel/preset-react', // Sử dụng preset-react nếu dùng React
              '@babel/preset-typescript' // Sử dụng preset-typescript nếu dùng TypeScript
            ],
            plugins: [
              [
                'babel-plugin-formatjs',  // Thêm babel-plugin-formatjs
                {
                  "idInterpolationPattern": "[sha512:contenthash:base64:6]",
                  "ast": true
                }
              ]
            ]
          }
        }
      },
      // {
      //   test: /\.(@jsx|jsx?|tsx?)$/,
      //   use: [
      //     {
      //       loader: 'builtin:swc-loader',
      //       options: {
      //         sourceMap: true,              
      //         jsc: {                        
      //           experimental: {
      //             plugins: [
      //               [
      //                 '@formatjs/swc-plugin',
      //                 {
      //                   idInterpolationPattern: DEFAULT_ID_INTERPOLATION_PATTERN,
      //                   ast: true,                        
      //                   overrideIdFn: (id) => {
      //                     console.log({ id });
      //                   }
      //                 },
      //               ],                    
      //             ]
      //           },
      //           parser: {
      //             syntax: 'typescript',
      //             tsx: true,
      //           },
      //           transform: {
      //             react: {
      //               runtime: 'automatic',
      //               development: isDev,
      //               refresh: isDev,
      //             },
      //           },
      //         },
      //         env: {
      //           targets: [
      //             'chrome >= 87',
      //             'edge >= 88',
      //             'firefox >= 78',
      //             'safari >= 14',
      //           ],
      //         },
      //       },
      //     },
      //   ],
      // },
    ],
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: 'host',
      filename: 'remoteEntry.js',      
      remotes: {
        orders: "orders@http://localhost:3005/remoteEntry.js",
      },
      shared: {
        // ...deps,
        react: { singleton: true, eager: true, requiredVersion: deps.react },
        // "react-dom": { singleton: true, eager: true, requiredVersion: deps["react-dom"] },
        // "react-router-dom": { singleton: true, eager: true, requiredVersion: deps["react-router-dom"] },
        // axios: { singleton: true, eager: true, requiredVersion: deps.axios },
        // clsx: { singleton: true, eager: true, requiredVersion: deps.clsx },
        // redux: { singleton: true, eager: true, requiredVersion: deps.redux },
        // graphql: { singleton: true, eager: true, requiredVersion: deps.graphql },
        // dayjs: { singleton: true, eager: true, requiredVersion: deps.dayjs },
        // lodash: { singleton: true, eager: true, requiredVersion: deps.lodash },
        // "react-redux": { singleton: true, eager: true, requiredVersion: deps["react-redux"] },
        // "prop-types": { singleton: true, eager: true, requiredVersion: deps["prop-types"] },
        // "react-is": { singleton: true, eager: true, requiredVersion: deps["react-is"] },
        // "react-intl": { singleton: true, eager: true, requiredVersion: deps["react-intl"] },
        // "react-inlinesvg": { singleton: true, eager: true, requiredVersion: deps["react-inlinesvg"] },
        // "object-path": { singleton: true, eager: true, requiredVersion: deps["object-path"] },
        // "react-bootstrap": { singleton: true, eager: true, requiredVersion: deps["react-bootstrap"] },
        // "react-perfect-scrollbar": { singleton: true, eager: true, requiredVersion: deps["react-perfect-scrollbar"] },
        // "perfect-scrollbar": { singleton: true, eager: true, requiredVersion: deps["perfect-scrollbar"] },
        // "graphql-tag": { singleton: true, eager: true, requiredVersion: deps["graphql-tag"] },
        // "@apollo/client": { singleton: true, eager: true, requiredVersion: deps["@apollo/client"] },
        // "@material-ui/core": { singleton: true, eager: true, requiredVersion: deps["@material-ui/core"] },
        // "@material-ui/styles": { singleton: true, eager: true, requiredVersion: deps["@material-ui/styles"] },
        // "react-syntax-highlighter": { singleton: true, eager: true, requiredVersion: deps["react-syntax-highlighter"] },
        // "clipboard-copy": { singleton: true, eager: true, requiredVersion: deps["clipboard-copy"] },
        // "formik": { singleton: true, eager: true, requiredVersion: deps["formik"] },
        // "react-datepicker": { singleton: true, eager: true, requiredVersion: deps["react-datepicker"] },
        // "react-number-format": { singleton: true, eager: true, requiredVersion: deps["react-number-format"] },
        // "react-copy-to-clipboard": { singleton: true, eager: true, requiredVersion: deps["react-copy-to-clipboard"] },
        // "react-toast-notifications": { singleton: true, eager: true, requiredVersion: deps["react-toast-notifications"] },
        // "react-bootstrap-table2-paginator": { singleton: true, eager: true, requiredVersion: deps["react-bootstrap-table2-paginator"] },
        // "react-portal": { singleton: true, eager: true, requiredVersion: deps["react-portal"] },
        // "@tanem/svg-injector": { singleton: true, eager: true, requiredVersion: deps["@tanem/svg-injector"] },
        // "subscriptions-transport-ws": { singleton: true, eager: true, requiredVersion: deps["subscriptions-transport-ws"] },
        // "firebase": { singleton: true, eager: true, requiredVersion: deps["firebase"] },
        // "ws": { singleton: true, eager: true, requiredVersion: deps["ws"] },
        // "yup": { singleton: true, eager: true, requiredVersion: deps["yup"] },
      },
    }),
    new Dotenv({
      path: './.env', // Path to .env file (this is the default)    
      safe: true, // load .env.example (defaults to "false" which does not use dotenv-safe)
    }),
    new rspack.EnvironmentPlugin({
      'NODE_ENV': 'development',
      'DEBUG': true,
    }),
    new rspack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.REACT_APP_LAYOUT_CONFIG_KEY': JSON.stringify(process.env.REACT_APP_LAYOUT_CONFIG_KEY),
      'process.env.REACT_APP_MODE': JSON.stringify(process.env.REACT_APP_MODE),
    }),
    new rspack.ProgressPlugin({}),
    new rspack.HtmlRspackPlugin({
      template: './src/public/index.html',
      // path: path.resolve(__dirname, 'dist'),
      // publicPath: process.env.PUBLIC_URL || '/',
    }),
    isDev ? new refreshPlugin() : null,
  ].filter(Boolean),
}
