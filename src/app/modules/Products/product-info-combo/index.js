import React, { Fragment, useCallback, useState, memo, useMemo } from "react";
import {
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardHeaderToolbar,
    FieldFeedbackLabel,
    Input,
    InputVertical
} from "../../../../_metronic/_partials/controls";
import { useProductsUIContext } from "../ProductsUIContext";
import { OverlayTrigger, Tooltip, Modal } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { Field, useFormikContext, Form, Formik } from "formik";
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { formatNumberToCurrency } from "../../../../utils";
import ModalAddVariants from "../product-new-combo/ModalAddVariants";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useIntl } from "react-intl";
import clsx from "clsx";

const LIMIT_ADD_COMBO = 10;
const MAX_COST_RATIO = 100;

const ProductInfoCombo = ({ isCreating }) => {
    const [isShowModalAdd, setShowModalAdd] = useState(false);
    const { setFieldValue, values, setFieldError } = useFormikContext();
    const [showModalStockOnHand, setShowModalStockOnHand] = useState(false);
    const { variantsCombo, setVariantsCombo, smeCatalogStores } = useProductsUIContext();
    const { formatMessage } = useIntl()

    const deleteVariantCombo = useCallback(
        (id) => {
            setVariantsCombo(prevVariantsCombo => prevVariantsCombo.filter(_variant => _variant?.id != id));

            (variantsCombo || []).forEach(_variant => {
                if (_variant?.id == id) {
                    setFieldError(`variant-combo-${_variant?.id}-quantity`, false);
                    setFieldError(`variant-combo-${_variant?.id}-costRatioValue`, false);
                    setFieldValue(`variant-combo-${_variant?.id}-quantity`, undefined);
                    setFieldValue(`variant-combo-${_variant?.id}-costRatioValue`, undefined);
                }
            });
        }, [variantsCombo]
    );

    console.log({ variantsCombo });

    const caculateComboInventory = useCallback((key, store_id) => {
        let total = 0;
        let checkQttCombo = !variantsCombo?.some(_variant => !values[`variant-combo-${_variant?.id}-quantity`]);
        if (checkQttCombo && variantsCombo?.length > 0) {
            total = Math.min(
                ...variantsCombo?.map(_variant => {
                    const inventory = _variant?.inventories?.find(iv => iv?.sme_store_id === store_id);
                    const valueInventory = inventory[key]

                    if (values[`variant-combo-${_variant?.id}-quantity`] > 0) {
                        return Math.floor(valueInventory / values[`variant-combo-${_variant?.id}-quantity`]);
                    } else {
                        return valueInventory
                    }
                })
            )
        };

        return total;
    }, [variantsCombo, values])

    const selectedInventory = useCallback((id) => {
        return {
            stock_actual: caculateComboInventory('stock_actual', id),
            stock_allocated: caculateComboInventory('stock_allocated', id),
            stock_reserve: caculateComboInventory('stock_reserve', id),
            stock_available: caculateComboInventory('stock_available', id),
            stock_preallocate: caculateComboInventory('stock_preallocate', id),
            stock_shipping: caculateComboInventory('stock_shipping', id),
        }
    }, [caculateComboInventory]);

    const totalStockOnHand = useMemo(
        () => {
            let total = 0;
            let checkQttCombo = !variantsCombo?.some(_variant => !values[`variant-combo-${_variant?.id}-quantity`]);
            if (isCreating && checkQttCombo && variantsCombo?.length > 0) {
                total = smeCatalogStores?.map(wh => {
                    return selectedInventory(wh?.value)?.stock_actual
                }).reduce((a, b) => a + b, 0)

            } else {
                total = values['inventories']?.map(_variant => {
                    return _variant?.stock_actual
                }).reduce((a, b) => a + b, 0)
            }

            return total;
        }, [variantsCombo, values]
    );

    const totalCostRatio = useMemo(() => {
        const total = variantsCombo?.reduce((result, value) => {
            if (!!values[`variant-combo-${value?.id}-costRatioValue`]) {
                result += Number(values[`variant-combo-${value?.id}-costRatioValue`])
            }
            return result
        }, 0)

        if (total == MAX_COST_RATIO) {
            setFieldValue(`variant-total-ratio-boolean`, undefined)
        } else {
            setFieldValue(`variant-total-ratio-boolean`, { ratio: true })
        }

        return total;
    }, [variantsCombo, ...variantsCombo?.map(variant => values[`variant-combo-${variant?.id}-costRatioValue`])]);

    return (
        <Fragment>
            {isCreating && <ModalAddVariants
                show={isShowModalAdd}
                onHide={() => setShowModalAdd(false)}
            />}

            <Card>
                <CardHeader title={<div className="d-flex flex-column">
                    <span>{formatMessage({ defaultMessage: 'THÔNG TIN COMBO' })}</span>
                    <span className="fs-12 mt-1" style={{ fontStyle: 'italic', color: '#9daab5' }}>* {formatMessage({ defaultMessage: 'Có thể thêm tối đa 10 sản phẩm con trong combo' })}</span>
                </div>}>
                    <CardHeaderToolbar>
                    </CardHeaderToolbar>
                </CardHeader>
                <CardBody>
                    <div className="row mb-4 d-flex align-items-center">
                        <div className={`col-md-5`} >
                            <div className="row align-items-end">
                                <div className="col-md-6">
                                    <button
                                        type="button"
                                        disabled={false}
                                        className="btn btn-primary"
                                        onClick={() => setShowModalStockOnHand(true)}
                                    >
                                        {formatMessage({ defaultMessage: 'Chi tiết tồn kho' })}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-7 d-flex justify-content-end align-items-center">
                            <span className={clsx("mr-4", { 'text-danger': !!values[`variant-total-ratio-boolean`] })}>
                                {formatMessage({ defaultMessage: 'Tổng tỷ lệ phân bổ giá: {count}%' }, { count: totalCostRatio })}
                            </span>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={variantsCombo?.length == 0}
                                onClick={() => {
                                    const totalPriceVariantsCombo = _.sum(variantsCombo?.map(_variant => (_variant?.inventory?.variant?.price || 0) * (values[`variant-combo-${_variant?.id}-quantity`] || 0)));
                                    let sumCaculateRatio = 0;

                                    (variantsCombo || []).forEach((_variant, index) => {
                                        const isLastVariant = index == variantsCombo?.length - 1;

                                        if (isLastVariant) {
                                            setFieldValue(`variant-combo-${_variant?.id}-costRatioValue`, MAX_COST_RATIO - sumCaculateRatio);
                                        } else {
                                            if (totalPriceVariantsCombo == 0) {
                                                const ratioException = Number((MAX_COST_RATIO / variantsCombo?.length).toFixed())
                                                sumCaculateRatio += Number(ratioException);

                                                setFieldValue(`variant-combo-${_variant?.id}-costRatioValue`, ratioException);
                                                return;
                                            }
                                            const ratio = ((((_variant?.inventory?.variant?.price || 0) * (values[`variant-combo-${_variant?.id}-quantity`] || 0)) / totalPriceVariantsCombo) * 100).toFixed();
                                            sumCaculateRatio += Number(ratio);

                                            setFieldValue(`variant-combo-${_variant?.id}-costRatioValue`, Number(ratio));
                                        }
                                    });
                                }}
                            >
                                <span className="mr-2">{formatMessage({ defaultMessage: 'Tính lại phân bổ giá' })}</span>
                                <OverlayTrigger
                                    placement='bottom'
                                    overlay={
                                        <Tooltip>
                                            <div style={{ textAlign: 'center' }}>
                                                <span>{formatMessage({ defaultMessage: 'Tính theo công thức tỷ lệ giá = (Giá bán sản phẩm con / Tổng giá bán sản phẩm con trong combo)*100%' })}</span>
                                            </div>
                                        </Tooltip>
                                    }
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-info-circle" viewBox="0 0 16 16">
                                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                    </svg>
                                </OverlayTrigger>
                            </button>
                            {isCreating && (
                                <button
                                    type="button"
                                    className="btn btn-primary ml-4"
                                    disabled={variantsCombo?.length >= LIMIT_ADD_COMBO}
                                    style={variantsCombo?.length >= LIMIT_ADD_COMBO ? { cursor: 'not-allowed' } : {}}
                                    onClick={() => setShowModalAdd(true)}
                                >
                                    {formatMessage({ defaultMessage: 'Thêm hàng hóa' })}
                                </button>
                            )}
                        </div>
                    </div>
                    {variantsCombo?.length > 0 &&
                        <div style={{
                            boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                            borderRadius: 6
                        }} >
                            <table className="table product-list table-borderless table-vertical-center fixed">
                                <thead style={{
                                    borderBottom: '1px solid #F0F0F0',
                                    borderRight: '1px solid #d9d9d9',
                                    borderLeft: '1px solid #d9d9d9'
                                }}>
                                    <tr className="text-left" >
                                        <th style={{ fontSize: '14px' }} width='40%'>
                                            <span>{formatMessage({ defaultMessage: 'Hàng hóa' })}</span>
                                        </th>
                                        <th style={{ fontSize: '14px', borderBottom: '1px solid #d9d9d9', }} width='20%' className="text-center">
                                            <span>{formatMessage({ defaultMessage: 'Tồn và giá' })}</span>
                                        </th>
                                        <th style={{ fontSize: '14px' }} width='15%'>
                                            <span>{formatMessage({ defaultMessage: 'Số lượng' })} <span className="text-primary fs-16">*</span></span>
                                        </th>
                                        <th style={{ fontSize: '14px' }} width='15%'>
                                            <span>{formatMessage({ defaultMessage: 'Tỷ lệ phân bổ giá' })} <span className="text-primary fs-16">*</span></span>
                                        </th>
                                        {
                                            isCreating && <th style={{ fontSize: '14px' }} className='text-center' width='10%'>
                                                <span>{formatMessage({ defaultMessage: 'Thao tác' })}</span>
                                            </th>
                                        }
                                    </tr>
                                </thead>
                                <tbody>
                                    {variantsCombo?.map((_variant, index) => {
                                        let imgAssets = null;
                                        if (_variant?.sme_catalog_product_variant_assets?.[0]?.asset_url) {
                                            imgAssets = _variant?.sme_catalog_product_variant_assets[0]
                                        }

                                        const hasAttribute = _variant?.attributes?.length > 0;

                                        return (
                                            <tr
                                                key={`product-combo-variant`}
                                                style={{ borderBottom: '1px solid #d9d9d9' }}
                                            >
                                                <td className='pt-6 pb-2' style={{ verticalAlign: 'top' }} >
                                                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                                                        <Link to={`/products/edit/${_variant?.sme_catalog_product?.id}`} target="_blank">
                                                            <div style={{
                                                                backgroundColor: '#F7F7FA',
                                                                width: 80, height: 80,
                                                                borderRadius: 8,
                                                                overflow: 'hidden',
                                                                minWidth: 80
                                                            }} className='mr-6' >
                                                                {
                                                                    !!imgAssets && <img src={imgAssets?.asset_url}
                                                                        style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                                                }
                                                            </div>
                                                        </Link>
                                                        <div>
                                                            <Link to={`/products/edit/${_variant?.sme_catalog_product?.id}`} target="_blank">
                                                                <p
                                                                    className='font-weight-normal mb-2 line-clamp'
                                                                    title={_variant?.sme_catalog_product?.name}
                                                                    style={{ color: 'black' }}
                                                                >
                                                                    {_variant?.sme_catalog_product?.name}
                                                                </p>
                                                            </Link>
                                                            <p className='mb-2 d-flex align-items-center'>
                                                                <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                <span className='text-truncate-sku fs-12 ml-2'>{_variant?.sku}</span>
                                                            </p>
                                                            {!!hasAttribute && <p className='font-weight-normal mb-2 text-secondary-custom fs-12' >{_variant?.name?.replaceAll(' + ', ' - ')}</p>}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className='removeBorder pt-6 pb-2 d-flex justify-content-center' style={{ verticalAlign: 'top' }} >
                                                    <div className="d-flex flex-column align-items-start">
                                                        <p style={{ marginBottom: 1, marginTop: 2 }} > <b>{formatMessage({ defaultMessage: 'Tồn thực tế' })}: {formatNumberToCurrency(_variant?.inventory?.stock_actual)}</b></p>
                                                        <p style={{ marginBottom: 1, marginTop: 2 }} > {formatMessage({ defaultMessage: 'Giá vốn' })}: {formatNumberToCurrency(_variant?.inventory?.variant?.cost_price)}</p>
                                                        <p style={{ marginBottom: 1, marginTop: 2 }} > {formatMessage({ defaultMessage: 'Giá bán' })}: {formatNumberToCurrency(_variant?.inventory?.variant?.price)}</p>
                                                    </div>
                                                </td>

                                                <td className='pt-6 pb-2' style={{ verticalAlign: 'middle' }}>
                                                    <Field
                                                        name={`variant-combo-${_variant?.id}-quantity`}
                                                        component={InputVertical}
                                                        placeholder=""
                                                        label={false}
                                                        type='number'
                                                        disabled={!isCreating}
                                                        customFeedbackLabel={' '}
                                                    />
                                                </td>
                                                <td className='pt-6 pb-2' style={{ verticalAlign: 'middle' }}>
                                                    <Field
                                                        name={`variant-combo-${_variant?.id}-costRatioValue`}
                                                        component={InputVertical}
                                                        placeholder=""
                                                        label={false}
                                                        type='number'
                                                        addOnRight={'%'}
                                                        // disabled={!isCreating}
                                                        customFeedbackLabel={' '}
                                                    />
                                                </td>
                                                {isCreating && (
                                                    <td className='text-center pt-6 pb-2'>
                                                        <i
                                                            class="fas fa-trash-alt"
                                                            role="button"
                                                            style={{ color: 'red' }}
                                                            onClick={() => deleteVariantCombo(_variant?.id)}
                                                        />
                                                    </td>
                                                )}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    }
                </CardBody>
            </Card>

            <Modal
                show={showModalStockOnHand}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName={"modal-show-detail-stock-product"}
                centered
                onHide={() => {
                    setShowModalStockOnHand(false)
                }}
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Tồn kho' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                    <i
                        className="fas fa-times"
                        onClick={() => {
                            setShowModalStockOnHand(false)
                        }}
                        style={{ position: 'absolute', top: -55, right: 20, fontSize: 20, cursor: 'pointer' }}
                    />
                    <div style={{ padding: '0rem 1rem' }}>
                        <div className="d-flex align-items-center mt-4 mb-2">
                            <span style={{ width: '50%' }}>{formatMessage({ defaultMessage: 'Mã SKU hàng hóa' })}: {values[`origin_sku`] || '--'}</span>
                            <span style={{ width: '50%' }}>GTIN: {values[`gtin`] || '--'}</span>
                        </div>
                        <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                            <thead>
                                <tr className="text-uppercase" >
                                    <th style={{ border: '1px solid' }} width='16%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn thực tế' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm giữ' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm ứng' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Dự trữ' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}</span>
                                    </th>
                                    <th style={{ border: '1px solid' }} className="text-center" width='14%'>
                                        <span className="text-dark-75">{formatMessage({ defaultMessage: 'Đang vận chuyển' })}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(isCreating ? smeCatalogStores : values['inventories'])?.map(
                                    (inventory, index) => {
                                        console.log({ inventory })
                                        const { stockActual, stockAllocated, stockReserve, stockPreallocate, stockReady, stockShipping } = {
                                            stockActual: isCreating ? selectedInventory(inventory?.value)?.stock_actual : inventory?.stock_actual,
                                            stockAllocated: isCreating ? selectedInventory(inventory?.value)?.stock_allocated : inventory?.stock_allocated,
                                            stockReserve: isCreating ? selectedInventory(inventory?.value)?.stock_reserve : inventory?.stock_reserve,
                                            stockPreallocate: isCreating ? selectedInventory(inventory?.value)?.stock_preallocate : inventory?.stock_preallocate,
                                            stockReady: isCreating ? selectedInventory(inventory?.value)?.stock_available : inventory?.stock_available,
                                            stockShipping: isCreating ? selectedInventory(inventory?.value)?.stock_shipping : inventory?.stock_shipping
                                        }

                                        return (
                                            <tr key={`sme-catalog-store-${index}`}>
                                                <td style={{ border: '1px solid #c8c7c9' }}>
                                                    <span className="text-dark-75" >
                                                        {isCreating ? inventory?.label : inventory?.sme_store?.name}
                                                    </span>
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockActual}
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockAllocated}
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockPreallocate}
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockReserve}
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockReady}
                                                </td>
                                                <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                    {stockShipping}
                                                </td>
                                            </tr>
                                        )
                                    }
                                )}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={() => setShowModalStockOnHand(false)}
                            className="btn btn-primary btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            {formatMessage({ defaultMessage: 'Đóng' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
};

export default memo(ProductInfoCombo);