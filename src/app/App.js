/**
 * Entry application component used to compose providers and render Routes.
 * */

import React, { memo, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { AuthInit } from "./modules/Auth";
import { Routes } from "./Routes";
import { I18nProvider } from "../_metronic/i18n";
import { LayoutSplashScreen, MaterialThemeProvider } from "../_metronic/layout";
import { ToastProvider, useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from "../_metronic/_helpers";
import { HelmetProvider } from 'react-helmet-async';
import DangerouslySetHtmlContent from "../components/DangerouslySetHtmlContent";
import ModalExpired from "../components/ModalExpired";

export default function App({ store, persistor, basename }) {
  return (
    /* Provide Redux store */
    <Provider store={store}>
      {/* Asynchronously persist redux stores and show `SplashScreen` while it's loading. */}
      <PersistGate persistor={persistor} loading={<LayoutSplashScreen />}>
        {/* Add high level `Suspense` in case if was not handled inside the React tree. */}
        <React.Suspense fallback={<LayoutSplashScreen />}>
          {/* Override `basename` (e.g: `homepage` in `package.json`) */}
          <BrowserRouter basename={basename}>
            <HelmetProvider>
              {/*This library only returns the location that has been active before the recent location change in the current window lifetime.*/}
              <MaterialThemeProvider>
                {/* Provide `react-intl` context synchronized with Redux state.  */}
                <I18nProvider>
                  {/* Render routes with provided `Layout`. */}
                  <ToastProvider                    
                    autoDismissTimeout={5000}
                    autoDismiss
                  >
                    <AuthInit>
                      <Routes />
                    </AuthInit>
                  </ToastProvider>
                </I18nProvider>
              </MaterialThemeProvider>
            </HelmetProvider>
          </BrowserRouter>
        </React.Suspense>
      </PersistGate>

      <DangerouslySetHtmlContent html={`
      <script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_ID}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
    
        gtag('config', '${process.env.REACT_APP_GA_ID}');
      </script>
      `} />
    </Provider>
  );
}
