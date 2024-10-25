import { useQuery } from "@apollo/client";
import queryString from "querystring";
import React, {
    Fragment,
    memo,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";
import { Helmet } from "react-helmet-async";
import SVG from "react-inlinesvg";
import { useLocation } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import WarehouseBillHistoryFilter from "./WarehouseBillHistoryFilter";
import WarehouseBillHistoryTable from "./WarehouseBillHistoryTable";
import { useIntl } from "react-intl";

const WarehouseBillHistoryList = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: "Lịch sử thay đổi tồn" }),
            },
        ]);
    }, []);

    const [dataResultUpload, setDataResultUpload] = useState(null);
    const [showUploadFile, setShowUploadFile] = useState(false);

    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "cache-and-network",
    });

    const defaultWarehouse = useMemo(() => {
        return dataWarehouse?.sme_warehouses?.find(wh => !!wh?.is_default) || {}
    }, [dataWarehouse])

    const create_time = useMemo(() => {
        try {
            if (!params.gt || !params.lt) return {};
            let rangeTimeConvert = [params?.gt, params?.lt]?.map((_range) =>
                new Date(_range * 1000).toISOString()
            );
            return {
                created_at: {
                    _gt: rangeTimeConvert[0],
                    _lt: rangeTimeConvert[1],
                },
            };
        } catch (error) {
            return {};
        }
    }, [params?.gt, params?.lt]);

    const tab = useMemo(() => {
        try {
            if (!params?.tab) return "goods";

            return params?.tab;
        } catch (error) {
            return {};
        }
    }, [params?.tab]);
    const type = useMemo(() => {
        try {
            if (!params?.type) return {};

            return {
                type: { _eq: params?.type },
            };
        } catch (error) {
            return {};
        }
    }, [params?.type]);

    const target = useMemo(() => {
        try {
            if (!params?.status) return {};

            return {
                target: { _eq: params?.status },
            };
        } catch (error) {
            return {};
        }
    }, [params?.status]);

    const actor = useMemo(() => {
        try {
            if (!params?.actor) return {};

            return {
                actor: { _eq: params?.actor },
            };
        } catch (error) {
            return {};
        }
    }, [params?.actor]);

    const search = useMemo(() => {
        try {
            if (!params?.q) return {};

            switch (params?.search_type) {
                case "variant-name":
                    return {
                        variant: {
                            sme_catalog_product: {
                                name_clear_text: {
                                    _iregex: encodeURI(params.q.trim()).replace(/%/g, ""),
                                },
                            },
                        },
                    };
                case "variant-sku":
                    return {
                        variant: {
                            sku: { _ilike: `%${params?.q?.trim()}%` },
                        },
                    };
                case "code":
                    return {
                        actor_ref_code: { _ilike: `%${params?.q?.trim()}%` },
                    };
                case "shipping_code":
                    return {
                        _and: {
                            _or: [
                                { warehouseBill: { shipping_code: { _ilike: `%${params?.q?.trim()}%` } } },
                                { order_tracking_number: { _ilike: `%${params?.q?.trim()}%` } },
                            ]
                        },
                    };
                case "order_code":
                    return {
                        _and: {
                            _or: [
                                { warehouseBill: { order_code: { _ilike: `%${params?.q?.trim()}%` } } },
                                { order_code: { _ilike: `%${params?.q?.trim()}%` } },
                            ]
                        },
                    };
                default:
                    return {
                        variant: {
                            sme_catalog_product: {
                                name_clear_text: {
                                    _iregex: encodeURI(params.q.trim()).replace(/%/g, ""),
                                },
                            },
                        },
                    };
            }
        } catch (err) {
            return {};
        }
    }, [params?.q, params?.search_type]);

    const warehouse = useMemo(() => {
        try {
            if (!params?.warehouseId) return

            return {
                sme_warehouse_id: {
                    _eq: +params?.warehouseId,
                },
            };
        } catch (error) {
            return {};
        }
    }, [params?.warehouseId]);

    let whereCondition = useMemo(() => {
        return {
            ...create_time,
            ...type,
            ...warehouse,
            ...actor,
            ...search,
            ...target,
        };
    }, [create_time, type, warehouse, search, actor, target]);


    return (
        <Fragment>
            <Card>
                <Helmet
                    titleTemplate={`${formatMessage({
                        defaultMessage: "Lịch sử thay đổi tồn",
                    })} - UpBase`}
                    defaultTitle={`${formatMessage({
                        defaultMessage: "Lịch sử thay đổi tồn",
                    })} - UpBase`}
                >
                    <meta
                        name="description"
                        content={`${formatMessage({
                            defaultMessage: "Lịch sử thay đổi tồn",
                        })} - UpBase`}
                    />
                </Helmet>

                <CardBody>
                    <WarehouseBillHistoryFilter
                        tabPage={tab}
                        onShowUploadFile={() => setShowUploadFile(true)}
                        dataWarehouse={dataWarehouse}
                        defaultWarehouse={defaultWarehouse}
                        whereCondition={whereCondition}
                    />
                    <WarehouseBillHistoryTable
                        tabPage={tab}
                        defaultWarehouse={defaultWarehouse}
                        whereCondition={whereCondition}
                    />
                </CardBody>
            </Card>
            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: "smooth",
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG
                        src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
                        title={" "}
                    ></SVG>
                </span>{" "}
            </div>
        </Fragment>
    );
};

export default memo(WarehouseBillHistoryList);

export const actionKeys = {
    "warehouse_bill_history_view": {
        router: '/products/warehouse-bill/history',
        actions: [
            "sme_warehouses", 
            "warehouse_inventory_transactions", 
            "warehouse_inventory_transactions_aggregate", 
            "warehouseInventoryHistories"
        ], 
        name: "Xem danh sách thay đổi",
        group_code: 'warehouse_bill_history',
        group_name: 'Lịch sử thay đổi tồn',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
    "warehouse_bill_history_export": {
        router: '',
        actions: [
            "sme_warehouses", "inventorySumProductChangeActual", "inventoryCreateExportChangeActualRequest",
            "warehouse_inventory_export_histories", "warehouse_inventory_export_histories_aggregate"
        ], 
        name: "Xuất file",
        group_code: 'warehouse_bill_history',
        group_name: 'Lịch sử thay đổi tồn',
        cate_code: 'product_service',
        cate_name: 'Quản lý kho',
    },
};