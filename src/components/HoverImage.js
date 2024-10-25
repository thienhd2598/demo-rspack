import { OverlayTrigger, Tooltip } from "react-bootstrap";
import React from 'react'
const HoverImage = ({ url, size = {}, defaultSize = {}, placement = 'right', styles = {}, handleOnclick }) => {
    return (
        <OverlayTrigger
            className="overightTooltip"
            id={`tooltip-${placement}`} placement={placement}
            overlay={
                <Tooltip title="#1234443241434" style={{ zIndex: 99999 }}>
                    <img src={url} style={{ width: size?.width, height: size?.height, objectFit: 'cover' }} alt='' />
                </Tooltip>
            }
        >
            <img src={url} style={{ ...styles, width: defaultSize?.width, height: defaultSize?.height, objectFit: 'cover' }} alt='' onClick={handleOnclick} />
        </OverlayTrigger>
    )
}

export default HoverImage