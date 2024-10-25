import React, { Fragment, memo, useMemo } from "react";
import { useIntl } from "react-intl";
import Select from 'react-select';
import DateRangePicker from 'rsuite/DateRangePicker';
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Field, useFormikContext } from "formik";
import { useVoucherContext } from "../contexts/VoucherContext";
import { OPTIONS_CONFIG_DISPLAY, OPTIONS_PRODUCT_APPLY } from "../Constants";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { formatNumberToCurrency } from "../../../../utils";
import { maxBy, minBy, sumBy } from "lodash";
import HoverImage from "../../../../components/HoverImage";
import InfoProduct from "../../../../components/InfoProduct";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import Pagination from "../pagination";
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import queryString from 'querystring';
import clsx from "clsx";
import { useMutation } from "@apollo/client";
import mutate_retryCampaignItem from "../../../../graphql/mutate_retryCampaignItem";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import { useToasts } from "react-toast-notifications";

const TableVoucher = ({ loading = false, isActionView = false, setShowAddProduct, isEdit = false, isTemplate = false, voucherDetail = null }) => {
    const { productsVoucher, setProductsVoucher, page, limit, paramsQuery } = useVoucherContext();
    const { formatMessage } = useIntl();
    const params = useParams();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const { setFieldValue, errors, touched, values } = useFormikContext();

    const [retryCampaignItem, { loading: loadingRetryItem }] = useMutation(mutate_retryCampaignItem);

    const titleConfig = useMemo(() => {
        if (values?.channel == 'shopee') {
            if (values?.type == 20 || values?.type == 23) {
                return formatMessage({ defaultMessage: 'Hiển thị nhiều nơi' })
            }

            if (values?.type == 21) {
                return formatMessage({ defaultMessage: 'Livestreams' })
            }

            if (values?.type == 22) {
                return formatMessage({ defaultMessage: 'Video' })
            }
        }
        if (values?.channel == 'lazada') {
            if (values?.type == 21) {
                return formatMessage({ defaultMessage: 'Livestreams' })
            }
            if (values?.type == 26) {
                return formatMessage({ defaultMessage: 'Ngoại tuyến' })
            }
        }

        return null
    }, [values?.channel, values?.type]);

    const statusCampaignItems = useMemo(() => {
        const statusList = [
            {
                type: 2,
                title: formatMessage({ defaultMessage: 'Đồng bộ thành công' }),
                count: productsVoucher?.filter(item =>
                    values?.channel != 'lazada'
                        ? !item?.sync_error_message && item?.sync_status == 2
                        : item?.productVariants?.some(variant => !variant?.sync_error_message && variant?.sync_status == 2)
                )?.length
            },
            {
                type: 1,
                title: formatMessage({ defaultMessage: 'Đồng bộ lỗi' }),
                count: productsVoucher?.filter(item =>
                    values?.channel != 'lazada'
                        ? !!item?.sync_error_message
                        : item?.productVariants?.some(variant => !!variant?.sync_error_message)

                )?.length

            },
            {
                type: 3,
                title: formatMessage({ defaultMessage: 'Chưa đồng bộ' }),
                count: productsVoucher?.filter(item =>
                    values?.channel != 'lazada'
                        ? item?.sync_status == 1
                        : item?.productVariants?.some(variant => variant?.sync_status == 1)
                )?.length

            },
        ];

        return statusList
    }, [productsVoucher, paramsQuery, values?.channel]);

    const channelCode = useMemo(() => values?.channel, [values?.channel]);

    const [dataTable, dataTabs] = useMemo(() => {
        let data = [];

        if (paramsQuery?.type) {
            data = productsVoucher?.filter(item => {
                if (paramsQuery?.type == 1) {
                    return values?.channel != 'lazada'
                        ? !!item?.sync_error_message
                        : item?.productVariants?.some(variant => !!variant?.sync_error_message)
                }

                if (paramsQuery?.type == 2) {
                    return values?.channel != 'lazada'
                        ? !item?.sync_error_message && item?.sync_status == 2
                        : item?.productVariants?.some(variant => !variant?.sync_error_message && variant?.sync_status == 2)
                }

                if (paramsQuery?.type == 3) {
                    return values?.channel != 'lazada'
                        ? item?.sync_status == 1
                        : item?.productVariants?.some(variant => variant?.sync_status == 1)
                }
            })
        } else {
            data = productsVoucher
        }

        return [data?.slice((page - 1) * limit, page * limit), data]
    }, [productsVoucher, paramsQuery, page, limit, values?.channel]);

    const buildProductVariants = (variant, product) => {
        const variantsActive = product?.productVariants?.filter(variant => values[`campaign-${product?.id}-${variant?.id}-active`]);
        const isDisabledSwitch = variantsActive?.length == 1;

        return (
            <Fragment>
                <td style={{ fontSize: '14px', borderTop: 'none', borderBottom: 'none' }}>
                    <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                        <div style={{
                            width: 68, height: 68,
                            borderRadius: 8,
                            overflow: 'hidden',
                            minWidth: 68
                        }} className='mr-6' />
                        <div className='w-100 d-flex flex-column justify-content-center'>
                            <InfoProduct
                                short={true}
                                sku={variant.sku}
                            // url={`/product-stores/edit/${product.id}`}
                            />
                            {variant?.name != product?.name && <span className='font-weight-normal text-secondary-custom' >{variant?.name?.replaceAll(' + ', ' - ')}</span>}
                        </div>
                    </div>

                </td>
                <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <span>{formatNumberToCurrency(variant?.price) || ''} đ</span>
                </td>
                <td style={{ fontSize: '14px', textAlign: 'center', borderTop: 'none', borderBottom: 'none' }}>
                    <span>{variant?.sellable_stock}</span>
                </td>
                {values?.type != 'other' && (
                    <td className="text-center" style={{ borderTop: 'none', borderBottom: 'none' }}>
                        <span className="switch d-flex justify-content-center" style={{ transform: 'scale(0.9)' }}>
                            <label>
                                <input
                                    type={'checkbox'}
                                    style={{ background: '#F7F7FA', border: 'none' }}
                                    disabled={(values[`campaign-${product?.id}-${variant?.id}-active`] && isDisabledSwitch) || isActionView || variant?.sellable_stock == 0 || (isEdit && values?.status == 2 && variant?.sync_status != 1 && !!voucherDetail?.ref_id)}
                                    onChange={() => {
                                        setFieldValue(`campaign-${product?.id}-${variant?.id}-active`, !values[`campaign-${product?.id}-${variant?.id}-active`]);
                                    }}
                                    checked={values[`campaign-${product?.id}-${variant?.id}-active`]}
                                />
                                <span></span>
                            </label>
                        </span>
                    </td>
                )}
            </Fragment>
        )
    }

    return (
        <Card style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <LoadingDialog show={loadingRetryItem} />
            <div className="m-4">
                <div className="mb-8">
                    <strong className="fs-14" style={{ color: '#000' }}>
                        {formatMessage({ defaultMessage: 'HIỂN THỊ MÃ GIẢM GIÁ VÀ CÁC SẢN PHẨM ÁP DỤNG' })}
                    </strong>
                </div>
                {!!titleConfig && <div className="row mb-8">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Thiết lập hiển thị' })}</span>
                    </div>
                    <div className="col-4">
                        <span>{titleConfig}</span>
                    </div>
                </div>}
                <div className="row">
                    <div className="col-2">
                        <span>{formatMessage({ defaultMessage: 'Sản phẩm được áp dụng' })}</span>
                        <span className="text-danger">*</span>
                    </div>
                    <div className='col-4 '>
                        <Field
                            name="typeItem"
                            component={RadioGroup}
                            curr
                            disabled={isActionView || (isEdit && values?.status == 2 && !!voucherDetail?.ref_id)}
                            customFeedbackLabel={' '}
                            options={OPTIONS_PRODUCT_APPLY?.filter(item => {
                                const isDisplayOnlyShop = values?.type == 25
                                    || (values?.channel == 'shopee' && values?.type == 24);

                                if (isDisplayOnlyShop) {
                                    return item?.value == 3
                                }

                                return true
                            })}
                            onChangeOption={() => {
                                // if (campaignItems.length > 0) {
                                //     setShowWarningPrompt(true)
                                // } else {
                                // }
                                if (values[`typeItem`] == 1) {
                                    setFieldValue('typeItem', 3)
                                } else {
                                    setFieldValue('typeItem', 1)
                                }
                            }}
                        />
                    </div>
                </div>
                {values?.typeItem == 1 && <Fragment>
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => setShowAddProduct(true)}
                            className="btn btn mr-3"
                            disabled={!values?.store || isActionView}
                            style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                        >
                            {formatMessage({ defaultMessage: '+ Thêm sản phẩm' })}
                        </button>
                    </div>
                    {isEdit && values?.status != 1 && <ul className="nav nav-tabs" id="myTab" role="tablist"
                    // style={{ position: 'sticky', top: 80, zIndex: 1, background: '#fff', borderBottom: 'none' }}
                    >
                        {statusCampaignItems?.map(item => {
                            return (
                                <li className={clsx(`product-status-nav nav-item`, { active: paramsQuery?.type == item?.type })}>
                                    <a
                                        className={clsx(`nav-link font-weight-normal`, { active: paramsQuery?.type == item?.type })}
                                        style={{ fontSize: '13px', minWidth: 100, }}
                                        onClick={e => {
                                            history.push(`${location.pathname}?${queryString.stringify({
                                                ...paramsQuery,
                                                page: 1,
                                                type: item?.type,
                                            })}`)
                                        }}
                                    >
                                        {`${item?.title} (${item?.count})`}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>}
                    <table className="table table-borderless product-list table-vertical-center fixed">
                        <thead
                            style={{
                                position: 'sticky',
                                top: 45,
                                zIndex: 1,
                                background: '#F3F6F9',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                borderBottom: '1px solid gray',
                                borderLeft: '1px solid #d9d9d9',
                            }}
                        >
                            <th
                                style={{ fontSize: '14px' }}
                                width="45%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Sản phẩm' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="25%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Giá bán' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="20%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Có sẵn' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="10%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Thao tác' })}
                                </span>
                            </th>
                        </thead>
                        <tbody style={{ borderBottom: '0.5px solid #cbced4' }}>
                            {dataTable?.map(product => {
                                const campaignVariants = product?.productVariants?.filter(variant => {
                                    if (paramsQuery?.type) {
                                        if (paramsQuery?.type == 1) return !!variant?.sync_error_message
                                        if (paramsQuery?.type == 2) return !variant?.sync_error_message && variant?.sync_status == 2
                                        if (paramsQuery?.type == 3) return variant?.sync_status == 1
                                    }

                                    return true
                                })
                                const totalSellableStockVariant = sumBy(product?.productVariants, 'sellable_stock')
                                const errorMessageProduct = channelCode == 'lazada'
                                    ? product?.productVariants?.find(variant => !!variant?.sync_error_message)?.sync_error_message
                                    : product?.sync_error_message;

                                const imgOrigin = (product?.productAssets || []).find(_asset => _asset.type == 4)
                                const imgProduct = !!imgOrigin?.template_image_url ? imgOrigin : (product?.productAssets || []).find(_asset => _asset.type == 1);

                                return (
                                    <Fragment>
                                        <tr>
                                            <td style={{ verticalAlign: 'top', borderBottom: channelCode == 'lazada' ? 'none' : 'unset' }}>
                                                <div className="d-flex">
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 68, height: 68,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        minWidth: 68
                                                    }} className='mr-6' >
                                                        {!!imgProduct && <HoverImage
                                                            placement="right"
                                                            defaultSize={{ width: 68, height: 68 }}
                                                            size={{ width: 320, height: 320 }}
                                                            url={imgProduct?.sme_url}
                                                        />}
                                                    </div>
                                                    <div className='w-100'>
                                                        <InfoProduct
                                                            name={product?.name}
                                                            short={true}
                                                            sku={product?.sku}
                                                            url={`/product-stores/edit/${product?.id}`}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="fs-14" style={{ borderBottom: channelCode == 'lazada' ? 'none' : 'unset' }}>
                                                {values?.channel == 'shopee' && <div className="d-flex justify-content-center">
                                                    {product?.productVariants?.length == 1 && <span>{formatNumberToCurrency(minBy(product?.productVariants, 'price')?.price)}đ</span>}
                                                    {product?.productVariants?.length > 1 && <div className="d-flex flex-column align-items-start justify-content-center">
                                                        <span>{formatNumberToCurrency(minBy(product?.productVariants, 'price')?.price)}đ - {formatNumberToCurrency(maxBy(product?.productVariants, 'price')?.price)}đ</span>
                                                    </div>}
                                                </div>}
                                            </td>
                                            <td className="fs-14 text-center" style={{ borderBottom: channelCode == 'lazada' ? 'none' : 'unset' }}>
                                                {values?.channel == 'shopee' && <span className="p-4">{formatNumberToCurrency(totalSellableStockVariant)}</span>}
                                            </td>
                                            <td className="fs-14 text-center" style={{ borderBottom: channelCode == 'lazada' ? 'none' : 'unset' }}>
                                                {paramsQuery?.type == 1 ? <Dropdown drop='down'
                                                    isDisabled={isActionView}
                                                >
                                                    <Dropdown.Toggle
                                                        className='btn-outline-secondary'
                                                        disabled={isActionView}
                                                        style={isActionView ? { cursor: 'not-allowed', opacity: 0.4 } : {}}
                                                    >
                                                        {formatMessage({ defaultMessage: `Chọn` })}
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu style={{ zIndex: 99 }}>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={() => {
                                                            setProductsVoucher(prev => prev.filter(item => item?.id != product?.id));
                                                        }} >
                                                            {formatMessage({ defaultMessage: 'Xóa' })}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const { data } = await retryCampaignItem({
                                                                variables: {
                                                                    campaign_id: values?.id,
                                                                    list_campaign_item_id: values?.typeItem == 1
                                                                        ? [product?.campaign_item_id]
                                                                        : product?.productVariants?.filter(variant => !!variant?.sync_error_message)?.map(item => item?.campaign_item_id)
                                                                }
                                                            })
                                                            if (data?.mktRetryCampaignItem?.success) {
                                                                addToast(formatMessage({ defaultMessage: 'Đồng bộ hàng hóa thành công' }), { appearance: 'success' })
                                                            } else {
                                                                addToast(data?.mktRetryCampaignItem?.message, { appearance: 'error' })
                                                            }
                                                        }} >
                                                            {formatMessage({ defaultMessage: `Đồng bộ lại` })}
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown> : <button
                                                    className="p-4"
                                                    disabled={isActionView}
                                                    style={{ backgroundColor: 'transparent' }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setProductsVoucher(prev => prev.filter(item => item?.id != product?.id));
                                                    }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash-fill text-danger" viewBox="0 0 16 16">
                                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                                    </svg>
                                                </button>}
                                            </td>
                                        </tr>
                                        {values?.channel == 'lazada' && campaignVariants?.map(variant => <tr>{buildProductVariants(variant, product)}</tr>)}
                                        {errorMessageProduct && paramsQuery?.type == 1 && <tr>
                                            <td colSpan={4} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)' }}>
                                                <div style={{
                                                    paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center'
                                                }} >
                                                    <p className="mt-0 mb-0"><span>{errorMessageProduct}</span></p>
                                                </div>

                                            </td>
                                        </tr>}
                                    </Fragment>
                                )
                            })}
                        </tbody>
                    </table>

                    <Pagination
                        page={page}
                        totalPage={Math.ceil(dataTabs?.length / limit)}
                        limit={limit}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm' })}
                        totalRecord={dataTabs?.length}
                        count={page * limit >= dataTabs?.length ? (dataTabs?.length - (page - 1) * limit) : limit}
                        basePath={location?.pathname}
                    />
                </Fragment>
                }
            </div>
        </Card>
    )
}

export default memo(TableVoucher);