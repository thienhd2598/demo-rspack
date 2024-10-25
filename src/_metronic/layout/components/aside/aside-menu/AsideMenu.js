import React, { useMemo } from "react";
import { AsideMenuList } from "./AsideMenuList";
import { useHtmlClassService } from "../../../_core/MetronicLayout";
import { useIntl } from "react-intl";
export function AsideMenu({ disableScroll }) {
   const {formatMessage} = useIntl()
  const uiService = useHtmlClassService();
  const layoutProps = useMemo(() => {
    return {
      layoutConfig: uiService.config,
      asideMenuAttr: uiService.getAttributes("aside_menu"),
      ulClasses: uiService.getClasses("aside_menu_nav", true),
      asideClassesFromConfig: uiService.getClasses("aside_menu", true)
    };
  }, [uiService]);  

  return (
    <>
      {/* begin::Menu Container */}
      <div
        id="kt_aside_menu"
        data-menu-vertical="1"
        style={{ maxHeight: '85vh' }}
        className={`aside-menu my-4 ${layoutProps.asideClassesFromConfig}`}
        {...layoutProps.asideMenuAttr}
      >
        <AsideMenuList layoutProps={layoutProps} />
        <span style={{ position: 'fixed', bottom: 10, left: 24 }} >{formatMessage({defaultMessage: 'Phiên bản'})}: <strong>{process.env.REACT_APP_VERSION}</strong></span>
      </div>
      {/* end::Menu Container */}
    </>
  );
}
