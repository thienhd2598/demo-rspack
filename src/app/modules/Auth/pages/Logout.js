import React, { Component } from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { LayoutSplashScreen } from "../../../../_metronic/layout";
import * as auth from "../_redux/authRedux";
import { auth as authFirebase } from '../../../../firebase'
import client from "../../../../apollo";

class Logout extends Component {
  async componentDidMount() {
    console.log('componentDidMount')
    try {
      client.clearStore();
      await authFirebase.signOut();
      localStorage.removeItem('jwt')
      localStorage.removeItem('info_sub_user')
      localStorage.removeItem('refresh_token')
    } catch (error) {

    }

    this.props.logout();
  }

  render() {
    const { hasAuthToken, isSubUser } = this.props;

    return hasAuthToken ? <LayoutSplashScreen /> : <Redirect to={isSubUser ? "/auth/login-sub-user" : "/auth/login"} />;
  }
}

export default connect(
  ({ auth }) => ({ hasAuthToken: Boolean(auth.authToken), isSubUser: !!auth?.user?.is_subuser }),
  auth.actions
)(Logout);
