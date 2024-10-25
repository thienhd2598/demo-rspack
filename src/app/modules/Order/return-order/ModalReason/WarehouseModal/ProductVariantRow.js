import React, { memo, useMemo, useState } from "react";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import { InputVerticalWithIncrease } from "../../../../../../_metronic/_partials/controls";
import { Field } from "formik";
import ModalCombo from "../../../../Products/products-list/dialog/ModalCombo";
import InfoProduct from "../../../../../../components/InfoProduct";
import ModalVariantDialog from "./ModalVariantDialog";
import { useIntl } from "react-intl";
const ProductVariantRow = ({
  keyVariant,
  getProductVariant,
  setGetProductVariant,
  method,
  order,
  returnOrder,
  removeProductVariant,
}) => {
  const { formatMessage } = useIntl()
  const [dataCombo, setDataCombo] = useState(null);
  const [scCurrentVariantSku, setScCurrentVariantSku] = useState(null);
  const [currentOrderItemId, setCurrentOrderItemId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  function detailsProductOnSeller(
    connector_channel_code,
    ref_store_id,
    refProductId,
    ref_variant_id
  ) {
    switch (connector_channel_code) {
      case "shopee":
        return window.open(
          `https://shopee.vn/product/${ref_store_id}/${refProductId}` || "",
          "_blank"
        );
        break;
      case "lazada":
        return window.open(
          `https://www.lazada.vn/-i${refProductId}-s${ref_variant_id}.html` ||
          "",
          "_blank"
        );
        break;
      case "tiktok":
        return window.open(
          `https://oec-api.tiktokv.com/view/product/${refProductId}` || "",
          "_blank"
        );
        break;
      default:
        break;
    }
  }


  const _attributes = (item_attributes) => {
    let attributes = [];
    if (item_attributes && item_attributes.length > 0) {
      for (let index = 0; index < item_attributes.length; index++) {
        const element = item_attributes[index];
        attributes.push(
          `${element.sme_catalog_product_attribute_value?.name}`
        );
      }
      return attributes.join(" - ");
    }
    return null;
  };

  const buildVariantComboElse = useMemo(() => {
    return (
      <>
        <tr
          style={{
            display: "table",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <td
            colSpan={3}
            className="d-flex align-items-center"
            style={{ verticalAlign: "top", width: "180%" }}
          >
            <div>
              <InfoProduct short={true} sku={order.getProductVariantByIndex?._item?.sku} textTruncateSku={true} />
            </div>
            <span
              style={{ cursor: "pointer" }}
              onClick={() =>
                setDataCombo(order.getProductVariantByIndex?._item?.combo_items)
              }
              className="ml-4 text-primary"
            >
              Combo
            </span>
            <span
              onClick={() => removeProductVariant(keyVariant)}
              style={{ cursor: "pointer" }}
              className="ml-4 text-primary"
            >
              {formatMessage({ defaultMessage: 'Xóa' })}
            </span>
          </td>
        </tr>
        {order.getProductVariantByIndex?._item?.combo_items?.map((_combo, index) => {
          return (
            <tr>
              <td className="d-flex" style={{ verticalAlign: "top" }}>
                <div
                  style={{
                    backgroundColor: "#F7F7FA",
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: "hidden",
                    minWidth: 60,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="mr-6"
                >
                  {
                    <img
                      src={
                        _combo?.combo_item
                          ?.sme_catalog_product_variant_assets[0].asset_url
                      }
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                      }}
                    />
                  }
                </div>
                <div>
                  <div className="mt-1 mb-2">
                    <InfoProduct short={true} sku={_combo?.combo_item?.sku} textTruncateSku={true} />
                  </div>
                  <span className="text-secondary-custom fs-12">
                    {_combo?.combo_item?.attributes.length > 0 ? _combo?.combo_item?.name?.replaceAll(' - ', ' + ') : ''}
                  </span>
                </div>
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                {_combo?.quantity * order?.quantityReturn}
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                <Field
                  name={`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-quantity`}
                  component={InputVerticalWithIncrease}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["", "col-12"]}
                  countChar
                  maxChar={"255"}
                  rows={4}
                />
              </td>
            </tr>
          );
        })}
      </>
    );
  }, [order]);

  const buildVariant = useMemo(() => {
    // Case không có liên kết
    if (!order?.sme_variant_id) {
      if (order.getProductVariantByIndex?._item) {
        if (!order.getProductVariantByIndex?._item.is_combo) {
          const variantAsset =
            order.getProductVariantByIndex?._item
              ?.sme_catalog_product_variant_assets?.[0];
          return (
            <>
              <td className="d-flex" style={{ verticalAlign: "top" }}>
                <div
                  style={{
                    backgroundColor: "#F7F7FA",
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: "hidden",
                    minWidth: 60,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="mr-6"
                >
                  {
                    <img
                      src={variantAsset?.asset_url}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                      }}
                    />
                  }
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      className="mt-1 mb-2"
                    >
                      <InfoProduct
                        short={true}
                        sku={order.getProductVariantByIndex?._item?.sku}
                        textTruncateSku={true}
                      />
                    </div>
                    <span
                      onClick={() => removeProductVariant(keyVariant)}
                      style={{ cursor: "pointer" }}
                      className="ml-4 text-primary"
                    >
                      {formatMessage({ defaultMessage: 'Xóa' })}
                    </span>
                  </div>
                  <span className="text-secondary-custom">
                    {_attributes(order.getProductVariantByIndex?._item?.attributes || '')}

                  </span>
                </div>
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                {order?.quantityReturn}
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                <Field
                  name={`variant-${order.getProductVariantByIndex?._item?.id}-${order.getProductVariantByIndex.keyVariant}-quantity`}
                  component={InputVerticalWithIncrease}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["", "col-12"]}
                  countChar
                  maxChar={"255"}
                  rows={4}
                />
              </td>
            </>
          );
        } else {
          return (
            <>
              <tr></tr>
            </>
          );
        }
      }
      return (
        <>
          <td>
            <div
              className="text-secondary-custom fs-12"
              style={{ width: "120%" }}
            >
              <span
                onClick={() => {
                  setShowConnectModal(true);
                  setCurrentOrderItemId(order?.id);
                  setScCurrentVariantSku(order?.variant_sku);
                }}
                style={{ cursor: "pointer" }}
                className="ml-4 text-primary"
              >
                {formatMessage({ defaultMessage: 'Chọn hàng hóa kho' })}
              </span>
            </div>
          </td>
        </>
      );
    }
    // Case có liên kết
    const variantAsset =
      order?.productVariant?.sme_catalog_product_variant_assets?.[0];

    return (
      <>
        <td className="d-flex" style={{ verticalAlign: "top" }}>
          <div
            style={{
              backgroundColor: "#F7F7FA",
              width: 60,
              height: 60,
              borderRadius: 8,
              overflow: "hidden",
              minWidth: 60,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.preventDefault();
            }}
            className="mr-6"
          >
            {
              <img
                src={variantAsset?.asset_url}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: "contain",
                }}
              />
            }
          </div>
          <div>
            <div className="mt-1 mb-2">
              <InfoProduct short={true} sku={order?.productVariant?.sku} textTruncateSku={true} />
            </div>
            <span className="text-secondary-custom">
              {_attributes(order?.productVariant?.attributes || '')}
            </span>
          </div>
        </td>
        <td className="text-center" style={{ verticalAlign: "top" }}>
          {order?.quantityReturn}
        </td>
        <td className="text-center" style={{ verticalAlign: "top" }}>
          <Field
            name={`variant-${order?.productVariant?.id}-${keyVariant}-quantity`}
            component={InputVerticalWithIncrease}
            label={""}
            required={false}
            customFeedbackLabel={" "}
            cols={["", "col-12"]}
            countChar
            maxChar={"255"}
            rows={4}
          />
        </td>
      </>
    );
  }, [order]);

  const buildVariantCombo = useMemo(() => {
    return (
      <>
        <tr style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
          <td
            colSpan={3}
            className="d-flex align-items-center"
            style={{ verticalAlign: "top", width: "180%" }}
          >
            <div>
              <InfoProduct short={true} sku={order?.productVariant?.sku} textTruncateSku={true} />
            </div>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => setDataCombo(order?.productVariant?.combo_items_origin)}
              className="ml-4 text-primary"
            >
              Combo
            </span>
          </td>
        </tr>
        {order?.productVariant?.combo_items?.map((_combo) => {
          return (
            <tr>
              <td className="d-flex" style={{ verticalAlign: "top" }}>
                <div
                  style={{
                    backgroundColor: "#F7F7FA",
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    overflow: "hidden",
                    minWidth: 60,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                  className="mr-6"
                >
                  {
                    <img
                      src={
                        _combo?.combo_item
                          ?.sme_catalog_product_variant_assets[0].asset_url
                      }
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "contain",
                      }}
                    />
                  }
                </div>
                <div>
                  <div style={{ wordWrap: "break-word" }} className="mt-1 mb-2">
                    <InfoProduct short={true} sku={_combo?.combo_item?.sku} textTruncateSku={true} />
                  </div>
                  <span className="text-secondary-custom fs-12">
                    {_combo?.combo_item?.attributes.length > 0 ? _combo?.combo_item?.name?.replaceAll(' - ', ' + ') : ''}
                  </span>
                </div>
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                {(_combo?.quantity / order?.quantity_purchased) * order?.quantityReturn}
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                <Field
                  name={`variant-${_combo?.combo_item?.id}-${order.productVariant.id}-combo-${keyVariant}-quantity`}
                  component={InputVerticalWithIncrease}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["", "col-12"]}
                  countChar
                  maxChar={"255"}
                  rows={4}
                />
              </td>
            </tr>
          );
        })}
      </>
    );
  }, [order]);

  return (
    <>
      <tr
        key={`product-variant-return-order-${order?.id}`}
        style={{
          borderBottom: "1px solid #D9D9D9",
          borderTop: "1px solid #D9D9D9",
        }}
      >
        <td
          rowSpan={`${!!order?.productVariant?.is_combo
            ? order?.productVariant?.combo_items?.length + 2
            : !!order.getProductVariantByIndex?._item.is_combo
              ? order.getProductVariantByIndex?._item?.combo_items.length + 2
              : 1
            }`}
          style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9" }}
        >
          <div className="d-flex row w-100 m-0 p-1">
            <div
              className="col-10"
              style={{
                verticalAlign: "top",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <div
                style={{
                  backgroundColor: "#F7F7FA",
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  overflow: "hidden",
                  minWidth: 60,
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="mr-6"
              >
                {
                  <img
                    src={order.variant_image}
                    style={{ width: 60, height: 60, objectFit: "contain" }}
                  />
                }
              </div>
              <div>
                <div>
                  <InfoProduct
                    short={true}
                    name={order.product_name}
                    url={() => {
                      detailsProductOnSeller(
                        order?.connector_channel_code,
                        returnOrder?.order?.ref_store_id,
                        order?.ref_product_id,
                        order?.ref_variant_id
                      );
                    }}
                    productOrder={true}
                  />
                </div>

                <div style={{ wordWrap: "break-word" }} className="mt-1 mb-2">
                  <InfoProduct short={true} sku={order.variant_sku} textTruncateSku={true} />
                </div>
                <span className="text-secondary-custom fs-12">
                  {order.variant_name}
                </span>
              </div>
            </div>
            <div className="col-2 px-0" style={{ wordBreak: 'break-word' }}>
              <span style={{ fontSize: 12 }} className="mr-1">
                x
              </span>
              {order?.quantityReturn}
            </div>
          </div>
        </td>
        {!order?.productVariant || !order?.productVariant?.is_combo ? (
          <>
            <ModalVariantDialog
              keyVariant={keyVariant}
              getProductVariant={getProductVariant}
              setGetProductVariant={setGetProductVariant}
              show={showConnectModal}
              setShowConnectModal={setShowConnectModal}
              onHide={() => {
                setScCurrentVariantSku(null);
                setCurrentOrderItemId(null);
                setShowConnectModal(false);
              }}
              scVariantSku={scCurrentVariantSku}
              order_item_id={currentOrderItemId}
            />
            {buildVariant}
          </>
        ) : (
          <></>
        )}
      </tr>
      {order?.productVariant?.is_combo ? (
        <>
          <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
          {buildVariantCombo}
        </>
      ) : (
        <></>
      )}
      {order.getProductVariantByIndex?._item.is_combo ? (
        <>
          <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
          {buildVariantComboElse}
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default memo(ProductVariantRow);