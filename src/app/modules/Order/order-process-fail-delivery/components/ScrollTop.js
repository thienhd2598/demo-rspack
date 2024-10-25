import React, { memo } from "react";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";

const ScrollTop = () => {
    return (
        <div
            id="kt_scrolltop1"
            className="scrolltop"
            style={{ bottom: 80 }}
            onClick={() => {
                window.scrollTo({
                    letf: 0,
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }}
        >
            <span className="svg-icon">
                <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
            </span>{" "}
        </div>
    )
};

export default memo(ScrollTop);