import React, { memo, useEffect, useMemo, useState } from "react";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Dropdown } from "react-bootstrap";
import dayjs from "dayjs";
import { detailsOrderSeller } from "./InformationLine";
import InfoProduct from "../../../../../../components/InfoProduct";
import HoverImage from "../../../../../../components/HoverImage";
import { useIntl } from 'react-intl';
import EditVertical from "../../../return-order/EditVertical";
import AuthorizationWrapper from "../../../../../../components/AuthorizationWrapper";
const RowTable = memo(({ returnOrder, openModal, setOpenModal, setIdOrder, params }) => {
  const { formatMessage } = useIntl()
  const openFloorProducts = (
    connector_channel_code,
    ref_store_id,
    refProductId,
    ref_variant_id
  ) => {
    let url = "";
    switch (connector_channel_code) {
      case "shopee":
        url = `https://shopee.vn/product/${ref_store_id}/${refProductId}`;
        break;

      case "lazada":
        url = `https://www.lazada.vn/-i${refProductId}-s${ref_variant_id}.html`;
        break;

      case "tiktok":
        url = `https://oec-api.tiktokv.com/view/product/${refProductId}`;
        break;

      default:
        break;
    }
    window.open(url || "", "_blank");
  };
  const renderAction = useMemo(() => {
    return (
      <Dropdown drop="down">
        <Dropdown.Toggle className="btn-outline-secondary">
          {formatMessage({ defaultMessage: 'Chọn' })}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          {/* {!!returnOrder?.returnWarehouseImport && (
            <Dropdown.Item
              onClick={() => {
                setIdOrder(returnOrder);
                setOpenModal({ ...openModal, openWarehouseDetail: true });
              }}
              className="mb-1 d-flex"
            >
              {formatMessage({ defaultMessage: 'Chi tiết' })}
            </Dropdown.Item>
          )} */}
          <Dropdown.Item
            onClick={() =>
              detailsOrderSeller(
                {
                  lazadaAndTiktokOrderId: returnOrder?.order.ref_id,
                  shoppeOrderId: returnOrder?.ref_return_id,
                },
                returnOrder?.connector_channel_code
              )
            }
            className="mb-1 d-flex"
          >
            {formatMessage({ defaultMessage: 'Chi tiết trên sàn' })}
          </Dropdown.Item>
          {/* Update theo task #7114 */}
          <AuthorizationWrapper keys={['refund_order_import_warehouse']}>
            {!returnOrder?.returnWarehouseImport?.import_type && !params?.is_old_order && (
              <Dropdown.Item
                onClick={() => {
                  setIdOrder(returnOrder);
                  setOpenModal({ ...openModal, openWarehouse: true });
                }}
                className="mb-1 d-flex"
              >
                {formatMessage({ defaultMessage: 'Xử lý trả hàng' })}
              </Dropdown.Item>
            )}
          </AuthorizationWrapper>
          {/* Update theo task #7114 */}
          {/* {((returnOrder?.status == "REFUND_PAID" ||
            returnOrder?.status == "ACCEPTED") && (!returnOrder?.sme_reason_text && !returnOrder?.sme_reason_type)) && ( */}
          <AuthorizationWrapper keys={['order_return_list_add_note']}>
          {!params?.is_old_order && <Dropdown.Item
            onClick={() => {
              setOpenModal({ ...openModal, openAddReason: true, openMoreReason: false, checkOpenModalElse: true });
              setIdOrder(returnOrder);
            }}
            className="mb-1 d-flex"
          >
            {formatMessage({ defaultMessage: 'Bổ sung nguyên nhân' })}
          </Dropdown.Item>}
          </AuthorizationWrapper>
          {/* )} */}
        </Dropdown.Menu>
      </Dropdown>
    );
  }, [returnOrder, params?.is_old_order]);

  const orderInreturnOrderItems = returnOrder?.returnOrderItems.map((or) => or?.orderItem);
  const returnOrderItems = returnOrder?.returnOrderItems
  const totalPriceOrder = returnOrderItems
    .map((orIt) => orIt?.return_quantity)
    .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  const [showOrHide, setShowOrHide] = useState(false)
  let getThreeProduct = []
  let allProducts = []
  if (orderInreturnOrderItems) {
    const length = orderInreturnOrderItems?.length;
    if (length > 3) {
      getThreeProduct = [...orderInreturnOrderItems?.slice(0, 3)]
      allProducts = [...orderInreturnOrderItems]
    }
  }

  return (
    <>
      <tr className="borderRight" style={{ borderBottom: '1px solid #d9d9d9' }}>
        {/* //colum1 */}
        <td style={{ height: 0 }} className="p-0">
          {(getThreeProduct.at(2) ? !showOrHide ?
            getThreeProduct : allProducts : orderInreturnOrderItems)?.map((orderItem, index, arr) => (
              <div
                className="d-flex row w-100 m-0 p-3"
                style={{
                  borderBottom: arr?.length > 1 ?
                    arr.at(arr.length - 1) == arr.at(index) ?
                      'none' : "0.5px solid #d9d9d9" : "none",
                  height: orderInreturnOrderItems?.length > 1 || getThreeProduct?.length > 1 ? "auto" : "100%",
                }}
              >
                <div
                  className="col-11"
                  style={{
                    verticalAlign: "top",
                    display: "flex",
                    flexDirection: "row",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#F7F7FA",
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      minWidth: 80,
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                    }}
                    className="mr-6"
                  >
                    {
                      <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 80, height: 80 }} url={orderItem.variant_image} />
                    }
                  </div>
                  <div>
                    <InfoProduct
                      short={true}
                      name={orderItem.product_name}
                      sku={orderItem?.variant_sku}
                      url={() => {
                        openFloorProducts(
                          orderItem?.connector_channel_code,
                          returnOrder?.order?.ref_store_id,
                          orderItem?.ref_product_id,
                          orderItem?.ref_variant_id
                        );
                      }}
                      productOrder={true}
                    />
                    <div style={{ width: "max-content" }}>
                      {orderItem?.variant_name}
                    </div>
                  </div>
                </div>
                <div
                  style={{ verticalAlign: "center" }}
                  className="col-1 px-0 mt-4"
                >
                  <span style={{ fontSize: 12 }} className="mr-1">
                    x
                  </span>
                  {returnOrderItems[index]?.return_quantity}
                </div>
              </div>
            ))}
        </td>
        {/* //colum2 */}
        <td
          style={{ verticalAlign: "top" }}
          className="pt-4 pb-1"
        >
          <div className="d-flex flex-column">
            <div className="pb-2">
              {totalPriceOrder > 0
                && new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(returnOrder.refund_total)}{" "}
            </div>
          </div>
        </td>
        {/* //colum3 */}
        <td
          style={{ verticalAlign: "top" }}
          className="pt-4 pb-1"
        >
          {returnOrder?.platform_status_text}
        </td>
        {/* //colum4*/}
        <td
          style={{ verticalAlign: "top" }}
          className="pt-4 pb-1"
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="mb-2">
              {formatMessage({ defaultMessage: 'Thời gian tạo đơn' })}:{" "}
              {returnOrder?.order.order_at
                ? dayjs(returnOrder?.order.order_at * 1000).format(
                  "DD/MM/YYYY HH:mm"
                )
                : "--"}
            </span>
            <span className="mb-2">
              {formatMessage({ defaultMessage: 'Thời gian tạo hoàn' })}:{" "}
              {returnOrder?.reverse_request_time
                ? dayjs(returnOrder?.reverse_request_time * 1000).format(
                  "DD/MM/YYYY HH:mm"
                )
                : "--"}
            </span>
            {returnOrder?.returnWarehouseImport && (
              <span>
                {formatMessage({ defaultMessage: 'Thời gian xử lý trả hàng' })}:{" "}
                <br />
                {returnOrder?.returnWarehouseImport
                  ? dayjs(returnOrder?.returnWarehouseImport.created_at).format(
                    "DD/MM/YYYY HH:mm"
                  )
                  : "--"}
              </span>
            )}
          </div>
        </td>
        {/* //colum5 */}
        <td
          style={{ verticalAlign: "top", maxWidth: 180 }}
          className="pt-4 pb-1"
        >
          <div className="d-flex flex-column">
            <div className="d-flex flex-column mb-2">
              <p className="text-secondary-custom my-0">{formatMessage({ defaultMessage: 'Mã đơn hàng' })}:</p>
              <p className="my-0">{returnOrder?.order.ref_id}</p>
              <p className="text-secondary-custom my-0">{formatMessage({ defaultMessage: 'Mã vận đơn trả hàng' })}:</p>
              <p className="my-0">
                {returnOrder?.tracking_number
                  ? returnOrder?.tracking_number
                  : "--"}
              </p>
              <p className="text-secondary-custom my-0">{formatMessage({ defaultMessage: 'Mã vận đơn - ĐVVC' })}:</p>
              <p className="my-0 d-flex">
                {returnOrder?.shipping_tracking_number || "--"}
                {!params?.is_old_order && <EditVertical varibles={{id: returnOrder?.id, shipping_tracking_number: returnOrder?.shipping_tracking_number || ''}} title={formatMessage({ defaultMessage: 'Mã vận đơn - ĐVVC'})}/>}
              </p>
            </div>
          </div>
        </td>
        {/* //colum6 */}
        <td
          style={{ verticalAlign: "top" }}
          className="pt-4 pb-1"
        >
          <div className="d-flex flex-column">
            <p>{returnOrder?.order.customer.user_name || "X"}</p>
          </div>
        </td>
        {/* //colum7 */}
        <td
          style={{ verticalAlign: "top" }}
          className="pt-4 pb-1 text-center"
        >
          {renderAction}
        </td>
      </tr>

      {getThreeProduct?.at(2) && (
        <tr style={{ borderBottom: "1px solid #d9d9d9" }}>
          <td
            colSpan="1"
            style={{ borderRight: "1px solid #d9d9d9" }}
            className="pt-0 pl-6"
          >
            <a className="d-flex align-items-center">
              <span
                style={{
                  height: 1,
                  backgroundColor: "rgba(0,0,0,0.15)",
                  flex: 1,
                }}
              />
              <span
                onClick={() => setShowOrHide(!showOrHide)}
                className="font-weight-normal mx-4"
                style={{ color: "rgba(0,0,0,0.85)" }}
              >
                {!showOrHide ? formatMessage({ defaultMessage: 'Xem thêm' }) : formatMessage({ defaultMessage: 'Thu gọn' })}
              </span>
              <span
                style={{
                  height: 1,
                  backgroundColor: "rgba(0,0,0,0.15)",
                  flex: 1,
                }}
              />
            </a>
          </td>
        </tr>
      )}
    </>
  );
});

export default RowTable;