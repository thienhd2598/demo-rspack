import { OverlayTrigger, Tooltip } from "react-bootstrap";
import React from 'react'

export const TooltipWrapper = ({ children, note }) => {
    return (
      <OverlayTrigger
        overlay={
          <Tooltip title="#1234443241434" style={{ color: "red" }}>
            <span>{note}</span>
          </Tooltip>
        }
      >
        {children}
      </OverlayTrigger>
    );
  };
  