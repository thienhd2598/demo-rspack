import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useQuery } from "@apollo/client";
import _ from 'lodash';
import { Checkbox } from "../../../../../_metronic/_partials/controls";
import query_coGetShippingCarrierFromListPackage from "../../../../../graphql/query_coGetShippingCarrierFromListPackage";
import query_coGetPaymentMethodFromListPackage from "../../../../../graphql/query_coGetPaymentMethodFromListPackage";
import { useIntl } from 'react-intl'
import { OPTIONS_TYPE_PARCEL } from "../Constant";
import { useSelector } from "react-redux";
import { OPTIONS_AFTER_SALE_TYPE } from '../../../Order/OrderUIHelpers'
const OrderSalesPersonFilterDrawer = ({ isOpenDrawer, onToggleDrawer, whereCondition }) => {
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [filterParams, setFilterParams] = useState({});
    const { formatMessage } = useIntl()
    const user = useSelector((state) => state.auth.user);
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

    const { data: coGetShippingCarrier, refetch: refetchCoGetShippingCarrier } = useQuery(query_coGetShippingCarrierFromListPackage, {
        variables: {
            search: {
                ...(params?.is_old_order ? {is_old_package: +params?.is_old_order} : {}),
                list_person_in_charge: user?.email,
                list_source: ['manual'],
                range_time: whereCondition.range_time,
                connector_channel_code: whereCondition.connector_channel_code,
                list_store: whereCondition.list_store,
                is_connected: 1
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: coGetPaymentMethod, refetch: refetchCoGetPaymentMethod } = useQuery(query_coGetPaymentMethodFromListPackage, {
        variables: {
            search: {
                ...(params?.is_old_order ? {is_old_package: +params?.is_old_order} : {}),
                list_person_in_charge: user?.email,
                list_source: ['manual'],
                range_time: whereCondition.range_time,
                connector_channel_code: whereCondition.connector_channel_code,
                list_store: whereCondition.list_store,
                is_connected: 1
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        refetchCoGetShippingCarrier()
        refetchCoGetPaymentMethod()
    }, [filterParams])


    useMemo(() => {
        setFilterParams({
            shipping_unit: params?.shipping_unit || undefined,
            payments: params?.payments || undefined,
            type_parcel: params?.type_parcel || undefined,
            after_sale_type: params?.after_sale_type || undefined
        })
        }, [params?.shipping_unit, params?.payments, isOpenDrawer, params?.type_parcel]);

    const [currentShippingUnit, optionsShippingUnit] = useMemo(() => {
        let parseParamsShippingUnit = filterParams?.shipping_unit?.split('$')
        let optionsShippingUnit = coGetShippingCarrier?.coGetShippingCarrierFromListPackage?.data?.map(_ship => {
            return { label: _ship.shipping_carrier, value: _ship.shipping_carrier }
        })
        let currentShippingUnit = optionsShippingUnit?.filter(
            _option => parseParamsShippingUnit?.some(param => param == _option?.value)
        );
        return [currentShippingUnit, optionsShippingUnit]
    }, [coGetShippingCarrier, params, filterParams])

    const currentAfterSaleType = useMemo(() => {
        let parseParamsAfterSaletype = filterParams?.after_sale_type?.split('$')
        let currentAfterSaleType = OPTIONS_AFTER_SALE_TYPE?.filter(_option => parseParamsAfterSaletype?.some(param => param == _option?.value));
        return currentAfterSaleType
    }, [params, filterParams])

    const [currentPayments, optionsPayments] = useMemo(() => {
        let parseParamsPayments = filterParams?.payments?.split(',')
        let optionsPayments = coGetPaymentMethod?.coGetPaymentMethodFromListPackage?.data?.map(_payment => {
            return { label: _payment.payment_method, value: _payment.payment_method }
        })
        let currentPayments = optionsPayments?.filter(
            _option => parseParamsPayments?.some(param => param == _option?.value)
        );
        return [currentPayments, optionsPayments]
    }, [coGetPaymentMethod, params, filterParams])

    const onResetFilterParams = useCallback(() => {setFilterParams({})}, []);

    const onUpdateFilterParams = useCallback((key, value) => {
        setFilterParams(prevParams => ({...prevParams,[key]: value}))
    }, []);

    const onRemoveFilterProducts = useCallback(() => onResetFilterParams(), []);

    const onConfirmFilterProducts = useCallback(() => {
            let filtered = {
                ..._.omit(params, ['shipping_unit', 'payments', 'type_parcel', 'after_sale_type']),
                ...filterParams,
                page: 1
            };

            for (const key in filtered) {
                if (filtered[key] === undefined) delete filtered[key]
            };

            history.push(`${location.pathname}?${queryString.stringify({...filtered})}`.replaceAll('%2C', '\,'));
            onResetFilterParams();
            onToggleDrawer();
        }, [filterParams]
    );


    return (
        <div className="drawer-filter-wrapper d-flex flex-column justify-content-between">
            <div className="d-flex flex-column">
                <div className="drawer-filter-header d-flex align-items-center">
                    <div className="d-flex align-items-center justify-content-between px-4 flex-grow-1">
                        <p className="drawer-filter-title font-weight-bold mb-0">{formatMessage({ defaultMessage: 'Lọc đơn hàng nâng cao' })}</p>
                        <span onClick={onToggleDrawer}><i className="drawer-filter-icon fas fa-times icon-md ml-6"></i></span>
                    </div>
                </div>

                <div style={{ overflow: 'scroll', overflowX: 'hidden', height: '84vh' }}>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isMulti
                            isClearable
                            value={currentShippingUnit}
                            options={optionsShippingUnit}
                            onChange={values => {
                                let paramShippingUnit = values?.length > 0
                                    ? _.map(values, 'value')?.join('$')
                                    : undefined;
                                onUpdateFilterParams('shipping_unit', paramShippingUnit);
                            }}

                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Hình thức thanh toán" })}</p>
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
                        <p className="mb-4 font-weight-bold">{formatMessage({ defaultMessage: "Loại kiện hàng" })}</p>
                        <div
                            className="radio-list"
                        >
                            {OPTIONS_TYPE_PARCEL?.map(_option => {
                                let parsePrintStatus = filterParams?.type_parcel?.split(',') ?? [];
                                return (
                                    <div className="mb-2">
                                        <Checkbox
                                            inputProps={{
                                                'aria-label': 'checkbox'
                                            }}
                                            title={_option.label}
                                            isSelected={parsePrintStatus?.find(element => element == _option.value) ? true : false}
                                            onChange={(e) => {
                                                if (parsePrintStatus?.find(element => element == _option.value)) {
                                                    onUpdateFilterParams('type_parcel', parsePrintStatus.filter(_value => _value != _option.value).join())
                                                } else {
                                                    onUpdateFilterParams('type_parcel', parsePrintStatus.concat([_option.value]).join())
                                                }
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: 'Lý do' })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isMulti
                            isClearable
                            value={currentAfterSaleType}
                            options={OPTIONS_AFTER_SALE_TYPE}
                            onChange={values => {
                                let paramAfterSaleType = values?.length > 0
                                    ? _.map(values, 'value')?.join('$')
                                    : undefined;
                                onUpdateFilterParams('after_sale_type', paramAfterSaleType);
                            }}
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

export default memo(OrderSalesPersonFilterDrawer);