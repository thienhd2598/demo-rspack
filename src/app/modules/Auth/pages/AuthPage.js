/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useMemo } from "react";
import { Link, Switch, Redirect, useLocation } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { ContentRoute } from "../../../../_metronic/layout";
import Login from "./Login";
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";
import "../../../../_metronic/_assets/sass/pages/login/classic/login-1.scss";
import ChangePassword from "./ChangePassword";
import SetPassword from "./SetPassword";
import Register from "./Register";
import LoginSubUser from "./LoginSubUser";
import { shallowEqual, useSelector } from "react-redux";

export function AuthPage({ isSubUser }) {
  const location = useLocation();

  return (
    <Switch>
      <ContentRoute path="/auth/login" component={Login} />
      <ContentRoute
        path="/auth/register"
        component={Register}
      />
      <ContentRoute
        path="/auth/change-password"
        component={ChangePassword}
      />
      <ContentRoute
        path="/auth/login-sub-user"
        component={LoginSubUser}
      />
      <ContentRoute
        path="/auth/set-password"
        component={SetPassword}
      />
      <ContentRoute
        path="/auth/forgot-password"
        component={ForgotPassword}
      />
      <Redirect from="/auth" exact={true} to={{
        pathname: isSubUser ? "/auth/login-sub-user" : "/auth/login",
        state: {
          redirect: location.pathname
        }
      }} />
      <Redirect to={{
        pathname: isSubUser ? "/auth/login-sub-user" : "/auth/login",
        state: {
          redirect: location.pathname
        }
      }} />
    </Switch>

  );
}
