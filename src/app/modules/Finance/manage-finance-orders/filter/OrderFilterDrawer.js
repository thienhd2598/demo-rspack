import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useQuery } from "@apollo/client";
import _ from 'lodash';
import query_getListFinanceOrderPaymentMethod from "../../../../../graphql/query_getListFinanceOrderPaymentMethod";
import { useIntl } from 'react-intl'
import { OPTIONS_SOURCE_ORDER, OPTIONS_ORDER, PRICE_IN_ORDER_OPTION } from "../../../Order/OrderUIHelpers";

const OrderFilterDrawer = ({ STATUS_ORDER_FIlTER_DRAWER,
    CAPITAL_PRICE_STATUS,
    isOpenDrawer,
    onToggleDrawer,
    OPTIONS_WAREHOUSE_STATUS,
    dataStore, whereCondition }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [filterParams, setFilterParams] = useState({});
    const { formatMessage } = useIntl()

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


    const { data: coGetFinancePaymentMethod, refetch: refetchFinancePaymentMethod } = useQuery(query_getListFinanceOrderPaymentMethod, {
        variables: {
            ...whereCondition
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetchFinancePaymentMethod()
    }, [filterParams])

    useMemo(
        () => {
            setFilterParams({
                capital_price_status: params?.capital_price_status || undefined,
                payments: params?.payments || undefined,
                warehouse_status: params?.warehouse_status || undefined,
                order_status: params?.order_status || undefined,
                list_source: params?.list_source || undefined,
                order_type: !!params?.order_type || params?.order_type == 0 ? params?.order_type : undefined,
                is_lower_cost_price: !!params?.is_lower_cost_price || params?.is_lower_cost_price == 0 ? params?.is_lower_cost_price : undefined
            })
        }, [params?.order_status, params?.list_source, params?.warehouse_status, params?.payments, params?.capital_price_status, isOpenDrawer, params?.order_type, params?.is_lower_cost_price]
    );


    const [currentPayments, optionsPayments] = useMemo(() => {

        let parseParamsPayments = filterParams?.payments
        let optionsPayments = coGetFinancePaymentMethod?.getListFinanceOrderPaymentMethod?.data?.flatMap(_payment => {
            return !!_payment?.payment_method ? { label: _payment?.payment_method, value: _payment?.payment_method } : []
        })
        let currentPayments = optionsPayments?.find(_option => parseParamsPayments == _option?.value)
        return [currentPayments, optionsPayments]
    }, [coGetFinancePaymentMethod, params, filterParams])

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
                ..._.omit(params, ['capital_price_status', 'warehouse_status', 'payments', 'order_status', 'list_source', 'order_type']),
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

    const currentWarehouseStatus = useMemo(
        () => {
            let parseWarehouseStatus = filterParams?.warehouse_status
            let _current = OPTIONS_WAREHOUSE_STATUS?.find(_option => parseWarehouseStatus == _option?.value)

            return _current || []
        }, [filterParams]
    );

    const currentOrderType = useMemo(
        () => {
            let orderType = filterParams?.order_type
            let _current = OPTIONS_ORDER?.find(_option => orderType == _option?.value)

            return _current || []
        }, [filterParams]
    );

    const currentPriceType = useMemo(
        () => {
            let priceType = filterParams?.is_lower_cost_price
            let _current = PRICE_IN_ORDER_OPTION?.find(_option => priceType == _option?.value)

            return _current || []
        }, [filterParams]
    );

    const currentOrderStatus = useMemo(
        () => {
            let parseOrderStatus = filterParams?.order_status
            let _current = STATUS_ORDER_FIlTER_DRAWER?.find(_option => parseOrderStatus == _option?.value)

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


    const currentCapitalPriceStatus = useMemo(
        () => {
            let parseCapitalStatus = filterParams?.capital_price_status
            let _current = CAPITAL_PRICE_STATUS?.find(_option => parseCapitalStatus == _option?.value)

            return _current || []
        }, [filterParams])

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



                    {/* <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Giá vốn" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            isClearable
                            value={currentCapitalPriceStatus}
                            onChange={values => {
                                onUpdateFilterParams('capital_price_status', values?.value);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> {option.label}</div>
                            }}
                            options={CAPITAL_PRICE_STATUS}
                        />
                    </div> */}
                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Giá vốn trong đơn" })}</p>                        
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            value={currentPriceType}
                            onChange={values => {
                                onUpdateFilterParams('is_lower_cost_price', values?.value);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                            options={PRICE_IN_ORDER_OPTION}
                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Hình thức thanh toán" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isClearable
                            value={currentPayments || []}
                            onChange={values => {
                                onUpdateFilterParams('payments', values?.value);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> {option.label}</div>
                            }}
                            options={optionsPayments}
                        />
                    </div>
                    {params?.tab !== 2 ? (
                        <div className="drawer-filter-item p-4">
                            <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Trạng thái đơn" })}</p>
                            <Select
                                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                isClearable
                                value={currentOrderStatus}
                                onChange={values => {
                                    onUpdateFilterParams('order_status', values?.value);
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div> {option.label}</div>
                                }}
                                options={STATUS_ORDER_FIlTER_DRAWER}
                            />
                        </div>
                    ) : null}

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Tình trạng kho" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            isClearable
                            value={currentWarehouseStatus}
                            onChange={values => {
                                onUpdateFilterParams('warehouse_status', values?.value);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div> {option.label}</div>
                            }}
                            options={OPTIONS_WAREHOUSE_STATUS}
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
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Loại đơn hàng" })}</p>                        
                        <Select
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            value={currentOrderType}
                            onChange={values => {
                                onUpdateFilterParams('order_type', values?.value);
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>{option.label}</div>
                            }}
                            options={OPTIONS_ORDER}
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