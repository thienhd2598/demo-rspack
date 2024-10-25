import React, { useMemo } from "react";
import objectPath from "object-path";
import SVG from "react-inlinesvg";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../_helpers";
import { useHtmlClassService } from "../../_core/MetronicLayout";
import { SearchDropdown } from "../extras/dropdowns/search/SearchDropdown";
import { UserNotificationsDropdown } from "../extras/dropdowns/UserNotificationsDropdown";
import { QuickActionsDropdown } from "../extras/dropdowns/QuickActionsDropdown";
import { MyCartDropdown } from "../extras/dropdowns/MyCartDropdown";
import { LanguageSelectorDropdown } from "../extras/dropdowns/LanguageSelectorDropdown";
import { QuickUserToggler } from "../extras/QuiclUserToggler";
import { DropdownTopbarItemToggler } from "../../../_partials/dropdowns";
import { Link } from "react-router-dom";
import { SubHeader } from "../subheader/SubHeader";
import { useHistory } from 'react-router-dom';
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";

export function Topbar() {
  const history = useHistory();
  const user = useSelector((state) => state.auth.user);
  const { formatMessage } = useIntl();

  const uiService = useHtmlClassService();
  const layoutProps = useMemo(() => {
    return {
      viewSearchDisplay: objectPath.get(
        uiService.config,
        "extras.search.display"
      ),
      viewNotificationsDisplay: objectPath.get(
        uiService.config,
        "extras.notifications.display"
      ),
      viewQuickActionsDisplay: objectPath.get(
        uiService.config,
        "extras.quick-actions.display"
      ),
      viewCartDisplay: objectPath.get(uiService.config, "extras.cart.display"),
      viewQuickPanelDisplay: objectPath.get(
        uiService.config,
        "extras.quick-panel.display"
      ),
      viewLanguagesDisplay: objectPath.get(
        uiService.config,
        "extras.languages.display"
      ),
      viewUserDisplay: objectPath.get(uiService.config, "extras.user.display"),
    };
  }, [uiService]);

  return (
    <div className="topbar d-flex align-items-center">
      {/* {layoutProps.viewSearchDisplay && <SearchDropdown />} */}
      {/* 
      <Dropdown drop="down" alignRight>
        <Dropdown.Toggle
          as={DropdownTopbarItemToggler}
          id="kt_quick_notifications_toggle1"          
        >
          <Link
            className="btn btn-icon btn-clean mr-6 px-2 "
            id="kt_quick_notifications_toggle"
            style={{ width: 'fit-content' }}            
            to="/products/new"
          >
            <span className="svg-icon svg-icon-md svg-icon-control  mr-2">
              <SVG src={toAbsoluteUrl("/media/svg/ic_add_circle.svg")} />
            </span>
            <span className='text-dark' >Thêm mới</span>
          </Link>
        </Dropdown.Toggle>
      </Dropdown> */}

      {/* Comment để test performance */}
      {/* {layoutProps.viewNotificationsDisplay && <UserNotificationsDropdown />}  */}
      {layoutProps.viewLanguagesDisplay && <LanguageSelectorDropdown />}
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip>{formatMessage({ defaultMessage: 'Hướng dẫn' })}</Tooltip>
        }
      >
        <div className="mr-6" onClick={() => window.open('https://guide.upbase.vn/tong-quan/gioi-thieu', '_blank')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="cursor-pointer bi bi-question-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94" />
          </svg>
        </div>
      </OverlayTrigger>
      {!user?.is_subuser && <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip>{formatMessage({ defaultMessage: 'Gian hàng' })}</Tooltip>
        }
      >
        <div className="mr-6" onClick={() => history.push('/setting/channels')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="cursor-pointer bi bi-shop" viewBox="0 0 16 16">
            <path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.371 2.371 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976l2.61-3.045zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0V5.37a.5.5 0 0 0-.12-.325L12.27 2H3.73L1.12 5.045A.5.5 0 0 0 1 5.37v.255a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0M1.5 8.5A.5.5 0 0 1 2 9v6h1v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5h6V9a.5.5 0 0 1 1 0v6h.5a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1H1V9a.5.5 0 0 1 .5-.5M4 15h3v-5H4zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm3 0h-2v3h2z" />
          </svg>
        </div>
      </OverlayTrigger>}
      {/* {(!user?.is_subuser || user?.roles?.includes("product_manager")) && (
        <Dropdown drop="down" alignRight>
          <Dropdown.Toggle
            as={DropdownTopbarItemToggler}
            id="kt_quick_notifications_toggle2"
          >
            <Link
              className="btn btn-icon btn-clean mr-6 px-2"
              id="kt_quick_notifications_toggle"
              style={{ width: 'fit-content' }}
              to='/setting/channels'
            >
              <span className="svg-icon svg-icon-md svg-icon-control  mr-2">
                <SVG src={toAbsoluteUrl("/media/svg/ic_setting.svg")} />
              </span>
              <span className='text-dark  fs-16' >{formatMessage({ defaultMessage: 'Cài đặt' })}</span>
            </Link>
          </Dropdown.Toggle>
        </Dropdown>
      )} */}
      {(layoutProps.viewUserDisplay || localStorage.getItem('fromAgency')) && <QuickUserToggler />}
    </div>
  );
}
