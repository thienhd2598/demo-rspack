import React, { Fragment, useCallback, useState } from "react";
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
import { Field, useFormikContext, Form, Formik } from "formik";
import CreatableSelect from 'react-select/creatable';
import { useToasts } from "react-toast-notifications";
import _ from 'lodash';
import { useIntl } from "react-intl";
import { queryCheckExistGtin, queryCheckExistSku, queryCheckExistSkuMain } from "../ProductsUIHelpers";
import { createSKUProduct } from "../../../../utils";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useQuery } from "@apollo/client";
import { useParams } from 'react-router-dom'
import query_sme_cataglog_inventories_by_product_id from "../../../../graphql/query_sme_cataglog_inventories_by_product_id";
import ModalProductConnectVariant from "../products-list/dialog/ModalProductConnectVariant";
import TableInventory from "./TableInventory";
import query_sme_product_status from "../../../../graphql/query_sme_product_status";

const ProductInventory = ({ isCreating = true, isCombo = false, isSyncVietful, syncedVariants }) => {
    const { formatMessage } = useIntl();
    const { addToast, removeAllToasts } = useToasts();
    const { setFieldValue, values } = useFormikContext()
    const params = useParams()
    const { currentProduct, smeCatalogStores, refetchGetWarehouse, isUnit } = useProductsUIContext();
    const [showModalStockOnHand, setShowModalStockOnHand] = useState(false);
    const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null)
    const [expandedStores, setExpandedStores] = useState(new Set());

    const user = useSelector((state) => state.auth.user);
    const checkExistSku = useCallback(async (code) => {
        if (code.trim().length == 0) {
            return false;
        }
        if (await queryCheckExistSku(currentProduct?.id, code)) {
            setFieldValue(`variant-origin-sku_boolean`, { origin_sku: true })
        } else {
            setFieldValue(`variant-origin-sku_boolean`, { origin_sku: false })
        }
    }, [currentProduct?.id]);

    const checkExistGtin = useCallback(async (code) => {
        if (code.trim().length == 0) {
            return false;
        }
        const existed = await queryCheckExistGtin(currentProduct?.id, code);
        if (existed) {
            setFieldValue(`variant-gtin_boolean`, { gtin: true })
        } else {
            setFieldValue(`variant-gtin_boolean`, { gtin: false })
        }
    }, [currentProduct?.id])

    const { data, loading, refetch } = useQuery(query_sme_cataglog_inventories_by_product_id, {
        variables: {
            product_id: params?.id
        },
        fetchPolicy: 'cache-and-network'
    })

    const {data: statusData} = useQuery(query_sme_product_status,
        {fetchPolicy: 'no-cache'})

    const toggleStoreExpansion = (storeValue) => {
        const newExpandedStores = new Set(expandedStores);
        if (newExpandedStores.has(storeValue)) {
          newExpandedStores.delete(storeValue);
        } else {
          newExpandedStores.add(storeValue);
        }
        setExpandedStores(newExpandedStores);
      };
    function sortArray(a, b) {
        if (a.variant.product_status_id === null && b.variant.product_status_id !== null) {
            return -1;
        } else if (a.variant.product_status_id !== null && b.variant.product_status_id === null) {
            return 1;
        } else {
            return 0;
        }
    }

    console.log(isSyncVietful)
    return (
        <Fragment>
            <ModalProductConnectVariant
                variantId={currentProductVariantLinked}
                onHide={() => setCurrentProductVariantLinked(null)}
            />
            <Card>
                <div className="d-flex align-items-center ">
                    <div style={{
                        fontWeight: 500,
                        fontSize: "1.275rem",
                        color: '#000000',
                        marginRight: '3px',
                        paddingLeft: '12px'
                    }}>
                        {formatMessage({ defaultMessage: "THÔNG TIN KHO" })}
                    </div>
                    <span
                        className={`${data?.sme_catalog_inventories[0]?.variant?.sc_variant_linked?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12'}
                        onClick={() => {
                            if (data?.sme_catalog_inventories[0]?.variant?.sc_variant_linked?.length === 0) return;
                            setCurrentProductVariantLinked(data.sme_catalog_inventories[0]?.variant?.id)
                        }}>
                        {data?.sme_catalog_inventories[0]?.variant?.sc_variant_linked?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
                    </span>
                </div>
                {!!values[`switch-unit`] && (
                    <TableInventory
                        isCreating={isCreating}
                        isCombo={isCombo}
                        isSyncVietful={isSyncVietful}
                        syncedVariants={syncedVariants}
                    />
                )}
                {!values[`switch-unit`] && <CardBody>
                    <div className='row'>
                        <div className={`col-md-6`} style={{ position: 'relative' }}>
                            <Field
                                name="origin_sku"
                                component={InputVertical}
                                placeholder=""
                                disabled={isSyncVietful}
                                label={formatMessage({ defaultMessage: "Mã SKU hàng hóa" })}
                                tooltip={formatMessage({ defaultMessage: "Mã SKU của hàng hóa phục vụ cho mục đích quản lý tồn kho" })}
                                required={true}
                                customFeedbackLabel={' '}
                                countChar
                                maxChar={50}
                                absolute
                                onBlurChange={async (value) => {
                                    await checkExistSku(value)
                                }}
                            />
                            {!values.origin_sku &&
                                <a href="#" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem' }}
                                    onClick={e => {
                                        e.preventDefault()

                                        if (!!values.name)
                                            setFieldValue('origin_sku', createSKUProduct(user?.sme_id, values.name || ''))
                                        else {
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập tên sản phẩm' }), { appearance: 'warning' });
                                        }

                                    }}
                                >{formatMessage({ defaultMessage: 'Tự động tạo' })}</a>}
                        </div>
                        <div className={`col-md-6`} >
                            <label className="col-form-label">GTIN
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Mã vạch sản phẩm từ lúc xuất xưởng. Nếu để trống, mã SKU sẽ được lấy làm mã vạch sản phẩm.' })}
                                        </Tooltip>
                                    }
                                >
                                    <i className="ml-2 fas fa-info-circle"></i>
                                </OverlayTrigger>
                            </label>
                            <Field
                                name="gtin"
                                component={InputVertical}
                                disabled={isSyncVietful || !!values['is_has_sell_info']}
                                placeholder={formatMessage({ defaultMessage: 'Nhập GTIN' })}
                                required={false}
                                countChar
                                maxChar={120}
                                onBlurChange={async (value) => {
                                    await checkExistGtin(value)
                                }}
                                tooltip={formatMessage({ defaultMessage: 'Mã vạch sản phẩm từ lúc xuất xưởng. Nếu để trống, mã SKU sẽ được lấy làm mã vạch sản phẩm.' })}
                                customFeedbackLabel={' '}
                                absolute
                            />
                        </div>
                    </div>
                    <div className="row mt-2">
                        <div className="col-md-6">
                            <Field
                                name="price"
                                component={InputVertical}
                                type='number'
                                placeholder=""
                                label={formatMessage({ defaultMessage: 'Giá bán' })}
                                tooltip={formatMessage({ defaultMessage: 'Giá bán dùng để set giá của sản phẩm được hiển thị trên sàn.' })}
                                required={false}
                                customFeedbackLabel={' '}
                                addOnRight="đ"
                                absolute
                            />
                        </div>
                        <div className="col-md-6">
                            <Field
                                name="priceMinimum"
                                component={InputVertical}
                                type='number'
                                placeholder=""
                                label={formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}
                                tooltip={formatMessage({ defaultMessage: 'Giá bán tối thiểu dùng làm căn cứ để set giá ở chương trình khuyến mại. Giá ở chương trình khuyến mại không được nhỏ hơn giá bán tối thiểu.' })}
                                required={false}
                                customFeedbackLabel={' '}
                                addOnRight="đ"
                                absolute
                            />
                        </div>
                    </div>
                    <div className='row mt-2'>
                        {!isUnit && !isCombo &&<div className={`col-md-6`} >
                            <div className="row">
                                <div className="col-md-12">
                                    <Field
                                        name="unit"
                                        component={InputVertical}
                                        placeholder=""
                                        required={false}
                                        disabled={isSyncVietful}
                                        label={formatMessage({ defaultMessage: 'Đơn vị tính' })}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div>
                                
                            </div>
                        </div>}
                        <div className={`col-md-${!isCombo ? 6 : 12}`} >
                            <div className="row">
                                <div className="col-md-12">
                                    <Field
                                        name="stockWarning"
                                        component={InputVertical}
                                        type='number'
                                        placeholder=""
                                        required={false}
                                        label={formatMessage({ defaultMessage: 'Cảnh báo tồn' })}
                                        tooltip={formatMessage({ defaultMessage: 'Sản phẩm sẽ đưa vào danh sách “Sắp hết hàng” khi tồn kho sẵn sàng bán nhỏ hơn ngưỡng cảnh báo tồn.' })}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div>
                                {/* <div className="col-md-6">
                                    <label className="col-form-label">VAT
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip>
                                                    {formatMessage({ defaultMessage: 'Sẽ được sử dụng tính VAT khi xuất hóa đơn.' })}
                                                </Tooltip>
                                            }
                                        >
                                            <i className="ml-2 fas fa-info-circle"></i>
                                        </OverlayTrigger>
                                    </label>
                                    <Field
                                        name="vatRate"
                                        component={InputVertical}
                                        type='number'
                                        placeholder={formatMessage({ defaultMessage: 'Nhập VAT' })}
                                        required={false}
                                        tooltip={formatMessage({ defaultMessage: 'Sẽ được sử dụng tính VAT khi xuất hóa đơn' })}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div> */}

                            </div>

                        </div>
                    </div>
                    <div className="row mt-2">
                        {!isCombo && !isCreating && (
                            <div className={`col-md-6`} >
                                <div className="row align-items-end">
                                    <div className="col-md-7">
                                        <Field
                                            name="stockOnHand"
                                            component={({ }) => {
                                                const totalStockOnHandVariant = smeCatalogStores?.reduce(
                                                    (result, store) => {
                                                        result += values[`${store?.value}-stockOnHand`] || 0;
                                                        return result;
                                                    }, 0
                                                );

                                                return (
                                                    <div className="d-flex flex-column">
                                                        <div className="d-flex align-items-center">
                                                            <label className="col-form-label mr-1">
                                                                {isCreating ? formatMessage({ defaultMessage: 'Tồn đầu' }) : formatMessage({ defaultMessage: 'Tồn kho' })}
                                                            </label>
                                                            <OverlayTrigger
                                                                overlay={
                                                                    <Tooltip>
                                                                        {formatMessage({ defaultMessage: 'Tồn thực tế đã kiểm kho trước đó' })}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <i className="fas fa-info-circle"></i>
                                                            </OverlayTrigger>
                                                        </div>
                                                        <span style={{ width: '100%', border: '1px solid #f7f7fa', background: '#f7f7fa', borderRadius: 4, padding: '8px 13px' }}>
                                                            {totalStockOnHandVariant.toLocaleString("en-US")}
                                                        </span>
                                                    </div>
                                                )
                                            }}
                                            disable
                                            type='number'
                                            placeholder=""
                                            required={false}
                                            label={formatMessage({ defaultMessage: 'Tồn đầu' })}
                                            tooltip={formatMessage({ defaultMessage: 'Tồn thực tế đã kiểm kho trước đó' })}
                                            customFeedbackLabel={' '}
                                            absolute
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <button
                                            type="button"
                                            disabled={!!values['is_has_sell_info']}
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                            onClick={() => {
                                                setShowModalStockOnHand(true)
                                                refetchGetWarehouse()
                                            }}
                                        >
                                            {isCreating ? formatMessage({ defaultMessage: 'Cập nhật tồn' }) : formatMessage({ defaultMessage: 'Chi tiết tồn kho' })}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    
                </CardBody>}
            </Card >

            <Modal
                show={showModalStockOnHand && !isCreating}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName={isCreating ? "modal-show-stock-product" : "modal-show-detail-stock-product"}
                centered
                onHide={() => {
                    setShowModalStockOnHand(false)
                }}
                backdrop={true}
            >
                {/* {isCreating &&
                    <Formik
                        initialValues={smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = values[`${store?.value}-stockOnHand`] || 0;
                                return result;
                            }, {}
                        )}
                        validationSchema={Yup.object().shape(smeCatalogStores.reduce(
                            (result, store) => {
                                result[`${store?.value}-stockOnHand`] = Yup.number()
                                    .min(0, formatMessage({ defaultMessage: "Giá trị cần nhập {min}->{max}" }, { min: 0, max: '999.999' }))
                                    .max(999999, 'Số lượng sản phẩm tối đa 999.999');

                                return result;
                            }, {}
                        ))}
                        enableReinitialize
                    >
                        {({
                            handleSubmit,
                            values: valuesStockOnHand,
                            validateForm
                        }) => {

                            return (
                                <Form>
                                    <Modal.Header closeButton={true}>
                                        <Modal.Title>
                                            {formatMessage({ defaultMessage: 'Thiết lập tồn kho đầu' })}
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
                                                <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {values[`origin_sku`] || '--'}</span>
                                                <span style={{ width: '50%' }}>GTIN: {values[`gtin`] || '--'}</span>
                                            </div>
                                            <table className="table product-list table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                                <thead>
                                                    <tr className="text-left text-uppercase" >
                                                        <th style={{ border: '1px solid', fontSize: '14px' }} width='50%'>
                                                            <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho' })}</span>
                                                        </th>
                                                        <th style={{ border: '1px solid', fontSize: '14px' }} width='50%'>
                                                            <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn đầu' })}</span>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {smeCatalogStores?.map(
                                                        (_store, index) => {

                                                            return (
                                                                <tr key={`sme-catalog-store-${index}`}>
                                                                    <td style={{ border: '1px solid #c8c7c9' }}>
                                                                        <span className="text-dark-75" >
                                                                            {_store?.label}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ border: '1px solid #c8c7c9', padding: '1.25rem 0.75rem' }}>
                                                                        <Field
                                                                            name={`${_store?.value}-stockOnHand`}
                                                                            component={InputVertical}
                                                                            placeholder=""
                                                                            label={false}
                                                                            type='number'
                                                                            customFeedbackLabel={' '}
                                                                            absolute={true}
                                                                        />
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
                                                onClick={async () => {
                                                    let error = await validateForm(valuesStockOnHand);
                                                    console.log('valuesStockOnHand', valuesStockOnHand)
                                                    const isErrorForm = Object.keys(error)?.length > 0

                                                    if (isErrorForm) {
                                                        handleSubmit();
                                                    } else {
                                                        smeCatalogStores.forEach(
                                                            _store => {
                                                                setFieldValue(
                                                                    `${_store?.value}-stockOnHand`,
                                                                    valuesStockOnHand[`${_store?.value}-stockOnHand`] || 0
                                                                );
                                                            }
                                                        )
                                                        setShowModalStockOnHand(false);
                                                    }
                                                }}
                                                className="btn btn-primary btn-elevate mr-3"
                                                style={{ width: 100 }}
                                            >
                                                {formatMessage({ defaultMessage: 'Cập nhật' })}
                                            </button>
                                        </div>
                                    </Modal.Footer>
                                </Form>
                            )
                        }}
                    </Formik>
                } */}

                {!isCreating && (
                    <>
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
                                    <span style={{ width: '50%' }}><img className="mr-2" src={toAbsoluteUrl('/media/ic_sku.svg')} /> {values[`origin_sku`] || '--'}</span>
                                    <span style={{ width: '50%' }}>GTIN: {values[`gtin`] || '--'}</span>
                                </div>
                                <table className="table table-head-custom table-head-bg  table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderRight: '1px solid transparent' }}>
                                    <thead>
                                        <tr className="text-uppercase" >
                                            <th style={{ border: '1px solid' }} width='16%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Kho vật lý' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Trạng thái hàng hóa' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tồn thực tế' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm giữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Tạm ứng' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Dự trữ' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Sẵn sàng bán' })}</span>
                                            </th>
                                            <th style={{ border: '1px solid' }} className="text-center" width='12.5%'>
                                                <span className="text-dark-75">{formatMessage({ defaultMessage: 'Đang vận chuyển' })}</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {smeCatalogStores?.map(
                                            (_store, index) => {
                                                let statusProductArray = values.inventoryStatusVariant.filter(item => item.sme_store_id == _store.value && (item?.variant?.parent_variant_id == values[`origin_id`] || item?.variant?.id == values[`origin_id`]))
                                                statusProductArray.sort(sortArray)
                                                const isStoreExpanded = expandedStores.has(_store.value);
                                                const stockActual = values[`${_store?.value}-stockActual`] || 0;
                                                const stockAllocated = values[`${_store?.value}-stockAllocated`] || 0;
                                                const stockReserve = values[`${_store?.value}-stockReserve`] || 0;
                                                const stockPreallocate = values[`${_store?.value}-stockPreallocate`] || 0;
                                                const stockAvailable = values[`${_store?.value}-stockAvailable`] || 0;
                                                const stockShipping = values[`${_store?.value}-stockShipping`] || 0;

                                                return (
                                                    <>
                                                    <tr key={`sme-catalog-store-${index}`}>
                                                        <td style={{ border: '1px solid #c8c7c9',display: 'flex',justifyContent: 'space-between', alignItems:'center' }}>
                                                            <span className="text-dark-75" >
                                                                {_store?.label}
                                                            </span>
                                                            {!!statusData?.sme_product_status?.length && (!isStoreExpanded ? <span style={{cursor: 'pointer'}} onClick={() => toggleStoreExpansion(_store.value)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                                        </span> 
                                                        : <span onClick={() => toggleStoreExpansion(_store.value)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg></span>)}
                                                        </td>
                                                        <td
                                                        style={{
                                                          border:
                                                            '1px solid #c8c7c9',
                                                        }}
                                                        className="text-center"
                                                      >
                                                        {statusData?.sme_product_status?.length ? 'Tất cả' : "Mới"}
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
                                                            {stockAvailable}
                                                        </td>
                                                        <td style={{ border: '1px solid #c8c7c9' }} className="text-center">
                                                            {stockShipping}
                                                        </td>
                                                    </tr>
                                                    {!!statusData?.sme_product_status?.length && isStoreExpanded &&statusProductArray?.map(
                                                        (status) => {
                                                          return (
                                                            <tr>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                              >
                                                                <span className="text-dark-75">
                                                                  {status.sku}
                                                                </span>
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.variant.product_status_id ? status.variant
                                                                    .product_status_name : 'Mới'
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_actual
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_allocated
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_preallocate
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_reserve
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_available
                                                                }
                                                              </td>
                                                              <td
                                                                style={{
                                                                  border:
                                                                    '1px solid #c8c7c9',
                                                                }}
                                                                className="text-center"
                                                              >
                                                                {
                                                                  status.stock_shipping
                                                                }
                                                              </td>
                                                            </tr>
                                                          );
                                                        }
                                                      )}
                                                    </>
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
                    </>
                )}
            </Modal>
        </Fragment>
    )
};

export default ProductInventory;