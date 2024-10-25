import React, { memo, useMemo, useState } from "react";
import InfoProduct from "../../../../../components/InfoProduct";
import { useIntl } from "react-intl";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Field } from "formik";
import { InputVerticalWithIncrease } from "../../../../../_metronic/_partials/controls";
import SelectPicker from "rsuite/SelectPicker";
import { useFormikContext } from "formik";
import _ from "lodash";
const TooltipWrapper = ({ children, note }) => {
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
const openSellerProductDetails = (connector_channel_code,ref_store_id,refProductId,ref_variant_id) => {
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

const RowTableProcessOrder = ({ values, state, dataStore, key, item,updateState,isOrderManual}) => {
  console.log('values', values)
  const [isCopied, setIsCopied] = useState(false);
  const { setFieldValue, errors } = useFormikContext()

  const onCopyToClipBoard = async (text) => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };
  const { formatMessage } = useIntl();

  const [logoStore, nameStore] = useMemo(() => {
    const findedStore = dataStore?.sc_stores?.find(st => st?.id == item?.other?.store_id);
    const findedChannel = dataStore?.op_connector_channels?.find(cn => cn?.code == item?.other?.connector_channel_code);

    return [
      findedChannel?.logo_asset_url,
      findedStore?.name
    ]
  }, [item, dataStore]);

  const findNoteExist = state.dataNote.find((note) => note.key == item?.other?.id);
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

  const rowSpan = (product, index) => {
    const isMultiStatus = values[`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${index}-isMulti`]
    const listStatus = values[`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${index}-list-status`]
    if(product.sc_variant_product?.is_combo) {
      const row = (product?.sme_variant_product?.combo_items || []).map((_combo, indexCombo) => {
        const isMultiStatusCombo = values[`${product?.sme_variant_product?.id}-variant-combo-${_combo?.id}-${item?.other?.id}-isMulti`]
        return isMultiStatusCombo ? values[`${item?.other?.id}-variant-${_combo?.id}-combo-listStatus-${indexCombo}-${index}`]?.length + 1 : 1
      })

      return _.sum(row) + 2
    } else {
      if(isMultiStatus) {
        return listStatus?.length + 1
      } else {
        return 1
      }
    }
}

  return (
    <>
      <tr key={key}>
        <td colSpan="6" className="p-0">
          <div
            className="d-flex align-items-center justify-content-between"
            style={{ background: "#D9D9D9", padding: "8px" }}
          >
            <div className="d-flex">
              <span className="mx-4">
                <img src={logoStore} style={{ width: 20, height: 20, objectFit: "contain" }} alt=""/>
                <span className="ml-1">{nameStore}</span>
              </span>

              <div>
                <span onClick={() => window.open(`/orders/${item.other.id}`, "_blank")} style={{ cursor: "pointer" }}>
                  {`${formatMessage({defaultMessage: "Mã đơn hàng"})}: ${item?.other?.ref_order_id}`}
                </span>

                <OverlayTrigger
                  overlay={
                    <Tooltip title="#1234443241434" style={{ color: "red" }}>
                      <span>{isCopied ? `Copied!` : `Copy to clipboard`}</span>
                    </Tooltip>
                  }
                >
                  <span onClick={() => onCopyToClipBoard(item?.other?.ref_order_id)} style={{ cursor: "pointer" }} className="ml-2">
                    <i style={{ fontSize: 12 }} className="far fa-copy text-info"></i>
                  </span>
                </OverlayTrigger>
              </div>

              <div className="ml-4">
                <span onClick={() => window.open(`/orders/${item.other.id}`, "_blank")} style={{ cursor: "pointer" }}>
                  {`${formatMessage({defaultMessage: "Mã vận đơn",})}: ${item?.other?.tracking_number || "--"}`}
                </span>
                <OverlayTrigger
                  overlay={
                    <Tooltip title="#1234443241434" style={{ color: "red" }}>
                      <span>{isCopied ? `Copied!` : `Copy to clipboard`}</span>
                    </Tooltip>
                  }
                >
                  <span
                    onClick={() =>
                      onCopyToClipBoard(item?.other?.tracking_number)
                    }
                    style={{ cursor: "pointer" }}
                    className="ml-2"
                  >
                    <i style={{ fontSize: 12 }} className="far fa-copy text-info"></i>
                  </span>
                </OverlayTrigger>
              </div>

              {item?.other?.source == 'manual' && <div className='ml-4'>
                <OverlayTrigger
                  overlay={
                    <Tooltip title='Đơn thủ công'>
                      <span>
                        {formatMessage({ defaultMessage: 'Đơn thủ công' })}
                      </span>
                    </Tooltip>
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-primary bi bi-hand-index" viewBox="0 0 16 16">
                    <path d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637-.008.816.027.134.027.294.096.448.182.077.042.15.147.15.314V8a.5.5 0 1 0 1 0V6.435l.106-.01c.316-.024.584-.01.708.04.118.046.3.207.486.43.081.096.15.19.2.259V8.5a.5.5 0 0 0 1 0v-1h.342a1 1 0 0 1 .995 1.1l-.271 2.715a2.5 2.5 0 0 1-.317.991l-1.395 2.442a.5.5 0 0 1-.434.252H6.035a.5.5 0 0 1-.416-.223l-1.433-2.15a1.5 1.5 0 0 1-.243-.666l-.345-3.105a.5.5 0 0 1 .399-.546L5 8.11V9a.5.5 0 0 0 1 0V1.75A.75.75 0 0 1 6.75 1M8.5 4.466V1.75a1.75 1.75 0 1 0-3.5 0v5.34l-1.2.24a1.5 1.5 0 0 0-1.196 1.636l.345 3.106a2.5 2.5 0 0 0 .405 1.11l1.433 2.15A1.5 1.5 0 0 0 6.035 16h6.385a1.5 1.5 0 0 0 1.302-.756l1.395-2.441a3.5 3.5 0 0 0 .444-1.389l.271-2.715a2 2 0 0 0-1.99-2.199h-.581a5 5 0 0 0-.195-.248c-.191-.229-.51-.568-.88-.716-.364-.146-.846-.132-1.158-.108l-.132.012a1.26 1.26 0 0 0-.56-.642 2.6 2.6 0 0 0-.738-.288c-.31-.062-.739-.058-1.05-.046zm2.094 2.025" />
                  </svg>
                </OverlayTrigger>
              </div>}
            </div>

            <div className="mr-4 d-flex align-items-center">
              <span className="fs-14 mr-2">
                {formatMessage({ defaultMessage: "Ghi chú xử lý trả hàng" })}:
              </span>
              {findNoteExist?.note || findNoteExist?.links?.length || findNoteExist?.videosLink || findNoteExist?.urlVideo? (
                <TooltipWrapper
                  note={formatMessage({ defaultMessage: "Sửa ghi chú" })}
                >
                  <img
                    onClick={() => updateState({ modalEditNote: true, key: item?.other?.id })}
                    src={toAbsoluteUrl("/media/journal_check.png")}
                    style={{ cursor: "pointer", width: "16.88px", height: "18px", cursor: "pointer"}}
                    alt=""
                  />
                </TooltipWrapper>
              ) : (
                <TooltipWrapper note={formatMessage({ defaultMessage: "Thêm ghi chú" })}>
                  <i
                    style={{ width: "14px", cursor: "pointer" }}
                    role="button"
                    onClick={() => updateState({ modalNote: true, key: item?.other?.id })}
                    className="ml-2 text-dark far fa-edit"
                  ></i>
                </TooltipWrapper>
              )}

              <TooltipWrapper
                note={formatMessage({ defaultMessage: "Xóa đơn hàng" })}
              >
                <img
                  className="ml-6"
                  onClick={() =>
                    updateState({
                      modalConfirmDelete: true,
                      key: item?.other?.id,
                    })
                  }
                  alt=""
                  style={{ width: "14px", cursor: "pointer" }}
                  src={toAbsoluteUrl("/media/trash_solid.svg")}
                />
              </TooltipWrapper>
            </div>
          </div>
        </td>
      </tr>
      {item &&
        item?.products?.map((product, index) => {
          if (product.sc_variant_product?.is_combo) {
            return (
              <>
                {!isOrderManual && <tr style={{ width: "100%" }}>
                  <td rowSpan={rowSpan(product, index)} style={{ verticalAlign: "top",borderBottom: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9"}} className="p-0">
                    <div className="d-flex row w-100 m-0 p-1">
                      <div className="col-10" style={{ verticalAlign: "top", display: "flex", flexDirection: "row"}}>
                        <div
                          style={{ backgroundColor: "#F7F7FA", width: 60, height: 60, borderRadius: 8, overflow: "hidden", minWidth: 60, cursor: "pointer"}}
                          className="mr-6"
                        >
                          {<img src={product.sc_variant_product?.variant_image} style={{ width: 60, height: 60, objectFit: "contain"}} alt=""/>}
                        </div>
                        <div>
                          <div>
                            <InfoProduct
                              url={() => {
                                openSellerProductDetails(
                                  item.other?.connector_channel_code,
                                  item.other?.ref_store_id,
                                  product.sc_variant_product?.ref_product_id,
                                  product.sc_variant_product?.ref_variant_id,
                                );
                              }}
                              short={true}
                              sku={product.sc_variant_product?.variant_sku}
                              name={product.sc_variant_product?.product_name}
                              productOrder={true}
                            />
                          </div>
                          <span className="text-secondary-custom fs-12">
                            {_attributes(
                              product?.sme_variant_product?.attributes || ""
                            )}
                          </span>
                        </div>
                      </div>
                      <div
                        className="col-2 px-0"
                        style={{ wordBreak: "break-word" }}
                      >
                        <span style={{ fontSize: 12 }} className="mr-1">
                          x
                        </span>
                        {product?.sc_variant_product?.quantity_purchased}
                      </div>
                    </div>
                  </td>
                </tr>}
                <tr>
                  <td colSpan={5} style={{verticalAlign: "top", borderBottom: "1px solid #d9d9d9", borderTop: '1px solid #d9d9d9'}}>
                    <div className="d-flex">
                    <div><InfoProduct short={true} sku={product?.sme_variant_product?.sku} textTruncateSku={true}/></div>
                      <span style={{ cursor: "pointer" }} className="ml-4 text-primary" onClick={() => updateState({dataCombo: product?.sme_variant_product?.data_combo})}>
                        Combo
                      </span>     
                    </div>
                  </td>
                </tr>
                {product?.sme_variant_product?.combo_items?.map((__combo, indexCombo) => {
                  const isMultiStatusCombo = values[`${product?.sme_variant_product.id}-variant-combo-${__combo?.id}-${item?.other?.id}-isMulti`]
                  const isActive = values[`${item?.other?.id}-variant-${__combo?.id}-combo-status-${indexCombo}-${index}`]
                  const listStatusVariantCombo = values[`${item?.other?.id}-variant-${__combo?.id}-combo-listStatus-${indexCombo}-${index}`]
                  const comboQuantity = product?.sc_variant_product?.comboItems[indexCombo]?.purchased_quantity
                  const currentImportQuantity = _.sum(listStatusVariantCombo?.filter(stt => !!stt?.status)?.map((status) => values[`${item?.other?.id}-variant-${__combo?.id}-combo-quantity-${status?.id}-${indexCombo}-${index}`] || 0))

                  return (
                    <>
                      <tr>
                        <td className="d-flex" style={{verticalAlign: "top",borderBottom: "1px solid #d9d9d9",borderTop: "1px solid #d9d9d9"}}>
                          <div
                            style={{ backgroundColor: "#F7F7FA",width: 60,height: 60,borderRadius: 8,overflow: "hidden", minWidth: 60, cursor: "pointer"}}
                            onClick={(e) => {
                              e.preventDefault();
                            }}
                            className="mr-6"
                          >
                            {<img src={__combo?.sme_catalog_product_variant_assets?.[0]?.asset_url} style={{width: 60,height: 60,objectFit: "contain",}} alt=""/>}
                          </div>
                          <div>
                            <div style={{ wordWrap: "break-word" }} className="mt-1 mb-2">
                              <InfoProduct short={true} sku={__combo?.sku} textTruncateSku={true}/>
                            </div>
                            <span className="text-secondary-custom fs-12">
                              {_attributes(__combo?.attributes || "")}
                            </span>
                          </div>
                        </td>
                        {(isMultiStatusCombo && isActive) ? (
                          <>
                          <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9', borderRight: "1px solid #d9d9d9"}}>
                            <div className="d-flex align-items-center">
                              <span className="mr-4">Số lượng cần nhập: {comboQuantity}</span>
                              <span className="ml-4">
                                Số lượng nhập kho: {
                                  currentImportQuantity
                                }
                                <div style={{color: '#F5222D'}}>
                                  {errors[`${item?.other?.id}-variant-multi-combo-${product?.sme_variant_product.id}-${__combo?.id}-quantity-import`]}
                                </div>
                                </span>
                            </div>
                          </td>
                        </>
                        ) : (
                          <>
                            <td style={{verticalAlign: "center",textAlign: "center", borderBottom: "1px solid #d9d9d9"}}>{__combo?.unit || '--'}</td>
                            <td className="text-center" style={{verticalAlign: "center", borderBottom: "1px solid #d9d9d9"}}>
                            <SelectPicker
                              data={[...(listStatusVariantCombo?.map(status => ({
                                label: status?.product_status_name,
                                value: status?.id
                              })) || [])]}
                              onChange={(value) => {
                              if(value) {
                                setFieldValue(`current-combo-${item?.other?.id}-variant-status-${__combo?.id}`, value)
                              }
                              }}
                              value={values[`current-combo-${item?.other?.id}-variant-status-${__combo?.id}`] || {}}
                              isClearable={false}
                              className="removeBorderRsuite"
                              searchable={false}
                              style={{ width: 'max-content' }}
                              placeholder="Mới"
                            />
                            </td>
                            <td className="text-center" style={{ verticalAlign: "center",borderRight: "1px solid #d9d9d9", borderBottom: "1px solid #d9d9d9"}}>
                              <Field
                                name={`${item.other.id}-variant-${__combo?.id}-combo-quantity-${indexCombo}-${index}`}
                                component={InputVerticalWithIncrease}
                                label={""}
                                required={false}
                                disabled={values.import_form_type == 1}
                                customFeedbackLabel={" "}
                                cols={["", "col-12"]}
                                countChar
                                slash={true}
                                slashValue={comboQuantity}
                                maxChar={"255"}
                                rows={4}
                              />
                            </td>
                          </>
                        )}
                        <td style={{verticalAlign: "center", textAlign: "center", borderBottom: "1px solid #d9d9d9", borderTop: '1px solid #d9d9d9'}}  className="pt-4 pb-1">
                        {isActive && 
                        <span 
                          onClick={() => {
                            setFieldValue(`${product?.sme_variant_product.id}-variant-combo-${__combo?.id}-${item?.other?.id}-isMulti`, !isMultiStatusCombo)
                          }}
                          style={{cursor: 'pointer'}} className="text-primary">
                            {isMultiStatusCombo ? 'Một trạng thái' : 'Nhiều trạng thái'}
                          </span>}
                      </td>
                      </tr>

                      {isMultiStatusCombo && listStatusVariantCombo?.map((status) => {
                        return (
                          <tr>
                            <td className="d-flex" style={{ verticalAlign: "top" }}>
                              <div className="mt-1 mb-2 cursor-pointer">
                                <InfoProduct short={true} sku={status?.sku} textTruncateSku={true}/>
                              </div>
                              
                            </td>
                            <td className="text-center" style={{ verticalAlign: "top" }}>{status?.unit || '--'}</td>
                            <td className="text-center" style={{ verticalAlign: "top" }}>{status?.product_status_name}</td>
                            <td className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                            <Field 
                              name={`${item?.other?.id}-variant-${__combo?.id}-combo-quantity-${status?.id}-${indexCombo}-${index}`}
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
                  )
                })}
              </>
            );
          }

          const isMultiStatus = values[`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${index}-isMulti`]
          const listStatus = values[`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${index}-list-status`]
          const amountImport = listStatus?.map(status => values[`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${status?.id}-${index}-status-quantity`])
          return (
            <>
              <tr style={{ borderBottom: "1px solid #d9d9d9", borderTop: "1px solid #d9d9d9",}}>
              {!isOrderManual && 
              <td rowSpan={rowSpan(product, index)} style={{verticalAlign: "top",borderBottom: "1px solid #d9d9d9", borderTop: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9"}} className="p-0">
                <div className="d-flex row w-100 m-0 p-1">
                  <div className="col-10" style={{ verticalAlign: "top", display: "flex", flexDirection: "row",}}>
                    <div
                      style={{backgroundColor: "#F7F7FA", width: 60,  height: 60,  borderRadius: 8, overflow: "hidden", minWidth: 60,  cursor: "pointer" }}
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      className="mr-6"
                    >
                      { <img  src={product.sc_variant_product?.variant_image} style={{width: 60, height: 60, objectFit: "contain"}} alt=""/>}
                    </div>
                    <div>
                      <div>
                        <InfoProduct
                          short={true}
                          url={() => {
                            openSellerProductDetails(
                              item.other?.connector_channel_code,
                              item.other?.ref_store_id,
                              product.sc_variant_product?.ref_product_id,
                              product.sc_variant_product?.ref_variant_id,
                            );
                          }}
                          sku={product.sc_variant_product?.variant_sku}
                          name={product.sc_variant_product?.product_name}
                          productOrder={true}
                        />
                      </div>
                      <span className="text-secondary-custom fs-12">
                        {_attributes(product?.sme_variant_product?.attributes || "")}
                      </span>
                    </div>
                  </div>
                  <div className="col-2 px-0" style={{ wordBreak: "break-word" }}>
                    <span style={{ fontSize: 12 }} className="mr-1">
                      x
                    </span>
                    {product.sc_variant_product?.quantity_purchased}
                  </div>
                </div>
              </td>}
              <td style={{verticalAlign: "top"}} className="p-0">
                <div className="d-flex row w-100 m-0 pt-3">
                  <div className="col-11" style={{verticalAlign: "top",display: "flex",flexDirection: "row"}}>
                    <div className="mr-4" style={{backgroundColor: "#F7F7FA",width: 60,height: 60, borderRadius: 8,overflow: "hidden", minWidth: 60,cursor: "pointer",}}>
                      {<img src={product?.sme_variant_product?.sme_catalog_product_variant_assets?.[0]?.asset_url} style={{width: 60,height: 60, objectFit: "contain"}} alt=""/>}
                    </div>
                    <div>
                      <div className="w-100">
                        <InfoProduct
                          short={true}
                          sku={product.sme_variant_product.sku}
                          productOrder={true}
                        />
                      </div>
                      <span className="text-secondary-custom fs-12">
                        {_attributes(product?.sme_variant_product?.attributes || "")}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              {isMultiStatus ? (
                <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9"}}>
                <div className="d-flex align-items-center">
                  <span className="mr-4">Số lượng cần nhập: {product?.sc_variant_product.quantity_purchased}</span>
                  <span className="ml-4">
                    Số lượng nhập kho: {_.sum(amountImport)}
                    <div style={{color: '#F5222D'}}>
                      {errors[`${item?.other?.id}-variant-multi-${product?.sme_variant_product.id}-import-quantity`]}
                    </div>
                  </span>
                </div>
              </td>
              ) : (
                <>
                <td style={{verticalAlign: "center",textAlign: "center"}} className="pt-4 pb-1">{product?.sme_variant_product?.unit || '--'}</td>
                <td style={{verticalAlign: "center", textAlign: "center"}} className="pt-4 pb-1">
                  <SelectPicker
                      data={[...(listStatus?.map(status => ({
                        label: status?.product_status_name,
                        value: status?.id
                      })) || [])]}
                      onChange={(value) => {
                      if(value) {
                        setFieldValue(`${item.other.id}-current-variant-status-${product?.sme_variant_product?.id}`, value)
                      }
                      }}
                      value={values[`${item.other.id}-current-variant-status-${product?.sme_variant_product?.id}`] || {}}
                      isClearable={false}
                      className="removeBorderRsuite"
                      searchable={false}
                      style={{ width: 'max-content' }}
                      placeholder="Mới"
                    />
                </td>
                <td style={{ verticalAlign: "center", textAlign: "center"}} className="pt-4 pb-1">
                <Field
                  name={`${item.other.id}-variant-${product.sme_variant_product.id}-${index}-quantity`}
                  component={InputVerticalWithIncrease}
                  label={""}
                  disabled={values.import_form_type == 1}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["", "col-12"]}
                  countChar
                  maxChar={"255"}
                  slash={true}
                  slashValue={product?.sc_variant_product.quantity_purchased}
                  rows={4}
                />
                </td>
                </>
              )}

            <td
               style={{verticalAlign: "center", textAlign: "center", borderRight: "1px solid #d9d9d9"}} className="cursor-pointer text-primary pt-4 pb-1">
                <span onClick={() => setFieldValue(`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${index}-isMulti`, !isMultiStatus)}>
                {isMultiStatus ? 'Một trạng thái' : 'Nhiều trạng thái'}
                </span>
              </td>

            </tr>

            {isMultiStatus && listStatus?.map(status => (
              <tr>
                <td className="d-flex" style={{ verticalAlign: "center" }}>
                    <div className="mt-1 mb-2 cursor-pointer">
                      <InfoProduct short={true} sku={status?.sku} textTruncateSku={true}/>
                    </div>
                </td>
                <td className="text-center" style={{ verticalAlign: "center" }}>{status?.unit || '--'}</td>
                <td className="text-center" style={{ verticalAlign: "center" }}>{status?.product_status_name}</td>
                <td className="text-center" style={{ verticalAlign: "center", borderRight: '1px solid #d9d9d9' }}>
                  <Field
                    name={`${item?.other?.id}-variant-${product?.sme_variant_product?.id}-${status?.id}-${index}-status-quantity`}
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
            ))}
            </>
          );
        })}
    </>
  );
};

export default memo(RowTableProcessOrder);
