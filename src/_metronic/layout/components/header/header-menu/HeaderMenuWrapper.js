import React, { useMemo } from "react";
import objectPath from "object-path";
import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_helpers";
import { useHtmlClassService } from "../../../_core/MetronicLayout";
import { SubHeader } from "../../subheader/SubHeader";

export function HeaderMenuWrapper() {
    const uiService = useHtmlClassService();
    const layoutProps = useMemo(() => {
        return {
            config: uiService.config,
            ktMenuClasses: uiService.getClasses("header_menu", true),
            rootArrowEnabled: objectPath.get(
                uiService.config,
                "header.menu.self.root-arrow"
            ),
            menuDesktopToggle: objectPath.get(uiService.config, "header.menu.desktop.toggle"),
            headerMenuAttributes: uiService.getAttributes("header_menu"),
            headerSelfTheme: objectPath.get(uiService.config, "header.self.theme"),
            ulClasses: uiService.getClasses("header_menu_nav", true),
            disabledAsideSelfDisplay:
                objectPath.get(uiService.config, "aside.self.display") === false,
            subheaderDisplay: objectPath.get(uiService.config, "subheader.display"),
        };
    }, [uiService]);
    const getHeaderLogo = () => {
        let result = "logo-light.png";
        if (layoutProps.headerSelfTheme && layoutProps.headerSelfTheme !== "dark") {
            result = "logo-dark.png";
        }
        return toAbsoluteUrl(`/media/logos/${result}`);
    };

    return <>
        {/*begin::Header Menu Wrapper*/}
        <div className="header-menu-wrapper header-menu-wrapper-left d-flex align-items-center" id="kt_header_menu_wrapper">
            {layoutProps.disabledAsideSelfDisplay && (
                <>
                    {/*begin::Header Logo*/}
                    <div className="header-logo">
                        <Link to="/">
                            <img alt="logo" style={{ height: 50 }} src={getHeaderLogo()} />
                        </Link>
                    </div>
                    {/*end::Header Logo*/}
                </>
            )}
            {layoutProps.subheaderDisplay && <SubHeader />}
            {/*begin::Header Menu*/}
            {/* <HeaderMenu layoutProps={layoutProps} /> */}
            {/*end::Header Menu*/}
        </div>
        {/*Header Menu Wrapper*/}
    </>
}
