import React, { memo, useMemo, useState, useLayoutEffect } from "react";
import {
    Card,
    CardBody,
} from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation } from 'react-router-dom';
import OrderFilter from "./filter/OrderFilter";
import OrderTable from "./OrderTable";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import { useQuery } from "@apollo/client";
import query_getListFinanceOrder from "../../../../graphql/query_getListFinanceOrder";
import query_sme_catalog_product_variant_finance from "../../../../graphql/query_sme_catalog_product_variant_finance";
import { useIntl } from 'react-intl'
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import client from '../../../../apollo'
import dayjs from 'dayjs'
import ExportFinanceOrderDialog from "./ExportFinanceOrderDialog";
import {
    ALL, EXPORTED_BILL,
    NOT_EXPORT_BILL,
    NOT_PROCESSED_BILL,
    PROCESSED_BILL,
    STATUS_ORDER_DETAIL,
    TAB_SELL_PRODUCT,
    SELL_LOWER_COST_PRICE
} from "./constants";
import { useSelector } from "react-redux";

export default memo(() => {
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const { setBreadcrumbs } = useSubheader()
    const user = useSelector((state) => state.auth.user);
    const { formatMessage } = useIntl()
    const [valueRangeTime, setValueRangeTime] = useState(null);
    const [typeSearchTime, setTypeSearchTime] = useState('order_at');
    const [keywordType, setKeywordType] = useState(null);

    const [dialogExportFile, setDialogExportFile] = useState(false);

    const [dataTable, setDataTable] = useState([])
    console.log('dataTable',dataTable)
    const [loading, setLoading] = useState(false)

    useLayoutEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: 'Bán hàng' }) }])
    }, []);
    const [ids, setIds] = useState([]);

    useMemo(() => {
        if (!!params?.is_old_order) {
            setValueRangeTime([
                new Date(dayjs().subtract(119, "day").startOf("day")),
                new Date(dayjs().subtract(90, "day").startOf("day")),
            ]);
        } else {
            setValueRangeTime(null)
        }
    }, [params?.is_old_order]);

    const object_type = useMemo(() => {
        return params?.tab ? +params?.tab : TAB_SELL_PRODUCT
    }, [params?.tab])

    const from_date = useMemo(() => {
        if (!params?.gt && !!params?.is_old_order && valueRangeTime?.length > 0) {
            return dayjs().subtract(119, "day").startOf("day").format('YYYY-MM-DD')
        }

        return params?.gt ? dayjs.unix(params?.gt).format('YYYY-MM-DD') : null
    }, [params?.gt, params?.is_old_order, valueRangeTime])

    const to_date = useMemo(() => {
        if (!params?.lt && !!params?.is_old_order && valueRangeTime?.length > 0) {
            return dayjs().subtract(90, "day").startOf("day").format('YYYY-MM-DD')
        }

        return params?.lt ? dayjs.unix(params?.lt).format('YYYY-MM-DD') : null
    }, [params?.lt, params?.is_old_order, valueRangeTime])

    const time_type = useMemo(() => {
        try {
            return {
                time_type: params?.time_type || 'order_at'
            }
        } catch (error) {
            return {
                time_type: 'order_at'
            }
        }
    }, [params?.time_type]);

    const connector_channel_code = useMemo(() => {
        if (params.channel) {
            return params.channel?.split(',')
        }
        return null
    }, [params.channel]);

    const order_status = useMemo(() => {
        return !!params.order_status ? { order_status: params.order_status } : {}
    }, [params.order_status]);


    const keyword = useMemo(() => {
        if (params.q) {
            setKeywordType(+params.search_type || 1)
            return params?.q
        }
        return null
    }, [params.q, params.search_type]);

    const invoice_cancel = useMemo(() => {
        return params.invoiceCancel ? { invoice_cancel: +params.invoiceCancel } : {}
    }, [params.invoiceCancel]);

    const invoice_exported = useMemo(() => {
        return !!params.invoice ? { invoice_exported: +params.invoice } : {}
    }, [params.invoice]);

    const is_lower_cost_price = useMemo(() => {
        return (params?.is_lower_cost_price == 0 || !!params?.is_lower_cost_price) ? +params?.is_lower_cost_price : null
    }, params?.is_lower_cost_price)

    const is_old_order = useMemo(() => {
        if (!params.is_old_order) return {};

        return { is_old_order: Number(params?.is_old_order) }
    }, [params.is_old_order]);

    const payment_method = useMemo(() => {
        return params.payments ? params.payments : null
    }, [params.payments]);

    const store_id = useMemo(() => {
        return params.stores ? params.stores?.split(',')?.map(store => +store) : null
    }, [params.stores]);

    const cost_price = useMemo(() => {
        return params.capital_price_status ? +params.capital_price_status : null
    }, [params.capital_price_status]);

    const warehouse_status = useMemo(() => {
        return params.warehouse_status ? +params.warehouse_status : null
    }, [params.warehouse_status]);

    const list_source = useMemo(() => {
        return params.list_source ? params.list_source?.split(',') : null
    }, [params.list_source]);

    const abnormal = useMemo(() => {
        return (params?.order_type == 0 || !!params?.order_type) ? +params?.order_type : null
    }, [params?.order_type])

    const page = useMemo(() => {
        try {
            let _page = Number(params.page);
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1;
        }
    }, [params.page]);

    const limit = useMemo(() => {
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

    let whereCondition = useMemo(
        () => {
            setIds([])
            return {
                ...(connector_channel_code ? { connector_channel_code: [...connector_channel_code] } : {}),
                ...(cost_price ? { cost_price: cost_price } : {}),
                ...(from_date ? { from_date: from_date } : {}),
                ...(keyword ? { keyword: keyword } : {}),
                ...(keywordType ? { keyword_type: keywordType } : {}),
                ...(object_type ? { object_type: object_type } : {}),
                ...(payment_method ? { payment_method: payment_method } : {}),
                ...(list_source ? { list_source: list_source } : {}),
                ...order_status,
                per_page: limit,
                page: page,
                ...(to_date ? { to_date: to_date } : {}),
                ...(store_id ? { store_id: [...store_id] } : {}),
                ...(warehouse_status ? { warehouse_status: warehouse_status } : {}),
                ...time_type,
                ...invoice_exported,
                ...invoice_cancel,
                ...is_old_order,
                is_lower_cost_price,
                abnormal
            }
        }, [
            list_source,
        invoice_exported,
        order_status,
        warehouse_status,
        store_id, to_date,
        invoice_cancel,
        page, limit, payment_method,
        object_type, keywordType,
        connector_channel_code, cost_price,
        is_old_order,
        from_date, keyword, time_type, abnormal, is_lower_cost_price
    ]);

    let whereConditionPayments = useMemo(() => {
        return {
            ...(from_date ? { from_date: from_date } : {}),
            ...(to_date ? { to_date: to_date } : {}),
            ...(object_type ? { object_type: object_type } : {}),
            ...(connector_channel_code ? { connector_channel_code: [...connector_channel_code] } : {}),
            ...time_type,
            ...is_old_order
        }
    }, [from_date, to_date, connector_channel_code, object_type, time_type, is_old_order])

    const { data, loading: loadingListFinanceOrder, error, refetch: refetchListFinanceOrder } = useQuery(query_getListFinanceOrder, {
        variables: {
            ...whereCondition
        },
        fetchPolicy: 'cache-and-network',
    });


    const { data: stores_channels, loadingGetChannel } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network',
    });

    const [channels, stores] = useMemo(() => {
        return [stores_channels?.op_connector_channels, stores_channels?.sc_stores]
    }, [stores_channels])

    const [currentChannels, channelsActive, currentStores, optionsStores] = useMemo(
        () => {
            const channelsActive = channels?.filter(store => {
                return {
                    channelsActive: stores?.some(sa => sa?.connector_channel_code === store?.code)
                }
            });
            let _optionsChannel = channelsActive?.map(_channel => ({
                label: _channel?.name,
                logo: _channel?.logo_asset_url,
                value: _channel?.code
            })) || [];

            let __optionsStores = stores?.flatMap(_store => {
                const channelParams = params?.channel ? params?.channel?.split(',') : null
                const channel = _optionsChannel?.find(cn => cn?.value == _store?.connector_channel_code)
                if (!channelParams) {

                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                if (channelParams?.includes(_store?.connector_channel_code)) {
                    return {
                        label: _store?.name,
                        logo: channel?.logo,
                        value: _store?.id,
                        channel: channel?.value
                    }
                }
                return []
            })

            let _currentChannel = !!params?.channel ? _optionsChannel?.filter(_channel => !!_channel?.value && params?.channel?.split(',').some(_param => _param == _channel.value)) : [];
            let _currentStores = !!params?.stores ? __optionsStores?.filter(_stores => !!_stores?.value && params?.stores?.split(',').some(_param => _param == _stores.value)) : [];

            return [_currentChannel, _optionsChannel, _currentStores, __optionsStores];
        }, [stores, channels, params.stores, params.channel]
    );


    const queryGetProductVariants = async (ids) => {
        if (ids?.length == 0) return [];

        const uniqueIds = [...new Set(ids)];
        const { data } = await client.query({
            query: query_sme_catalog_product_variant_finance,
            variables: {
                where: {
                    id: { _in: uniqueIds },
                },
                limit: uniqueIds?.length
            },
            fetchPolicy: "network-only",
        });

        return data?.sme_catalog_product_variant || [];
    }


    useMemo(async () => {
        try {
            const listOrder = data?.getListFinanceOrder?.list_order
            const getAllSmeVariantId = listOrder?.map(list => list?.financeOrderItem?.map(item => item?.sme_variant_id)).flat()

            setLoading(true)
            const totalSmeItems = await queryGetProductVariants([...getAllSmeVariantId])

            const dataList = listOrder.map(list => {
                const financeOrderItem = list?.financeOrderItem
                const findSmeItem = financeOrderItem?.flatMap(item => {
                    const smeVariantProduct = totalSmeItems?.find(smeVariant => smeVariant?.id == item?.sme_variant_id)

                    return {
                        ...smeVariantProduct,
                        quantity_purchased: item?.quantity_purchased,
                        is_gift: item?.is_gift
                    }
                })

                const statusOrder = ["SHIPPED", "COMPLETED", "TO_CONFIRM_RECEIVE", "CANCELLED", "PROCESSED"].includes(list?.status) ? formatMessage(STATUS_ORDER_DETAIL[list?.status]) : ''
                return {
                    ...list,
                    statusName: statusOrder,
                    productSmeItems: findSmeItem
                }
            })

            setDataTable(dataList)

            setLoading(false)
        } catch (err) {

        }
    }, [data])

    const amountOrderTab = {
        [ALL]: data?.getListFinanceOrder?.summary_data?.total_for_paging,
        [EXPORTED_BILL]: data?.getListFinanceOrder?.summary_data?.total_invoice_exported,
        [NOT_EXPORT_BILL]: data?.getListFinanceOrder?.summary_data?.total_invoice_not_exported,
        [SELL_LOWER_COST_PRICE]: data?.getListFinanceOrder?.summary_data?.count_sell_lower_cost_price,
    }


    const amountOrderTabReturn = {
        [ALL]: data?.getListFinanceOrder?.summary_data?.total_for_paging,
        [PROCESSED_BILL]: data?.getListFinanceOrder?.summary_data?.count_invoice_cancel,
        [NOT_PROCESSED_BILL]: data?.getListFinanceOrder?.summary_data?.count_invoice_no_cancel,
    }

    return (
        <Card>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Bán hàng" }) + ' - UpBase'}
                defaultTitle={formatMessage({ defaultMessage: "Bán hàng" }) + ' - UpBase'}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Bán hàng" }) + ' - UpBase'} />
            </Helmet>

            {/* {
                <LoadingDialog show={loading} />
            } */}
            {dialogExportFile && <ExportFinanceOrderDialog show={dialogExportFile} params={params} status={object_type} onHide={() => setDialogExportFile(false)} />}
            <CardBody>
                <OrderFilter
                    whereConditionPayments={whereConditionPayments}
                    setTypeSearchTime={setTypeSearchTime}
                    typeSearchTime={typeSearchTime}
                    ids={ids}
                    valueRangeTime={valueRangeTime}
                    setValueRangeTime={setValueRangeTime}
                    openDialogExportFile={() => setDialogExportFile(true)}
                    setIds={setIds}
                    amountOrderTab={amountOrderTab}
                    amountOrderTabReturn={amountOrderTabReturn}
                    whereCondition={whereCondition}
                    refetchListFinanceOrder={refetchListFinanceOrder}
                    storesAndChannel={{loadingGetChannel, currentChannels, channelsActive, currentStores, optionsStores}}
                    totalPaidPrice={data?.getListFinanceOrder?.summary_data?.total_paid_price}
                />
                <OrderTable ids={ids}
                    setIds={setIds}
                    data={dataTable}
                    loadingListFinanceOrder={loadingListFinanceOrder}
                    amountOrderTab={amountOrderTab}
                    amountOrderTabReturn={amountOrderTabReturn}
                    loading={loading}
                    error={error}
                    channels={stores_channels?.op_connector_channels}
                    sc_stores={stores_channels?.sc_stores}
                    refetch={refetchListFinanceOrder} page={page} limit={limit} />
            </CardBody>
            <div
                id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => {
                    window.scrollTo({
                        letf: 0,
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }}
            >
                <span className="svg-icon">
                    <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                </span>
            </div>
        </Card>
    )
});

export const actionKeys = {
    "finance_order_manage_view": {
        router: '/finance/manage-finance-order',
        actions: [
            "sc_stores", 
            "op_connector_channels", 
            "getListFinanceOrder", 
            "cfGetTemplateExport", 
            "cfExportFinanceOrderAggregate", 
            "getListFinanceOrderPaymentMethod",
            "reloadFinanceOrderCostPrice",
            "cfGetJobTrackingExport",
            "cfExportFinanceOrder"
        ],
        name: 'Xem danh sách bán hàng',
        group_code: 'finance_sell',
        group_name: 'Bán hàng',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
    "finance_order_manage_export": {
        router: '/finance/manage-finance-order',
        actions: ["createMultipleInvoice", "sc_stores", "op_connector_channels"],
        name: 'Xuất hoá đơn',
        group_code: 'finance_sell',
        group_name: 'Bán hàng',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
    "finance_order_cost_price_process": {
        router: '/finance/manage-finance-order',
        actions: ["reloadFinanceOrderCostPrice", "getListFinanceOrder", "processFinanceOrderLowPrice"],
        name: 'Xem và thao tác về giá vốn tại màn đơn bán hàng',
        group_code: 'finance_sell',
        group_name: 'Bán hàng',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
    "finance_order_vat_rate_reload": {
        router: '/finance/manage-finance-order',
        actions: ["reloadFinanceOrderVatRate", "getListFinanceOrder"],
        name: 'Màn danh sách - Cập nhật VAT',
        group_code: 'finance_sell',
        group_name: 'Bán hàng',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    }
  };
