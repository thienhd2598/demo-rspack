/* eslint-disable no-restricted-imports */
/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Dropdown from "react-bootstrap/Dropdown";
import { useSelector } from "react-redux";
import objectPath from "object-path";
import { useHtmlClassService } from "../../../_core/MetronicLayout";
import { toAbsoluteUrl } from "../../../../_helpers";
import { DropdownTopbarItemToggler } from "../../../../_partials/dropdowns";
import { FormattedMessage, useIntl } from "react-intl";
import { Avatar } from "@material-ui/core";

export function UserProfileDropdown() {
  const { user } = useSelector((state) => state.auth);
  const { formatMessage } = useIntl();
  const uiService = useHtmlClassService();
  const layoutProps = useMemo(() => {
    return {
      light:
        objectPath.get(uiService.config, "extras.user?.dropdown.style") ===
        "light",
    };
  }, [uiService]);
  console.log(user)
  const fromAgency = localStorage.getItem('fromAgency')
  return (
    <Dropdown drop="down" alignRight>
      <Dropdown.Toggle
        as={DropdownTopbarItemToggler}
        id="dropdown-toggle-user-profile"
      >
        <div
          className={
            "btn btn-icon w-auto btn-clean d-flex align-items-center btn-lg px-2"
          }
        >
          <Avatar variant='circle' style={{ width: '35px', height: '35px' }} src={user?.avatar_url} />
          <div style={{ textAlign: 'left', display: 'flex', justifyContent: 'center', flexDirection: 'column' }} >
          </div>
        </div>
      </Dropdown.Toggle>
      <Dropdown.Menu className="p-0 m-0 dropdown-menu-right dropdown-menu-user dropdown-menu-anim dropdown-menu-top-unround dropdown-menu-xl">
        <div className="navi navi-spacer-x-0 my-4">

          <div to="/user-profile/update-information" className="navi-item border-bottom px-8 cursor-pointer">
            <div className="navi-link">
              <div className="navi-text">
                <div className="font-weight-bold cursor-pointer">
                  <div style={{ fontWeight: 'bold' }}>{user?.email}</div>
                  {!!user?.is_subuser ? (
                    <small>{user?.full_name}</small>
                  ) : (
                    <small>
                      {(() => {
                        switch (user?.business_model) {
                          case 'enterprise':
                            return formatMessage({ defaultMessage: 'Doanh nghiệp' })
                          case 'individual':
                            return formatMessage({ defaultMessage: 'Cá nhân' })
                          default:
                            return ''
                        }
                      })()}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
          {!user?.is_subuser && !fromAgency && (
            <>
              {
                window.location.pathname != "/user-profile/update-information" ?
                  <Link to="/user-profile/update-information" className="navi-item px-8 border-bottom cursor-pointer">
                    <div className="navi-link">
                      <div className="navi-text">
                        <div className="font-weight-bold cursor-pointer">
                          {formatMessage({ defaultMessage: 'Thông tin cá nhân' })}
                        </div>
                      </div>
                    </div>
                  </Link>
                  :
                  <div className="navi-item px-8 border-bottom cursor-pointer">
                    <div className="navi-link">
                      <div className="navi-text">
                        <div className="font-weight-bold cursor-pointer">
                          {formatMessage({ defaultMessage: 'Thông tin cá nhân' })}
                        </div>
                      </div>
                    </div>
                  </div>
              }
            </>
          )}


          <Link to="/logout" className="navi-item px-8 cursor-pointer">
            <div className="navi-link">
              <div className="navi-text">
                <div className="font-weight-bold cursor-pointer" onClick={() => {
                  if(fromAgency) {
                    localStorage.removeItem('fromAgency')
                    localStorage.removeItem('jwt')
                    localStorage.removeItem('accessToken')
                  }
                }}>
                  {formatMessage({ defaultMessage: 'Đăng xuất' })}
                </div>
              </div>
            </div>
          </Link>


          {/* <a className="navi-item px-8">
            <div className="navi-link">
              <div className="navi-icon mr-2">
                <i className="flaticon2-rocket-1 text-danger"></i>
              </div>
              <div className="navi-text">
                <div className="font-weight-bold">My Activities</div>
                <div className="text-muted">Logs and notifications</div>
              </div>
            </div>
          </a> */}

          {/* <a className="navi-item px-8">
            <div className="navi-link">
              <div className="navi-icon mr-2">
                <i className="flaticon2-hourglass text-primary"></i>
              </div>
              <div className="navi-text">
                <div className="font-weight-bold">My Tasks</div>
                <div className="text-muted">latest tasks and projects</div>
              </div>
            </div>
          </a> */}
          {/* <div className="navi-separator mt-3"></div> */}

          {/* <div className="navi-footer  px-8 py-5">
            <Link
              to="/logout"
              className="btn btn-light-primary font-weight-bold"
            >
              <FormattedMessage id="HEADER.GENERAL.SIGN_OUT" />
            </Link>
          </div> */}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
}
