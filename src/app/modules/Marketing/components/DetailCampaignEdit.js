import React, { memo, useCallback, useMemo, useState } from "react";
import { Card, InputVertical } from "../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { OPTIONS_ITEM_TYPE, OPTIONS_TYPE_LIMIT, TABS_DETAILS } from "../Constants";
import { Field, useFormikContext } from "formik";
import { useMarketingContext } from "../contexts/MarketingContext";
import { useHistory, useLocation } from 'react-router-dom';
import Select from 'react-select';
import TableCampaignActions from "./TableCampaignActions";
import SupportFeature from "../campaign-create/SupportFeature";
import { Dropdown } from "react-bootstrap";
import queryString from 'querystring';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import { minBy } from "lodash";
import Pagination from "../pagination";
import clsx from "clsx";

const DetailCampaignEdit = ({
    setShowImportCampaignDiscount, setShowImportCampaignItems, setShowAddProduct, productSelect, setProductSelect,
    createFrameImgBatch, removeFrameImgBatch, setShowWarningItemType,
    idCampaign, campaignDetail, isActionView
}) => {
    const { channelCampaign, paramsQuery, queryVariables, campaignItems, setCampaignItems } = useMarketingContext();
    const { setFieldValue, validateForm, setValues, values, handleSubmit } = useFormikContext();
    const { typeCampaign, page, limit } = queryVariables;
    const [search, setSearch] = useState('');
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();

    const statusCampaignItems = useMemo(() => {
        const statusList = [
            {
                type: 2,
                title: formatMessage({ defaultMessage: 'Đồng bộ thành công' }),
                count: campaignItems?.filter(item => {
                    return values?.typeItem == 1
                        ? !item?.sync_error_message && item?.sync_status == 2
                        : item?.productVariants?.some(variant => !variant?.sync_error_message && variant?.sync_status == 2)
                })?.length
            },
            {
                type: 1,
                title: formatMessage({ defaultMessage: 'Đồng bộ lỗi' }),
                count: campaignItems?.filter(item => {
                    return values?.typeItem == 1
                        ? !!item?.sync_error_message
                        : item?.productVariants?.some(variant => !!variant?.sync_error_message)
                })?.length

            },
            {
                type: 3,
                title: formatMessage({ defaultMessage: 'Chưa đồng bộ' }),
                count: campaignItems?.filter(item => {
                    return values?.typeItem == 1
                        ? item?.sync_status == 1
                        : item?.productVariants?.some(variant => variant?.sync_status == 1)
                })?.length

            },
        ];

        return statusList
    }, [campaignItems]);

    const [dataTable, dataPaginate] = useMemo(() => {
        let data = [];
        if (paramsQuery?.type) {
            data = campaignItems?.filter(item => {
                if (paramsQuery?.type == 1) {
                    return values?.typeItem == 1
                        ? !!item?.sync_error_message
                        : item?.productVariants?.some(variant => !!variant?.sync_error_message)
                }
                if (paramsQuery?.type == 2) {
                    return values?.typeItem == 1
                        ? !item?.sync_error_message && item?.sync_status == 2
                        : item?.productVariants?.some(variant => !variant?.sync_error_message && variant?.sync_status == 2)
                }
                if (paramsQuery?.type == 3) {
                    return values?.typeItem == 1
                        ? item?.sync_status == 1
                        : item?.productVariants?.some(variant => variant?.sync_status == 1)
                }

                return true
            })
        } else {
            data = campaignItems
        }

        return [
            data?.slice((page - 1) * limit, page * limit)?.filter(item => item?.name?.includes(search) || item?.sku?.includes(search) || item?.productVariants?.some(vr => vr?.sku?.includes(search))),
            data?.filter(item => item?.name?.includes(search) || item?.sku?.includes(search) || item?.productVariants?.some(vr => vr?.sku?.includes(search)))
        ]
    }, [campaignItems, page, limit, paramsQuery, search]);

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

    return (
        <Card>
            <div className="d-flex flex-column pb-4 mt-4">
                <strong
                    style={{ fontSize: 14, color: '#000', marginLeft: '12.5px' }}
                >
                    {formatMessage({ defaultMessage: 'CHI TIẾT' })}
                </strong>
            </div>
            <div className="col-12 d-flex w-100 mb-4 mt-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {(campaignDetail?.type == 10 ? TABS_DETAILS?.slice(0, 1) : TABS_DETAILS).map((tab, index) => {
                            const isTabActive = (paramsQuery?.tab || 1) == tab?.status
                            return (
                                <li key={index} onClick={() => history.push(`${location.pathname}?${queryString.stringify({ ...paramsQuery, page: 1, tab: tab?.status })}`)}>
                                    <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>{tab?.title}</a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {paramsQuery?.tab != 2 ? (
                <>
                    {values?.type != 'other' && typeCampaign != 'other' && <div className="d-flex justify-content-between mx-4 pb-4 mt-4">
                        <div>
                            <div className="d-flex align-items-center">
                                <span className="mr-12">{formatMessage({ defaultMessage: 'Chọn sản phẩm hoặc hàng hóa bạn muốn đặt giá khuyến mãi' })}</span>
                                <Field
                                    name="typeItem"
                                    component={RadioGroup}
                                    isCenter
                                    customFeedbackLabel={' '}
                                    options={OPTIONS_ITEM_TYPE}
                                    // disabled={isActionView || values?.channel == 'shopee' || (values?.channel == 'tiktok' && values?.status == 2)}
                                    disabled={isActionView}
                                    onChangeOption={() => {
                                        if (campaignItems?.length > 0) {
                                            setShowWarningItemType(true);
                                            return;
                                        }

                                        if (values[`typeItem`] == 1) {
                                            setFieldValue('typeItem', 2)
                                        } else {
                                            setFieldValue('typeItem', 1)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div className='d-flex align-items-center'>
                            {typeCampaign != 'other' && <Dropdown drop='down' className="mr-4">
                                <Dropdown.Toggle
                                    disabled={!values?.store || isActionView}
                                    className={`${(!!values?.store || !isActionView) ? 'btn-primary' : 'btn-darkk'} btn`}
                                >
                                    {formatMessage({ defaultMessage: "Tải file" })}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item className="mb-1 d-flex"
                                        onClick={() => setShowImportCampaignItems(true)}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải file {name}' }, { name: values?.typeItem == 1 ? 'sản phẩm' : 'hàng hóa' })}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        className="mb-1 d-flex"
                                        disabled={campaignItems?.length == 0}
                                        onClick={() => setShowImportCampaignDiscount(true)}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải file giảm giá' })}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>}
                            <button
                                type="button"
                                onClick={() => setShowAddProduct(true)}
                                className="btn btn"
                                disabled={!values?.store || isActionView}
                                style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                            >
                                {formatMessage({ defaultMessage: '+ Thêm sản phẩm' })}
                            </button>
                        </div>
                    </div>}
                    {typeCampaign != 'other' && values?.type != 'other' && (<><div className='ml-1 row align-items-end mb-8'>
                        <div className="col-2 input-icon d-dlex" >
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
                        <div className='col-2 d-dlex flex-row'>
                            <p className="text-muted">{formatMessage({ defaultMessage: 'Giảm giá' })}</p>
                            {values?.typeDiscount == 2 && <Field
                                name={`discount_percent`}
                                value={values.discount_percent}
                                component={InputVertical}
                                disabled={isActionView}
                                type='number'
                                placeholder=""
                                style={{ padding: '0 10px' }}
                                addOnRight={'%'}
                            />}
                            {values?.typeDiscount == 1 && <Field
                                type='number'
                                style={{ padding: '0 10px' }}
                                value={values.discount_value}
                                disabled={isActionView}
                                name={`discount_value`}
                                component={InputVertical}
                                placeholder=""
                                addOnRight={'đ'}
                            />}
                        </div>
                        <div className='col-3 d-dlex flex-row'>
                            <p className="text-muted">{formatMessage({ defaultMessage: 'Số lượng sản phẩm khuyến mại' })}</p>
                            <div className='d-flex'>
                                <div style={{ width: '70%' }}>
                                    <Select
                                        type='number'
                                        id="quantity"
                                        style={{ zIndex: 10 }}
                                        options={OPTIONS_TYPE_LIMIT}
                                        value={values?.quantity}
                                        isDisabled={isActionView}
                                        styles={{
                                            container: (styles) => ({
                                                ...styles,
                                                zIndex: 10
                                            }),
                                        }}
                                        onChange={(value) => {
                                            setFieldValue('quantity', value)
                                        }}
                                    />
                                </div>
                                {values.quantity.value == 2 &&
                                    <div style={{ width: '30%' }}>
                                        <Field
                                            type='number'
                                            name={'quantity_number'}
                                            component={InputVertical}
                                            placeholder=""
                                            value={values.quantity_number}
                                        />
                                    </div>
                                }
                            </div>
                        </div>
                        <div className='col-3 d-dlex flex-row'>
                            <p className="text-muted">Giới hạn mua</p>
                            <div className='d-flex'>
                                <div style={{ width: '70%' }}>
                                    <Select
                                        id="quantity_per_user"
                                        value={values?.quantity_per_user}
                                        isDisabled={isActionView}
                                        options={OPTIONS_TYPE_LIMIT}
                                        styles={{
                                            container: (styles) => ({
                                                ...styles,
                                                zIndex: 10
                                            }),
                                        }}
                                        onChange={(value) => {
                                            setFieldValue('quantity_per_user', value)
                                        }}
                                    />
                                </div>
                                {values?.quantity_per_user?.value == 2 &&
                                    <div style={{ width: '30%' }}>
                                        <Field
                                            type='number'
                                            name={'quantity_per_user_number'}
                                            disabled={isActionView}
                                            component={InputVertical}
                                            placeholder=""
                                            value={values?.quantity_per_user_number}
                                        />
                                    </div>}
                            </div>
                        </div>
                        <div className='col-2 d-dlex flex-row'>
                            <button
                                className="btn btn-primary btn-elevate mt-6"
                                style={{ padding: '10px 20px' }}
                                disabled={isActionView}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const totalError = await validateForm()
                                    if (Object.keys(totalError)?.filter((item) => {
                                        return ['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                                    })?.length > 0) {
                                        handleSubmit();
                                        return;
                                    } else {
                                        // if (values?.status == 2 && paramsQuery?.type != 3) return;
                                        let formUpdate = { ...values };
                                        (campaignItems || []).forEach(product => {
                                            const minPriceVariant = minBy(product?.productVariants || [], 'price')?.price;

                                            if (values?.typeItem == 1) {
                                                if (values[`quantity_per_user`].value == 2) {
                                                    formUpdate[`campaign-${product?.id}-quantity_per_user_number`] = +values[`quantity_per_user_number`]
                                                    formUpdate[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[1]
                                                } else {
                                                    formUpdate[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                                }
                                                if (values[`quantity`].value == 2) {
                                                    formUpdate[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[1]
                                                    formUpdate[`campaign-${product?.id}-purchase_limit_number`] = +values[`quantity_number`]
                                                } else {
                                                    formUpdate[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                                }

                                                if (values?.typeDiscount == 1) {
                                                    if (values[`discount_value`] != null) {
                                                        formUpdate[`campaign-${product?.id}-discount-value`] = +values[`discount_value`]
                                                        formUpdate[`campaign-${product.id}-promotion_price`] = minPriceVariant - values[`discount_value`]
                                                    }
                                                } else {
                                                    if (values[`discount_percent`] != null) {
                                                        formUpdate[`campaign-${product?.id}-discount-percent`] = +values[`discount_percent`]
                                                        formUpdate[`campaign-${product.id}-promotion_price`] = Math.ceil(minPriceVariant - values[`discount_percent`] / 100 * minPriceVariant)
                                                    }
                                                }
                                            }

                                            if (values?.typeItem == 2) {
                                                (product?.productVariants || []).forEach(variant => {
                                                    if (!values[`campaign-${product?.id}-${variant?.id}-active`]) return;
                                                    if (values[`quantity_per_user`].value == 2) {
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = +values[`quantity_per_user_number`]
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[1]
                                                    } else {
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                                    }
                                                    if (values[`quantity`].value == 2) {
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[1]
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = +values[`quantity_number`]
                                                    } else {
                                                        formUpdate[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                                    }

                                                    if (values?.typeDiscount == 1) {
                                                        if (values[`discount_value`] != null) {
                                                            formUpdate[`campaign-${product?.id}-${variant?.id}-discount-value`] = +values[`discount_value`]
                                                            formUpdate[`campaign-${product.id}-${variant?.id}-promotion_price`] = variant?.price - values[`discount_value`]
                                                        }
                                                    } else {
                                                        if (values[`discount_percent`] != null) {
                                                            formUpdate[`campaign-${product?.id}-${variant?.id}-discount-percent`] = +values[`discount_percent`]
                                                            formUpdate[`campaign-${product.id}-${variant?.id}-promotion_price`] = Math.ceil(variant?.price - values[`discount_percent`] / 100 * variant?.price)
                                                        }
                                                    }
                                                })
                                            }
                                        })

                                        setValues(formUpdate)
                                    }
                                }}
                            >
                                {formatMessage({ defaultMessage: 'ÁP DỤNG CHO TẤT CẢ' })}
                            </button>
                        </div>
                    </div>
                        <div className='row mb-4 ml-4 d-dlex align-items-center' style={{ position: 'sticky', top: 44, zIndex: 9, background: '#fff' }}>
                            <span style={{ color: '#ff5629' }} className='mr-4'>Đã chọn {productSelect?.length}</span>
                            <Dropdown drop='down'>
                                <Dropdown.Toggle disabled={!productSelect.length} className={`${productSelect?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                                    {formatMessage({ defaultMessage: "Thao tác" })}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <>
                                        <Dropdown.Item className="mb-1 d-flex"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                let productSelectIds = productSelect?.map(item => item.id)
                                                let newProduct = campaignItems?.filter(item => {
                                                    return !productSelectIds.includes(item?.id)
                                                })
                                                setCampaignItems(newProduct);
                                                setProductSelect([])
                                            }}>
                                            {formatMessage({ defaultMessage: "Xóa hàng loạt" })}
                                        </Dropdown.Item>
                                        {!isActionView && <Dropdown.Item onClick={createFrameImgBatch} className="mb-1 d-flex">
                                            {formatMessage({ defaultMessage: "Thêm khung ảnh hàng loạt" })}
                                        </Dropdown.Item>}
                                        <Dropdown.Item onClick={async () => await removeFrameImgBatch()} className="mb-1 d-flex">
                                            {formatMessage({ defaultMessage: "Xóa khung ảnh hàng loạt" })}
                                        </Dropdown.Item>
                                    </>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div></>)}

                    {campaignDetail?.status != 1 && values?.type != 'other' && <ul className="nav nav-tabs ml-4" id="myTab" role="tablist" style={{ position: 'sticky', top: 80, zIndex: 1, background: '#fff', borderBottom: 'none' }}>
                        {statusCampaignItems?.map(item => {
                            return (
                                <li className={clsx(`product-status-nav nav-item`, { active: paramsQuery.type == item?.type })}>
                                    <a
                                        className={clsx(`nav-link font-weight-normal`, { active: paramsQuery.type == item?.type })}
                                        style={{ fontSize: '13px', minWidth: 100, }}
                                        onClick={e => {
                                            setProductSelect([]);
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

                    <TableCampaignActions
                        search={search}
                        stickyTop={campaignDetail?.status != 1 && values?.type != 'other' ? 118 : 80}
                        isEdit
                        isActionView={isActionView}
                        productSelect={productSelect}
                        setProductSelect={setProductSelect}
                        isSelectedAll={isSelectedAll}
                        handleSelectAll={handleSelectAll}
                    />

                    <Pagination
                        page={page}
                        totalPage={Math.ceil(dataPaginate?.length / limit)}
                        limit={limit}
                        totalRecord={dataPaginate?.length}
                        count={page * limit >= dataPaginate?.length ? (dataPaginate?.length - (page - 1) * limit) : limit}
                        basePath={`/marketing/sale/${campaignDetail?.id}`}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có hàng hóa nào.' })}
                    />
                </>
            ) : <SupportFeature
                id={idCampaign}
                isActionView={isActionView}
                isFrame={campaignDetail?.on_create_schedule_frame}
                capaign={campaignDetail}
            />}
        </Card>
    )
}

export default memo(DetailCampaignEdit);