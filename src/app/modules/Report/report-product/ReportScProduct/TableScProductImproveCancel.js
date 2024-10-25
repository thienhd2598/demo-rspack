import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { find } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import client from "../../../../../apollo";
import InfoProduct from "../../../../../components/InfoProduct";
import query_report_scproduct_improve_cancel_ratio from "../../../../../graphql/query_report_scproduct_improve_cancel_ratio";
import query_scGetProductVariants from "../../../../../graphql/query_scGetProductVariants";
import { formatNumberToCurrency } from "../../../../../utils";
import query_scGetProductVariantAssets from "../../../../../graphql/query_scGetProductVariantAssets";
import query_report_scproduct_improve_cancel_ratio_pagination from "../../../../../graphql/query_report_scproduct_improve_cancel_ratio_pagination";
import PaginationModal from "../../../../../components/PaginationModal";
import queryString from 'querystring'

const queryGetScProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_scGetProductVariants,
        variables: {
            variant_ids: ids,
        },
        fetchPolicy: "network-only",
    });

    return data?.scGetProductVariants?.variants || [];
}

const queryGetScProductVariantAssets = async (product_variants) => {
    if (product_variants?.length == 0) return [];

    const { data } = await client.query({
        query: query_scGetProductVariantAssets,
        variables: { product_variants },
        fetchPolicy: "network-only",
    });

    return data?.scGetProductVariantAssets || [];
}

const TableScProductImproveCancel = ({ variables, dataStore }) => {
    const { formatMessage } = useIntl();
    const [dataTable, setDataTable] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: dataScProductImproveCancel, loading: loadingScProductImproveCancel } = useQuery(query_report_scproduct_improve_cancel_ratio_pagination, {
        variables: {
            ...variables,
            page,
            pageSize
        },
        fetchPolicy: 'cache-and-network',
    });

    useMemo(() => setPage(1), [variables]);

    useEffect(() => {
        let isMounted = true;
        if (!dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination || dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.items?.length == 0) {
            setDataTable([])
            return;
        };

        setLoadingTable(true);
        queryGetScProductVariants(dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.items?.map(
            product => product?.scVariantId
        ))
            .then(dataMappingScProduct => {
                if (!isMounted) return;

                queryGetScProductVariantAssets(dataMappingScProduct?.map(
                    product => ({
                        sc_product_id: product?.product?.id,
                        sc_variant_id: product?.id,
                        sc_product_attributes_value: product?.sc_product_attributes_value
                    })
                )).then(dataAssets => {
                    const parseData = dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.items?.map(item => {
                        const findedScProduct = find(dataMappingScProduct || [], product => product?.id == item?.scVariantId);
                        const findedStore = find(dataStore?.sc_stores || [], store => store?.id == findedScProduct?.product?.store_id);

                        return {
                            ...item,
                            store: findedStore,
                            scProduct: {
                                ...findedScProduct,
                                asset: find(dataAssets, asset => asset?.sc_variant_id == item?.scVariantId)?.asset
                            }
                        }
                    })
                    setDataTable(parseData);
                })
                    .finally(() => {
                        setLoadingTable(false);
                    })

            })
            .catch(err => {
                setDataTable([]);
            })

        return () => {
            isMounted = false;
        }

    }, [dataScProductImproveCancel, dataStore]);

    console.log({ variables, dataScProductImproveCancel, dataTable });

    const parseDateTime = useCallback((time_diff) => {
        return dayjs.unix(variables?.date).add(time_diff, 'day').format('DD/MM')
    }, [variables?.date]);

    const columns = [
        {
            title: 'STT',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '5%',
            render: (item, record, index) => {
                return <span>{index + (page - 1) * pageSize + 1}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Sản phẩm' }),
            dataIndex: 'scProduct',
            key: 'scProduct',
            align: 'left',
            width: '45%',
            render: (item, record, index) => {
                let imgOrigin = (item?.product?.productAssets || []).find(_asset => _asset?.type == 4)
                const productAsset = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin?.sme_url : (item?.product?.productAssets || []).filter(_asset => _asset?.type == 1)[0]?.sme_url

                return (
                    <div style={{ verticalAlign: 'center', display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                backgroundColor: '#F7F7FA',
                                width: 60, height: 60,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 60,
                                cursor: 'pointer'
                            }}
                            onClick={e => {
                                e.preventDefault();
                            }}
                            className='mr-6'
                        >
                            <img
                                src={item?.asset?.sme_url || productAsset}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onClick={() => window.open(`/report/product/${item?.id}?${queryString.stringify({type: 'channel'})}`, '_blank')}
                            />
                        </div>
                        <div className="w-100" style={{ display: 'flex', flexDirection: 'column' }}>
                            <InfoProduct
                                url={() => window.open(`/report/product/${item?.id}?${queryString.stringify({type: 'channel'})}`, '_blank')}
                                short={true}
                                name={item?.product?.name}
                                sku={item?.sku}
                                productOrder={true}
                            />
                            <div>
                                {item?.product?.productVariantAttributes?.length > 0 ? item?.name : ''}
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            dataIndex: 'store',
            key: 'store',
            align: 'center',
            width: '15%',
            render: (item, record, index) => {
                return !!item ? <div className="d-flex justify-content-center align-items-center">
                    <img
                        className="mr-2"
                        src={toAbsoluteUrl(`/media/logo_${item?.connector_channel_code}.png`)}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                    <span>
                        {item?.name}
                    </span>
                </div> : '--'
            }
        },
        {
            title: <span>{formatMessage({ defaultMessage: 'Yêu cầu trả hàng ({from} - {to})' }, { from: parseDateTime(-29), to: parseDateTime(0) })}</span>,
            dataIndex: 'totalReturn',
            key: 'totalReturn',
            align: 'center',
            width: '20%',
            render: (item) => {
                return <span>{formatNumberToCurrency(item)}</span>
            }
        },
        {
            title: <span>{formatMessage({ defaultMessage: 'Tỷ lệ hoàn trả ({from} - {to})' }, { from: parseDateTime(-29), to: parseDateTime(0) })}</span>,
            dataIndex: 'ratio',
            key: 'ratio',
            align: 'center',
            width: '20%',
            render: (item) => {
                return <span>{item != 0 ? formatNumberToCurrency((item * 100).toFixed(2)) : item}%</span>
            }
        },
    ];

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {(loadingTable || loadingScProductImproveCancel) && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    style={(loadingTable || loadingScProductImproveCancel) ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={(loadingTable || loadingScProductImproveCancel) ? [] : dataTable}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataTable?.length > 0 && (
                <div style={{ width: '100%' }}>
                    <PaginationModal
                        page={page}
                        limit={pageSize}
                        onPanigate={(page) => setPage(page)}
                        totalPage={Math.ceil(dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.totalPage / pageSize)}
                        totalRecord={dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.totalPage || 0}
                        count={dataScProductImproveCancel?.report_scproduct_improve_cancel_ratio_pagination?.items?.length}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                    />
                </div>
            )}
        </Fragment>
    )
};

export default memo(TableScProductImproveCancel);