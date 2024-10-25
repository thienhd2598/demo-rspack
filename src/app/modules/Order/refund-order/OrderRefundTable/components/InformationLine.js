import React, { useEffect } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Checkbox } from "../../../../../../_metronic/_partials/controls";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import { useState, memo } from "react";
import { useIntl } from 'react-intl';
import AuthorizationWrapper from "../../../../../../components/AuthorizationWrapper";

export function detailsOrderSeller(ids, channel) {
  switch (channel) {
    case 'lazada':
      return window.open(`https://sellercenter.lazada.vn/apps/order/detail?spm=a1zawf.25038512.table_row_0.1.60ad4edf5ei8nN&tradeOrderId=${ids.lazadaAndTiktokOrderId}`, "_blank")
    case 'shopee':
      return window.open(`https://banhang.shopee.vn/portal/sale/return/${ids.shoppeOrderId}`, "_blank")
    case 'tiktok':
      return window.open(`https://seller-vn.tiktok.com/order/detail?order_no=${ids.lazadaAndTiktokOrderId}&shop_region=VN`, "_blank")
    default:
      return false
  }
}
//! Dòng chi tiết phía dưới header
const InformationLine = memo(
  ({
    setIdOrder,
    dataStore,
    returnOrder,
    setOpenModal,
    openModal,
    isSelected,
    params,
    setIds,
  }) => {
    const { formatMessage } = useIntl()
    function MakeIcon(code) {
      return toAbsoluteUrl(`/media/logo_${code}.png`);
    }
    const [isCopied, setIsCopied] = useState(false);
    const onCopyToClipBoard = async (text) => {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    };
    function nameStore() {
      const store__id = returnOrder?.store_id;
      return dataStore?.filter((st) => st.id == store__id);
    }
    function statusNoteWarehouse(status) {
      if (status == 0) {
        return false;
      }
      if (status == 1) {
        return {
          title: formatMessage({ defaultMessage: "không nhập kho" }),
          color: "#f3252e",
        };
      }
      if (status == 2) {
        return {
          title: formatMessage({ defaultMessage: "nhập kho 1 phần" }),
          color: "#ffa500",
        };
      }
      if (status == 3) {
        return {
          title: formatMessage({ defaultMessage: "nhập kho toàn phần" }),
          color: "#00DB6D",
        };
      }
      return false;
    }

    function handlerStatus(status) {
      switch (status) {
        case "REQUESTED":
          return {
            title: formatMessage({ defaultMessage: "Yêu cầu hoàn" }),
            color: "#f3252e",
          };
        case "PROCESSING":
          return {
            title: formatMessage({ defaultMessage: "Đang xử lý hoàn" }),
            color: "#347354",
          };
        case "SELLER_DISPUTE":
          return {
            title: formatMessage({ defaultMessage: "Đang khiếu nại" }),
            color: "#c96621",
          };
        case "JUDGING":
          return {
            title: formatMessage({ defaultMessage: "Sàn đang xem xét" }),
            color: "#4ca87a",
          };
        case "ACCEPTED":
          return {
            title: formatMessage({ defaultMessage: "Đồng ý hoàn" }),
            color: "#420fc6",
          };
        case "REFUND_PAID":
          return {
            title: formatMessage({ defaultMessage: "Hoàn tiền thành công" }),
            color: "#038f42",
          };
        case "CLOSED":
          return {
            title: formatMessage({ defaultMessage: "Sàn đóng yêu cầu" }),
            color: "#343434",
          };
        case "CANCELLED":
          return {
            title: formatMessage({ defaultMessage: "Hủy yêu cầu" }),
            color: "#969696",
          };
        default:
          return "";
      }
    }

    return (
      <>
        <tr>
          <td colSpan="7" className="p-0">
            <div
              className="d-flex align-items-center justify-content-between"
              style={{ background: "#D9D9D9", padding: "8px" }}
            >
              <div className="d-flex align-items-center">
                {!params?.is_old_order && <Checkbox
                  inputProps={{
                    "aria-label": "checkbox",
                  }}
                  size="checkbox-md"
                  isSelected={isSelected}
                  onChange={(e) => {
                    if (isSelected) {
                      setIds((prev) =>
                        prev.filter((_id) => _id.id != returnOrder.id)
                      );
                    } else {
                      setIds((prev) => prev.concat([returnOrder]));
                    }
                  }}
                />}
                <span className="mx-4">
                  <img
                    src={MakeIcon(returnOrder?.connector_channel_code)}
                    style={{ width: 20, height: 20, objectFit: "contain" }}
                  />
                  <span className="ml-1">{nameStore()?.[0]?.name}</span>
                </span>
                {/* <span className='mr-4'> */}
                <span
                  onClick={() => {
                    detailsOrderSeller({ lazadaAndTiktokOrderId: returnOrder?.order.ref_id, shoppeOrderId: returnOrder?.ref_return_id }, returnOrder?.connector_channel_code)
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {formatMessage({ defaultMessage: 'Mã trả hàng' })}: {returnOrder?.ref_return_id}
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
                    onClick={() =>
                      onCopyToClipBoard(returnOrder?.ref_return_id)
                    }
                    style={{ cursor: "pointer" }}
                    className="ml-2"
                  >
                    <i style={{ fontSize: 12 }} className="far fa-copy"></i>
                  </span>
                </OverlayTrigger>
                {/* </span> */}
                {returnOrder?.returnWarehouseImport &&
                  <>
                    <span className="mx-4">
                      <span className="fs-12" style={{
                        background: statusNoteWarehouse(
                          returnOrder?.returnWarehouseImport.import_type
                        ).color, color: '#fff', fontWeight: "bold",
                        padding: "4px 8px",
                        borderRadius: "4px", display: 'flex', alignItems: 'center'
                      }}>
                        {statusNoteWarehouse(returnOrder?.returnWarehouseImport.import_type).title}
                      </span>
                    </span>
                    {/* {returnOrder?.returnWarehouseImport?.import_note ? (
                      <OverlayTrigger
                        overlay={
                          <Tooltip
                            title="#1234443241434"
                            style={{ color: "red" }}
                          >
                            <span>{formatMessage({ defaultMessage: 'Ghi chú nhập kho' })}</span>
                          </Tooltip>
                        }
                      >
                        <img
                          onClick={() => {
                            setOpenModal({
                              ...openModal,
                              openNoteWarehouse: !openModal.openNoteWarehouse,
                            });
                            setIdOrder(returnOrder);
                          }}
                          src={toAbsoluteUrl("/media/journal_check.png")}
                          style={{
                            cursor: "pointer",
                            width: "16.88px",
                            height: "18px",
                            cursor: 'pointer'
                          }}
                        />
                      </OverlayTrigger>
                    ) : null}

                    {!returnOrder?.returnWarehouseImport?.import_note ? (
                      <OverlayTrigger
                        overlay={
                          <Tooltip
                            title="#1234443241434"
                            style={{ color: "red" }}
                          >
                            <span>{formatMessage({ defaultMessage: 'Thêm ghi chú nhập kho' })}</span>
                          </Tooltip>
                        }
                      >
                        <img
                          onClick={() => {
                            setOpenModal({
                              ...openModal,
                              checkOpenModalWarehouseELse: true,
                              openAddNoteWarehouse: true,
                            });
                            setIdOrder(returnOrder);
                          }}
                          src={toAbsoluteUrl("/media/journal-plus.png")}
                          style={{
                            cursor: "pointer",
                            width: "16.88px",
                            height: "18px",
                          }}
                        />
                      </OverlayTrigger>
                    ) : null} */}
                  <AuthorizationWrapper keys={["refund_order_detail_view"]}>
                    <span
                      className="text-primary cursor-pointer"
                      onClick={() => {
                        setIdOrder(returnOrder);
                        setOpenModal({ ...openModal, openWarehouseDetail: true });
                      }}
                    >
                      {formatMessage({ defaultMessage: 'Chi tiết' })}
                    </span>
                    </AuthorizationWrapper>
                  </>
                }
              </div>
              <div className="d-flex justify-content-between align-items-center" style={{ marginRight: "10px" }}>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#000000",
                    fontWeight: 400,
                  }}
                  className="mr-9 fs-14"
                >
                  {(returnOrder?.status == "REFUND_PAID" ||
                    returnOrder?.status == "ACCEPTED") && (returnOrder?.sme_reason_text || returnOrder?.sme_reason_type) ?
                    <OverlayTrigger
                      overlay={
                        <Tooltip title="#1234443241434" style={{ color: "red" }}>
                          <span>{formatMessage({ defaultMessage: 'Bổ sung nguyên nhân' })}</span>
                        </Tooltip>
                      }
                    >
                      <img
                        onClick={() => {
                          setOpenModal({
                            ...openModal,
                            openMoreReason: !openModal.openMoreReason,
                          });
                          setIdOrder(returnOrder);
                        }}
                        src={toAbsoluteUrl("/media/incognito.png")}
                        style={{
                          cursor: "pointer",
                          width: "16.88px",
                          height: "18px",
                          marginRight: "4px",
                          cursor: "pointer",
                        }}
                      />
                    </OverlayTrigger> : null}
                  {" "}
                  {formatMessage({ defaultMessage: 'Nguyên nhân trả hàng' })}:{" "}
                  <a
                    onClick={() => {
                      setOpenModal({
                        ...openModal,
                        openReasonReturn: !openModal.openReasonReturn,
                      });
                      setIdOrder(returnOrder);
                    }}
                    style={{
                      fontSize: "14px",
                      color: "#FE5629",
                      fontWeight: 400,
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Chi tiết' })}
                  </a>
                </span>
                {returnOrder?.status && (
                  <span
                    className="fs-12"
                    style={{
                      color: "#fff",
                      backgroundColor: handlerStatus(returnOrder?.status).color,
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {handlerStatus(returnOrder?.status).title}
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      </>
    );
  }
);

export default InformationLine;