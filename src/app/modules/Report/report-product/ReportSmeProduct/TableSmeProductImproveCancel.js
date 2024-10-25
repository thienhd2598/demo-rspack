import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { find } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import client from "../../../../../apollo";
import InfoProduct from "../../../../../components/InfoProduct";
import query_sme_catalog_product_variant from "../../../../../graphql/query_sme_catalog_product_variant";
import { formatNumberToCurrency } from "../../../../../utils";
import ModalSmeProductConnect from "../components/ModalSmeProductConnect";
import query_report_smeproduct_improve_cancel_ratio_pagination from "../../../../../graphql/query_report_smeproduct_improve_cancel_ratio_pagination";
import PaginationModal from "../../../../../components/PaginationModal";
import queryString from 'querystring'

const queryGetSmeProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_sme_catalog_product_variant,
        variables: {
            where: {
                id: { _in: ids },
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_product_variant || [];
}

const TableSmeProductImproveCancel = ({ variables, dataStore }) => {
    const { formatMessage } = useIntl();
    const [dataTable, setDataTable] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [currentVariantConnect, setCurrentVariantConnect] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: dataSmeProductImproveCancel, loading: loadingSmeProductImproveCancel } = useQuery(query_report_smeproduct_improve_cancel_ratio_pagination, {
        variables: {
            ...variables,
            page,
            pageSize
        },
        fetchPolicy: 'cache-and-network',
    });

    useMemo(() => setPage(1), [variables]);

    useMemo(async () => {
        try {
            if (!dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination) return null;

            setLoadingTable(true);
            const dataMappingSmeProduct = await queryGetSmeProductVariants(dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination?.items?.map(product => product?.variantId));

            const parseData = dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination?.items?.map(item => {
                const findedSmeProduct = find(dataMappingSmeProduct || [], product => product?.id == item?.variantId);

                return {
                    ...item,
                    smeProduct: findedSmeProduct
                }
            })

            setDataTable(parseData);
        } catch (err) {
            setDataTable([]);
        } finally {
            setLoadingTable(false);
        }
    }, [dataSmeProductImproveCancel]);

    const parseAttributes = useCallback((item_attributes) => {
        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
            for (let index = 0; index < item_attributes.length; index++) {
                const element = item_attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);
            }
            return attributes.join(" - ");
        }
        return null;
    }, []);

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
            dataIndex: 'smeProduct',
            key: 'smeProduct',
            align: 'left',
            width: '45%',
            render: (item) => {
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
                                src={item?.sme_catalog_product_variant_assets[0]?.asset_url}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                onClick={() => window.open(`/report/product/${item?.id}?${queryString.stringify({type: 'warehouse'})}`, '_blank')}
                            />
                        </div>
                        <div className="w-100" style={{ display: 'flex', flexDirection: 'column' }}>
                            <InfoProduct
                                url={() => window.open(`/report/product/${item?.id}?${queryString.stringify({type: 'warehouse'})}`, '_blank')}
                                short={true}
                                name={item?.variant_full_name}
                                sku={item?.sku}
                                productOrder={true}
                            />
                            <div style={{ width: "max-content" }}>
                                {parseAttributes(item?.attributes) || ''}
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Liên kết' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (item, record, index) => {
                const countVariantLinked = record?.smeProduct?.sc_variant_linked?.length;

                return <span
                    className="text-primary cursor-pointer"
                    onClick={() => setCurrentVariantConnect(record?.smeProduct?.id)}
                >
                    {formatMessage({ defaultMessage: '{count} liên kết' }, { count: countVariantLinked })}
                </span>
            }
        },
        {
            title: <span>{formatMessage({ defaultMessage: 'Yêu cầu trả hàng ({from} - {to})' }, { from: parseDateTime(-29), to: parseDateTime(0) })}</span>,
            dataIndex: 'totalReturn',
            key: 'totalReturn',
            align: 'center',
            width: '20%',
            render: (item) => {
                return <span>{formatNumberToCurrency(item * 100)}</span>
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
                {(loadingTable || loadingSmeProductImproveCancel) && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                {!!currentVariantConnect && (
                    <ModalSmeProductConnect
                        dataStore={dataStore}
                        variantId={currentVariantConnect}
                        onHide={() => setCurrentVariantConnect(null)}
                    />
                )}
                <Table
                    style={(loadingTable || loadingSmeProductImproveCancel) ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={(loadingTable || loadingSmeProductImproveCancel) ? [] : dataTable}
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
                        totalPage={Math.ceil(dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination?.totalPage / pageSize)}
                        totalRecord={dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination?.totalPage || 0}
                        count={dataSmeProductImproveCancel?.report_smeproduct_improve_cancel_ratio_pagination?.items?.length}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                    />
                </div>
            )}
        </Fragment>
    )
};

export default memo(TableSmeProductImproveCancel);