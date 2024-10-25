import React, { useMemo, useRef, useState } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useIntl } from 'react-intl';
import HoverImage from '../../../../components/HoverImage';
import InfoProduct from '../../../../components/InfoProduct';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import { useFormikContext } from 'formik';
import Pagination from '../../../../components/Pagination';
import mutate_scDeleteVariantPushInventory from '../../../../graphql/mutate_scDeleteVariantPushInventory'
import _ from 'lodash';
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import EditVertical from './EditVertical';
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { Dropdown } from 'react-bootstrap';

const TableProduct = ({ single, page, loading, perPage }) => {
    const { formatMessage } = useIntl()
    const { values, setFieldValue, setFieldError } = useFormikContext()
    const [ show, setShow ] = useState(false);
    const [variantSelect, setVariantSelect] = useState([]);

    const isSelectedAll = useMemo(() => {
        if (values['listVariantPush']?.list_variant?.length == 0) return false;
        return values['listVariantPush']?.list_variant?.every(variant => variantSelect?.some(item => item?.id == variant?.id));
    }, [values, variantSelect])

    const columnsPushInventory = useMemo(() => {
        if (single) {
            return (
                <div className='row col-12'>
                    <span className='col-4 text-center'>{formatMessage({ defaultMessage: "Tỷ lệ đẩy" })}</span>
                    <span className='col-4 text-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })}</span>
                        <TooltipWrapper note={formatMessage({ defaultMessage: "Khi đến ngưỡng bảo vệ, tồn kho của hàng hóa sàn sẽ về 0." })}>
                            <i className="fas fa-info-circle fs-14"></i>
                        </TooltipWrapper>
                    </span>
                    <span className='col-4' style={{ paddingLeft: '5%' }}>{formatMessage({ defaultMessage: "Kho vật lý" })}</span>
                </div>
            )
        }
        return (
            <div className='row col-12'>
                <span className='col-3'>{formatMessage({ defaultMessage: "Kho kênh bán" })}</span>
                <span className='col-3 text-center'>{formatMessage({ defaultMessage: "Tỷ lệ đẩy" })}</span>
                 <span className='col-3 text-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })}</span>
                        <TooltipWrapper note={formatMessage({ defaultMessage: "Khi đến ngưỡng bảo vệ, tồn kho của hàng hóa sàn sẽ về 0." })}>
                            <i className="fas fa-info-circle fs-14"></i>
                        </TooltipWrapper>
                </span>
                <span className='col-3' style={{ paddingLeft: '5%' }}>{formatMessage({ defaultMessage: "Kho vật lý" })}</span>
            </div>
        )
    }, [single])

    const [deleteVariantPushInventory, { loading: loadingDeleteVariantPushInventory }] = useMutation(mutate_scDeleteVariantPushInventory,
        { awaitRefetchQueries: true, refetchQueries: ['scGetSettingPushInventory'] }
    );

    let totalRecord = values['listVariantPush']?.total || 0;
    let totalPage = Math.ceil(totalRecord / perPage);
    
    return (
        <div>
            <LoadingDialog show={loadingDeleteVariantPushInventory} />
            <div className='mb-4'>
                <div style={{ flexBasis: '55%' }} className='w-100 d-flex align-items-center'>
                    <div className='text-right mr-2 text-primary'>{formatMessage({ defaultMessage: "Đã chọn" })}: {variantSelect?.length} hàng hóa</div>
                    <Dropdown show = {show} drop='down'>
                    <Dropdown.Toggle onClick = {() => setShow(!show)} disabled={!variantSelect.length} className={`${variantSelect?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                        {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                         {
                            show && (
                                <>
                                    <EditVertical type='push' 
                                        title={formatMessage({ defaultMessage: "Tỷ lệ đẩy" })} 
                                        field='inventory_push_percent_multi'
                                        onConfirm={(value) => {
                                        variantSelect.forEach(variant => {
                                            (variant?.scProductVariantPushInventory?.flatMap(variant => variant?.scWarehouseMapping?.sme_warehouse_id ? variant : []) || []).forEach(item => {
                                                setFieldValue(`inventory_push_percent-product-${variant?.id}-${item?.scWarehouseMapping?.sme_warehouse_id}`, value)
                                            })
                                        })
                                    }}>
                                        <Dropdown.Item>
                                            {formatMessage({ defaultMessage: "Sửa tỷ lệ đẩy" })}
                                        </Dropdown.Item>
                                    </EditVertical>
        

                                        <>
                                            <EditVertical type='protection' 
                                            title={formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })} 
                                            field='protection_threshold_multi'
                                            onConfirm={(value) => {
                                            variantSelect.forEach(variant => {
                                                (variant?.scProductVariantPushInventory?.flatMap(variant => variant?.scWarehouseMapping?.sme_warehouse_id ? variant : []) || []).forEach(item => {
                                                    setFieldValue(`protection_threshold-product-${variant?.id}-${item?.scWarehouseMapping?.sme_warehouse_id}`, value || 0)
                                                })
                                            })
                                        }}>
                                        <div className='mb-1 d-flex dropdown-item cursor-pointer'>{formatMessage({ defaultMessage: "Sửa ngưỡng bảo vệ" })}</div>
                                        </EditVertical>
                                        </>
                                
                                </>
                            )
                         }
                     </Dropdown.Menu>
                </Dropdown>
                </div>
            </div>
            <table className="table table-borderless product-list fixed">
                <thead
                    style={{ zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9', borderRight: '1px solid #d9d9d9' }}
                >
                    <tr className="font-size-lg">
                        <th style={{ fontSize: '14px', width: '35%' }}>
                            <div className="d-flex">
                                <Checkbox disabled={!Boolean(!!values['typePush'])} size='checkbox-md' inputProps={{ 'aria-label': 'checkbox', }} isSelected={isSelectedAll}
                                    onChange={(e) => {
                                        if (isSelectedAll) {
                                            setVariantSelect(variantSelect.filter(x => {
                                                return !values['listVariantPush']?.list_variant?.some(variant => variant.id === x.id);
                                            }))
                                        } else {
                                            const tempArray = [...variantSelect];
                                            (values['listVariantPush']?.list_variant || []).forEach(variant => {
                                                if (variant && !variantSelect.some(item => item.id === variant.id)) {
                                                    tempArray.push(variant);
                                                }
                                            })
                                            setVariantSelect(tempArray)
                                        }
                                    }}
                                />
                                <span className="mx-4">{formatMessage({ defaultMessage: 'Hàng hóa' })}</span>
                            </div>
                        </th>
                        <th style={{ fontSize: '14px', width: '58%' }}>
                            {columnsPushInventory}
                        </th>
                        <th style={{ fontSize: '14px', width: '7%' }}>{formatMessage({ defaultMessage: 'Thao tác' })}</th>

                    </tr>
                </thead>
                <tbody>
                    {values['listVariantPush']?.list_variant?.map((elm, index, arr) => {

                        return (
                            <RowTableProduct onDeleteVariant={deleteVariantPushInventory} single={single} variantSelect={variantSelect} elm={elm} setVariantSelect={setVariantSelect} />
                        )
                    })}
                </tbody>
            </table>
            <Pagination
                page={page}
                totalPage={totalPage}
                loading={loading}
                limit={perPage}
                totalRecord={totalRecord}
                count={values['listVariantPush']?.list_variant?.length || 0}
                basePath="/setting/setting-push-inventory"
                emptyTitle={formatMessage({ defaultMessage: "Chưa có hàng hóa" })}
            />
        </div>
    )
}

const RowTableProduct = ({ onDeleteVariant, single, variantSelect, elm, setVariantSelect }) => {
    const [isExpand, setIsExpand] = useState(false);
    const { values, setFieldValue, setFieldError } = useFormikContext()
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const combinationVariant = useMemo(() => {
        let hasAttribute = elm?.product?.variantAttributeValues?.length > 0;
        if (hasAttribute) {
            let combinationVariant = [];

            let _sc_product_attributes_value = elm?.sc_product_attributes_value ? JSON.parse(elm?.sc_product_attributes_value) : []
            let _sc_product_variant_attr = elm?.product.productVariantAttributes

            let _variantAttributeValue = elm?.product?.variantAttributeValues?.filter(_value => {
                return _sc_product_attributes_value.includes(_value.ref_index)
            })
            _variantAttributeValue.forEach(variant_attr_value => {
                _sc_product_variant_attr.forEach(variant_attr => {
                    if (variant_attr_value.sc_variant_attribute_id == variant_attr.id) {
                        combinationVariant.push(variant_attr_value.value)
                    }
                });
            });
            return combinationVariant.join(' - ')
        }
    }, [elm])

    let assetUrl = useMemo(() => {
        let _asset = null
        try {
            let _sc_product_attributes_value = JSON.parse(elm?.sc_product_attributes_value)
            let _variantAttributeValue = elm?.product?.variantAttributeValues?.find(_value => {
                return _value.scVariantValueAssets?.length > 0 && _sc_product_attributes_value.some(_v => _v == _value.ref_index)
            })
            if (!!_variantAttributeValue) {
                _asset = _variantAttributeValue.scVariantValueAssets[0]
            }
        } catch (error) {

        }
        try {
            if (!_asset) {
                let _variantAttributeValue = _.sortBy(elm?.product?.productAssets || [], 'position')
                if (!!_variantAttributeValue) {
                    _asset = _variantAttributeValue[0]
                }
            }
        } catch (error) {

        }
        return _asset;
    }, [elm])



    const getProductVariantPushInventory = elm?.scProductVariantPushInventory
    let canExpand = getProductVariantPushInventory?.length > 3;
    return (
        <>
            <tr>
                <td>
                    <div className='d-flex align-items-start'>
                        <Checkbox
                            disabled={!Boolean(!!values['typePush'])}
                            size="checkbox-md"
                            inputProps={{ 'aria-label': 'checkbox' }}
                            isSelected={variantSelect.some(_id => _id.id == elm?.id)}
                            onChange={(e) => {
                                if (variantSelect.some(_id => _id.id == elm?.id)) {
                                    setVariantSelect(prev => prev.filter(_id => _id.id != elm?.id))
                                } else {
                                    setVariantSelect(prev => prev.concat([elm]))
                                }
                            }}
                        />

                        <div className="col-11" style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                            <div style={{ backgroundColor: '#F7F7FA', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', minWidth: 90, cursor: 'pointer' }}
                                onClick={e => window.open(`/product-stores/edit/${elm?.product?.id}`, '_blank')}
                                className='mr-6'
                            >
                                {!!assetUrl && <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 90, height: 90 }} url={assetUrl?.sme_url} />}
                            </div>
                            <div className='w-100'>
                                <InfoProduct sku={elm?.sku} short={true} name={elm?.product?.name} url={`/product-stores/edit/${elm?.product?.id}`} />

                                <div className='mt-2'>
                                    {combinationVariant || ''}
                                </div>

                            </div>
                        </div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'center' }} className="p-0">
                    {getProductVariantPushInventory?.slice(0, (canExpand && !isExpand) ? 3 : getProductVariantPushInventory?.length)?.map((variant, index, arr) => {
                        const warehouseMapping = values['warehouseMappingProduct']?.find(whMaping => whMaping?.id == variant?.scWarehouseMapping?.sme_warehouse_id)
                        let isBorder = (variant?.id === arr?.at(-1)?.id)
                        return (
                            <div style={{ padding: '5px', borderBottom: !isBorder ? '0.5px solid #cbced4' : {} }} className='row col-12 d-flex row w-100 m-0 p-5'>
                                {!single && (
                                    <div style={{ display: 'flex', alignItems: 'center' }} className={`${single ? 'col-4' : 'col-3'}`}>
                                        <div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z">
                                                </path>
                                            </svg>
                                        </div>
                                        <span>{variant?.scWarehouseMapping?.scWarehouse?.warehouse_name}</span>
                                    </div>
                                )}
                                {!!warehouseMapping?.name ? (
                                    <>
                                        <div style={{ pointerEvents: !Boolean(!!values['typePush']) ? 'none' : 'auto' }} className={`${single ? 'col-4' : 'col-3'} d-flex align-items-center justify-content-center`}>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginRight: '15px' }}>
                                                <span className='mr-2'>{values[`inventory_push_percent-product-${elm?.id}-${warehouseMapping?.id}`]}%</span>

                                                <EditVertical type='push' title={formatMessage({ defaultMessage: "Tỷ lệ đẩy" })} field={`inventory_push_percent-product-${elm?.id}-${warehouseMapping?.id}`} onConfirm={(value) => setFieldValue(`inventory_push_percent-product-${elm?.id}-${warehouseMapping?.id}`, value)}/>

                                            </div>

                                        </div>

                                        <div style={{ pointerEvents: !Boolean(!!values['typePush']) ? 'none' : 'auto' }} className={`${single ? 'col-4' : 'col-3'} d-flex align-items-center justify-content-center`}>
                                           <div style={{ display: 'flex', justifyContent: 'center', marginRight: '15px' }}>
                                                <span className='mr-2'>{values[`protection_threshold-product-${elm?.id}-${warehouseMapping?.id}`]}</span>
                                                <EditVertical type='protection' title={formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })} field={`protection_threshold-product-${elm?.id}-${warehouseMapping?.id}`} onConfirm={(value) => setFieldValue(`protection_threshold-product-${elm?.id}-${warehouseMapping?.id}`, value)}/>
                                            </div>

                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center' }} className={`${single ? 'col-4' : 'col-3'}`}>
                                            <div>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z">
                                                    </path>
                                                </svg>
                                            </div>
                                            <span>{warehouseMapping?.name}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ marginLeft: '11%' }}>
                                        <span className='text-danger'>
                                            {formatMessage({ defaultMessage: 'Không có liên kết kho nên không thể đẩy tồn được' })}
                                        </span>
                                    </div>

                                )}

                            </div>
                        )
                    })}
                    {!!canExpand && (
                        <div className='col-5 mb-4 mt-2' style={{ marginLeft: '3%' }} onClick={e => {
                            e.preventDefault();
                            setIsExpand(prev => !prev);
                        }}>
                            <span style={{ cursor: 'pointer', fontWeight: '700', color: 'rgba(0,0,0,0.85)' }}>
                                {isExpand ? `${formatMessage({ defaultMessage: '-------Thu gọn-------' })}` : `${formatMessage({ defaultMessage: '-------Xem thêm-------' })}`}
                            </span>
                        </div>
                    )}

                </td>
                <td>
                    <div style={{ pointerEvents: !Boolean(values['typePush']) ? 'none' : 'auto' }} className='table-vertical-top d-flex justify-content-center' onClick={async () => {
                        const { data } = await onDeleteVariant({
                            variables: {
                                sc_variant_id: elm?.id,
                                store_id: params?.store ? +params?.store : null
                            }
                        })
                        if (data?.scDeleteVariantPushInventory?.success) {
                            addToast(data?.scDeleteVariantPushInventory?.message || formatMessage({ defaultMessage: 'Thành công' }), { appearance: 'success' })
                            return
                        }
                        addToast(data?.scDeleteVariantPushInventory?.message || formatMessage({ defaultMessage: 'Thất bại' }), { appearance: 'error' })
                    }} >
                        <img style={{ cursor: 'pointer' }} src={toAbsoluteUrl("/media/svg/trash-red.svg")} alt="" />
                    </div>
                </td>
            </tr>
        </>
    )
}

export default TableProduct