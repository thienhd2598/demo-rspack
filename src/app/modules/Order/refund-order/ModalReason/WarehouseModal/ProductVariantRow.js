import React, { memo, useCallback, useMemo, useState } from "react";
import { toAbsoluteUrl } from "../../../../../../_metronic/_helpers";
import { InputVerticalWithIncrease } from "../../../../../../_metronic/_partials/controls";
import { Field } from "formik";
import ModalCombo from "../../../../Products/products-list/dialog/ModalCombo";
import InfoProduct from "../../../../../../components/InfoProduct";
import HoverImage from "../../../../../../components/HoverImage";
import { useFormikContext } from "formik";
import ModalVariantDialog from "./ModalVariantDialog";
import { useIntl } from "react-intl";
import _ from "lodash";
import SelectPicker from "rsuite/SelectPicker";
const ProductVariantRow = ({ keyVariant,getProductVariant,setGetProductVariant, order,removeProductVariant}) => {
  const { values,errors, setFieldValue} = useFormikContext()
  const { formatMessage } = useIntl()
  const [dataCombo, setDataCombo] = useState(null);
  const [scCurrentVariantSku, setScCurrentVariantSku] = useState(null);
  const [currentOrderItemId, setCurrentOrderItemId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  console.log('values', values)
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
  const variantView = !order?.sme_variant_id ? order.getProductVariantByIndex?._item : order?.productVariant
  console.log('variantView', variantView)
  const isMultiStatus = values[`variant-${variantView?.id}-${keyVariant}-isMultiStatus`]
  const isActive = values[`variant-${variantView?.id}-${keyVariant}-status`]

  const amountImportCombo = (list, idCombo, index, type) => {
    if(type == 'linked') {
      return _.sum(list?.map((item) => {
        return values[`variant-${idCombo}-${item?.id}-${variantView?.id}-${keyVariant}-${index}-status-quantity`] || 0
      }))
    } else {
      return _.sum(list?.map((item) => {
        return values[`variant-${idCombo}-${item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-status-quantity`] || 0
      }))
    }
    
}

  const buildVariantComboElse = useMemo(() => {
    return (
      <>
        <tr>
          <td className="text-center" colSpan={4} style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9'}}>
            <div className="cursor-pointer d-flex align-items-center">
              <div onClick={() => navigateSmeProduct(order.getProductVariantByIndex?._item)}>
                <InfoProduct short={true} sku={order.getProductVariantByIndex?._item?.sku} textTruncateSku={true} />
              </div>   
              <span style={{ cursor: "pointer" }} onClick={() => setDataCombo(order.getProductVariantByIndex?._item?.combo_items)} className="ml-4 text-primary">
                Combo
              </span> 
            </div>
          </td>
          <td className="text-center" colSpan={1}>
            <span onClick={() => removeProductVariant(keyVariant)} style={{ cursor: "pointer" }} className="ml-4 text-primary">
              {formatMessage({ defaultMessage: 'Xóa' })}
            </span>
          </td>
        </tr>
        {order.getProductVariantByIndex?._item?.combo_items?.map((_combo, index) => {
          const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-isMultiStatus`]
          const isActiveCombo = values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-status`]
          return (
            <>
            <tr>
              <td style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                <div className="d-flex">
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
                </div>
              </td>
              {(isMultiStatusCombo && isActiveCombo) ? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                    <div className="d-flex align-items-center">
                      <span className="mr-4">{formatMessage({defaultMessage: 'Số lượng cần nhập'})}: {_combo?.quantity * order?.quantityReturn}</span>
                      <span className="ml-4">
                        {formatMessage({defaultMessage: 'Số lượng nhập kho'})}: {amountImportCombo(values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-list_status`], _combo?.combo_item?.id, index)}
                        <div style={{color: '#F5222D'}}>
                          {errors[`variant-multi-combo-${order?.getProductVariantByIndex.keyVariant}-${_combo?.combo_item?.id}-import-quantity`]}
                        </div>
                      </span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center" style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>{_combo?.combo_item?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" , borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9'}}>
                  <SelectPicker
                      data={[...(values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-list_status`]?.map(status => ({
                          label: status?.product_status_name,
                          value: status?.id
                        })) || [])
                      ]}
                      onChange={(value) => {
                        if(value) {
                          setFieldValue(`current-${order?.id}-combo-variant-status-${_combo?.combo_item?.id}`, value)
                         }
                      }}
                      isClearable={false}
                      className="removeBorderRsuite"
                      searchable={false}
                      style={{ width: 'max-content' }}
                      placeholder="Mới"
                    />
                  </td>
                  <td className="text-center" style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                    <Field
                      name={`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-quantity`}
                      component={InputVerticalWithIncrease}
                      label={""}
                      required={false}
                      customFeedbackLabel={" "}
                      cols={["", "col-12"]}
                      countChar
                      slashValue={_combo?.quantity * order?.quantityReturn}
                      slash={true}
                      setValueZero={true}
                      maxChar={"255"}
                      rows={4}
                    />
                  </td>
                  
                </>
              )}
              <td className="text-center" style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9' }}>
                {isActiveCombo && 
                <span onClick={() => setFieldValue(`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-isMultiStatus`, !isMultiStatusCombo)}
                  style={{cursor: 'pointer'}} className="text-primary">
                    {(isMultiStatusCombo && isActiveCombo) ? 'Một trạng thái' : 'Nhiều trạng thái'}
                  </span>}
              </td>
            </tr>
            {isMultiStatusCombo && isActiveCombo && values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-list_status`]?.map((item) => {
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
                <Field
                  name={`variant-${_combo?.combo_item?.id}-${item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-status-quantity`}
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
              )
            })}
            </>
          );
        })}
      </>
    );
  }, [order, values, keyVariant,errors, amountImportCombo]);

  const buildVariant = useMemo(() => {
    // Case không có liên kết
    if (!order?.sme_variant_id) {
      if (order.getProductVariantByIndex?._item) {
        if (!order.getProductVariantByIndex?._item.is_combo) {
          const variantAsset = order.getProductVariantByIndex?._item?.sme_catalog_product_variant_assets?.[0];
          return (
            <>
              <td className="d-flex" style={{ verticalAlign: "top" }}>
                <div style={{ backgroundColor: "#F7F7FA",width: 60, height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer",}} className="mr-6">
                  {<HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={variantAsset?.asset_url} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(order.getProductVariantByIndex?._item)}>
                      <InfoProduct short={true} sku={order.getProductVariantByIndex?._item?.sku} textTruncateSku={true}/>
                    </div>
                    <span onClick={() => removeProductVariant(keyVariant)} style={{ cursor: "pointer" }} className="ml-4 text-primary">
                      {formatMessage({ defaultMessage: 'Xóa' })}
                    </span>
                  </div>
                  <span className="text-secondary-custom">
                    {_attributes(order.getProductVariantByIndex?._item?.attributes || '')}
                  </span>
                </div>
              </td>
              {(isMultiStatus && isActive )? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                    <div className="d-flex align-items-center">
                      <span className="mr-4">Số lượng cần nhập: {order?.quantityReturn}</span>
                      <span className="ml-4">
                        Số lượng nhập kho: {_.sum(values[`variant-${variantView?.id}-${order.getProductVariantByIndex.keyVariant}-list_status`]?.map(item => values[`variant-${item?.id}-${keyVariant}-status-quantity`]))}
                        <div style={{color: '#F5222D'}}>
                          {errors[`variant-multi-${order.getProductVariantByIndex.keyVariant}-import-quantity`]}
                        </div>
                      </span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center" style={{ verticalAlign: "top" }}>{order?.getProductVariantByIndex?._item?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" }}>
                  <SelectPicker
                      data={(values[`variant-${variantView?.id}-${order.getProductVariantByIndex.keyVariant}-list_status`]?.map(status => ({ label: status?.product_status_name,value: status?.id})) || [])}
                      onChange={(value) => {
                       setFieldValue(`current-status-${order.getProductVariantByIndex.keyVariant}-variant-${variantView?.id}`, value)
                      }}
                      isClearable={false}
                      className="removeBorderRsuite"
                      searchable={false}
                      style={{ width: 'max-content' }}
                      placeholder="Mới"
                    />
                  </td>
                  <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                    <Field
                      name={`variant-${order.getProductVariantByIndex?._item?.id}-${order.getProductVariantByIndex.keyVariant}-quantity`}
                      component={InputVerticalWithIncrease}
                      label={""}
                      required={false}
                      customFeedbackLabel={" "}
                      cols={["", "col-12"]}
                      setValueZero={true}
                      countChar
                      slash={true}
                      slashValue={order?.quantityReturn}
                      maxChar={"255"}
                      rows={4}
                    />
                  </td>
                  
                </>
              )}
              
              <td rowspan={(isMultiStatus && isActive) ? values[`variant-${order?.getProductVariantByIndex?._item?.id}-${keyVariant}-list_status`]?.length + 1 : 1} className="text-center" style={{ verticalAlign: "top" }}>
                {isActive && <span onClick={() => setFieldValue(`variant-${order?.getProductVariantByIndex?._item?.id}-${keyVariant}-isMultiStatus`, !isMultiStatus)} style={{cursor: 'pointer'}} className="text-primary">
                  {isMultiStatus ? 'Một trạng thái' : 'Nhiều trạng thái'}
                </span>}
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
            <div className="text-secondary-custom fs-12" style={{ width: "120%" }}>
              <span onClick={() => {
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
    const variantAsset = order?.productVariant?.sme_catalog_product_variant_assets?.[0];
    return (
      <>
        <td style={{ verticalAlign: "top" }}>
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
        {(isMultiStatus && isActive) ? (
            <>
              <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                <div className="d-flex align-items-center">
                  <span className="mr-4">Số lượng cần nhập: {order?.quantityReturn}</span>
                  <span className="ml-4">
                    Số lượng nhập kho: {_.sum(values[`variant-${variantView?.id}-${keyVariant}-list_status`]?.map(item => values[`variant-${item?.id}-${order?.getProductVariantByIndex?.keyVariant || keyVariant}-status-quantity`]))}
                    <div style={{color: '#F5222D'}}>
                          {errors[`variant-multi-${variantView?.id}-import-quantity`]}
                      </div>
                  </span>
                </div>
              </td>
            </>
          ) : (
            <>
                <td className="text-center" style={{ verticalAlign: "top" }}>{order?.productVariant?.unit || '--'}</td>
              <td className="text-center" style={{ verticalAlign: "top" }}>
                <SelectPicker
                  data={[...(values[`variant-${variantView?.id}-${keyVariant}-list_status`] || [])?.map(status => ({
                    label: status?.product_status_name,
                    value: status?.id
                  }))]}
      
                  onChange={(value) => {
                   if(value) {
                    setFieldValue(`current-${keyVariant}-status-variant-${variantView?.id}`, value)
                   }
                  }}
                  isClearable={false}
                  className="removeBorderRsuite"
                  searchable={false}
                  style={{ width: 'max-content' }}
                  placeholder="Mới"
                />
              </td>
              <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                <Field
                  name={`variant-${order?.productVariant?.id}-${keyVariant}-quantity`}
                  component={InputVerticalWithIncrease}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  slash={true}
                  cols={["", "col-12"]}
                  setValueZero={true}
                  slashValue={order?.quantityReturn}
                  countChar
                  maxChar={"255"}
                  rows={4}
                />
              </td>
            </>
          )}
       
          <td rowspan={(isMultiStatus && isActive) ? values[`variant-${order?.productVariant?.id}-${keyVariant}-list_status`]?.length + 1 : 1} className="text-center" style={{ verticalAlign: "top" }}>
            {isActive && <span onClick={() => setFieldValue(`variant-${order?.productVariant?.id}-${keyVariant}-isMultiStatus`, !isMultiStatus)} style={{cursor: 'pointer'}} className="text-primary">
              {isMultiStatus ? 'Một trạng thái' : 'Nhiều trạng thái'}
            </span>}
          </td>
      </>
    );
  }, [order, isMultiStatus,isActive, errors, amountImportCombo]);

  const buildVariantCombo = useMemo(() => {
    return (
      <>
      <tr>
          <td className="text-center" colSpan={4} style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9'}}>
            <div className="cursor-pointer d-flex align-items-center">
              <div onClick={() => navigateSmeProduct(order?.productVariant)}>
                <InfoProduct short={true} sku={order?.productVariant?.sku} textTruncateSku={true} />
              </div>   
              <span style={{ cursor: "pointer" }} onClick={() => setDataCombo(order?.productVariant?.combo_items_origin)} className="ml-4 text-primary">
                Combo
              </span> 
            </div>
          </td>
          <td className="text-center" colSpan={1}>
            
          </td>
        </tr>
        {variantView?.combo_items?.map((_combo, index) => {
          const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-isMultiStatus`]
          const isActive = values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-status`]
          return (
            <>
            <tr>
              <td style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9' }}>
                <div className="d-flex">
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
                </div>
              </td>
              {(isMultiStatusCombo && isActive) ? (
                <>
                  <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                    <div className="d-flex align-items-center">
                      <span className="mr-4">Số lượng cần nhập: {(_combo?.purchased_quantity / order?.quantity_purchased) * order?.quantityReturn}</span>
                      <span className="ml-4">
                        Số lượng nhập kho: {amountImportCombo(values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-list_status`], _combo?.combo_item?.id, index, 'linked')}
                        <div style={{color: '#F5222D'}}>
                          {errors[`variant-multi-combo-${variantView?.id}-${_combo?.combo_item?.id}-import-quantity`]}
                        </div>
                        </span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center" style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>{_combo?.combo_item?.unit || '--'}</td>
                  <td className="text-center" style={{ verticalAlign: "top" , borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9'}}>
                  <SelectPicker
                    data={[...(values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-list_status`]?.map(status => ({
                      label: status?.product_status_name,
                      value: status?.id
                    })) || [])]}
                    onChange={(value) => {
                     if(value) {
                      setFieldValue(`current-${order?.id}-combo-variant-status-${_combo?.combo_item?.id}`, value)
                     }
                    }}
                    isClearable={false}
                    className="removeBorderRsuite"
                    searchable={false}
                    style={{ width: 'max-content' }}
                    placeholder="Mới"
                  />
                  </td>
                  <td className="text-center" style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                    <Field
                      name={`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-quantity`}
                      component={InputVerticalWithIncrease}
                      label={""}
                      required={false}
                      customFeedbackLabel={" "}
                      cols={["", "col-12"]}
                      countChar 
                      slashValue={(_combo?.purchased_quantity / order?.quantity_purchased) * order?.quantityReturn}
                      slash={true}
                      setValueZero={true}
                      maxChar={"255"}
                      rows={4}
                    />
                  </td>
                  
                </>
              )}
              <td className="text-center" style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9' }}>
              {isActive && <span 
                onClick={() => 
                  setFieldValue(`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-isMultiStatus`, !isMultiStatusCombo)}
                  style={{cursor: 'pointer'}} className="text-primary">
                  {isMultiStatusCombo ? 'Một trạng thái' : 'Nhiều trạng thái'}
                </span>}
              </td>
            </tr>
            {isMultiStatusCombo && values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-list_status`]?.map((item) => {
              return (
                <tr>
              <td style={{ verticalAlign: "top" }}>
                  <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
                    <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
                  </div>
              </td>
              <td className="text-center" style={{ verticalAlign: "top" }}>{item?.unit || '--'}</td>
              <td className="text-center" style={{ verticalAlign: "top" }}>{item?.product_status_name}</td>
              <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                <Field
                  name={`variant-${_combo?.combo_item?.id}-${item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-status-quantity`}
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
              )
            })}
            </>
          );
        })}

      </>
    );
  }, [order, values,errors, keyVariant,isMultiStatus, variantView, amountImportCombo]);

  const amountRow = useMemo(() => {
    if(!order?.sme_variant_id) {
      const variant = order.getProductVariantByIndex?._item
      if(variant?.is_combo) {
        const row = (variant?.combo_items || []).map((_combo, index) => {
          const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-isMultiStatus`]
          return isMultiStatusCombo ? values[`variant-${_combo?.combo_item?.id}-${order?.getProductVariantByIndex.keyVariant}-${keyVariant}-${index}-list_status`]?.length + 1 : 1
        })

        return _.sum(row) + 2
      } else {
        return values[`variant-${variant?.id}-${order.getProductVariantByIndex?.keyVariant}-isMultiStatus`] ? values[`variant-${variantView?.id}-${keyVariant}-list_status`]?.length + 1 : 1
      }
    } else {
      const variant = order?.productVariant

      if(variant?.is_combo) {
        const row = (variant?.combo_items || []).map((_combo, index) => {
          const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${variant?.id}-${keyVariant}-${index}-isMultiStatus`]
          return isMultiStatusCombo ? values[`variant-${_combo?.combo_item?.id}-${order?.productVariant.id}-${keyVariant}-${index}-list_status`]?.length + 1 : 1
        })
        return _.sum(row) + 2
      } else {
        const isMultiStatus = values[`variant-${variant?.id}-${keyVariant}-isMultiStatus`]
        return isMultiStatus ? values[`variant-${variantView?.id}-${keyVariant}-list_status`]?.length + 1 : 1
      }
    }
  }, [order, values, keyVariant])
  return (
    <>
      <tr key={`product-variant-return-order-${order?.id}`} style={{borderBottom: "1px solid #D9D9D9", borderTop: "1px solid #D9D9D9",}}>
        <td rowSpan={`${amountRow}`}
          style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9" }}>
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
      {isMultiStatus && isActive && values[`variant-${variantView?.id}-${keyVariant}-list_status`]?.map(item => (
        <tr>
        <td className="d-flex" style={{ verticalAlign: "top" }}>
            <div className="mt-1 mb-2 cursor-pointer" onClick={() => navigateSmeProduct(item)}>
              <InfoProduct short={true} sku={item?.sku} textTruncateSku={true}/>
            </div>
        </td>
        <td className="text-center" style={{ verticalAlign: "top" }}>{item?.unit || '--'}</td>
        <td className="text-center" style={{ verticalAlign: "top" }}>{item?.product_status_name}</td>
        <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
          <Field
            name={`variant-${item?.id}-${order?.getProductVariantByIndex?.keyVariant || keyVariant}-status-quantity`}
            component={InputVerticalWithIncrease}
            label={""}
            required={false}
            customFeedbackLabel={" "}
            cols={["", "col-12"]}
            countChar
            slashValue={order?.quantityReturn}
            maxChar={"255"}
            rows={4}
          />
        </td>
      </tr>
      ))}
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