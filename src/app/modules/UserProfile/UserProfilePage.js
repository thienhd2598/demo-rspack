import React from "react";
import { Redirect, Route, Switch, useLocation } from "react-router-dom";
import { useSubheader } from "../../../_metronic/layout";
import AccountInformation from "./AccountInformation";
import { ProfileOverview } from "./ProfileOverview";
import PersonaInformation from "./PersonaInformation";
import EmailSettings from "./EmailSettings";
import { ProfileCard } from "./components/ProfileCard";
import UpdateInformation from "./UpdateInformation"
import { useIntl } from "react-intl";

export default function UserProfilePage() {
  const { formatMessage } = useIntl();
  const suhbeader = useSubheader();
  suhbeader.setTitle(formatMessage({ defaultMessage: "Thông tin cá nhân" }));
  return (
    <Switch>
      <Redirect
        from="/user-profile"
        exact={true}
        to="/user-profile/profile-overview"
      />
      <Route
        path="/user-profile/profile-overview"
        component={ProfileOverview}
      />      
      <Route
        path="/user-profile/account-information"
        component={AccountInformation}
      />      
      <Route
        path="/user-profile/email-settings"
        component={EmailSettings}
      />
      <Route
        path="/user-profile/personal-information"
        component={PersonaInformation}
      />

      <Route
        path="/user-profile/update-information"
        component={UpdateInformation}
      />
    </Switch>
  );
}
