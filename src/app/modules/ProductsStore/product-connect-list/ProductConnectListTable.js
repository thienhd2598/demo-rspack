import React, { Fragment, memo, useMemo, useState } from "react";
import * as uiHelpers from "../ProductsUIHelpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import { useMutation, useQuery } from "@apollo/client";
import query_ScGetSmeProducts from '../../../../graphql/query_ScGetSmeProducts'
import Pagination from '../../../../components/Pagination'
import { useLocation, useHistory, Link } from "react-router-dom";
import { useToasts } from 'react-toast-notifications'
import queryString from 'querystring'
import { useProductsUIContext } from "../ProductsUIContext";
import { Modal } from "react-bootstrap";
import ProductConnectRow from "./ProductConnectRow";
import ProductConnectDialog from "../products-list/dialog/ProductConnectDialog";
import DeleteProductConnectDialog from "../products-list/dialog/DeleteProductConnectDialog";
import ModalCombo from "../products-list/dialog/ModalCombo";
import ProductCount from "./ProductCount";
import _ from 'lodash';
import { useIntl } from 'react-intl';

// import LoadingDialog from "./dialog/LoadingDialog";

const ProductConnectListTable = () => {
    const { formatMessage } = useIntl();
    const params = queryString.parse(useLocation().search.slice(1, 100000))
    const { addToast } = useToasts();
    const history = useHistory()
    let currentChannel = params?.channel || 'shopee';
    const [scId, setScId] = useState(null);
    const [isRemoveConnect, setRemoveConnect] = useState(false);
    const [selectedValue, setSelectedValue] = useState({
        sme_product_id: '',
        sc_product_id: null,
        sc_variant_id: null,
        sme_variant_id: '',
        action: '',
    });
    const [dataCombo, setDataCombo] = useState(null);

    const STATUS_PRODUCT_CONNECT = [
        { title: formatMessage({ defaultMessage: 'Tất cả' }) },
        { title: formatMessage({ defaultMessage: 'Chưa liên kết' }), value: 3 },
        { title: formatMessage({ defaultMessage: 'Đã liên kết' }), value: 2 },
    ];

    let page = useMemo(() => {
        try {
            let _page = Number(params.page)
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1
        }
    }, [params.page]);

    const status = useMemo(() => {
        if (!params?.status) return {}

        return {
            status: Number(params?.status)
        }
    }, [params?.status]);

    let limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit]);

    let store_id = useMemo(() => {
        try {
            let store = !!params?.store ? parseInt(params?.store) : null
            if (!store || Number.isNaN(store)) {
                return null
            }
            return store
        } catch (error) {
            return null
        }
    }, [params.store])

    let filter_map_sme = useMemo(() => {
        let filter_map_sme = Number(params?.filter_map_sme);
        if (!isNaN(filter_map_sme)) {
            return filter_map_sme
        }
        return null
    }, [params?.filter_map_sme]);

    const { data, loading, error, refetch } = useQuery(query_ScGetSmeProducts, {
        variables: {
            per_page: limit,
            page: page,
            q: !!params.name ? params.name : '',
            connector_channel_code: currentChannel,
            store_id: store_id,
            filter_map_sme,
            ...status
        },
        fetchPolicy: 'network-only',
    });

    let totalRecord = data?.ScGetSmeProducts?.total || 0
    let totalPage = Math.ceil(totalRecord / limit);

    return (
        <>
            <div className="d-flex w-100" style={{ position: 'sticky', top: 45, background: '#fff', zIndex: 1 }}>
                <div style={{ flex: 1 }} >
                    <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
                        {STATUS_PRODUCT_CONNECT?.map((_status, index) => {
                            console.log(_status?.title)
                            let clss = `nav-link font-weight-normal`;
                            if (
                                (isNaN(Number(params?.filter_map_sme)) && typeof _status?.value != 'number')
                                || Number(params?.filter_map_sme) === _status?.value
                            ) {
                                clss += ` active`;
                            }

                            return (
                                <li className={`nav-item ${(_status?.title == 'Tất cả' || _status?.title == 'all') && !params.title ? 'active' : ''} ${_status?.title ? _status?.title == params.title ? 'active' : null : null}`} key={`product-connect-${index}`}>
                                    <a className={clss}
                                        style={{ fontSize: '13px' }}
                                        onClick={e => {
                                            history.push(`/product-stores/connect?${queryString.stringify(
                                                typeof _status?.value == 'number' ? {
                                                    ...params,
                                                    page: 1,
                                                    filter_map_sme: _status?.value,
                                                    title: _status?.title
                                                } : _.omit(params, ['filter_map_sme', 'title'])
                                            )}`)
                                        }}
                                    >
                                        {_status?.title} (
                                        <ProductCount
                                            whereCondition={
                                                {
                                                    q: !!params.name ? params.name : '',
                                                    connector_channel_code: currentChannel,
                                                    store_id: store_id,
                                                    filter_map_sme: _status?.value,
                                                    ...status
                                                }
                                            }
                                        />
                                        )
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
            <div>
                <table className="table product-list table-borderless product-list  table-vertical-center fixed"  >
                    <thead style={{ position: 'sticky', top: 84, background: '#F3F6F9', fontWeight: '500', fontSize: '14px', borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9' }}>
                        <tr>
                            <th width="35%" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {formatMessage({ defaultMessage: 'Sản phẩm sàn' })}
                            </th>
                            <th width="20%" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {formatMessage({ defaultMessage: 'SKU' })}
                            </th>
                            <th width='35%' style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {formatMessage({ defaultMessage: 'Sản phẩm kho' })}
                            </th>
                            <th width='10%' className="text-center" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                {formatMessage({ defaultMessage: 'Thao tác' })}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            loading && <div style={{ minHeight: 150 }}> <div className='text-center w-100 my-8' style={{ position: 'absolute' }} >
                                <span className="ml-3 spinner spinner-primary"></span>
                            </div>
                            </div>
                        }
                        {!!error && !loading && (
                            <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 100 }}
                                        onClick={e => {
                                            e.preventDefault();
                                            refetch();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {
                            !error && !loading && data?.ScGetSmeProducts?.products?.map(_product => {
                                return <ProductConnectRow
                                    key={`product-row-${_product.id}`}
                                    product={_product}
                                    onLink={(id, sme_product_id) => setScId({ id, sme_product_id })}
                                    onRemoveLink={params => {
                                        setRemoveConnect(true);
                                        setSelectedValue({
                                            ...selectedValue,
                                            ...params
                                        })
                                    }}
                                    op_connector_channels={data?.op_connector_channels || []}
                                    sc_stores={data?.sc_stores || []}
                                    setDataCombo={setDataCombo}
                                />
                            })
                        }
                    </tbody>
                </table>
                {!error && !loading && (
                    <Pagination
                        page={page}
                        totalPage={totalPage}
                        loading={loading}
                        limit={limit}
                        totalRecord={totalRecord}
                        count={data?.ScGetSmeProducts?.products?.length}
                        basePath={'/product-stores/connect'}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                    />
                )}
            </div>
            <DeleteProductConnectDialog
                show={isRemoveConnect}
                onHide={() => setRemoveConnect(false)}
                sme_product_id={selectedValue.sme_product_id}
                sc_product_id={selectedValue.sc_product_id}
                sc_variant_id={selectedValue.sc_variant_id}
                action={selectedValue.action}
            />
            <ProductConnectDialog
                show={!!scId}
                scId={scId?.id}
                sme_product_id={scId?.sme_product_id}
                onHide={() => setScId(null)}
                setDataCombo={setDataCombo}
            />

            <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />
        </>
    )
};

export default memo(ProductConnectListTable);