import React, { FC, memo, useMemo, useState } from 'react';
import SVG from "react-inlinesvg";
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../utils';
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import Pagination from '../../../../components/Pagination';
import { useIntl } from 'react-intl';

const ProductConnectTable = memo(({
    data,
    loading,
    smeId,
    page,
    limit,
    totalPage,
    totalRecord,
    onShowRemoveConnect,
    onShowConnectClassify,
    setSelectedValue
}) => {
    const { formatMessage } = useIntl()
    console.log({ data })

    return (
        <div style={{
            boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
            minHeight: 200,
            borderRadius: 6,
            marginTop: 20
        }} >
            <table className="table table-borderless product-list table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th colSpan={4} className='text-center' style={{ fontSize: '14px',border: '1px solid #D9D9D9', borderTopRightRadius: 6, borderLeft: 'none', borderTop: 'none' }}>
                            <p className="text-dark-75 mb-0">{formatMessage({defaultMessage:'Sản phẩm kho'})}</p>
                        </th>
                        <th colSpan={4} className='text-center' style={{ fontSize: '14px', borderRight: '1px solid #D9D9D9' }}>
                            <span className="text-dark-75">{formatMessage({defaultMessage:'Sản phẩm trên sàn'})}</span>
                        </th>
                        <th colSpan={1} rowSpan={2} className='text-center' style={{ fontSize: '14px', borderBottom: '1px solid #D9D9D9' }}>
                        {formatMessage({defaultMessage:'Thao tác'})}
                        </th>
                    </tr>
                    <tr>
                        <th colSpan={2} className='text-center' style={{fontSize: '14px', border: '1px solid #D9D9D9', borderRight: 'none', borderLeft: 'none' }}>
                        {formatMessage({defaultMessage:'Tên sản phẩm'})}
                        </th>
                        <th className='text-center' style={{fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none' }}>
                        {formatMessage({defaultMessage:'Tồn kho'})}
                        </th>
                        <th className='text-center' style={{ fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none' }}>
                        {formatMessage({defaultMessage:'Giá gốc'})}
                        </th>
                        <th colSpan={2} className='text-center' style={{fontSize: '14px', border: '1px solid #D9D9D9', borderRight: 'none' }}>
                        {formatMessage({defaultMessage:'Tên sản phẩm'})}
                        </th>
                        <th className='text-center' style={{fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none' }}>
                        {formatMessage({defaultMessage:'Tồn kho'})}
                        </th>
                        <th className='text-center' style={{fontSize: '14px', border: '1px solid #D9D9D9', borderLeft: 'none' }}>
                        {formatMessage({defaultMessage:'Giá niêm yết'})}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                            <span className="ml-3 spinner spinner-primary"></span>
                        </div>
                    }
                    {data.map(
                        (_row, index) => (
                            <>
                                <tr
                                    style={_row?.sme_attributes?.length == 0 || _row.variants.length == 0 ? { marginBottom: 20, borderBottom: '1px solid #ebedf3' } : {}}
                                >
                                    <td colSpan={2} style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                        <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <p className='font-weight'>{_row.sme_name}</p>
                                            <div style={{ display: 'flex' }} >
                                                <p className='d-flex' style={{ alignItems: 'flex-start' }}>
                                                    <img src={toAbsoluteUrl('/media/ic_sku.svg')} className="mr-2 sku-img-custom" />
                                                    <span style={{ maxWidth: '170px' }}>{_row.sme_sku}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                        {formatNumberToCurrency(_row.sme_stock_on_hand)}
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                        {formatNumberToCurrency(_row.sme_price)} đ
                                    </td>
                                    <td colSpan={2} style={{ borderRight: '1px solid #D9D9D9' }}>
                                        <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <p
                                                className='font-weight'
                                                style={{ cursor: 'pointer' }}
                                                onClick={e => {
                                                    e.preventDefault();
                                                    window.open(`/product-stores/edit/${_row.sc_id}`, '_blank')
                                                }}
                                            >
                                                {_row.sc_name}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center' }} >
                                                <p className='d-flex' style={{ alignItems: 'flex-start' }}>
                                                    <img src={toAbsoluteUrl('/media/ic_sku.svg')} className="mr-2 sku-img-custom" />
                                                    <span style={{ maxWidth: '170px' }}>{_row.sc_sku}</span>
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center' }} >
                                                <p className='d-flex' style={{ alignItems: 'baseline' }}>
                                                    <img style={{ width: 20, height: 20 }} src={_row.sc_channel?.logo_asset_url} className="mr-2 sku-img-custom" />
                                                    <span>{_row.sc_store?.name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                        {formatNumberToCurrency(_row.sc_stock_on_hand)}
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                        {formatNumberToCurrency(_row.sc_price)} đ
                                    </td>
                                    <td className='text-center' style={{ verticalAlign: 'top' }}>
                                        <p
                                            style={{ cursor: 'pointer', color: '#f94e30' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                onShowRemoveConnect();
                                                setSelectedValue(prevState => ({
                                                    ...prevState,
                                                    sc_product_id: _row.sc_id,
                                                    action: 'unlink_product'
                                                }))
                                            }}
                                        >
                                            {formatMessage({defaultMessage:'Huỷ liên kết'})}
                                        </p>
                                    </td>
                                </tr>
                                {_row?.sme_attributes?.length > 0 && _row.variants.map(
                                    (_variant, idx) => {
                                        return (
                                            <tr style={idx == (_row.variants.length - 1) ? { marginBottom: 20, borderBottom: '1px solid #ebedf3' } : {}}>
                                                <td colSpan={2} style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                                    <>
                                                        <p className="ml-6 d-flex" style={{ marginBottom: 0 }}>
                                                            {_variant.sme_variant_name}
                                                        </p>
                                                        <div style={{ display: 'flex' }}>
                                                            <p className="ml-6 d-flex" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
                                                                <img src={toAbsoluteUrl('/media/ic_sku.svg')} className="mr-2 sku-img-custom" /><span style={{ maxWidth: '170px' }}>{_variant.sme_variant_sku}</span>
                                                            </p>
                                                        </div>
                                                    </>
                                                </td>
                                                <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                                    <>
                                                        {formatNumberToCurrency(_variant.sme_variant_stock_on_hand)}
                                                    </>
                                                </td>
                                                <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                                    <>
                                                        {formatNumberToCurrency(_variant.sme_variant_price)} đ
                                                    </>
                                                </td>
                                                <td colSpan={2} style={{ borderRight: '1px solid #D9D9D9' }}>
                                                    {!!_variant.sc_variant_name && (
                                                        <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'start' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <p
                                                                    className="ml-6 d-flex"
                                                                    style={{ marginBottom: 0 }}
                                                                >
                                                                    {_variant.sc_variant_name}
                                                                </p>
                                                            </div>
                                                            <div style={{ display: 'flex' }}>
                                                                <p className="ml-6 d-flex" style={{ marginBottom: 0, alignItems: 'flex-start' }}>
                                                                    <img src={toAbsoluteUrl('/media/ic_sku.svg')} className="mr-2 sku-img-custom" />
                                                                    <span style={{ maxWidth: '170px' }}>{_variant.sc_variant_sku}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                                    {_variant.sc_variant_stock_on_hand != null && (
                                                        <>
                                                            {formatNumberToCurrency(_variant.sc_variant_stock_on_hand)}
                                                        </>
                                                    )}
                                                </td>
                                                <td className='text-center' style={{ verticalAlign: 'top', borderRight: '1px solid #D9D9D9' }}>
                                                    {_variant.sc_variant_price != null && (
                                                        <>
                                                            {formatNumberToCurrency(_variant.sc_variant_price)} đ
                                                        </>
                                                    )}
                                                </td>
                                                <td className='text-center' style={{ verticalAlign: 'top' }}>
                                                    {_row?.sc_variants_attribute?.length > 0 && (
                                                        <p
                                                            style={{ cursor: 'pointer', color: _variant.sc_variant_id ? '#f94e30' : '#1890ff' }}
                                                            onClick={e => {
                                                                e.preventDefault();

                                                                setSelectedValue(prevState => ({
                                                                    ...prevState,
                                                                    sme_variant_id: _variant.sme_variant_id,
                                                                    action: 'unlink_product_variant'
                                                                }))
                                                                if (_variant.sc_variant_id) {
                                                                    setSelectedValue(prevState => ({
                                                                        ...prevState,
                                                                        sc_variant_id: _variant.sc_variant_id,
                                                                    }))
                                                                    onShowRemoveConnect();
                                                                } else {
                                                                    setSelectedValue(prevState => ({
                                                                        ...prevState,
                                                                        sc_product_id: _row.sc_id,
                                                                    }))
                                                                    onShowConnectClassify()
                                                                }
                                                            }}
                                                        >
                                                            {_variant.sc_variant_id ? formatMessage({defaultMessage:'Huỷ liên kết'}) : formatMessage({defaultMessage:'Liên kết'})}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    }
                                )}
                            </>
                        )
                    )}
                </tbody>
            </table>

            <Pagination
                page={page}
                totalPage={totalPage}
                loading={loading}
                limit={limit}
                totalRecord={totalRecord}
                count={data.length}
                basePath={`/products/edit/${smeId}/affiliate`}
                emptyTitle={formatMessage({defaultMessage:'Chưa có sản phẩm nào'})}
            />
        </div>
    )
});

export default ProductConnectTable;