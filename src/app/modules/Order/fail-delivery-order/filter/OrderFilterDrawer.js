import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import _ from 'lodash';
import query_coGetPaymentMethod from "../../../../../graphql/query_coGetPaymentMethod";
// import { STATUS_WAREHOUSING } from "../../return-order/utils/contants";
import query_coGetPaymentMethodFailDelivery from "../../../../../graphql/query_coGetPaymentMethodFailDelivery";
import { useQuery } from "@apollo/client";
import { OPTIONS_SOURCE_ORDER, STATUS_FAIL_DELIVERY_ORDER } from "../../OrderUIHelpers";
import { useIntl } from "react-intl";
const OrderFilterDrawer = ({ dataWarehouse, isOpenDrawer, onToggleDrawer, whereCondition, OPTIONS_MAP_SME }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [filterParams, setFilterParams] = useState({});
    const { formatMessage } = useIntl()
    const STATUS_WAREHOUSING = [
        {
            value: 0,
            label: formatMessage({ defaultMessage: "Chưa xử lý" })
        },
        {
            value: 1,
            label: formatMessage({ defaultMessage: "Không nhập kho" }),
        },
        {
            value: 2,
            label: formatMessage({ defaultMessage: "Nhập kho một phần" }),
        },
        {
            value: 3,
            label: formatMessage({ defaultMessage: "Nhập kho toàn bộ" }),
        },
    ];
    useEffect(() => {
        if (isOpenDrawer) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }

        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, [isOpenDrawer]);

    const { data: coGetPaymentMethodFailDelivery, refetch: refetchCoGetPaymentMethodFailDelivery } = useQuery(query_coGetPaymentMethodFailDelivery, {
        variables: {
            search: {
                range_time: whereCondition.range_time,
                connector_channel_code: whereCondition.connector_channel_code,
                list_store: whereCondition.list_store,
                is_connected: 1,
                ...(params?.is_old_order ? {is_old_order: Number(params?.is_old_order)} : {}),
                logistic_fail: STATUS_FAIL_DELIVERY_ORDER?.map(value => value?.status),
                search_time_type: whereCondition?.search_time_type
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetchCoGetPaymentMethodFailDelivery()

    }, [filterParams])

    useMemo(
        () => {
            setFilterParams({
                import_type: params?.import_type || undefined,
                payments: params?.payments || undefined,
                filter_map_sme: params?.filter_map_sme || undefined,
                list_source: params?.list_source || undefined,
                processed_warehouse: params?.processed_warehouse || undefined
            })
        }, [params?.import_type, params?.payments, isOpenDrawer, params?.processed_warehouse,params?.filter_map_sme, params?.list_source]
    );

    const onResetFilterParams = useCallback(
        () => {
            setFilterParams({})
        }, []
    );

    const onUpdateFilterParams = useCallback(
        (key, value) => {
            setFilterParams(prevParams => ({
                ...prevParams,
                [key]: value
            }))
        }, []
    );

    const onRemoveFilterProducts = useCallback(
        () => {
            onResetFilterParams();
        }, []
    );

    const onConfirmFilterProducts = useCallback(
        () => {
            let filtered = {
                ..._.omit(params, ['import_type', 'payments', 'processed_warehouse', 'list_source', 'filter_map_sme']),
                ...filterParams,
                page: 1
            };

            for (const key in filtered) {
                if (filtered[key] === undefined) delete filtered[key]
            };

            history.push(`${location.pathname}?${queryString.stringify({
                ...filtered
            })}`.replaceAll('%2C', '\,'));
            onResetFilterParams();
            onToggleDrawer();
        }, [filterParams]
    );

    const currenImportStatus = useMemo(
        () => {
            let parsImportStatus = filterParams?.import_type?.split(',');
            let _current = STATUS_WAREHOUSING?.filter(
                _option => parsImportStatus?.some(param => param == _option?.value)
            );

            return _current || []
        }, [filterParams]
    );

    const currentFilterMapSme = useMemo(
        () => {
            let _current = OPTIONS_MAP_SME?.find(
                _option => filterParams?.filter_map_sme == _option?.value
            );

            return _current || []
        }, [filterParams]
    );

    const currentListSource = useMemo(
        () => {
            let parseListSource = filterParams?.list_source?.split(',');
            let _current = OPTIONS_SOURCE_ORDER?.filter(
                _option => parseListSource?.some(param => param == _option?.value)
            );

            return _current || []
        }, [filterParams]
    );

    const [currentPayments, optionsPayments] = useMemo(() => {
        let parseParamsPayments = filterParams?.payments?.split(',')
        let optionsPayments = coGetPaymentMethodFailDelivery?.coGetPaymentMethodFailDelivery?.data?.map(_payment => {
            return { label: _payment.payment_method, value: _payment.payment_method }
        })
        let currentPayments = optionsPayments?.filter(
            _option => parseParamsPayments?.some(param => param == _option?.value)
        );
        return [currentPayments, optionsPayments]
    }, [coGetPaymentMethodFailDelivery, params, filterParams])

    const [currentSmeWarehouse, optionsSmeWarehouse] = useMemo(() => {
        let parseSmeWarehouse = filterParams?.processed_warehouse?.split(',')
        let optionsPayments = dataWarehouse?.map(wh => {
            return { label: wh?.name, value: wh?.id }
        })
        let currentSmeWarehouse = optionsPayments?.filter(_option => parseSmeWarehouse?.some(param => param == _option?.value));
        return [currentSmeWarehouse, optionsPayments]
    }, [dataWarehouse, params, filterParams])


    return (
        <div className="drawer-filter-wrapper d-flex flex-column justify-content-between">
            <div className="d-flex flex-column">
                <div className="drawer-filter-header d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-between px-4 flex-grow-1">
                        <p className="drawer-filter-title font-weight-bold mb-0">{formatMessage({ defaultMessage: 'Lọc đơn hàng nâng cao' })}</p>
                        <span onClick={onToggleDrawer}><i className="drawer-filter-icon fas fa-times icon-md ml-6"></i></span>
                    </div>
                </div>

                <div style={{ overflow: 'scroll', overflowX: 'hidden', height: '80vh' }}>


                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Trạng thái nhập kho' })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isClearable
                            isMulti
                            value={currenImportStatus}
                            onChange={values => {
                                let importType = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('import_type', importType);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> {option.label}</div>
                            }}
                            options={STATUS_WAREHOUSING}
                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Hình thức thanh toán' })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isMulti
                            isClearable
                            value={currentPayments}
                            onChange={values => {
                                let paramsPayments = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('payments', paramsPayments);
                            }}
                            options={optionsPayments}
                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Trạng thái liên kết hàng hoá kho" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            isClearable
                            value={currentFilterMapSme}
                            onChange={value => {
                                onUpdateFilterParams('filter_map_sme', value?.value || undefined);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> {option.label}</div>
                            }}
                            options={OPTIONS_MAP_SME}
                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Loại đơn" })}</p>                        
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            isClearable
                            isMulti
                            value={currentListSource}
                            onChange={values => {
                                let paramsListSource = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('list_source', paramsListSource);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{formatMessage(option.label)}</div>
                            }}
                            options={OPTIONS_SOURCE_ORDER}
                        />
                    </div>


                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Kho nhập hàng" })}</p>                        
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            isClearable
                            isMulti
                            value={currentSmeWarehouse}
                            onChange={values => {
                                let paramsSmeWarehouse = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('processed_warehouse', paramsSmeWarehouse);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                            options={optionsSmeWarehouse}
                        />
                    </div>
                </div>
            </div>

            <div className="form-group my-6 mx-4 d-flex justify-content-between">
                <button
                    className="btn btn-light btn-elevate mr-6"
                    style={{ width: '47%' }}
                    onClick={onRemoveFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xoá bộ lọc' })}</span>
                </button>
                <button
                    className={`btn btn-primary font-weight-bold`}
                    style={{ width: '47%' }}
                    onClick={onConfirmFilterProducts}
                >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Lọc' })}</span>
                </button>
            </div>
        </div>
    )
};

export default memo(OrderFilterDrawer);