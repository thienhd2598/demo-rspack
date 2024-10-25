import { useQuery } from "@apollo/client";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import queryString from 'querystring';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import {
    Card,
    CardBody
} from "../../../../../_metronic/_partials/controls";
import client from '../../../../../apollo';
import query_report_productSoldScByGMV from '../../../../../graphql/query_report_productSoldScByGMV';
import query_report_productSoldScByQuantity from '../../../../../graphql/query_report_productSoldScByQuantity';
import query_report_productSoldSmeByGMV from '../../../../../graphql/query_report_productSoldSmeByGMV';
import query_report_productSoldSmeByQuantity from '../../../../../graphql/query_report_productSoldSmeByQuantity';
import query_scGetProductVariantAssets from '../../../../../graphql/query_scGetProductVariantAssets';
import query_scGetProductVariants from '../../../../../graphql/query_scGetProductVariants';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import query_sme_catalog_product_variant_by_pk from '../../../../../graphql/query_sme_catalog_product_variant_by_pk';
import { STATUS_TAB } from '../constants';
import ReportTableProductSc from './ReportTableProductSc';
import ReportTableProductSme from './ReportTableProductSme';

ChartJS.register(ArcElement, Tooltip, Legend);

export default memo(({ variables }) => {
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))
    const { formatMessage } = useIntl();
    const [subTabTypeSc, setSubTabTypeSc] = useState(STATUS_TAB['GMV'])
    const [subTabTypeSme, setSubTabTypeSme] = useState(STATUS_TAB['GMV'])

    const [dataTableSme, setDataTableSme] = useState([])
    const [dataTableSc, setDataTableSc] = useState([])
    const [loadingSc, setLoadingSc] = useState(false)
    const [loadingSme, setLoadingSme] = useState(false)
    const effectRan = useRef(false)

    // ================ get Top products Sme ================
    const { data: data_productSoldSmeByGMV,
        refetch: refetchProductSoldSmeByGMV, error: errorProductSoldSmeByGMV } =
        useQuery(query_report_productSoldSmeByGMV, {
            variables: {
                ...variables
            },
            fetchPolicy: 'cache-and-network',
            skip: subTabTypeSme !== STATUS_TAB['GMV']
        });

    const { data: data_productSoldSmeByQuantity,
        refetch: refetchProductSoldSmeByQuantity, error: errorProductSoldSByQuantity }
        = useQuery(query_report_productSoldSmeByQuantity, {
            variables: {
                ...variables
            },
            fetchPolicy: 'cache-and-network',
            skip: subTabTypeSme !== STATUS_TAB['ByQuantity']
        });

    useEffect(() => {
        if (effectRan.current == true) {
            try {

                const dataQuerySme = subTabTypeSme == STATUS_TAB['GMV'] ? {
                    data: data_productSoldSmeByGMV?.report_productSoldSmeByGMV,
                    refetch: refetchProductSoldSmeByGMV,
                    error: errorProductSoldSmeByGMV
                } : {
                    data: data_productSoldSmeByQuantity?.report_productSoldSmeByQuantity,
                    refetch: refetchProductSoldSmeByQuantity,
                    error: errorProductSoldSByQuantity
                }
                setLoadingSme(true)
                Promise.all([...dataQuerySme?.data?.map(item => {
                    return client.query({ query: query_sme_catalog_product_variant_by_pk, fetchPolicy: 'network-only', variables: { id: item?.variantId } })
                })]).then(res => {

                    const catalogProductVariantPk = res?.map(item => item?.data?.sme_catalog_product_variant_by_pk)

                    const data = {
                        error: dataQuerySme?.error,
                        refetch: dataQuerySme?.refetch,
                        products: catalogProductVariantPk?.map((item) => {
                            const productSoldSmeByGMV = dataQuerySme?.data?.find(data => data?.variantId == item?.id)

                            return {
                                ...item,
                                value: productSoldSmeByGMV?.value
                            }

                        })
                    }

                    setDataTableSme(data)
                }).finally(() => {
                    setLoadingSme(false)
                })

            } catch (err) {
                setLoadingSme(false)
                console.log(err)
            }

        }
        return () => {
            effectRan.current = true
        }
    }, [data_productSoldSmeByGMV, data_productSoldSmeByQuantity])

    // ================ get Top products Sme ================

    // ============== get Top product Sc ===============
    const { data: data_productSoldScByQuantity,
        refetch: refetchProductSoldScByQuantity, error: errorProductSoldScByQuantity }
        = useQuery(query_report_productSoldScByQuantity, {
            variables: {
                ...variables
            },
            fetchPolicy: 'cache-and-network',
            skip: subTabTypeSc !== STATUS_TAB['ByQuantity']
        });


    const { data: data_productSoldScByGMV,
        refetch: refetchProductSoldScByGMV, error: errorProductSoldScByGMV } =
        useQuery(query_report_productSoldScByGMV, {
            variables: {
                ...variables
            },
            fetchPolicy: 'cache-and-network',
            skip: subTabTypeSc !== STATUS_TAB['GMV']
        });

    const { data: dataStore, loading: loadingStore } = useQuery(
        query_sc_stores_basic,
        {
            variables: {
                context: 'order',
                context_channel: 'order'
            },
            fetchPolicy: "cache-and-network",
        }
    );
    const queryGetScProductVariantAssets = async (product_variants) => {
        if (product_variants?.length == 0) return [];

        const { data } = await client.query({
            query: query_scGetProductVariantAssets,
            variables: { product_variants },
            fetchPolicy: "network-only",
            skip: !product_variants?.length
        });

        return data?.scGetProductVariantAssets || [];
    }


    useMemo(async () => {
        try {
            const dataQuerySc = subTabTypeSc == STATUS_TAB['GMV'] ? {
                data: data_productSoldScByGMV?.report_productSoldScByGMV,
                refetch: refetchProductSoldScByGMV,
                error: errorProductSoldScByGMV
            } : {
                data: data_productSoldScByQuantity?.report_productSoldScByQuantity,
                refetch: refetchProductSoldScByQuantity,
                error: errorProductSoldScByQuantity
            }
            const variantIds = dataQuerySc?.data?.map?.(item => item?.scVariantId)
            setLoadingSc(true)
            const topProductVariantSc = await client.query({
                query: query_scGetProductVariants,
                fetchPolicy: 'network-only',
                variables: { variant_ids: [...variantIds] },
                skip: !variantIds?.length
            })
            const variablesGetAssets = topProductVariantSc?.data?.scGetProductVariants?.variants?.map(product => {
                return {
                    sc_product_id: product?.product?.id,
                    sc_variant_id: product?.id,
                    sc_product_attributes_value: product?.sc_product_attributes_value
                }
            })



            const productAssets = await queryGetScProductVariantAssets([...variablesGetAssets])

            const stores = dataStore?.sc_stores.map(st => {
                const channel = dataStore?.op_connector_channels?.find(cn => cn?.code == st?.connector_channel_code)

                return {
                    id: st?.id,
                    logo: channel?.logo_asset_url,
                    name: st?.name,
                }
            })
            const data = {
                error: dataQuerySc?.error,
                refetch: dataQuerySc?.refetch,
                products: topProductVariantSc?.data?.scGetProductVariants?.variants?.map(item => {
                    const assetProduct = productAssets?.find(product => product?.sc_variant_id == item?.id)
                    const productSoldScByGMV = dataQuerySc?.data?.find(data => data?.scVariantId == item?.id)
                    const storeProduct = stores?.find(store => store?.id == item?.product?.store_id)
                    return {
                        variantName: item?.name,
                        sku: item?.sku,
                        name: item?.product?.name,
                        storeId: item?.product?.store_id,
                        imgProduct: assetProduct?.asset?.sme_url,
                        id: item?.product?.id,
                        value: productSoldScByGMV?.value,
                        storeProduct
                    }
                })
            }
            setDataTableSc(data)
            setLoadingSc(false)
        } catch (err) {
            setLoadingSc(false)
        }

    }, [data_productSoldScByGMV, data_productSoldScByQuantity, dataStore])
    // ============== get Top product Sc ===============
    return (
        <div className='row'>
            <div className={'col-6'}>
                <Card>
                    <CardBody>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <p className="txt-title" style={{ fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>
                                    {formatMessage({ defaultMessage: "Top sản phẩm theo hàng hóa sàn" })}
                                </p>
                            </div>
                            {/* <div
                                className='d-flex align-items-center justify-content-center cursor-pointer'
                                onClick={() => {
                                    history.push(`/report/overview`);
                                }}
                            >
                                <span className="fs-14">{formatMessage({ defaultMessage: "Xem thêm" })}</span>
                                <ChevronRightOutlined className='ml-2' />
                            </div> */}
                        </div>
                        <ReportTableProductSc
                            dataTable={{ data: dataTableSc, loading: loadingSc }}
                            setSubTabTypeSc={setSubTabTypeSc}
                            status_tab={subTabTypeSc} />
                        {!dataTableSc?.products?.length ? <div className='mt-6'>
                            <div className='d-flex  align-items-center justify-content-center'>
                                <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>
                                        {formatMessage({ defaultMessage: "Chưa có sản phẩm" })}
                                    </span>
                                </div>
                            </div>
                        </div> : null}
                    </CardBody>
                </Card>
            </div>
            <div className='col-6'>
                <Card>
                    <CardBody>
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <p className="txt-title" style={{ fontSize: '1.25rem', color: '#000000', fontWeight: 'bold' }}>
                                    {formatMessage({ defaultMessage: "Top sản phẩm theo hàng hóa kho" })}
                                </p>
                            </div>
                            {/* <div
                                className='d-flex align-items-center justify-content-center cursor-pointer'
                                onClick={() => {
                                    history.push(`/report/overview`);
                                }}
                            >
                                <span className="fs-14">{formatMessage({ defaultMessage: "Xem thêm" })}</span>
                                <ChevronRightOutlined className='ml-2' />
                            </div> */}
                        </div>
                        <ReportTableProductSme dataTable={{ data: dataTableSme, loading: loadingSme }} setSubTabTypeSme={setSubTabTypeSme} status_tab={subTabTypeSme} />
                        {!dataTableSme?.products?.length ? <div className='mt-6'>
                            <div className='d-flex  align-items-center justify-content-center'>
                                <div className='d-flex flex-column align-items-center justify-content-center my-8'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>
                                        {formatMessage({ defaultMessage: "Chưa có sản phẩm" })}
                                    </span>
                                </div>
                            </div>
                        </div> : null}
                    </CardBody>
                </Card>
            </div>
        </div>
    )
})