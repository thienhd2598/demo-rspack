/**
 * High level router.
 *
 * Note: It's recommended to compose related routes in internal router
 * components (e.g: `src/app/modules/Auth/pages/AuthPage`, `src/app/BasePage`).
 */
import React, { memo, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useEffect, useRef } from "react";
import { Redirect, Switch, Route, useLocation, BrowserRouter } from "react-router-dom";
import { shallowEqual, useSelector } from "react-redux";
import { Layout } from "../_metronic/layout";
import BasePage from "./BasePage";
import { Logout, AuthPage } from "./modules/Auth";
import ErrorsPage from "./modules/ErrorsExamples/ErrorsPage";
import useWindowFocus from "../hooks/useWindowFocus";
import { toAbsoluteUrl } from "../_metronic/_helpers";
import Alert from '../components/Alert';
import BadReviewAlert from '../components/BadReviewAlert';
import StepModal from '../components/StepModal';
import { useQuery } from '@apollo/client';
import query_sme_users from '../graphql/query_sme_users';
import query_sme_users_by_pk from '../graphql/query_sme_users_by_pk';
import ScheduledFrameErrorAlert from '../components/ScheduledFrameErrorAlert';
import queryString from 'querystring';
import IdentifyPage from './modules/Auth/pages/IdentifyPage';
import RedirectPage from './modules/Auth/pages/RedirectPage';
import RedirectRoute from '../components/RedirectRoute';
import ModalExpired from '../components/ModalExpired';

const Hotline = memo(() => {
  const [visible, setvisible] = useState(false)
  const windowFocused = useWindowFocus();
  const _refLastLogin = useRef(localStorage.getItem('last_login'))
  useEffect(() => {
    if (windowFocused) {
      let _current = localStorage.getItem('last_login')
      if (_refLastLogin.current != _current && !!_current) {
        window.location.reload()
        _refLastLogin.current = _current
      }
    }
  }, [windowFocused])

  useEffect(() => {
    window.changeLastLogin = (_last) => {
      _refLastLogin.current = _last
    }
  }, [])

  return <>
    <div>
      {
        (!!visible) ? <div className="mock__hotline" style={{
          right: 61, bottom: 200, position: 'fixed', zIndex: 99
        }} >
          <ul>
            <a href="tel:+84944427799">
              <img style={{ marginRight: '18px' }} src={toAbsoluteUrl("/media/phoneicon.svg")}></img>
              <li>0944.427.799</li>
              <img id="right__hotline" src={toAbsoluteUrl("/media/arrow.svg")}></img>
            </a>
            <a href="mailto:support@upbase.vn">
              <img style={{ marginRight: '18px' }} src={toAbsoluteUrl("/media/Shape.svg")}></img>
              <li>Email</li>
              <img id="right__hotline" src={toAbsoluteUrl("/media/arrow.svg")}></img>
            </a>
          </ul>
        </div>
          : null}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', padding: '10px', background: 'white', borderRadius: '9px 0 0 9px', right: 0, bottom: 200, position: 'fixed', cursor: 'pointer', opacity: visible ? 0.7 : 1, zIndex: 99 }}
        onClick={() => {
          setvisible((prev) => !prev)
        }}>
        <img style={{ width: '26px' }} src={toAbsoluteUrl("/media/Vector.svg")} />
      </div>
    </div>
  </>
})

export function Routes() {
  const tawkMessengerRef = useRef();

  const [loaded, setloaded] = useState(false)
  const location = useLocation();
  let { source } = queryString.parse(location.search.slice(1, location.search.length))
  const { isAuthorized } = useSelector(
    ({ auth }) => ({
      isAuthorized: auth.user != null || localStorage?.getItem('fromAgency'),
    }),
    shallowEqual
  );

  // const isFromAgency = localStorage?.getItem('fromAgency')

  const { user } = useSelector(
    ({ auth }) => ({
      user: auth.user,
    }),
    shallowEqual
  );
  console.log(isAuthorized)

  // useMemo(() => {
  //   if (!tawkMessengerRef.current) return;

  //   if (isAuthorized) {
  //     tawkMessengerRef.current.showWidget()
  //   } else {
  //     tawkMessengerRef.current.hideWidget()
  //   }
  // }, [isAuthorized, tawkMessengerRef]);

  // console.log(!isAuthorized && !isFromAgency);


  return (
    <>
      <BrowserRouter
        getUserConfirmation={(message, callback) => {
        }}>
        <Switch>
          <Route
            path="/verify-token"
          >
            <RedirectRoute>
              <RedirectPage />
            </RedirectRoute>
          </Route>
          {!isAuthorized || location.pathname == '/auth/set-password' || location.pathname == '/auth/change-password' ? (
            <Route>
              <AuthPage isSubUser={!!user?.is_subuser} />
            </Route>
          ) : (
            <Redirect from="/auth" to={{
              pathname: (location?.state?.redirect == '/logout' ? null : location?.state?.redirect) || '/'
            }} />
          )}

          <Route path="/identify" component={IdentifyPage} />
          <Route path="/error" component={ErrorsPage} />
          <Route path="/logout" component={Logout} />
          {source == 'chat' && <Redirect to="/identify" />}
          {!isAuthorized ? (
            /*Redirect to `/auth` when user is not authorized*/
            <Redirect to={{
              pathname: !!user?.is_subuser ? "/auth/login-sub-user" : '/auth/login',
              state: {
                redirect: location.pathname == '/logout' ? null : location.pathname
              }
            }} />
          ) : (
            <Layout>
              <ScheduledFrameErrorAlert />
              <BadReviewAlert />
              <Alert />
              <BasePage />
            </Layout>
          )}
        </Switch>
      </BrowserRouter>
      {/* {process.env.REACT_APP_MODE == 'STAG' && isAuthorized && (
        <TawkMessengerReact
          propertyId="6370fee9b0d6371309cec72d"
          widgetId="1ghom7g6q"
          customStyle={{
            visibility: {
              desktop: {
                xOffset: 10,
                yOffset: 130,
              },
              mobile: {
                xOffset: 60,
                yOffset: 15
              }
            }
          }}
          size='small'
          ref={tawkMessengerRef}
          onLoad={() => {
            setTimeout(() => {
              if (!isAuthorized || !tawkMessengerRef?.current) return;

              tawkMessengerRef.current.visitor({
                name: 'name2222',
                email: 'duydatpham@gmail.com'
              });

              tawkMessengerRef.current.setAttributes({
                name: 'name',
                store: 'duydatpham@gmail.com',
                email: 'duydatpham@gmail.com',
                hash: 'has value'
              }, function (error) {
                // do something if error
                console.log('error', error)
              });
            }, 5000);
          }}
        />
      )} */}

      {/* <Hotline /> */}
    </>
  );
}

