import { useQuery } from "@apollo/client";
import { find } from 'lodash';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from "react-intl";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import client from "../../../../../apollo";
import InfoProduct from "../../../../../components/InfoProduct";
import query_report_smeproductQuantity from "../../../../../graphql/query_report_smeproductQuantity";
import query_sme_catalog_product_variant from "../../../../../graphql/query_sme_catalog_product_variant";
import { formatNumberToCurrency } from "../../../../../utils";
import ModalSmeProductConnect from "../components/ModalSmeProductConnect";
import queryString from 'querystring'
import { useLocation } from "react-router-dom";
import PaginationModal from "../../../../../components/PaginationModal";

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

const TableSmeProductQuantity = ({ variables, dataStore }) => {
    const { formatMessage } = useIntl();
    const [dataTable, setDataTable] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [currentVariantConnect, setCurrentVariantConnect] = useState(null);
    const location = useLocation()
    const params = queryString.parse(location.search.slice(1, 100000));
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);

    const { data: dataSmeProductQuantity, loading: loadingSmeProductQuantity } = useQuery(query_report_smeproductQuantity, {
        variables: {
            ...variables,
            warehouses_ids : params?.warehouse ? params?.warehouse : '',
            page,
            pageSize: limit
        },
        fetchPolicy: 'cache-and-network',
    });

    useMemo(async () => {
        try {
            if (!dataSmeProductQuantity?.report_smeproductQuantity_v2?.items?.length) return null;

            setLoadingTable(true);
            const dataMappingSmeProduct = await queryGetSmeProductVariants(dataSmeProductQuantity?.report_smeproductQuantity_v2?.items?.map(product => product?.variantId));

            const parseData = dataSmeProductQuantity?.report_smeproductQuantity_v2?.items?.map(item => {
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
    }, [dataSmeProductQuantity]);


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

    const columns = [
        {
            title: 'STT',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            width: '5%',
            render: (item, record, index) => {
                return <span>{(page - 1)*limit + index + 1}</span>
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
            title: <div>
                <span>{formatMessage({ defaultMessage: 'Số sản phẩm' })}</span>
                <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {formatMessage({ defaultMessage: 'Số lượng sản phẩm đó ở tất cả các đơn hàng (không bao gồm đơn hoàn, huỷ) trong khoảng thời gian đã chọn, được thống kê dựa trên thời gian đặt hàng.' })}
                        </Tooltip>
                    }
                >
                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                    </span>
                </OverlayTrigger>
            </div>,
            dataIndex: 'count',
            key: 'count',
            align: 'center',
            width: '15%',
            render: (item) => {
                return <span>{formatNumberToCurrency(item)}</span>
            }
        },
        {
            title: <div>
                <span>{formatMessage({ defaultMessage: 'Tỷ lệ' })}</span>
                <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {formatMessage({ defaultMessage: 'Số lượng của sản phẩm đó chia cho tổng doanh số ở tất cả các đơn hàng(không bao gồm đơn hoàn, huỷ) trong khoảng thời gian đã chọn, được thống kê dựa trên thời gian đặt hàng.' })}
                        </Tooltip>
                    }
                >
                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                    </span>
                </OverlayTrigger>
            </div>,
            dataIndex: 'ratio',
            key: 'ratio',
            align: 'center',
            width: '10%',
            render: (item, record, index) => {
                return <span>{item != 0 ? (item * 100).toFixed(2) : item}%</span>
            }
        },
        {
            title: <div>
                <span>{formatMessage({ defaultMessage: 'Thay đổi' })}</span>
                <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {formatMessage({ defaultMessage: 'Thay đổi về số lượng của các sản phẩm so với khoảng thời gian trước đó (tính theo %).' })}
                        </Tooltip>
                    }
                >
                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                    </span>
                </OverlayTrigger>
            </div>,
            dataIndex: 'increase',
            key: 'increase',
            align: 'center',
            width: '10%',
            render: (item, record) => {
                return <div className="d-flex justify-content-center align-items-center">
                    {item >= 0 ? (
                        <i
                            className={`fas fa-sort-up mr-2`}
                            style={{ color: '#00DB6D', position: 'relative', top: 3 }}
                        />
                    ) : (
                        <i
                            className={`fas fa-sort-down mr-1`}
                            style={{ color: '#FF0000', position: 'relative', top: -2 }}
                        />
                    )}
                    {item == record?.count ? (
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Tăng trưởng mới, do giá trị của kỳ trước là 0' })}
                                </Tooltip>
                            }
                        >
                            <span style={{ position: 'relative', top: '-1px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-infinity" viewBox="0 0 18 18">
                                    <path d="M5.68 5.792 7.345 7.75 5.681 9.708a2.75 2.75 0 1 1 0-3.916ZM8 6.978 6.416 5.113l-.014-.015a3.75 3.75 0 1 0 0 5.304l.014-.015L8 8.522l1.584 1.865.014.015a3.75 3.75 0 1 0 0-5.304l-.014.015zm.656.772 1.663-1.958a2.75 2.75 0 1 1 0 3.916z" />
                                </svg>
                            </span>
                        </OverlayTrigger>
                    ) : (
                        <span>{item != 0 ? Math.abs((item * 100).toFixed(2)) : item}%</span>
                    )}
                </div>
            }
        },
    ];

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {(loadingTable || loadingSmeProductQuantity) && (
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
                    style={(loadingTable || loadingSmeProductQuantity) ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={(loadingTable || loadingSmeProductQuantity || !dataSmeProductQuantity?.report_smeproductQuantity_v2?.items?.length) ? [] : dataTable}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
                <PaginationModal
                    page={page}
                    limit={limit}
                    onPanigate={(page) => {
                        setPage(page)}}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(+limit);
                    }}
                    emptyTitle=""
                    totalPage={dataSmeProductQuantity?.report_smeproductQuantity_v2?.totalPage}
                    // totalRecord={dataCrmProductByCustomer?.crmProductByCustomer?.paginatorInfo?.total || 0}
                    count={dataSmeProductQuantity?.report_smeproductQuantity_v2?.items?.length}
                />
            </div>
        </Fragment>
    )
};

export default memo(TableSmeProductQuantity);