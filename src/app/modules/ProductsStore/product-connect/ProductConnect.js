/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import { Field, Form, useFormikContext } from "formik";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import _ from 'lodash'
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Formik } from 'formik';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../utils';
import { useProductsUIContext } from "../ProductsUIContext";
import ProductConnectClassify from "./ProductConnectClassify";
import ProductConnectDialog from "./ProductConnectDialog";
import ProductConnectGroupClassify from './ProductConnectGroupClassify';
import mutate_scCreateSmeProduct from '../../../../graphql/mutate_scCreateSmeProduct';
import { useMutation, useQuery } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../products-list/dialog/LoadingDialog';
import mutate_scSettingVariant from "../../../../graphql/mutate_scSettingVariant";
import { SwitchSyncProduct } from "../../../../_metronic/_partials/controls/forms/SwitchSyncProduct";
import OutsideClickHandler from 'react-outside-click-handler';

const Sticky = require('sticky-js');


export function ProductConnect({
    history,
    scId,
    dataAttributeSc,
    onShowConnect,
    showConnect,
    onHideConnect
}) {

    const {
        attributesSelected,
        variants,
        smeProduct,
        productEditing,
        resetAll
    } = useProductsUIContext();
    const { values, setFieldValue } = useFormikContext();
    const { addToast } = useToasts();
    const [idJobSync, setIdJobSync] = useState(null);
    const [showError, setShowError] = useState(false);
    const [currentVariantSync, setCurrentVariantSync] = useState({});

    const [scCreateSmeProduct, { loading: loadingCreateSmeProduct, data }] = useMutation(mutate_scCreateSmeProduct, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_product', 'sme_catalog_notifications'],
    });
    const [scSettingVariant, { loading: loadingSettingVariant }] = useMutation(mutate_scSettingVariant, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_product', 'sme_catalog_product_by_pk']
    });

    useMemo(
        () => {
            if (
                !!smeProduct && smeProduct?.sme_catalog_product_variants?.length > 0 && productEditing?.productVariants?.length > 0
            ) {

                productEditing.productVariants.forEach(_variant => {
                    let findedSmeConnected = smeProduct.sme_catalog_product_variants.find(ii => ii.id == _variant.sme_product_variant_id);
                    if (!!findedSmeConnected) {
                        setFieldValue(`variant-${_variant.code}-sme_product_variant_id`, findedSmeConnected.id, false)
                    }
                    return;
                })
            }
        }, [smeProduct, variants]
    );

    const _filterAttributeSelected = useMemo(() => {
        return attributesSelected.filter(_att => !_att.isInactive).sort((a, b) => a.id - b.id)
    }, [attributesSelected])

    const [isShowConnectDialog, setShowConnectDialog] = useState(false);
    const [isShowGrpClassify, setShowGrpClassify] = useState(false)
    const [isShowClassify, setShowClassify] = useState(false);
    const [isShowChooseProduct, setShowChooseProduct] = useState(false);
    const [isShowConnectReject, setShowConnectReject] = useState(false);
    const [dataAttribute, setDataAttribute] = useState({
        smeAttr: [],
        scAttr: (dataAttributeSc || [])?.map(
            _item => ({
                value: _item?.id,
                label: _item?.name
            })
        )
    });

    const [valueSelected, setValueSelected] = useState({
        code: null,
        sc_id: null,
        sc_variant_id: null,
        sme_id: null
    });

    const onShowConnectGrpClassify = useCallback(
        () => {
            setShowGrpClassify(true)
        }, [isShowGrpClassify, setShowGrpClassify]
    );

    console.log({ productEditing, variants, smeProduct })

    const _buildSkuScProduct = useCallback(
        (attributes) => {
            if (!productEditing) return null;

            const findedScProduct = productEditing?.productVariants?.find(
                _variant => {
                    let variantParse = JSON.parse(_variant?.sc_product_attributes_value);

                    return attributes?.every(_att => variantParse.some(_var => _var == _att))
                }
            );

            return findedScProduct?.sku || null
        }, [productEditing]
    )

    const _buildSkuSmeProduct = useCallback(
        (code) => {
            if (!smeProduct) return '';

            const findedSmeProduct = smeProduct?.sme_catalog_product_variants?.find(
                _variant => _variant.id == values[`variant-${code}-sme_product_variant_id`]
            );

            console.log({ findedSmeProduct })

            return findedSmeProduct?.sku || 'Liên kết'
        }, [smeProduct, values]
    );

    return (
        <CardBody>
            {_filterAttributeSelected.length > 0 ? (
                <div className="row col-12" data-sticky-container>
                    <div className="table-responsive mt-10">
                        <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                            <thead>
                                <tr className="text-left text-uppercase" >
                                    {
                                        _filterAttributeSelected.map(_attribute => {
                                            return (
                                                <th style={{fontSize: '14px', border: '1px solid' }} key={`header--${_attribute.id}`} >
                                                    <span className="text-dark-75">{_attribute.display_name}</span>
                                                </th>
                                            )
                                        })
                                    }
                                    <th style={{fontSize: '14px', border: '1px solid' }} ><span className="text-dark-75">Mã SKU</span><span style={{ color: 'red' }} >*</span></th>
                                    <th style={{ fontSize: '14px', border: '1px solid' }}><span className="text-dark-75">Mã SKU sản phẩm kho</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    variants.map(
                                        _row => (
                                            <tr key={`row-connect-${_row.code}`}>
                                                {
                                                    _row.names.map((_text, index) => {
                                                        return (
                                                            <td key={`row-table-${_row.code}--${index}`} rowSpan={index == 0 ? _row.rowSpan : 1} style={{ border: '1px solid #9e9999' }}>
                                                                <span>
                                                                    {_text}
                                                                </span>
                                                            </td>
                                                        )
                                                    })
                                                }
                                                <td style={{ border: '1px solid #9e9999', fontWeight: 'bold' }}>
                                                    {_buildSkuScProduct(_row.attributes?.map(_att => _att?.attribute_value_ref_index))}
                                                </td>
                                                <td
                                                    style={{
                                                        border: '1px solid #9e9999',
                                                        color: _buildSkuSmeProduct(_row.code) == 'Liên kết' ? '#f94e30' : '#6067d9',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        if (_buildSkuSmeProduct(_row.code) != 'Liên kết') {
                                                            const findedSmeProduct = smeProduct?.sme_catalog_product_variants?.find(
                                                                _variant => _variant.id == values[`variant-${_row.code}-sme_product_variant_id`]
                                                            );

                                                            if (!!productEditing && !!productEditing.sme_product_id) {
                                                                history.push(`/products/edit/${productEditing.sme_product_id}/affiliate`)
                                                            } else return;
                                                        };

                                                        if (!smeProduct) {
                                                            setShowConnectReject(true);
                                                            return;
                                                        }

                                                        let scProductId = productEditing?.productVariants?.find(
                                                            ii => ii.name == _row.name
                                                        )?.id || null;

                                                        setValueSelected({
                                                            ...valueSelected,
                                                            code: _row.code,
                                                            sc_variant_id: scProductId
                                                        })
                                                        setShowClassify(true);
                                                        //success
                                                        // setFieldValue(`variant-${_row.code}-sme_product_variant_id`, 'sdfdsfsd', false)

                                                    }}
                                                >
                                                    {!!smeProduct ? (_buildSkuSmeProduct(_row.code) || <span className="ml-3 spinner spinner-primary"></span>) : null}
                                                </td>
                                            </tr>
                                        )
                                    )
                                }
                            </tbody>
                        </table>
                    </div >
                </div>
            ) : (
                <div className="row col-12" data-sticky-container>
                    <div className="table-responsive mt-10">
                        <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                            <thead>
                                <tr className="text-left text-uppercase" >
                                    <th style={{ border: '1px solid' }}><span className="text-dark-75">Sản phẩm</span></th>
                                    <th style={{ border: '1px solid' }} ><span className="text-dark-75">Mã SKU</span><span style={{ color: 'red' }} >*</span></th>
                                    <th style={{ border: '1px solid' }}><span className="text-dark-75">Mã SKU sản phẩm kho</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ border: '1px solid #9e9999', fontWeight: 'bold' }}>{productEditing?.name || ''}</td>
                                    <td style={{ border: '1px solid #9e9999', fontWeight: 'bold' }}>{productEditing?.sku || ''}</td>
                                    <td
                                        style={{ border: '1px solid #9e9999', fontWeight: 'bold', color: !smeProduct ? '#f94e30' : '#6067d9', cursor: 'pointer' }}
                                        onClick={e => {
                                            e.preventDefault();
                                            if (!!smeProduct) {
                                                history.push(`/products/edit/${productEditing?.sme_product_id}`)
                                            } else {
                                                onShowConnect()
                                            }
                                        }}
                                    >
                                        {!!smeProduct ? smeProduct?.sku : 'Liên kết'}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }

            <LoadingDialog show={loadingCreateSmeProduct || loadingSettingVariant} />

            <Modal
                show={showConnect}
                aria-labelledby="example-modal-sizes-title-xl"
                centered
                onHide={onHideConnect}
                backdrop={true}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    {
                        !loadingCreateSmeProduct && (
                            <>
                                <div className="mb-6" style={{ fontSize: 16 }}>
                                    Bạn muốn liên kết với sản phẩm kho đã có hay tạo sản phẩm kho mới?
                                </div>
                                <div className="form-group mb-0">
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-elevate mr-3"
                                        style={{ width: 160 }}
                                        onClick={async () => {
                                            onHideConnect()
                                            let res = await scCreateSmeProduct({
                                                variables: {
                                                    store_id: productEditing?.store_id,
                                                    sc_product_id: productEditing?.id

                                                }
                                            });

                                            if (!!res?.data?.scCreateSmeProduct?.success) {
                                                addToast('Đã tạo sản phẩm kho', { appearance: 'success' });
                                            } else {
                                                setShowError(true)
                                            }
                                        }}
                                    >
                                        <span className="font-weight-boldest">Tạo sản phẩm kho mới</span>
                                    </button>
                                    <button
                                        id="kt_login_signin_submit"
                                        className={`btn btn-primary btn-elevate`}
                                        style={{ width: 160 }}
                                        onClick={e => {
                                            onHideConnect()
                                            setShowConnectDialog(true)
                                        }}
                                    >
                                        <span className="font-weight-boldest">Liên kết sản phẩm kho đã có</span>
                                    </button>
                                </div>
                            </>
                        )
                    }
                </Modal.Body>
            </Modal>

            <Modal
                show={showError}
                aria-labelledby="example-modal-sizes-title-xl"
                centered
                onHide={() => setShowError(false)}
                backdrop={'static'}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center">
                    <div className="mb-2" >Tạo sản phẩm kho bị lỗi</div>
                    <div className="mb-6" >({data?.scCreateSmeProduct?.message || ''})</div>
                    <div className="form-group mb-0">
                        <button
                            className="btn btn-light btn-elevate mr-3"
                            style={{ width: 90 }}
                            onClick={() => setShowError(false)}
                        >
                            <span className="font-weight-boldest">Huỷ</span>
                        </button>
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 90 }}
                            onClick={async () => {
                                setShowError(false)
                                let res = await scCreateSmeProduct({
                                    variables: {
                                        store_id: productEditing?.store_id,
                                        sc_product_id: productEditing?.id

                                    }
                                });

                                if (!!res?.data?.scCreateSmeProduct?.success) {
                                    addToast('Đã tạo sản phẩm kho', { appearance: 'success' });
                                } else {
                                    setShowError(true)
                                }
                            }}
                        >
                            <span className="font-weight-boldest">Thử lại</span>
                        </button>
                    </div>
                </Modal.Body>
            </Modal>

            <ProductConnectDialog
                show={isShowConnectDialog}
                onHide={() => setShowConnectDialog(false)}
                scId={scId}
                hasVariants={productEditing?.variantAttributeValues?.length > 0}
                dataAttributeSc={dataAttributeSc}
                setDataAttribute={setDataAttribute}
                setValueSelected={setValueSelected}
                onShowConnectGrpClassify={onShowConnectGrpClassify}
            />

            <ProductConnectGroupClassify
                show={isShowGrpClassify}
                onHide={() => setShowGrpClassify(false)}
                sc_product_id={scId}
                sme_product_id={valueSelected.sme_id}
                dataAttribute={dataAttribute}
            />

            <ProductConnectClassify
                show={isShowClassify}
                onHide={() => setShowClassify(false)}
                sc_variant_id={valueSelected.sc_variant_id}
                smeProductData={smeProduct}
                scProductsData={productEditing?.productVariants}
                resetAll={resetAll}
                code={valueSelected.code}
            />

            <Modal
                show={isShowConnectReject}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                onHide={() => setShowConnectReject(false)}
                backdrop={true}
            >
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='text-center'>
                        <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                        <div className="mb-4" ></div>
                        <div className="mb-4" >Bạn chưa liên kết sản phẩm kho</div>
                        <p className='text-center'>Vui lòng thử lại</p>
                        <div  >
                            <button
                                type="button"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 150 }}
                                onClick={() => {
                                    setShowConnectReject(false);
                                }}
                            >
                                <span className="font-weight-boldest">Huỷ</span>
                            </button>
                            <button
                                id="kt_login_signin_submit"
                                className={`btn btn-primary font-weight-bold px-9 `}
                                style={{ width: 150 }}
                                onClick={e => {
                                    setShowConnectReject(false)
                                }}
                            >
                                <span className="font-weight-boldest">Liên kết ngay</span>
                            </button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </CardBody >
    )
}
