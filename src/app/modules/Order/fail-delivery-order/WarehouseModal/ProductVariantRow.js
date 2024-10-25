import React, { memo, useCallback, useMemo, useState } from 'react';
import { Field } from 'formik';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { InputVerticalWithIncrease } from '../../../../../_metronic/_partials/controls';
import InfoProduct from '../../../../../components/InfoProduct';
import { useFormikContext } from 'formik';
import * as Yup from "yup";
import { useIntl } from "react-intl";
import _ from 'lodash';
import SelectPicker from 'rsuite/SelectPicker';
const ProductVariantRow = ({ orderItem, setDataCombo, onSetVariant, orderItemVariant, setOrderItemVariant, order }) => {
    const { formatMessage } = useIntl()
    
    const { values, setFieldValue, errors, } = useFormikContext()
    const remoteOrderItemVariant = () => {
        const newOrderItemVariant = [...orderItemVariant].filter(order => order?.orderItemIdMapped != orderItem?.productVariant?.orderItemIdMapped)
        setOrderItemVariant(newOrderItemVariant)
    }
    const isMultiStatus = values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-isMulti`]
    const isActive = values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-status`]

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
        }, []
    );

    const elementRemoteVariant = useMemo(() => {
            const isMappedVariant = orderItemVariant?.some(variant => variant?.orderItemIdMapped === orderItem?.id);

            return !!isMappedVariant && <span className='text-secondary-custom fs-12 ml-3'
                onClick={() => remoteOrderItemVariant()}
                style={{ color: "#ff5629", cursor: 'pointer' }}>
                <span>{formatMessage({ defaultMessage: 'Xóa' })}</span>
            </span>
    }, [orderItemVariant])

    const _attributes = (item_attributes) => {

        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
            for (let index = 0; index < item_attributes.length; index++) {
                const element = item_attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }

    const buildVariant = useMemo(() => {
            const isConnected = orderItemVariant?.find(item => item?.id == orderItem?.sme_variant_id || item?.orderItemIdMapped === orderItem?.id);
            // Case không có liên kết
            if (!isConnected)
                return <td>
                    <div className='text-secondary-custom fs-12'
                        onClick={() => { onSetVariant(orderItem?.variant_sku, orderItem?.id) }}
                        style={{ width: '120%', color: "#ff5629", cursor: 'pointer' }}>
                        <span>{formatMessage({ defaultMessage: 'Chọn hàng hóa kho' })}</span>
                    </div>
                </td>

            // Case có liên kết
            const variantAsset = orderItem?.productVariant?.sme_catalog_product_variant_assets?.[0];
            return (
                <>
                    <td className='d-flex' style={{ verticalAlign: "top" }}>
                        <div style={{ backgroundColor: "#F7F7FA",width: 60, height: 60, borderRadius: 8, overflow: "hidden",  minWidth: 60, cursor: "pointer"}}

                            className="mr-6"
                        >
                            {<img src={variantAsset?.asset_url} style={{width: 60,height: 60,objectFit: "contain" }} alt=""/>}
                        </div>
                        <div>
                            <div style={{ display: "flex",alignItems: "center",}} className="mb-2">
                                <div className="d-flex align-items-center">
                                    <div className='cursor-pointer' onClick={() => navigateSmeProduct(orderItem?.productVariant)}>
                                        <InfoProduct
                                            short={true}
                                            sku={orderItem?.productVariant?.sku}
                                        />
                                    </div>
                                    {elementRemoteVariant}
                                </div>
                            </div>
                            {orderItem?.productVariant?.attributes?.length > 0 && (
                                <div className='d-flex align-items-center fs-12 text-secondary-custom'>
                                    {_attributes(orderItem?.productVariant?.attributes)}
                                </div>
                            )}
                        </div>
                    </td>
                        {(isMultiStatus && isActive ) ? (
                            <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9' }}>
                            <div className="d-flex align-items-center">
                            <span className="mr-4">Số lượng cần nhập: {orderItem?.quantity_purchased}</span>
                            <span className="ml-4">
                                Số lượng nhập kho: {_.sum(values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-list-status`]?.map(item => values[`variant-${item?.id}-${orderItem.id}-quantity-status`]))}
                                <div style={{color: '#F5222D'}}>
                                    {errors[`variant-multi-${orderItem.id}-quantity-import`]}
                                </div>
                            </span>
                            </div>
                        </td>
                        ) : (
                        <>
                        <td className='text-center' style={{ verticalAlign: "top" }}>
                            {orderItem?.productVariant?.unit || '--'}
                        </td>
                        <td className='text-center' style={{ verticalAlign: "top" }}>
                            <SelectPicker
                                data={values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-list-status`]?.map(status => ({label: status?.product_status_name, value: status?.id})) || []}
                                onChange={(value) => {
                                    setFieldValue(`inIsMulti-${orderItem?.id}-current-status-${orderItem?.productVariant?.id}`, value)
                                }}
                                isClearable={false}
                                searchable={false}
                                style={{ width: 'max-content' }}
                                placeholder="Mới"
                            />
                        </td>
                    
                        <td className='text-center' style={{ verticalAlign: "top" }}>
                            <Field 
                                name={`variant-${orderItem?.productVariant?.id}-${orderItem.id}-quantity`}
                                component={InputVerticalWithIncrease}
                                label={''}
                                required={false}
                                customFeedbackLabel={' '}
                                cols={['', 'col-12']}
                                slash={true}
                                setValueZero={true}
                                slashValue={orderItem?.quantity_purchased}
                                countChar
                                maxChar={'255'}
                                rows={4}
                            />
                        </td>
                       
                        </>
                    )}
                     <td rowspan={(isMultiStatus && isActive) ? orderItem?.productVariant?.status_variants?.filter(item => !!item?.status)?.length + 1 : 1} className='text-center' style={{ verticalAlign: "top" }}>
                        {isActive && <span 
                        onClick={() => {
                            setFieldValue(`variant-${orderItem?.productVariant?.id}-${orderItem.id}-isMulti`, !isMultiStatus)
                        }} 
                        style={{cursor: 'pointer'}} className="text-primary">
                            {isMultiStatus ? 'Một trạng thái' : 'Nhiều trạng thái'}
                        </span>}
                    </td>
                    
                </>
            )
        }, [orderItem, orderItemVariant, onSetVariant, errors, isMultiStatus, values,isActive]);

    const amountImportCombo = (list) => {
        return _.sum(list?.map((item) => {
            return values[`variant-${item?.id}-${orderItem.id}-quantity-status`] || 0
          }))
    }

    const buildVariantCombo = useMemo(() => {
        return (
            <>
            <tr>
                <td className="text-center" colSpan={4} style={{ verticalAlign: "top",borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9'}}>
                    <div className="cursor-pointer d-flex align-items-center">
                    <div onClick={() => navigateSmeProduct(orderItem.productVariant)}>
                        <InfoProduct short={true} sku={orderItem.productVariant?.sku} textTruncateSku={true} />
                    </div>   
                    <span style={{ cursor: "pointer" }} onClick={() => setDataCombo(orderItem.productVariant?.combo_items_origin)} className="ml-4 text-primary">
                        Combo
                    </span> 
                    </div>
                </td>
                <td className="text-center" colSpan={1}>
                {elementRemoteVariant}
                </td>

                </tr>
                {orderItem?.productVariant?.combo_items?.map((_combo, index) => {
                    const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${orderItem?.id}-isMulti`]
                    const isActiveCombo = values[`variant-${_combo?.combo_item?.id}-${orderItem?.id}-status`]
                    return (
                        <>
                            <tr>
                            <td style={{ verticalAlign: "top", borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                               <div className='d-flex'>
                               <div
                                    style={{  backgroundColor: "#F7F7FA",  width: 60, height: 60,  borderRadius: 8,  overflow: "hidden",  minWidth: 60,  cursor: "pointer",}}
                                    onClick={(e) => {
                                        e.preventDefault();
                                    }}
                                    className="mr-6"
                                >
                                    { <img src={_combo?.combo_item?.sme_catalog_product_variant_assets?.[0]?.asset_url} style={{ width: 60, height: 60,objectFit: "contain",}} alt=""/>}
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center",}} className="mt-1 mb-2">
                                        <div className="d-flex align-items-center cursor-pointer" onClick={() => navigateSmeProduct(_combo?.combo_item)}>
                                            <img src={toAbsoluteUrl("/media/ic_sku.svg")} className="pr-2" alt=""/>
                                            <span className="text-truncate-order">
                                                {_combo?.combo_item?.sku}
                                            </span>
                                        </div>
                                    </div>
                                    <span className='text-secondary-custom'>
                                        {_attributes(_combo?.combo_item?.attributes)}
                                    </span>
                                </div>
                               </div>
                            </td>
                            {(isMultiStatusCombo && isActiveCombo) ? (
                                <td colSpan={3} className="text-center" style={{ verticalAlign: "top", borderRight: '1px solid #d9d9d9', borderBottom: '1px solid #d9d9d9', borderTop: '1px solid #d9d9d9' }}>
                                    <div className="d-flex align-items-center">
                                        <span className="mr-4">Số lượng cần nhập: {_combo?.quantity}</span>
                                        <span className="ml-4">
                                            Số lượng nhập kho: {amountImportCombo([{..._combo?.combo_item}, ..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status))}
                                            <div style={{color: '#F5222D'}}>
                                                {errors[`variant-multi-combo-${orderItem.id}-${_combo?.combo_item?.id}-quantity-import`]}
                                            </div>
                                        </span>
                                    </div>
                                </td>
                            ) : (
                                <>
                                    <td className='text-center' style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9' }}>
                                        {_combo?.combo_item?.unit || '--'}
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9' }}>
                                    <SelectPicker
                                        data={
                                        [{..._combo?.combo_item, product_status_name: 'Mới'}, ..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status)?.map(status => ({label: status?.product_status_name, value: status?.id}))}
                                        onChange={(value) => {
                                            if(value) {
                                                setFieldValue(`inIsMulti-${orderItem?.id}-combo-current-status-${_combo?.combo_item?.id}`, value)
                                            }
                                        }}
                                        isClearable={false}
                                        className="removeBorderRsuite"
                                        searchable={false}
                                        style={{ width: 'max-content' }}
                                        placeholder="Mới"
                                    />
                                    </td>
                           
                                    <td className='text-center' style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9', borderRight: '1px solid #d9d9d9' }}>
                                        <Field
                                            name={`variant-${_combo?.combo_item?.id}-${orderItem.id}-quantity`}
                                            component={InputVerticalWithIncrease}
                                            label={''}
                                            required={false}
                                            customFeedbackLabel={' '}
                                            cols={['', 'col-12']}
                                            countChar
                                            slashValue={_combo?.quantity}
                                            slash={true}
                                            setValueZero={true}
                                            maxChar={'255'}
                                            rows={4}
                                        />
                                    </td>
                                </>
                            )}
                            
                            <td className='text-center' style={{ verticalAlign: "top", borderTop: '1px solid #d9d9d9' }}>
                                {isActiveCombo && (
                                    <span 
                                        style={{cursor: 'pointer'}} 
                                        onClick={() => {
                                        setFieldValue(`variant-${_combo?.combo_item?.id}-${orderItem?.id}-isMulti`, !isMultiStatusCombo)
                                    }} className="text-primary"> 
                                        {isMultiStatusCombo ? 'Một trạng thái' : 'Nhiều trạng thái'}
                                    </span>
                                )}
                               
                            </td>
                        </tr>

                        {isActiveCombo && isMultiStatusCombo && [{..._combo?.combo_item, product_status_name: 'Mới'}, ..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status)?.map((item) => {
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
                                        name={`variant-${item?.id}-${orderItem.id}-quantity-status`}
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
        )
    }, [orderItem, amountImportCombo, errors, values])
    const amountRow = useMemo(() => {
        const variant = orderItem?.productVariant
        if(variant?.is_combo) {
        const row = (variant?.combo_items || []).map((_combo, index) => {
            const isMultiStatusCombo = values[`variant-${_combo?.combo_item?.id}-${orderItem?.id}-isMulti`]
            return isMultiStatusCombo ? [{..._combo?.combo_item, product_status_name: 'Mới'}, ..._combo?.combo_item?.status_variants]?.filter(item => !!item?.status)?.length + 1: 1
        })
        
        return _.sum(row) + 2
        } else {
        return values[`variant-${orderItem?.productVariant?.id}-${orderItem.id}-isMulti`] ? [{...orderItem?.productVariant, product_status_name: 'Mới'}, ...orderItem?.productVariant?.status_variants]?.filter(item => !!item?.status)?.length + 1 : 1
        }
    }, [values, orderItem])
    return (
        <>
        <tr key={`product-variant-return-order-${orderItem?.id}`} style={{ borderBottom: '1px solid #D9D9D9', borderTop: "1px solid #D9D9D9" }}>
            {order?.source != 'manual' && (
                <td rowSpan={amountRow} style={{ verticalAlign: "top", borderRight: "1px solid #d9d9d9", }}>
                    <div className="d-flex row w-100 m-0 p-1">
                        <div className="col-11" style={{ verticalAlign: "top",  display: "flex", flexDirection: "row"}}>
                            <div style={{ backgroundColor: "#F7F7FA",width: 60,  height: 60,borderRadius: 8, overflow: "hidden",  minWidth: 60, cursor: "pointer",}}
                                onClick={(e) => {
                                    e.preventDefault();
                                }}
                                className="mr-6"
                            >
                                { <img src={orderItem?.variant_image} style={{ width: 60, height: 60, objectFit: "contain", }}/>}
                            </div>
                            <div>
                                <InfoProduct
                                    short={true}
                                    name={orderItem?.product_name}
                                    sku={orderItem?.variant_sku}
                                    url={() => {
                                        window.open(`/product-stores/edit/${orderItem?.sc_product_id}` || '', '_blank');
                                    }}
                                    productOrder={true}
                                />

                                <span className='text-secondary-custom fs-12 mt-2'>{orderItem?.variant_name}</span>
                            </div>
                        </div>
                        <div className="col-1 px-0">
                            <span style={{ fontSize: 12 }} className="mr-1">
                                x
                            </span>{orderItem?.quantity_purchased || 1}
                        </div>
                    </div>
                </td>
            )}
            {(!orderItem?.productVariant || !orderItem?.productVariant?.is_combo) ? buildVariant : <></>}
        </tr>
        {isMultiStatus && isActive && [{...orderItem?.productVariant, product_status_name: 'Mới'}, ...orderItem?.productVariant?.status_variants]?.filter(item => !!item?.status)?.map(item => (
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
                    name={`variant-${item?.id}-${orderItem.id}-quantity-status`}
                    component={InputVerticalWithIncrease}
                    label={''}
                    required={false}
                    customFeedbackLabel={' '}
                    cols={['', 'col-12']}
                    countChar
                    maxChar={'255'}
                    rows={4}
                />
            </td>
        </tr>
        ))}
            {orderItem?.productVariant?.is_combo ? buildVariantCombo : <></>}
        </>
    )
}

export default memo(ProductVariantRow);