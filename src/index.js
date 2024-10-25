/**
 * Create React App entry point. This and `public/index.html` files can not be
 * changed or moved.
 */
import axios from "axios";
import React from "react";
// import "react-app-polyfill/ie11";
// import "react-app-polyfill/stable";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.scss"; // Standard version
import * as _redux from "./redux";
import store, { persistor } from "./redux/store";
// import "./sass/style.react.rtl.css"; // RTL version
import "@fortawesome/fontawesome-free/css/all.min.css";
import "socicon/css/socicon.css";
import "./_metronic/_assets/plugins/flaticon/flaticon.css";
import "./_metronic/_assets/plugins/flaticon2/flaticon.css";
import "./_metronic/_assets/plugins/frame-editor/editor.css";
import "./_metronic/_assets/plugins/keenthemes-icons/font/ki.css";
// Datepicker
import "react-datepicker/dist/react-datepicker.css";

import 'rsuite/dist/rsuite.min.css';

import { MetronicI18nProvider } from "./_metronic/i18n";
import {
  MetronicLayoutProvider,
  MetronicSplashScreenProvider,
  MetronicSubheaderProvider,
} from "./_metronic/layout";

import { ApolloProvider } from '@apollo/client';
import client from './apollo';

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";
/**
 * Base URL of the website.
 *
 * @see https://facebook.github.io/create-react-app/docs/using-the-public-folder
 */
const { PUBLIC_URL } = process.env;
console.log('ENV CHECK:', process.env)

/**
 * Creates `axios-mock-adapter` instance for provided `axios` instance, add
 * basic Metronic mocks and returns it.
 *
 * @see https://github.com/ctimmerm/axios-mock-adapter
 */
// /* const mock = */ _redux.mockAxios(axios);
/**
 * Inject metronic interceptors for axios.
 *
 * @see https://github.com/axios/axios#interceptors
 */
_redux.setupAxios(axios, store);
console.log('window.location.hostname', window.location.hostname)
if (window.location.hostname != 'localhost') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_URL,
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
}

const AppRoot = () => (
  <ApolloProvider client={client}>
    <MetronicI18nProvider>
      <MetronicLayoutProvider>
        <MetronicSubheaderProvider>
          <MetronicSplashScreenProvider>
            <App store={store} persistor={persistor} basename={PUBLIC_URL || '/'} />
          </MetronicSplashScreenProvider>
        </MetronicSubheaderProvider>
      </MetronicLayoutProvider>
    </MetronicI18nProvider>
  </ApolloProvider>
);

const rootElement = document.getElementById('root');

const root = ReactDOM.createRoot(rootElement)

root.render(<AppRoot />)

// ReactDOM.render(

//   document.getElementById("app")
// );
