import React, { memo, useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import _ from "lodash";
import InfoProduct from "../../../../components/InfoProduct";
import HoverImage from "../../../../components/HoverImage";
const OrderReturnOrderRow = ({ isImported, key, order, returnItems,isOrderManual,onSetCombo}) => {
  const { formatMessage } = useIntl()
  const navigateSmeProduct = useCallback((smeVariant) => {
      let url = "";

      if (smeVariant?.is_combo) {
        url = `/products/edit-combo/${smeVariant?.sme_catalog_product?.id}`;
      } else if (smeVariant?.attributes?.length > 0 || smeVariant?.product_status_name) {
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
  const returnItemsWitoutCombo = returnItems?.filter(item => (item?.returnOrderItem?.order_item_id || item?.cancelOrderItem?.id) == order?.id && !item?.sme_combo_variant_id)
  const variantView = order?.productVariant
  const listStatus = ([{...variantView || {}}, ...(variantView?.status_variants || [])])?.filter(item => !!item?.status)?.filter(status => returnItemsWitoutCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))
  const isLinked = ([{...variantView || {}}, ...(variantView?.status_variants || [])])?.filter(item => !!item?.status)?.some(item => returnItems?.map(rt => rt.sme_variant_id)?.includes(item?.id))
 
  const buildVariant = useMemo(() => {
    // Case không có liên kết
    if (!isLinked && !order?.sme_variant_id) {

      return (
        <>
          <td colSpan={4}>
            <div className="text-secondary-custom fs-12" style={{ width: "120%" }}>
              <span
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
    const variantAsset = order?.productVariant?.sme_catalog_product_variant_assets?.[0];
    const quantityImport = returnItemsWitoutCombo?.find(importItem => (importItem?.returnOrderItem?.order_item_id || importItem?.cancelOrderItem?.id) == order?.id && order?.productVariant?.id == importItem?.sme_variant_id)

    return (
      <>
        <td style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
          <div className="d-flex">
          <div style={{ backgroundColor: "#F7F7FA", width: 60,height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer"}} className="mr-6">
            {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={variantAsset?.asset_url} />}
          </div>
          <div>
            <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(order?.productVariant)}>
              <InfoProduct short={true} sku={order?.productVariant?.sku} textTruncateSku={true} />
            </div>
            <span className="text-secondary-custom">{_attributes(order?.productVariant?.attributes || '')}</span>
          </div>
          </div>
        </td>
        
        {(listStatus?.length == 1 ? !!(listStatus[0]?.id != variantView?.id) : !!listStatus?.length) ? (
          <>
            <td colSpan={4} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
              <div className="d-flex align-items-center">
              <span className="mr-4">Số lượng: {order?.quantityReturn}</span>
                <span className="ml-4">Số lượng nhập kho: {order?.quantityReturn}</span>
              </div>
            </td>
          </>
        ) : (
          <>
              <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{order?.productVariant?.unit || '--'}</td>
            <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{variantView?.product_status_name}</td>
            <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
              {isImported ? `${quantityImport?.import_quantity || 0} / ${order?.quantityReturn}` : 0}
            </td>
          </>
        )}
      </>
    );
  }, [order, listStatus,isLinked, isImported,variantView, returnItemsWitoutCombo]);

  const buildVariantCombo = useMemo(() => {
    return (
      <>
      <tr>
          <td className="text-center" colSpan={4} style={{ verticalAlign: "top", borderRight: '1px solid transparent'}}>
            <div className="cursor-pointer d-flex align-items-center">
              <div onClick={() => navigateSmeProduct(order.productVariant)}>
                <InfoProduct short={true} sku={order.productVariant?.sku} textTruncateSku={true} />
              </div>   
              <span onClick={() => onSetCombo(order.productVariant?.combo_items_origin)} style={{ cursor: "pointer" }} className="ml-4 text-primary">
                Combo
              </span> 
            </div>
          </td>
        </tr>
        {order.productVariant?.combo_items?.map((_combo, index) => {
            const comboListStatus = [{...(_combo?.combo_item || {})},...(_combo?.combo_item?.status_variants || [])]?.filter(item => !!item?.status)
            const returnItemsInCombo = returnItems?.filter(item => (item?.returnOrderItem?.order_item_id || item?.cancelOrderItem?.id) == order?.id && item?.sme_combo_variant_id == order.productVariant?.id)
            const listStatusCombo = comboListStatus?.filter(status => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))
            
            const currentStatusCombo = comboListStatus?.find(item => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(item?.id))
            const returnItem = returnItemsInCombo?.filter(item => comboListStatus?.map(stt => stt?.id)?.includes(item?.sme_variant_id))

            return (
            <>
            <tr>
              <td style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
                <div className="d-flex">
                <div style={{ backgroundColor: "#F7F7FA", width: 60, height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer",}} className="mr-6">
                  {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={_combo?.combo_item?.sme_catalog_product_variant_assets[0]?.asset_url} />}
                </div>
                <div>
                  <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(_combo?.combo_item)}>
                    <InfoProduct short={true} sku={_combo?.combo_item?.sku || _combo?.combo_item?.sku} textTruncateSku={true} />
                  </div>
                  <span className="text-secondary-custom fs-12">
                    {_combo?.combo_item?.attributes.length > 0 ? _combo?.combo_item?.name?.replaceAll(' - ', ' + ') : ''}
                  </span>
                </div>
                </div>
              </td>
              {(listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) ? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
                    <div className="d-flex align-items-center">
                      <span className="mr-4">Số lượng: {_.sum(returnItem?.map(item => item?.import_quantity))}</span>
                      <span className="ml-4">Số lượng nhập kho: {_.sum(returnItem?.map(item => item?.import_quantity))}</span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{currentStatusCombo?.unit || _combo?.combo_item?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" , borderRight: '1px solid transparent'}}>{currentStatusCombo?.product_status_name|| _combo?.combo_item?.product_status_name}</td>
                  <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent'}}>
                  {isImported ? `${_.sum(returnItem?.map(item => item?.import_quantity))} / ${_combo?.return_quantity || _combo?.purchased_quantity || 0}` : 0}
                  </td>
                  
                </>
              )}
            </tr>
            {(listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) && listStatusCombo?.map((item) => {
              const returnItem = returnItemsInCombo?.find(returnItem => returnItem?.sme_variant_id == item?.id)
              return (
              <tr>
                <td style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
                    <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
                      <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
                    </div>
                </td>
                <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{item?.unit || '--'}</td>
                <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{item?.product_status_name}</td>
                <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                {returnItem?.import_quantity ? returnItem?.import_quantity : 0}
                </td>
              </tr>
              )
            })}
            </>
          );
        })}

      </>
    );
  }, [order, isImported, returnItems]);

  const amountRow = useMemo(() => {
      const variant = order?.productVariant

      if(variant?.is_combo) {
        const row = (variant?.combo_items || []).map((_combo, index) => {
          const returnItemsInCombo = returnItems?.filter(item => (item?.cancelOrderItem?.id || item?.returnOrderItem?.order_item_id) == order?.id && item?.sme_combo_variant_id == order.productVariant?.id)

          const listStatusCombo = [{...(_combo?.combo_item || {})}, ...(_combo?.combo_item?.status_variants || [])]?.filter(item => !!item?.status)?.filter(status => returnItemsInCombo?.map(item => item?.sme_variant_id)?.includes(status?.id))
          return (listStatusCombo?.length == 1 ? !!(listStatusCombo[0]?.id != _combo?.combo_item?.id) : !!listStatusCombo?.length) ? listStatusCombo?.length + 1 : 1
        })
        return _.sum(row) + 2
      } else {
        return (listStatus?.length == 1 ? !!(listStatus[0]?.id !== variantView?.id) : !!listStatus?.length) ? listStatus?.length + 1 : 1
      }
  }, [order, listStatus, variantView, returnItems])

  return (
    <>
      <tr key={key} style={{borderBottom: "1px solid #D9D9D9", borderTop: "1px solid #D9D9D9",}}>
        {!isOrderManual && (
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
        
          {(!order?.productVariant?.is_combo || !order?.productVariant) && <>
            {buildVariant}
          </>}

      </tr>
      {(listStatus?.length == 1 ? !!(listStatus[0]?.id != variantView?.id) : listStatus?.length > 1) && isLinked && isImported && listStatus?.map(item => {
        const quantityImport = returnItemsWitoutCombo?.find(importItem => (importItem?.returnOrderItem?.order_item_id || importItem?.cancelOrderItem?.id) == order?.id && item?.id == importItem?.sme_variant_id)

        return (
        <tr>
          <td style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>
              <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
                <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
              </div>
          </td>
          <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{item?.unit || '--'}</td>
          <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid transparent' }}>{item?.product_status_name}</td>
          <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
            {quantityImport?.import_quantity ? quantityImport?.import_quantity : 0}
          </td>
        </tr>
        )
      })}
      {order?.productVariant?.is_combo ? (
        <>
          {buildVariantCombo}
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default memo(OrderReturnOrderRow);