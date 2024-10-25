import React, { useRef, useEffect, useState } from "react";
import { shallowEqual, useSelector, connect, useDispatch } from "react-redux";
import { LayoutSplashScreen } from "../../../../_metronic/layout";
import * as auth from "./authRedux";
import { getUserByToken } from "./authCrud";
import { auth as authFirebase } from '../../../../firebase'

function AuthInit(props) {
  const didRequest = useRef(false);
  const dispatch = useDispatch();
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const { authToken } = useSelector(
    ({ auth }) => ({
      authToken: auth.authToken,
    }),
    shallowEqual
  );

  // We should request user by authToken before rendering the application
  useEffect(() => {
    const requestUser = async () => {
      try {
        if (!didRequest.current) {
          const userMe = await getUserByToken();                    
          dispatch(props.fulfillUser(userMe));
          setShowSplashScreen(false);
        }
      } catch (error) {
        console.error('Authentication hook::', error);
        if (error.message == 'Authentication hook unauthorized this request') {
          let token = await (
            new Promise(async (resolve) => {
              let cout = 0;
              let _interval = setInterval(async () => {
                if (!!authFirebase.currentUser) {
                  clearInterval(_interval)
                  try {
                    let token = await authFirebase.currentUser.getIdToken(true)
                    resolve(token)
                  } catch (error) {
                    resolve(null)
                  }
                }

                cout++;
                if (cout >= 15) {
                  clearInterval(_interval)
                  resolve(null)
                }
              }, 1000);

            })
          )

          console.log('token', token)
          if (token) {
            requestAnimationFrame(requestUser)
          } else {
            if (!didRequest.current) {
              dispatch(props.logout());
            }
            setShowSplashScreen(false);
          }
        } else {
          if (!didRequest.current) {
            dispatch(props.logout());
          }
          setShowSplashScreen(false);
        }

      } finally {

      }

      return () => (didRequest.current = true);
    };

    if (authToken || localStorage.getItem('fromAgency')) {
      requestUser();
    } else {
      dispatch(props.fulfillUser(undefined));
      setShowSplashScreen(false);
    }
    // eslint-disable-next-line
  }, []);

  return showSplashScreen ? <LayoutSplashScreen /> : <>{props.children}</>;
}

export default connect(null, auth.actions)(AuthInit);
