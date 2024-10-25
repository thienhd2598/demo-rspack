import React, { useEffect } from "react";
import { useIntl } from "react-intl";
import { Redirect, Route, Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import Channels from "./channels/Channels";
import ChannelsAddDialog from "./channels/ChannelsAddDialog";
import ChannelsAddRedirectDialog from "./channels/ChannelsAddRedirectDialog";
import ChannelsConfirmUnlinkDialog from "./channels/ChannelsConfirmUnlinkDialog";
import ChannelsDetailPage from "./channels/ChannelsDetailPage";
import ChannelsPage from "./channels/ChannelsPage";
import ChannelsSyncConfirmDialog from "./channels/ChannelsSyncConfirmDialog";
import ChannelsSyncDialog from "./channels/ChannelsSyncDialog";
import ChannelsSyncErrorDialog from "./channels/ChannelsSyncErrorDialog";
import ChangePassword from "./users/ChangePassword";
import CreateGroupPermission from "./profile/CreateGroupPermission";
import CreateMember from "./profile/CreateMember";
import EditProfile from "./profile/EditProfile";
import ProfilePage from "./profile/ProfilePage";
import SettingPage from "./SettingPage";
import UsersManagement from './users/index';
import CreateSubUser from "./users/CreateSubUser";
import ChangePasswordSubUser from "./users/ChangePasswordSubUser";
import UpdateSubUser from "./users/UpdateSubUser";
import SyncWarehouseSetting from "./channels/SyncWarehouseSetting";
import SettingFinance from "./settingfinance";
import SettingProductStatus from "./SettingProductStatus";
import SettingPushInventory from "./SettingPushInventory";
import ThirdPartyConnection from "./thirdPartyConnection";
import SettingProvider from "./settingProvider";
import SettingProviderConfig from "./SettingProviderConfig";
import CreateRoles from "./users/roles/CreateRoles";
import DetailRoles from "./users/roles/DetailRoles";


export default function SettingsPage() {
    const { formatMessage } = useIntl()
    const suhbeader = useSubheader();
    suhbeader.setTitle(null);

    useEffect(() => {
    }, [])
    return (
        <>
            <Switch>
                <ContentRoute
                    path="/setting/channel/:id"
                    component={ChannelsDetailPage}
                    roles={['setting_channel_view']}
                />
                <ContentRoute
                    path="/setting/channels"
                    component={Channels}
                    roles={['setting_channel_view']}
                />
                <ContentRoute
                    path="/setting/sync-warehouse"
                    component={SyncWarehouseSetting}
                    roles={['setting_sync_warehouse_view']}
                />
                <ContentRoute
                    path="/setting/setting-push-inventory"
                    component={SettingPushInventory}
                    roles={['setting_sync_warehouse_view']}
                />
                <ContentRoute
                    path="/setting/third-party-connection"
                    component={ThirdPartyConnection}
                    exact
                    roles={['setting_third_party_view']}
                />
                <ContentRoute
                    path="/setting/third-party-connection/config/:id"
                    exact
                    component={SettingProviderConfig}
                    roles={['setting_third_party_view']}
                />
                <ContentRoute
                    path="/setting/third-party-connection/:id"
                    exact
                    component={SettingProvider}
                    roles={['setting_third_party_view']}
                />
                <ContentRoute
                    path="/setting/users/create-role"
                    component={CreateRoles}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users/role/:id"
                    component={DetailRoles}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users/create-sub-user"
                    component={CreateSubUser}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users/change-password-sub-user"
                    component={ChangePasswordSubUser}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users/change-password"
                    component={ChangePassword}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users/update-sub-user"
                    component={UpdateSubUser}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/users"
                    component={UsersManagement}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/profile/edit-member/:id"
                    component={CreateMember}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/profile/add-member"
                    component={CreateMember}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/profile/create-group-permission"
                    component={CreateGroupPermission}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/profile/edit"
                    component={EditProfile}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/profile"
                    component={ProfilePage}
                    roles={['only-main-user']}
                />
                <ContentRoute
                    path="/setting/setting-finance"
                    component={SettingFinance}
                    roles={['setting_finance_view']}
                />
                <ContentRoute
                    path="/setting/setting-product-status"
                    component={SettingProductStatus}
                    roles={['setting_product_status_view']}
                />
                <ContentRoute
                    path="/setting"
                    component={SettingPage}
                    roles={['setting_channel_view']}
                />

            </Switch>
            <Route exact path="/setting/channels/add">
                {({ history, match }) => (
                    <ChannelsAddDialog
                        show={match != null}
                        onHide={() => {
                            history.push("/setting/channels");
                        }}
                    />
                )}
            </Route>
            <Route exact path="/setting/channels/add/:channel/connect-redirect">
                {({ history, match }) => (
                    <ChannelsAddRedirectDialog
                        show={match != null}
                        onHide={() => {
                            history.push({
                                pathname: "/setting/channels",
                                state: { reloadStore: true }
                            });
                        }}
                    />
                )}
            </Route>
            <Route exact path="/setting/channels/unlink/:id">
                {({ history, match }) => (
                    <ChannelsConfirmUnlinkDialog
                        show={match != null}
                        onHide={() => {
                            history.push("/setting/channels");
                        }}
                    />
                )}
            </Route>
            <Route exact path="/setting/channel/:id/unlink">
                {({ history, match }) => (
                    <ChannelsConfirmUnlinkDialog
                        show={match != null}
                        onHide={() => {
                            history.push(`/setting/channel/${match.params.id}`);
                        }}
                    />
                )}
            </Route>
            {/* <Route exact path="/setting/channel/:id/sync-confirm">
                {({ history, match }) => (
                    <ChannelsSyncConfirmDialog
                        show={match != null}
                        path={`/setting/channel/:id/sync`}
                        onHide={() => {
                            history.push(`/setting/channel/${match.params.id}`);
                        }}
                    />
                )}
            </Route>
            <Route exact path="/setting/channels/sync-confirm/:shopID">
                {({ history, match }) => (
                    <ChannelsSyncConfirmDialog
                        show={match != null}
                        path={`/setting/channels/sync/:id`}
                        onHide={() => {
                            history.push("/setting/channels");
                        }}
                    />
                )}
            </Route> */}
            <Route exact path="/setting/channels/sync-error/:id">
                {({ history, match }) => (
                    <ChannelsSyncErrorDialog
                        show={match != null}
                        onHide={() => {
                            history.push("/setting/channels");
                        }}
                    />
                )}
            </Route>
            {/* <Route exact path="/setting/channels/sync/:shopID">
                {({ history, match }) => (
                    <ChannelsSyncDialog
                        show={match != null}
                        onHide={() => {
                            history.push("/setting/channels");
                        }}
                    />
                )}
            </Route> */}
        </>
    );
}
