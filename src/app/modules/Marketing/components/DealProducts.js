import { useMutation } from "@apollo/client";
import clsx from "clsx";
import { useFormikContext } from "formik";
import { maxBy, minBy, sumBy } from "lodash";
import queryString from 'querystring';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useIntl } from "react-intl";
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToasts } from "react-toast-notifications";
import { Card, Checkbox } from "../../../../_metronic/_partials/controls";
import HoverImage from "../../../../components/HoverImage";
import InfoProduct from "../../../../components/InfoProduct";
import mutate_retryCampaignItem from "../../../../graphql/mutate_retryCampaignItem";
import { formatNumberToCurrency } from "../../../../utils";
import LoadingDialog from "../../FrameImage/LoadingDialog";
import { useDealContext } from "../contexts/DealContext";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";

const DealProducts = ({ loading = false, isActionView = false, setShowAddProduct, isEdit = false, isTemplate = false }) => {
    const { productsDeal, setProductsDeal, paramsQuery, logisticsChannel } = useDealContext();
    const { formatMessage } = useIntl();
    const params = useParams();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const { setFieldValue, errors, touched, values, setValues } = useFormikContext();
    const [search, setSearch] = useState('');
    const [expands, setExpands] = useState([]);
    const [productSelect, setProductSelect] = useState([]);

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
                count: productsDeal?.filter(item => !item?.sync_error_message && item?.sync_status == 2)?.length
            },
            {
                type: 1,
                title: formatMessage({ defaultMessage: 'Đồng bộ lỗi' }),
                count: productsDeal?.filter(item => !!item?.sync_error_message)?.length

            },
            {
                type: 3,
                title: formatMessage({ defaultMessage: 'Chưa đồng bộ' }),
                count: productsDeal?.filter(item => item?.sync_status == 1)?.length

            },
        ];

        return statusList
    }, [productsDeal, paramsQuery, values?.channel]);

    const channelCode = useMemo(() => values?.channel, [values?.channel]);

    const dataTable = useMemo(() => {
        let data = [];

        if (paramsQuery?.type) {
            data = productsDeal?.filter(item => {
                if (paramsQuery?.type == 1) {
                    return !!item?.sync_error_message
                }

                if (paramsQuery?.type == 2) {
                    return !item?.sync_error_message && item?.sync_status == 2
                }

                if (paramsQuery?.type == 3) {
                    return item?.sync_status == 1
                }
            })
        } else {
            data = productsDeal
        }

        return data?.filter(item => item?.name?.includes(search) || item?.sku?.includes(search) || item?.productVariants?.some(vr => vr?.sku?.includes(search)))
    }, [productsDeal, paramsQuery, values?.channel, search]);

    const isSelectedAll = useMemo(() => {
        if (dataTable?.length == 0) return false;

        return dataTable?.every(product => productSelect?.some(item => item?.id == product?.id));
    }, [productSelect, dataTable]);

    const handleSelectAll = useCallback(
        (e) => {
            if (isSelectedAll) {
                setProductSelect(prev => prev.filter(item => !dataTable?.some(variant => variant?.id == item?.id)))
            } else {
                const data_filtered = dataTable?.filter(
                    _product => !productSelect?.some(__ => __?.id == _product?.id)
                )
                setProductSelect(prev => [...prev, ...data_filtered]);
            }
        }, [productSelect, dataTable, isSelectedAll]
    );

    const existOneActive = useMemo(() => {
        const existOneActive = dataTable?.filter(product => values[`campaign-${product?.id}-active`])?.length == 1
        return existOneActive
    }, [values, dataTable]);

    return (
        <Card style={{ position: 'relative', opacity: loading ? 0.4 : 1 }}>
            {loading && <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                <span className="spinner spinner-primary" />
            </div>}
            <LoadingDialog show={loadingRetryItem} />
            <div className="m-4">
                <div className="mb-8">
                    <strong className="fs-14" style={{ color: '#000' }}>
                        {formatMessage({ defaultMessage: 'SẢN PHẨM CHÍNH' })}
                    </strong>
                </div>
                <Fragment>
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <span>{formatMessage({ defaultMessage: 'Thêm sản phẩm vào chương trình khuyến mãi' })}</span>
                        <button
                            type="button"
                            onClick={() => setShowAddProduct('product')}
                            className="btn btn-primary mr-3"
                            disabled={!values?.store || isActionView}
                            style={{ minWidth: 120 }}
                        >
                            {formatMessage({ defaultMessage: '+ Thêm sản phẩm' })}
                        </button>
                    </div>
                    {values?.type != 'other' && <div className='row mb-6'>
                        <div className="col-4 input-icon d-flex" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    setSearch(e.target.value)
                                }}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        setSearch(e.target.value)
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                    </div>}
                    <div
                        className='row mb-4 pl-4 d-dlex align-items-center'
                        style={{ position: 'sticky', top: 44, zIndex: 9, background: '#fff' }}
                    >
                        <span style={{ color: '#ff5629' }} className='mr-4'>Đã chọn {productSelect?.length}</span>
                        <Dropdown drop='down'>
                            <Dropdown.Toggle disabled={!productSelect.length} className={`${productSelect?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        let formValues = { ...values };
                                        (productSelect || []).forEach(product => {
                                            formValues[`campaign-${product?.id}-active`] = product?.sum_sellable_stock > 0;
                                        });

                                        setValues(formValues);
                                        setProductSelect([]);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: "Bật" })}
                                </Dropdown.Item>
                                <Dropdown.Item
                                    className="mb-1 d-flex"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        let formValues = { ...values };
                                        (productSelect || []).forEach(product => {
                                            formValues[`campaign-${product?.id}-active`] = false;
                                        });

                                        setValues(formValues);
                                        setProductSelect([]);
                                    }}
                                >
                                    {formatMessage({ defaultMessage: "Tắt" })}
                                </Dropdown.Item>
                                <Dropdown.Item className="mb-1 d-flex"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        let productSelectIds = productSelect?.map(item => item.id)
                                        let newProduct = productsDeal?.filter(item => {
                                            return !productSelectIds.includes(item?.id)
                                        })
                                        setProductsDeal(newProduct);
                                        setProductSelect([])
                                    }}>
                                    {formatMessage({ defaultMessage: "Xóa" })}
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                    {isEdit && values?.status == 2 && !isTemplate && <ul className="nav nav-tabs" id="myTab" role="tablist"
                        style={{ position: 'sticky', top: 81, zIndex: 1, background: '#fff', borderBottom: 'none' }}
                    >
                        {statusCampaignItems?.map(item => {
                            return (
                                <li className={clsx(`product-status-nav nav-item`, { active: paramsQuery?.type == item?.type })}>
                                    <a
                                        className={clsx(`nav-link font-weight-normal`, { active: paramsQuery?.type == item?.type })}
                                        style={{ fontSize: '13px', minWidth: 100, }}
                                        onClick={e => {
                                            setProductSelect([]);
                                            history.push(`${location.pathname}?${queryString.stringify({
                                                ...paramsQuery,
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
                                top: isEdit && values?.status == 2 && !isTemplate ? 115 : 80,
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
                                width="30%"
                            >
                                <div className="d-flex align-items-center">
                                    <Checkbox
                                        inputProps={{
                                            'aria-label': 'checkbox',
                                        }}
                                        disabled={isActionView}
                                        isSelected={isSelectedAll}
                                        onChange={handleSelectAll}
                                    />
                                    <span className="mx-4">
                                        {formatMessage({ defaultMessage: 'Tên sản phẩm' })}
                                    </span>
                                </div>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="20%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Giá bán' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="15%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Có sẵn' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="15%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Vận chuyển' })}
                                </span>
                            </th>
                            <th
                                style={{ fontSize: '14px', textAlign: 'center' }}
                                width="10%"
                            >
                                <span className="mx-4">
                                    {formatMessage({ defaultMessage: 'Trạng thái' })}
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
                        {dataTable?.length > 0 && <tbody style={{ borderBottom: '0.5px solid #cbced4' }}>
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

                                const logistics = logisticsChannel
                                    ?.filter(lg => product?.ref_logistic_channel_id?.some(id => id == lg?.value))
                                    ?.map(lg => lg?.label);
                                const isSelected = productSelect?.map(_product => _product?.id).includes(product?.id)
                                const isExpand = expands?.some(id => id == product?.id);

                                return (
                                    <Fragment>
                                        <tr>
                                            <td style={{ verticalAlign: 'top', borderBottom: channelCode == 'lazada' ? 'none' : 'unset' }}>
                                                <div className="d-flex align-items-start">
                                                    <Checkbox
                                                        isSelected={isSelected}
                                                        disabled={isActionView}
                                                        inputProps={{
                                                            'aria-label': 'checkbox',
                                                        }}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setProductSelect(prevState => ([...prevState, product]))
                                                            } else {
                                                                setProductSelect(prevState => prevState.filter(_state => _state.id !== product?.id))
                                                            }
                                                        }}
                                                    />
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 48, height: 48,
                                                        borderRadius: 8,
                                                        overflow: 'hidden',
                                                        minWidth: 48
                                                    }} className='mr-6' >
                                                        {!!imgProduct && <HoverImage
                                                            placement="right"
                                                            defaultSize={{ width: 48, height: 48 }}
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
                                            <td className="fs-14 text-center" style={{ borderBottom: 'unset' }}>
                                                <div className="d-flex justify-content-center align-items-center">
                                                    <span>{logistics?.slice(0, isExpand ? logistics?.length : 2)?.join(', ')} {logistics?.length > 2 && <span className="text-info ml-1 cursor-pointer" onClick={() => {
                                                        setExpands(prev => isExpand ? prev?.filter(id => id != product?.id) : prev.concat(product?.id))
                                                    }}>
                                                        {isExpand ? formatMessage({ defaultMessage: 'Thu gọn' }) : formatMessage({ defaultMessage: 'Xem thêm' })}
                                                    </span>}</span>
                                                </div>
                                            </td>
                                            <td className="fs-14 text-center" style={{ borderBottom: 'unset' }}>
                                                <span className="switch d-flex justify-content-center" style={{ transform: 'scale(0.9)' }}>
                                                    <label>
                                                        <input
                                                            type={'checkbox'}
                                                            style={{ background: '#F7F7FA', border: 'none' }}
                                                            disabled={(existOneActive && values[`campaign-${product?.id}-active`]) || isActionView || product?.sum_sellable_stock == 0}
                                                            onChange={() => {
                                                                setFieldValue(`campaign-${product?.id}-active`, !values[`campaign-${product?.id}-active`]);
                                                            }}
                                                            checked={values[`campaign-${product?.id}-active`]}
                                                        />
                                                        <span></span>
                                                    </label>
                                                </span>
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
                                                            setProductSelect(prev => prev.filter(item => item?.id != product?.id));
                                                            setProductsDeal(prev => prev.filter(item => item?.id != product?.id));
                                                        }} >
                                                            {formatMessage({ defaultMessage: 'Xóa' })}
                                                        </Dropdown.Item>
                                                        <Dropdown.Item className="mb-1 d-flex" onClick={async () => {
                                                            const { data } = await retryCampaignItem({
                                                                variables: {
                                                                    campaign_id: values?.id,
                                                                    list_campaign_item_id: [product?.campaign_item_id]
                                                                }
                                                            })
                                                            if (data?.mktRetryCampaignItem?.success) {
                                                                setProductsDeal(prev => prev.map(item => {
                                                                    if (item?.id == product?.id) {
                                                                        return { ...item, sync_error_message: null, sync_status: 2 }
                                                                    }

                                                                    return item
                                                                }));
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
                                                        setProductSelect(prev => prev.filter(item => item?.id != product?.id));
                                                        setProductsDeal(prev => prev.filter(item => item?.id != product?.id));
                                                    }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-trash-fill text-danger" viewBox="0 0 16 16">
                                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
                                                    </svg>
                                                </button>}
                                            </td>
                                        </tr>
                                        {errorMessageProduct && paramsQuery?.type == 1 && <tr>
                                            <td colSpan={6} style={{ position: 'relative', padding: '10px', backgroundColor: 'rgba(254, 86, 41, 0.51)' }}>
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
                        </tbody>}
                    </table>
                    {dataTable?.length == 0 && <div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={60} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                    </div>}
                </Fragment>
            </div>
        </Card>
    )
}

export default memo(DealProducts);