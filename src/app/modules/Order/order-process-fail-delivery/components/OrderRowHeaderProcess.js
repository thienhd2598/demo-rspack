import React, { memo, useMemo, useCallback, useState } from "react";
import { useIntl } from "react-intl";
import { OverlayTrigger, Tooltip } from "react-bootstrap";


const OrderRowHeaderProcess = ({ store, colSpan, order }) => {
    const { formatMessage } = useIntl();
    const [isCopied, setIsCopied] = useState(false);

    const btnCopy = useMemo(
        () => {
            return (
                <OverlayTrigger
                    overlay={
                        <Tooltip title="#1234443241434" style={{ color: "red" }}>
                            {isCopied ? `Copied!` : `Copy to clipboard`}
                        </Tooltip>
                    }
                >
                    <span
                        onClick={() => onCopyToClipBoard(order?.ref_return_id)}
                        style={{ cursor: "pointer" }}
                        className="ml-2"
                    >
                        <i style={{ fontSize: 12 }} className="far fa-copy"></i>
                    </span>
                </OverlayTrigger>
            )
        }, [order]
    );

    const onCopyToClipBoard = useCallback(
        async (text) => {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 1500);
        }, []
    );

    return (
        <tr>
            <td colSpan={colSpan}>
                <div className="d-flex align-items-center justify-content-between">
                    
                </div>
            </td>
        </tr>
    )
};

export default memo(OrderRowHeaderProcess);