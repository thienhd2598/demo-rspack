import React, { memo, useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import InfoProduct from "../../../../../components/InfoProduct";
import ModalCombo from "../../../Products/products-list/dialog/ModalCombo";
import ModalVariantDialog from "./ModalVariantDialog";
import HoverImage from "../../../../../components/HoverImage";
import _ from "lodash";
const ProductVariantRow = ({
  keyVariant,
  getProductVariant,
  setGetProductVariant,
  order,
  returnOrder,
}) => {
  const { formatMessage } = useIntl()
  const [dataCombo, setDataCombo] = useState(null);
  const [scCurrentVariantSku, setScCurrentVariantSku] = useState(null);
  const [currentOrderItemId, setCurrentOrderItemId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const navigateSmeProduct = useCallback((smeVariant) => {
      let url = "";
      
      if (smeVariant?.is_combo) {
        url = `/products/edit-combo/${smeVariant?.sme_catalog_product?.id}`;
      } else if (smeVariant?.attributes?.length > 0) {
        url = `/products/stocks/detail/${smeVariant?.id}`;
      } else {
        url = `/products/edit/${smeVariant?.sme_catalog_product?.id}`;
      }

      window.open(url, "_blank");
    }, []);
  const _attributes = (item_attributes) => {
    let attributes = [];
    if (item_attributes && item_attributes.length > 0) {
      for (let index = 0; index < item_attributes.length; index++) {
        const element = item_attributes[index];
        attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);
      }
      return attributes.join(" - ");
    }
    return null;
  };
  console.log('order', order)
  console.log('returnOrder', returnOrder)
  const returnItems = returnOrder?.returnWarehouseImport?.returnWarehouseImportItems

  const returnItemsWitoutCombo = returnItems?.filter(item => item?.cancelOrderItem?.id == order?.id && !item?.sme_combo_variant_id)
  const variantView = order?.productVariant
  const listStatus = (!!variantView ? [{...variantView}, ...variantView?.status_variants] : [])?.filter(item => !!item?.status)?.filter(status => returnItemsWitoutCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))
  const isLinked = (!!variantView ? [{...variantView}, ...variantView?.status_variants] : [])?.filter(item => !!item?.status)?.some(item => returnItems?.map(rt => rt.sme_variant_id)?.includes(item?.id))
  console.log('listStatus', listStatus)
  const buildVariant = useMemo(() => {
    // Case không có liên kết
    if (!isLinked && !order?.sme_variant_id) {
      return (
        <>
          <td>
            <div className="text-secondary-custom fs-12" style={{ width: "120%" }}>
              <span 
                style={{ cursor: "not-allowed" }}
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
    const variantAsset = order?.productVariant?.sme_catalog_product_variant_assets?.[0];
    
    return (
      <>
        <td className="d-flex" style={{ verticalAlign: "top" }}>
          <div style={{ backgroundColor: "#F7F7FA", width: 60,height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer"}} className="mr-6">
            {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={variantAsset?.asset_url} />}
          </div>
          <div>
            <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(order?.productVariant)}>
              <InfoProduct short={true} sku={order?.productVariant?.sku} textTruncateSku={true} />
            </div>
            <span className="text-secondary-custom">{_attributes(order?.productVariant?.attributes || '')}</span>
          </div>
        </td>
        {(listStatus?.length == 1 ? !!(listStatus?.[0]?.id != variantView?.id) : !!listStatus?.length) ? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                    <div className="d-flex align-items-center">
                    <span className="mr-4">Số lượng: {order?.quantityReturn}</span>
                      <span className="ml-4">Số lượng nhập kho: {order?.quantityReturn}</span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                   <td className="text-center" style={{ verticalAlign: "top" }}>{order?.productVariant?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" }}>{order?.productVariant?.product_status_name || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                   {`${variantView?.import_quantity || 0} / ${order?.quantityReturn || 0}`}
                  </td>
                </>
              )}
      </>
    );
  }, [order, listStatus, variantView]);

  const buildVariantCombo = useMemo(() => {
    return (
      <>
      <tr>
          <td className="text-center" colSpan={4} style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9'}}>
            <div className="cursor-pointer d-flex align-items-center">
              <div onClick={() => navigateSmeProduct(order.productVariant)}>
                <InfoProduct short={true} sku={order.productVariant?.sku} textTruncateSku={true} />
              </div>   
              <span style={{ cursor: "pointer" }} onClick={() => setDataCombo(order.productVariant?.combo_items_origin)} className="ml-4 text-primary">
                Combo
              </span> 
            </div>
          </td>
        </tr>
        {order.productVariant?.combo_items?.map((_combo, index) => {
          const comboListStatus = [{..._combo?.combo_item},..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status)
          const returnItemsInCombo = returnItems?.filter(item => item?.cancelOrderItem?.id == order?.id && item?.sme_combo_variant_id == order.productVariant?.id)

          const listStatusCombo = comboListStatus?.filter(status => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))

          const currentStatus = comboListStatus?.find(item => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(item?.id))

          const selectAllReturnImported = returnItemsInCombo?.filter(item => comboListStatus?.map(stt => stt?.id)?.includes(item?.sme_variant_id))

          return (
            <>
            <tr>
              <td className="d-flex" style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                <div style={{ backgroundColor: "#F7F7FA", width: 60, height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer",}} className="mr-6">
                  {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={_combo?.combo_item?.sme_catalog_product_variant_assets[0].asset_url} />}
                </div>
                <div>
                  <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(_combo?.combo_item)}>
                    <InfoProduct short={true} sku={_combo?.combo_item?.sku} textTruncateSku={true} />
                  </div>
                  <span className="text-secondary-custom fs-12">
                    {_combo?.combo_item?.attributes.length > 0 ? _combo?.combo_item?.name?.replaceAll(' - ', ' + ') : ''}
                  </span>
                </div>
              </td>
              {(listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) ? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                    <div className="d-flex align-items-center">
                      <span className="mr-4">Số lượng: {_.sum(selectAllReturnImported?.map(item => item?.import_quantity))}</span>
                      <span className="ml-4">Số lượng nhập kho: {_.sum(selectAllReturnImported?.map(item => item?.import_quantity))}</span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center" style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>{currentStatus?.unit || _combo?.combo_item?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" , borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9'}}>{currentStatus?.product_status_name || _combo?.combo_item?.product_status_name}</td>
                  <td className="text-center" style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                  {`${_.sum(selectAllReturnImported?.map(item => item?.import_quantity)) || 0} / ${_combo?.return_quantity || 0}`}
                  </td>
                </>
              )}
            </tr>
            {(listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) && listStatusCombo?.map((item) => {
              const statusQuantity = returnItemsInCombo?.find(returnItem => returnItem?.sme_variant_id == item?.id)
              return (
                <tr>
              <td className="d-flex" style={{ verticalAlign: "top" }}>
                  <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
                    <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
                  </div>
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>{item?.unit || '--'}</td>
              <td className="text-center" style={{ verticalAlign: "top" }}>{item?.product_status_name}</td>
              <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
              {statusQuantity?.import_quantity || 0}
              </td>
            </tr>
              )
            })}
            </>
          );
        })}

      </>
    );
  }, [order, returnItems]);

  const amountRow = useMemo(() => {
    const variant = order?.productVariant

    if(variant?.is_combo) {
      const row = (variant?.combo_items || []).map((_combo, index) => {
        const returnItemsInCombo = returnItems?.filter(item => item?.cancelOrderItem?.id == order?.id && item?.sme_combo_variant_id == order.productVariant?.id)

        const listStatusCombo = [{..._combo?.combo_item}, ..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status)?.filter(status => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))
        return (listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) ? listStatusCombo?.length + 1 : 1
      })
      return _.sum(row) + 2
    } else {
      return (listStatus?.length == 1 ? !!(listStatus?.[0]?.id != variantView?.id) : !!listStatus?.length) ? listStatus?.length + 1 : 1
    }
}, [order, listStatus, variantView, returnItems])

  return (
    <>
      <tr key={`product-variant-return-order-${order?.id}`} style={{borderBottom: "1px solid #D9D9D9", borderTop: "1px solid #D9D9D9",}}>
      {returnOrder?.source != 'manual' && (
      <td rowSpan={amountRow}
          style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9" }}
        >
          <div className="d-flex row w-100 m-0 p-1">
            <div className="col-10" style={{verticalAlign: "top", display: "flex", flexDirection: "row",}}>
              <div style={{ backgroundColor: "#F7F7FA", width: 60, height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer",}} className="mr-6">
                {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={order.variant_image} />}
              </div>
              <div>
                <div>
                  <InfoProduct short={true} name={order.product_name} url={() => window.open(`/product-stores/edit/${order?.sc_product_id}` || '', '_blank')} productOrder={true}/>
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
      )}
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
      {(listStatus?.length == 1 ? !!(listStatus?.[0]?.id != variantView?.id) : !!listStatus?.length) && isLinked && listStatus?.filter(item => !!item?.status)?.map(item => {
        const quantityImport = returnItemsWitoutCombo?.find(importItem => importItem?.cancelOrderItem?.id == order?.id && item?.id == importItem?.sme_variant_id)

        return (
         
          <tr>
          <td className="d-flex" style={{ verticalAlign: "top" }}>
              <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
                <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
              </div>
          </td>
          <td className="text-center" style={{ verticalAlign: "top" }}>{item?.unit || '--'}</td>
          <td className="text-center" style={{ verticalAlign: "top" }}>{item?.product_status_name}</td>
          <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
            {quantityImport?.import_quantity || 0}
          </td>
        </tr>
        )
      })}
      {order?.productVariant?.is_combo ? (
        <>
          <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
          {buildVariantCombo}
        </>
      ) : (
        <></>
      )}

    </>
  );
};

export default memo(ProductVariantRow);