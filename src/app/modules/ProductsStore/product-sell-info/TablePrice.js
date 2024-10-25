/*
 * Created by duydatpham@gmail.com on 08/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import { Field, useFormikContext } from "formik";
import React, { memo, useCallback, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { InputVertical } from "../../../../_metronic/_partials/controls";
import { useProductsUIContext } from "../ProductsUIContext";
import query_sme_catalog_product_variant_aggregate from "../../../../graphql/query_sme_catalog_product_variant_aggregate";
import { createApolloClientSSR } from "../../../../apollo";
import { queryCheckExistSku } from "../ProductsUIHelpers";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { createSKUVariant, formatNumberToCurrency, getMaxLengthSKU } from "../../../../utils";
import { useSelector } from "react-redux";
import { useToasts } from 'react-toast-notifications';
import { Modal } from "react-bootstrap";
import TableStock from "./TableStock";
import ModalVariantStockOnHand from "./dialogs/ModalVariantStockOnHand";
import _ from "lodash";
let client = createApolloClientSSR()

export default memo(({ isCreating, setShowStock, disableActions, currentChannel }) => {
    const { formatMessage } = useIntl();
    const {
        attributesSelected,
        variants, isEditProduct,
        scWarehouses,
        smeProduct,
        productEditing
    } = useProductsUIContext();
    const { addToast } = useToasts();
    const { setFieldValue, values } = useFormikContext();
    const [currentCodesVariant, setCurrentCodesVariant] = useState(null);

    const user = useSelector((state) => state.auth.user);

    const _filterAttributeSelected = useMemo(() => {
        return attributesSelected.filter(_att => !_att.isInactive).sort((a, b) => a.id - b.id)
    }, [attributesSelected]);    

    return (
        <div className="table-responsive mt-10">
            {/* table-borderless  */}
            <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                <thead>
                    <tr className="text-left text-uppercase" >
                        {
                            _filterAttributeSelected.map(_attribute => {
                                return (
                                    <th key={`header--${_attribute.id}`} >
                                        <span className="text-dark-75">{_attribute.display_name}</span>
                                    </th>
                                )
                            })
                        }
                        <th style={{ fontSize: '14px' }} width='30%'>
                            <p className="text-dark-75 mb-0"><FormattedMessage defaultMessage="SKU" /><span style={{ color: 'red' }} >*</span></p>
                            {!variants.every(variant => values[`variant-${variant.code}-sku`]) ? <a href="#" style={{ textTransform: 'none', cursor: disableActions ? 'not-allowed' : '' }}
                                onClick={e => {
                                    e.preventDefault()

                                    if (disableActions) return;
                                    if (!values.name) {
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                                        return;
                                    }
                                    console.log('variants', variants)
                                    if (variants.some(_variant => _variant.names.some(__ => __?.trim()?.length == 0))) {
                                        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên phân loại con' }), { appearance: 'warning' });
                                        return;
                                    }
                                    variants.forEach(_variant => {
                                        if (currentChannel?.connector_channel_code == 'lazada' && values[`disable-edit-attribute`] && values[`disable-lzd-sku-${_variant.code}`] && productEditing?.status != 2) return;
                                        setFieldValue(`variant-${_variant.code}-sku`, createSKUVariant(user?.sme_id, values.name, null, _variant.namesGenSku), false)
                                        setFieldValue(`variant-sku_boolean`, {})
                                    })
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Tự động tạo' })}
                            </a> : null}
                        </th>
                        <th style={{ fontSize: '14px' }} width='15%'><span className="text-dark-75"> {formatMessage({ defaultMessage: 'Giá niêm yết' })}</span><span style={{ color: 'red' }} >*</span></th>
                        <th style={{ fontSize: '14px' }} width='15%'><span className="text-dark-75"> {formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}</span><span style={{ color: 'red' }} >*</span></th>
                        <th className="text-center" style={{ fontSize: '14px' }} width='10%'>
                            <p className="text-dark-75 mb-0">{formatMessage({ defaultMessage: 'Có sẵn' })}<span style={{ color: 'red' }} >*</span></p>
                            {/* {
                                (!!smeProduct?.id || !!productEditing?.sme_product_id) && <a href="#" style={{ textTransform: 'none' }}
                                    onClick={e => {
                                        e.preventDefault()
                                        setShowStock(true)
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Xem thông tin tồn kho' })}
                                </a>
                            } */}
                        </th>
                        {!isCreating && currentChannel?.connector_channel_code != 'tiktok' && <th width='10%'><span className="text-dark-75">{formatMessage({ defaultMessage: `Hiển thị\nsản phẩm` })}</span></th>}
                    </tr>
                </thead>
                <tbody  >
                    {
                        variants.map(_row => {
                            const totalStockOnHand = _.sum(scWarehouses?.map(wh => values[`variant-${_row?.code}-${wh?.value}-stockOnHand`] || 0))
                            return (
                                <tr key={`row-table-${_row.code}`} style={{ borderBottom: '1px solid #F0F0F0', }} >
                                    {
                                        _row.names.map((_text, index) => {
                                            if (!!_row.rowSpans) {
                                                if (_text == null) {
                                                    return null
                                                }
                                                return (
                                                    <td key={`row-table-${_row.code}--${index}`} rowSpan={_row.rowSpans[index]} style={{ borderLeft: '1px solid #F0F0F0' }} >
                                                        <span className="text-muted font-weight-bold">
                                                            {_text}
                                                        </span>
                                                    </td>
                                                )
                                            }
                                            return (
                                                <td key={`row-table-${_row.code}--${index}`} rowSpan={index == 0 ? _row.rowSpan : 1} style={{ borderLeft: '1px solid #F0F0F0' }} >
                                                    <span className="text-muted font-weight-bold">
                                                        {_text}
                                                    </span>
                                                </td>
                                            )
                                        })
                                    }
                                    <td >
                                        <Field
                                            name={`variant-${_row.code}-sku`}
                                            component={InputVertical}
                                            placeholder=""
                                            label={false}
                                            required
                                            customFeedbackLabel={' '}
                                            countChar
                                            maxChar={getMaxLengthSKU(currentChannel?.connector_channel_code)}
                                            absolute={true}
                                            disabled={disableActions || (currentChannel?.connector_channel_code == 'lazada' && values[`disable-edit-attribute`] && values[`disable-lzd-sku-${_row.code}`] && productEditing?.status != 2)}
                                            // disabled={(!values[`disable-edit-attribute`] || currentChannel?.connector_channel_code != 'lazada') && (values[`disable-sku-${_row.code}`] || disableActions)}
                                            onBlurChange={async (value) => {
                                                let validateBoolean = {

                                                }
                                                let isError = false;
                                                variants.forEach(_variant => {
                                                    if (_variant.code != _row.code) {
                                                        if (values[`variant-${_variant.code}-sku`] == value) {
                                                            isError = true;
                                                            validateBoolean[_variant.code] = true;
                                                        } else {
                                                            validateBoolean[_variant.code] = false;
                                                        }
                                                    }
                                                });
                                                validateBoolean[_row.code] = isError;
                                                setFieldValue(`variant-sku_boolean`, validateBoolean)
                                                // if (!isError) {
                                                //     await checkExistSku(value, _row.code)
                                                // } else {

                                                // }
                                            }}
                                        />
                                    </td>
                                    <td >
                                        <Field
                                            name={`variant-${_row.code}-price`}
                                            component={InputVertical}
                                            placeholder=""
                                            required
                                            type='number'
                                            customFeedbackLabel={' '}
                                            disabled={disableActions}
                                            // addOnRight="đ"
                                            absolute={true}
                                        />
                                    </td>
                                    <td >
                                        <Field
                                            name={`variant-${_row.code}-priceMinimum`}
                                            component={InputVertical}
                                            placeholder=""
                                            required
                                            type='number'
                                            customFeedbackLabel={' '}
                                            disabled={disableActions}
                                            // addOnRight="đ"
                                            absolute={true}
                                        />
                                    </td>
                                    <td style={{ borderRight: '1px solid #F0F0F0', }} className="text-center">
                                        {!!currentChannel?.enable_multi_warehouse && (
                                            <div className="d-flex align-items-center justify-content-center">
                                                <span className="mr-2">{formatNumberToCurrency(totalStockOnHand)}</span>
                                                <i
                                                    role="button"
                                                    className="text-dark far fa-edit"
                                                    onClick={() => setCurrentCodesVariant(_row?.code)}
                                                />
                                            </div>
                                        )}
                                        {!currentChannel?.enable_multi_warehouse && (
                                            <>
                                            <Field
                                                name={`variant-${_row.code}-stockOnHand`}
                                                component={InputVertical}
                                                placeholder=""
                                                label={false}
                                                disabled={disableActions || values[`variant-${_row.code}-disable-stock`]}
                                                type='number'
                                                customFeedbackLabel={' '}
                                                absolute={true}
                                            />
                                            {!!values[`variant-${_row.code}-stockReverse`] && <span>Dự trữ: {values[`variant-${_row.code}-stockReverse`]}</span>}
                                            </>
                                        )}
                                    </td>
                                    {
                                        !isCreating && currentChannel?.connector_channel_code != 'tiktok' && <td style={{ borderRight: '1px solid #F0F0F0', }} >
                                            <Field
                                                name={`variant-${_row.code}-visible`}
                                                component={Switch}
                                                isVariant={true}
                                                disableActions={disableActions}
                                            />
                                        </td>
                                    }
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>

            <ModalVariantStockOnHand
                currentCodesVariant={currentCodesVariant}
                onHide={() => setCurrentCodesVariant(null)}
            />

        </div >
    )
})