import React from "react";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useState } from "react";
import {detailsOrderSeller} from '../../OrderRefundTable/components/InformationLine'
import { useIntl } from "react-intl";
export default function InformationLine({ dataStore, returnOrder }) {
  const {formatMessage} = useIntl()
  const [isCopied, setIsCopied] = useState(false);
  function MakeIcon(code) {
    return toAbsoluteUrl(`/media/logo_${code}.png`);
  }

  function nameStore() {
    const store__id = returnOrder?.store_id;
    return dataStore?.filter((st) => st?.id == store__id);
  }

  const onCopyToClipBoard = async (text) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };
  return (
    <tr>
      <td colSpan="7" className="p-0">
        <div
          className="d-flex align-items-center justify-content-between"
          style={{ background: "#D9D9D9", padding: "8px" }}
        >
          <div className="d-flex align-items-center">
            <span className="mx-4">
              <img
                src={MakeIcon(returnOrder?.connector_channel_code)}
                style={{ width: 20, height: 20, objectFit: "contain" }}
              />
              <span className="ml-1">{nameStore()?.[0]?.name}</span>
            </span>
            {/* <span className='mr-4'> */}
            <span onClick={() => detailsOrderSeller({lazadaAndTiktokOrderId: returnOrder?.order.ref_id, shoppeOrderId: returnOrder?.ref_return_id}, returnOrder?.connector_channel_code)} style={{ cursor: "pointer" }}>
             {formatMessage({defaultMessage: 'Mã trả hàng:'})} {returnOrder?.ref_return_id}
            </span>
            {/* <span className='mr-4'> */}
            <OverlayTrigger
              overlay={
                <Tooltip title="#1234443241434" style={{ color: "red" }}>
                  {isCopied ? `Copied!` : `Copy to clipboard`}
                </Tooltip>
              }
            >
              <span
                onClick={() => onCopyToClipBoard(returnOrder?.ref_return_id)}
                style={{ cursor: "pointer" }}
                className="ml-2"
              >
                <i style={{ fontSize: 12 }} className="far fa-copy"></i>
              </span>
            </OverlayTrigger>
            {/* </span> */}
          </div>
        </div>
      </td>
    </tr>
  );
}