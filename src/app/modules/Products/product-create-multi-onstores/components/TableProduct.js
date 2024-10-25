/*
 * Created by duydatpham@gmail.com on 17/03/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";

import {
    CardBody,
    // InputVertical
} from "../../../../../_metronic/_partials/controls";
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FastField } from "formik";
import { InputVertical } from '../../../../../components/InputNumber';
import TextAreaDialog from "../dialog/TextAreaDialog";
import { useCreateMultiContext } from '../CreateMultiContext';
import _ from 'lodash';
import 'handy-scroll/dist/handy-scroll.css';
import handyScroll from 'handy-scroll';
import { useHistory } from 'react-router-dom';
import OutsideClickHandler from 'react-outside-click-handler';
import { useFormikContext } from "formik";
import { useIntl } from "react-intl";
// import { queryCheckExistSku } from "../../ProductsUIHelpers";

export default memo(({
    errorMessage,
    setIndexShowImgPopup,
    setIndexShowShippingPopup,
    onShowConfirmPopup,
    setCurrentChannel,
    property,
    productRemoveIndex
}) => {
    const { products, setProducts } = useCreateMultiContext();
    const { values } = useFormikContext();
    const history = useHistory();
    const [isExpand, setIsExpand] = useState([]);
    console.log('isExpand', isExpand)
    const [currentProductSync, setCurrentProductSync] = useState({});
    const { formatMessage } = useIntl()
    useEffect(
        () => {
            handyScroll.mount(document.getElementById('float-hozirontal-scrollbar'));
        }, []
    );

    let channel = products?.length > 0 ? products[0]?.channel : null;

    console.log({ products });

    const [options, setOptions] = useState([
        {
            key: 'sell-info',
            title: formatMessage({ defaultMessage: 'Giá niêm yết và có sẵn' }),
            name: [formatMessage({ defaultMessage: 'Giá niêm yết' }), formatMessage({ defaultMessage: 'Có sẵn' })],
            isRequired: true,
            isShow: true,
            width: 150
        }
    ]);

    useMemo(
        () => {
            if (!channel) return;

            setOptions(prevState => {
                return _.filter(
                    [
                        ...prevState,
                        channel?.connector_channel_code === 'shopee' ? {
                            key: 'description-shopee',
                            title: formatMessage({ defaultMessage: 'Mô tả' }),
                            name: [channel?.special_type === 1 ? formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh' }) : formatMessage({ defaultMessage: 'Mô tả' })],
                            isRequired: true,
                            isShow: true,
                            width: 150
                        } : {},
                        channel?.connector_channel_code === 'lazada' ? {
                            key: 'description-lzd',
                            title: formatMessage({ defaultMessage: 'Mô tả' }),
                            name: [formatMessage({ defaultMessage: 'Mô tả dạng HTML' }), formatMessage({ defaultMessage: 'Mô tả ngắn' })],
                            isRequired: false,
                            isShow: true,
                            width: 150
                        } : {},
                        channel?.connector_channel_code === 'tiktok' ? {
                            key: 'description-tiktok',
                            title: formatMessage({ defaultMessage: 'Mô tả' }),
                            name: [formatMessage({ defaultMessage: 'Mô tả dạng HTML' })],
                            isRequired: true,
                            isShow: true,
                            width: 150
                        } : {},
                        {
                            key: 'properties',
                            title: formatMessage({ defaultMessage: 'Kích thước và cân nặng' }),
                            name: [formatMessage({ defaultMessage: 'Kích thước và cân nặng' })],
                            isRequired: true,
                            isShow: true,
                            width: 180
                        },
                        channel?.connector_channel_code === 'shopee' ? {
                            key: 'channel_logistic',
                            title: formatMessage({ defaultMessage: 'Đơn vị vận chuyển' }),
                            name: [formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })],
                            isRequired: true,
                            isShow: true,
                            width: 150
                        } : {}
                    ], function (_option) { return !_.isEmpty(_option) }
                )
            });
        }, [channel]
    );

    return (
        <CardBody>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
                <div className="col-2 flex-1">
                    <p>{formatMessage({ defaultMessage: 'Thông tin chỉnh sửa' })}</p>
                </div>
                <div className="col-22" style={{ flex: 1 }}>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                        <div style={{ width: '10%' }} className="mb-4 checkbox-inline">
                            <label className="checkbox d-flex" style={{ alignItems: 'flex-start' }}>
                                <input
                                    type="checkbox"
                                    name="tick"
                                    checked={options?.map(_option => _option.isShow)?.every(__option => !!__option)}
                                    onChange={e => {
                                        let checked = e.target.checked;

                                        setOptions(prevState => prevState.map(item => ({
                                            ...item,
                                            isShow: checked
                                        })))
                                    }}
                                />
                                <span></span>{formatMessage({ defaultMessage: 'Tất cả' })}
                            </label>
                        </div>
                        <div
                            style={{ width: '90%' }}
                        // className="col-22"
                        >
                            <div className="checkbox-inline">
                                {options?.map(
                                    (_option, index) => (
                                        <div
                                            key={`options-${index}`}
                                            style={{ width: '24%' }}
                                            className="checkbox-inline mr-3 mb-4"
                                        >
                                            <label className="checkbox d-flex" style={{ alignItems: 'flex-start' }}>
                                                <input
                                                    type="checkbox"
                                                    name={`tick-${index}`}
                                                    checked={_option.isShow}
                                                    onChange={e => {
                                                        let checked = e.target.checked;
                                                        setOptions(prevState => prevState.map(item => {
                                                            if (item.key == _option.key) {
                                                                return {
                                                                    ...item,
                                                                    isShow: checked
                                                                }
                                                            }
                                                            return item
                                                        }))
                                                    }}
                                                />
                                                <span></span>{_option.title}
                                            </label>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                id="float-hozirontal-scrollbar"
                style={{
                    boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                    minHeight: 200,
                    borderRadius: 6,
                    marginTop: 20,
                    width: '100%',
                    overflowX: 'scroll'
                }}
            >
                <table className="table table-borderless table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f8fa' }}>
                        <tr>
                            <th
                                className="text-center"
                                style={{ fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none', width: 150 }}
                            >
                                {formatMessage({ defaultMessage: 'Ảnh & Video' })}<span className="text-primary pl-1">*</span>
                            </th>
                            <th
                                className="text-center"
                                style={{ fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none', width: 300 }}
                            >
                                {formatMessage({ defaultMessage: 'Tên sản phẩm' })}<span className="text-primary pl-1">*</span>
                            </th>
                            <th
                                className="text-center"
                                style={{ fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none', width: 300 }}
                            >
                                SKU<span className="text-primary pl-1">*</span>
                            </th>
                            {options?.map(
                                (_option) => _option.isShow ? <>
                                    {_option.name.map((_title, index) => <th
                                        key={`th-${index}`}
                                        className="text-center"
                                        style={{ border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none', width: _option?.width || '' }}
                                    >
                                        {_title}{options?.find(ii => ii.name.some(__ => __ == _title))?.isRequired && <span className="text-primary pl-1">*</span>}
                                    </th>)}
                                </> : <></>
                            )}
                            {/* <th className="text-center" style={{ border: '1px solid #D9D9D9', borderLeft: 'none', width: 150 }}>
                                Đồng bộ
                            </th> */}
                            <th className="text-center" style={{ border: '1px solid #D9D9D9', borderLeft: 'none', width: 150 }}>
                                {formatMessage({ defaultMessage: 'Thao tác' })}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map((__product, index) => {
                            let existProductRemove = productRemoveIndex?.some(_index => _index === index);
                            if (existProductRemove) return null;

                            return (
                                <>
                                    {errorMessage?.some(__error => __error?.key == index) && (
                                        <tr>
                                            <td colSpan={5 + options?.filter(_option => !!_option.isShow)?.length}>
                                                <div className='bg-danger text-white py-4 px-4  rounded-sm mb-4' >
                                                    <span>
                                                        {`[${__product?.raw?.name?.length > 20 ? `${__product?.raw?.name?.slice(0, 20)}...` : __product?.raw?.name}]: ${_.capitalize(errorMessage?.find(_err => _err?.key == index)?.title?.join('; '))}`}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    <tr
                                        className="borderRight"
                                        key={`tr-${index}`}
                                        // className="pb-8"
                                        // className={products?.at(-2) ? 'removeBorder' : ''}
                                        style={index != products?.length - 1 && property[index].length == 0 ? { borderBottom: '1px solid #D9D9D9' } : {}}
                                    >
                                        <td style={{ width: 150, verticalAlign: 'top' }}>
                                            <div className="d-flex justify-content-center" >
                                                <img src={__product?.productFiles[0]?.source} style={{ width: 80, height: 80, cursor: 'pointer' }}
                                                    onClick={() => setIndexShowImgPopup(index)}
                                                />
                                                <i className="fa fa-pen icon-sm text-dark ml-2" style={{ cursor: 'pointer' }}
                                                    onClick={() => setIndexShowImgPopup(index)}
                                                ></i>
                                            </div>
                                        </td>
                                        <td style={{ width: 300, verticalAlign: 'initial' }}>
                                            <FastField
                                                name={`name_${index}`}
                                                component={InputVertical}
                                                placeholder={formatMessage({ defaultMessage: "Tên sản phẩm" })}
                                                label={""}
                                                nameTxt={formatMessage({ defaultMessage: "Tên sản phẩm" })}
                                                required
                                                customFeedbackLabel={' '}
                                                addOnRight={''}
                                            />
                                            <div className="d-flex align-items-center">
                                                <img src={__product?.channel?.logo || ''} style={{ width: 15, height: 15 }} />
                                                <span className="pl-2">{__product?.channel?.label || ''}</span>
                                            </div>
                                        </td>
                                        <td style={{ width: 300, verticalAlign: 'initial' }}>
                                            <div className="text-center">
                                                <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                    <FastField
                                                        name={`sku_${index}`}
                                                        component={InputVertical}
                                                        placeholder="SKU"
                                                        label={""}
                                                        nameTxt={""}
                                                        required
                                                        customFeedbackLabel={' '}
                                                        addOnRight={''}
                                                        decimalScale={2}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        {options?.map((_option, idx) => {
                                            if (!_option.isShow) return <></>;

                                            switch (_option.key) {
                                                case 'description-shopee':
                                                    return (
                                                        <TextAreaDialog
                                                            type={channel?.special_type === 1 ? 'description_extend' : 'description'}
                                                            placeholder={channel?.special_type === 1 ? formatMessage({ defaultMessage: "Mô tả kèm hình ảnh" }) : formatMessage({ defaultMessage: "Mô tả" })}
                                                            name={channel?.special_type === 1 ? `description_extend_${index}` : `description_${index}`}
                                                        />
                                                    );
                                                case 'description-lzd':
                                                    return (
                                                        <>
                                                            <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                <TextAreaDialog
                                                                    type={'description_html'}
                                                                    placeholder={formatMessage({ defaultMessage: "Mô tả dạng HTML" })}
                                                                    name={`description_html_${index}`}
                                                                />
                                                            </td>
                                                            <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                <TextAreaDialog
                                                                    type={'description_short'}
                                                                    placeholder={formatMessage({ defaultMessage: "Mô tả ngắn" })}
                                                                    name={`description_short_${index}`}
                                                                />
                                                            </td>
                                                        </>
                                                    );
                                                case 'description-tiktok':
                                                    return (
                                                        <TextAreaDialog
                                                            type={'description_html'}
                                                            placeholder={formatMessage({ defaultMessage: "Mô tả dạng HTML" })}
                                                            name={`description_html_${index}`}
                                                            required={true}
                                                        />
                                                    )
                                                case 'sell-info':
                                                    return (
                                                        <>
                                                            {property[index]?.length == 0 ? (
                                                                <>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                        <div className="text-center">
                                                                            <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                                                <FastField
                                                                                    name={`price_${index}`}
                                                                                    component={InputVertical}
                                                                                    placeholder={formatMessage({ defaultMessage: "Giá niêm yết" })}
                                                                                    label={""}
                                                                                    nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                                    required
                                                                                    customFeedbackLabel={' '}
                                                                                    addOnRight={'đ'}
                                                                                    type="number"
                                                                                    decimalScale={2}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                        <div className="text-center">
                                                                            <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                                                <FastField
                                                                                    name={`stockOnHand_${index}`}
                                                                                    component={InputVertical}
                                                                                    placeholder={formatMessage({ defaultMessage: "Có sẵn" })}
                                                                                    label={""}
                                                                                    nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                                    required
                                                                                    customFeedbackLabel={' '}
                                                                                    addOnRight={''}
                                                                                    type="number"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}></td>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                        <div className="text-center">
                                                                            <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                                                {_.reduce(property[index], (_total, _property) => {
                                                                                    let stockOnHandProperty = values[`${_property?.stockOnHand}_${index}`] || 0;
                                                                                    return _total + stockOnHandProperty;
                                                                                }, 0)}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </>
                                                    );
                                                case 'properties':
                                                    return (
                                                        <>
                                                            <td style={{ width: 180, verticalAlign: 'initial', 'borderLeft': '1px solid #d9d9d9' }}>
                                                                <div className="d-flex" style={{ flexDirection: 'column', alignItems: 'center' }}>
                                                                    <FastField
                                                                        name={`length_${index}`}
                                                                        component={InputVertical}
                                                                        placeholder={formatMessage({ defaultMessage: "Chiều dài" })}
                                                                        label={""}
                                                                        nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                        required
                                                                        customFeedbackLabel={' '}
                                                                        prefix={'Dài'}
                                                                        addOnRight={'cm'}
                                                                        type="number"
                                                                        decimalScale={2}
                                                                    />
                                                                    <FastField
                                                                        name={`width_${index}`}
                                                                        component={InputVertical}
                                                                        placeholder={formatMessage({ defaultMessage: "Chiều rộng" })}
                                                                        label={""}
                                                                        nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                        required
                                                                        customFeedbackLabel={' '}
                                                                        prefix={'Rộng'}
                                                                        addOnRight={'cm'}
                                                                        type="number"
                                                                        decimalScale={2}
                                                                    />
                                                                    <FastField
                                                                        name={`height_${index}`}
                                                                        component={InputVertical}
                                                                        placeholder={formatMessage({ defaultMessage: "Chiều cao" })}
                                                                        label={""}
                                                                        nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                        required
                                                                        customFeedbackLabel={' '}
                                                                        addOnRight={'cm'}
                                                                        prefix={'Cao'}
                                                                        type="number"
                                                                        decimalScale={2}
                                                                    />
                                                                    <FastField
                                                                        name={`weight_${index}`}
                                                                        component={InputVertical}
                                                                        placeholder={formatMessage({ defaultMessage: "Cân nặng" })}
                                                                        label={""}
                                                                        nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                        required
                                                                        customFeedbackLabel={' '}
                                                                        prefix={formatMessage({ defaultMessage: 'Cân nặng' })}
                                                                        addOnRight={'g'}
                                                                        type="number"
                                                                        decimalScale={2}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </>
                                                    );
                                                case 'channel_logistic':
                                                    return (
                                                        <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                            <div
                                                                className="text-center"
                                                                style={{ cursor: 'pointer' }}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    setCurrentChannel(__product?.channel);
                                                                    setIndexShowShippingPopup(index);
                                                                }}
                                                            >
                                                                {
                                                                    !__product.logisticChannels || __product.logisticChannels?.length == 0 ? <>
                                                                        <i className="ki ki-plus icon-xs text-primary"></i><span className="ml-2 text-primary">{formatMessage({ defaultMessage: "Thêm" })}</span>
                                                                    </> : <>
                                                                        <span className="">{formatMessage({ defaultMessage: "Chỉnh sửa" })} ({__product.logisticChannels?.length})</span>
                                                                    </>
                                                                }
                                                            </div>
                                                        </td>
                                                    );
                                                default:
                                                    return null;
                                            }
                                        })
                                        }
                                        <td style={{ width: 150, verticalAlign: 'initial' }}>
                                            <div className="text-center">
                                                <p
                                                    className="text-primary"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => onShowConfirmPopup(index)}
                                                >
                                                    {formatMessage({ defaultMessage: "Xoá" })}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>

                                    {property[index]?.length > 0 && (
                                        <>
                                            <tr className="borderRight" style={{ borderBottom: '0.5px solid #D9D9D9' }}>
                                                <td colSpan={1}></td>
                                                <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                    <div>
                                                        <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                            {!!property
                                                                ? property[index]?.slice(0, !property[index]?.length > 2 || !isExpand?.some(_indexExpand => _indexExpand == index) ? 2 : property[index]?.length)?.map(
                                                                    (_pro, __index) => <p className="mb-2" key={`attribute---${__index}`} style={{ marginBottom: 0, minHeight: 30 }} >{_pro.title}</p>
                                                                ) : null}
                                                        </div>
                                                    </div>

                                                    <p
                                                        className='font-weight-normal d-flex'
                                                        style={{ color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
                                                        onClick={e => {
                                                            e.preventDefault();

                                                            setIsExpand(prevState => {
                                                                if (prevState?.length == 0 || !prevState.some(__state => __state == index)) {
                                                                    return prevState.concat(index)
                                                                }
                                                                return prevState.filter(__state => __state != index)
                                                            });
                                                        }}
                                                    >
                                                        {(property[index].length > 2) && (!isExpand?.some(_indexExpand => _indexExpand == index) ? `Xem thêm` : `Thu gọn`)}
                                                    </p>
                                                    {/* flag */}
                                                </td>
                                                <td style={{ width: 300, verticalAlign: 'initial' }}>
                                                    <div className="text-center">
                                                        <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                            {!!property
                                                                ? property[index]?.slice(0, !property[index]?.length > 2 || !isExpand?.some(_indexExpand => _indexExpand == index) ? 2 : property[index]?.length)?.map(
                                                                    _pro => <FastField
                                                                        name={`${_pro.sku}_${index}`}
                                                                        component={InputVertical}
                                                                        placeholder="Sku"
                                                                        label={""}
                                                                        nameTxt={""}
                                                                        required
                                                                        customFeedbackLabel={' '}
                                                                        addOnRight={''}
                                                                        decimalScale={2}
                                                                    />
                                                                ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                {options?.map((_option, idx) => {
                                                    if (!_option.isShow) return <></>;

                                                    const canExpand = property[index]?.length > 2;

                                                    switch (_option.key) {
                                                        case 'sell-info':
                                                            return (
                                                                <>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                        <div className="text-center">
                                                                            <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                                                {!!property
                                                                                    ? property[index]?.slice(0, !canExpand || !isExpand?.some(_indexExpand => _indexExpand == index) ? 2 : property[index]?.length)?.map(
                                                                                        _pro => <FastField
                                                                                            name={`${_pro.price}_${index}`}
                                                                                            component={InputVertical}
                                                                                            placeholder={formatMessage({ defaultMessage: "Giá niêm yết" })}
                                                                                            label={""}
                                                                                            nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                                            required
                                                                                            customFeedbackLabel={' '}
                                                                                            addOnRight={'đ'}
                                                                                            type="number"
                                                                                            decimalScale={2}
                                                                                        />
                                                                                    ) : null}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ width: 150, verticalAlign: 'initial' }}>
                                                                        <div className="text-center">
                                                                            <div className="d-flex" style={{ flexDirection: 'column' }}>
                                                                                {!!property
                                                                                    ? property[index]?.slice(0, !canExpand || !isExpand?.some(_indexExpand => _indexExpand == index) ? 2 : property[index]?.length)?.map(
                                                                                        _pro => <FastField
                                                                                            name={`${_pro.stockOnHand}_${index}`}
                                                                                            component={InputVertical}
                                                                                            placeholder={formatMessage({ defaultMessage: "Tồn kho" })}
                                                                                            label={""}
                                                                                            nameTxt={formatMessage({ defaultMessage: "Chỉnh sửa" })}
                                                                                            required
                                                                                            customFeedbackLabel={' '}
                                                                                            addOnRight={''}
                                                                                            type="number"
                                                                                        />
                                                                                    ) : null}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            );
                                                        default:
                                                            return (
                                                                <> <td></td></>

                                                            )
                                                    }
                                                })}
                                            </tr>
                                            {/* {property[index]?.length > 2 && (
                                               <>
                                                 <tr style={index == products?.length - 1 ? {} : { borderBottom: '1px solid #D9D9D9' }}>
                                                    <td colSpan={1} />
                                                    <td colSpan={1} className='pt-0' >
                                                        <p
                                                            className='font-weight-normal d-flex'
                                                            style={{ color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
                                                            onClick={e => {
                                                                e.preventDefault();

                                                                setIsExpand(prevState => {
                                                                    if (prevState?.length == 0 || !prevState.some(__state => __state == index)) {
                                                                        return prevState.concat(index)
                                                                    }
                                                                    return prevState.filter(__state => __state != index)
                                                                });
                                                            }}
                                                        >
                                                            {!isExpand?.some(_indexExpand => _indexExpand == index) ? `Xem thêm` : `Thu gọn`}
                                                        </p>
                                                    </td>
                                                </tr>
                                               </>
                                            )} */}
                                        </>
                                    )}
                                </>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </CardBody >
    )
})