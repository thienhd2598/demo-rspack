import React, { useEffect } from "react";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Card, CardBody, CardHeader } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Link, NavLink, Redirect, Route, Switch, useHistory } from "react-router-dom";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useSubheader } from "../../../../_metronic/layout";
import { Avatar, Divider } from "@material-ui/core";
import MemberList from "./MemberList";
import GroupPermission from "./GroupPermission";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
export default function ProfilePage() {
  const history = useHistory();
  const { appendBreadcrumbs } = useSubheader()
  const { user } = useSelector((state) => state.auth);
  const {formatMessage} = useIntl()
  useEffect(() => {
    appendBreadcrumbs({
      title: formatMessage({defaultMessage:'Cài đặt'}),
      pathname: `/setting`
    })
    appendBreadcrumbs({
      title: formatMessage({defaultMessage:'Quản lý tài khoản & phân quyền'}),
      pathname: `/setting/profile/members`
    })
  }, [history.location.pathname])


  return (
    <Card >
      <CardHeader title={formatMessage({defaultMessage:'Thông tin chung'})} className='py-0'>
      </CardHeader>
      <CardBody style={{ minHeight: 'calc(100vh - 260px)', padding: 24, margin: 0 }} >
        <div className='row w-100 mx-0' style={{ alignItems: 'flex-start', marginBottom: 24 }} >
          <div className='col-6' style={{ display: 'flex', alignItems: 'center' }} >
            <Avatar src={user?.avatar_url} variant='circle' style={{ width: 120, height: 120, marginRight: 16 }} />
            <div>
              <h4>{user?.full_name}</h4>
              <span className='text-info' >{user?.email}</span>
            </div>
          </div>
          <div className='col-6 ' style={{ justifyContent: 'flex-end', display: 'flex' }} >
            <Link to='/setting/profile/change-password' className="btn btn-outline-secondary">{formatMessage({defaultMessage:'Đổi mật khẩu'})}</Link>
            <Link to='/setting/profile/edit' className="btn btn-primary" style={{ marginLeft: 16 }} >{formatMessage({defaultMessage:'Chỉnh sửa thông tin'})}</Link>
          </div>
        </div>
        <Divider variant='fullWidth' light />
        <div className='row w-100 mx-0' style={{ paddingTop: 24 }} >
          <div className='col-lg-9' >
            <ul className="nav nav-tabs nav-tabs-line nav-bold">
              <li className="nav-item">
                <NavLink className="nav-link" to="/setting/profile/members">
                {formatMessage({defaultMessage:'Quản lý tài khoản nhân sự'})}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/setting/profile/group-permission">
                {formatMessage({defaultMessage:'Quản lý nhóm quyền'})}
                </NavLink>
              </li>
            </ul>
            <div className="tab-content mt-5" id="myTabContent">
              <Switch>
                <Route
                  path="/setting/profile/members"
                  component={MemberList}
                />
                <Route
                  path="/setting/profile/group-permission"
                  component={GroupPermission}
                />
                <Redirect from="/setting/profile" exact={true} to={'/setting/profile/members'} />
              </Switch>
            </div>
          </div>
          <div className='col-lg-3 text-right' >
            {history.location.pathname =='/setting/profile/members' ? <Link to='/setting/profile/add-member' className="btn btn-primary" >{formatMessage({defaultMessage:'Tạo tài khoản'})}</Link> : <Link to='/setting/profile/create-group-permission' className="btn btn-primary" >{formatMessage({defaultMessage:'Tạo nhóm quyền'})}</Link>}
          </div>
        </div>
      </CardBody>
    </Card >
  )
}
