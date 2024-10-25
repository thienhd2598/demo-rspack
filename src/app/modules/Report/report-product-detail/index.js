import React, { Fragment, useCallback, useState, memo, useLayoutEffect, useMemo, useEffect } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../../_metronic/layout";
import clsx from "clsx";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import { useElementOnScreen } from "../../../../hooks/useElementOnScreen";
import ReportProductFilter from "./ReportProductFilter";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { TABS_REPORT_PRODUCT } from "./ReportProductHelper";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sme_catalog_product_variant from "../../../../graphql/query_sme_catalog_product_variant";
import query_scGetProductVariants from "../../../../graphql/query_scGetProductVariants";
import query_scGetProductVariantAssets from "../../../../graphql/query_scGetProductVariantAssets";
import query_Report_smeproductChart from '../../../../graphql/query_report_smeproductChart';
import query_report_scproductChart from '../../../../graphql/query_report_scproductChart';
import client from "../../../../apollo";
import ReportLineChart from "./components/ReportLineChart";
import ProductInfo from "./components/ProductInfo";
import ReportTable from "./components/ReportTable";
import { find } from 'lodash';

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

const ReportProductDetail = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const [dataProduct, setDataProduct] = useState([])
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const {id} = useParams()
    const [containerRef, isVisible] = useElementOnScreen({
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    });

    console.log(params)

    useEffect(() => {
        let isMounted = true;
        // if (!dataScProductGMV?.report_scproductGMV || dataScProductGMV?.report_scproductGMV?.length == 0) {
        //     setDataTable([])
        //     return;
        // };
        if(params?.type == 'channel') {
            queryGetScProductVariants([Number(id)])
                .then(dataMappingScProduct => {
                    if (!isMounted) return;
                    queryGetScProductVariantAssets(dataMappingScProduct?.map(
                        product => ({
                            sc_product_id: product?.product?.id,
                            sc_variant_id: product?.id,
                            sc_product_attributes_value: product?.sc_product_attributes_value
                        })
                    )).then(dataAssets => {
                        const parseData = dataMappingScProduct?.map(item => {
                            return {
                                ...item,
                                asset: find(dataAssets, asset => asset?.sc_variant_id == item?.id)?.asset
                            }
                        })
                        setDataProduct(parseData)
                        isMounted = true
                    })
                })
                .catch(err => {
                })
        } else {
            queryGetSmeProductVariants([id])
            .then(dataMappingSmeProduct => {
                if (!isMounted) return;
                setDataProduct(dataMappingSmeProduct)
                isMounted = true
            });
        }

        return () => {
            isMounted = false;
        }
    }, [params?.type, id]);

    console.log(dataProduct)
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sản phẩm' }),
            },
            params?.type == 'channel' ? {
                title: dataProduct[0]?.product?.name,
            } : {
                title: dataProduct[0]?.variant_full_name
            },
        ])
    }, [dataProduct]);

    const store_id = useMemo(
        () => {
            try {
                let store = params?.store || null
                if (!store) {
                    return {}
                }
                return { store_ids: store }
            } catch (error) {
                return {}
            }
        }, [params.store]
    );


    const channel_code = useMemo(
        () => {
            try {
                let channel = params?.channel || null;
                if (!channel) {
                    return {}
                }
                return { channel_codes: channel }
            } catch (error) {
                return {}
            }
        }, [params.channel]
    );

    const from = useMemo(
        () => {
            try {
                let from = params?.from || dayjs().subtract(7, "day").unix();
                return { from: Number(from) }
            } catch (error) {
                return {}
            }
        }, [params.from]
    );

    const to = useMemo(
        () => {
            try {
                let to = params?.to || dayjs().subtract(1, "day").unix();
                return { to: Number(to) }
            } catch (error) {
                return {}
            }
        }, [params.to]
    );

    const date = useMemo(
        () => {
            try {
                let date = params?.date || dayjs().subtract(1, "day").unix();
                return { date: Number(date) }
            } catch (error) {
                return {}
            }
        }, [params.date]
    );

    const tabActive = useMemo(() => {
        if (!params?.tab) return TABS_REPORT_PRODUCT[0].id

        return params?.tab
    }, [params?.tab]);

    const variables = useMemo(() => {
        return {
            ...channel_code,
            ...store_id,
            ...(tabActive == 1 ? {
                ...from,
                ...to
            } : {
                ...date
            })
        }
    }, [channel_code, store_id, from, to, tabActive, date]);

    const { data: dataSmeReportChart, loading: loadingSmeReportChart } = useQuery(query_Report_smeproductChart, {
        variables: {
            from: +params?.from || dayjs().subtract(30, "day").startOf("day").unix(), 
            to: +params?.to || dayjs().subtract(1, "day").startOf("day").unix(), 
            variant_id: id, 
            warehouses_ids: params?.warehouse || ''
        },
        skip: params?.type == 'channel',
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataScReportChart, loading: loadingScReportChart } = useQuery(query_report_scproductChart, {
        variables: {
            from: +params?.from || dayjs().subtract(30, "day").startOf("day").unix(), 
            to: +params?.to || dayjs().subtract(1, "day").startOf("day").unix(), 
            variant_id: id, 
        },
        skip: params?.type == 'warehouse',
        fetchPolicy: 'cache-and-network'
    });

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Phân tích sản phẩm' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Phân tích sản phẩm' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Phân tích' })} - UpBase`} />
            </Helmet>
            <div ref={containerRef} />
            <ProductInfo 
                type={params?.type}
                dataProduct={dataProduct[0]}/>
            <ReportProductFilter
                id={id}
                visible={isVisible}
            />
            <ReportLineChart 
                id={id} type={params?.type} 
                dataSmeReportChart={dataSmeReportChart} 
                dataScReportChart={dataScReportChart}
                loadingScReportChart={loadingScReportChart}
                loadingSmeReportChart={loadingSmeReportChart}
            />
            <ReportTable 
            dataTable={params?.type != 'channel' ? dataSmeReportChart?.report_smeproductChart : dataScReportChart?.report_scproductChart}/>
        </Fragment>
    )
};

export default memo(ReportProductDetail);

