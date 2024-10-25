import { useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { omit } from 'lodash';
import queryString from "querystring";
import React, { Fragment, memo, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from 'react-router-dom';
import Select from "react-select";
// import makeAnimated from 'react-select/animated';
import DateRangePicker from "rsuite/DateRangePicker";
import query_sfSessionHandoverShippingCarrier from "../../../../../graphql/query_sfSessionHandoverShippingCarrier";
import { OPTIONS_SEARCH_SESSION_DELIVERY, OPTIONS_SEARCH_SESSION_RECIEVED } from "../OrderFulfillmentHelper";
import { useOrderSessionHandoverContext } from "../context/OrderSessionHandoverContext";

const OrderSessionDeliveryFilter = ({ session = "delivery" }) => {
    const OPTIONS_SEARCH_SESSION = session == "delivery" ? OPTIONS_SEARCH_SESSION_DELIVERY : OPTIONS_SEARCH_SESSION_RECIEVED;
    const { formatMessage } = useIntl();
    const { _params, tab, setParams, optionsShippingCarrier, optionsSmeWarehouse } = useOrderSessionHandoverContext();
    // console.log(_params);
    const history = useHistory();
    const location = useLocation();
    // const params = queryString.parse(location.search.slice(1, 100000));
    // const animatedComponents = makeAnimated();
    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(29, "day").startOf("day")),
        new Date(dayjs().startOf("day")),
    ]);
    const [search, setSearch] = useState(_params?.code || '');

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().endOf("day").unix();
        return unixDate > today;
    };

    // const { data: dataShippingCarrierHandover } = useQuery(query_sfSessionHandoverShippingCarrier, {
    //     fetchPolicy: 'cache-and-network'
    // });

    // const optionsShippingCarrier = useMemo(() => {
    //     const options = dataShippingCarrierHandover?.sfSessionHandoverShippingCarrier?.shipping_carrier?.map(item => ({
    //         value: item,
    //         label: item
    //     }))

    //     return options || []
    // }, [dataShippingCarrierHandover]);

    useEffect(() => {
        setSearch(_params?.code);
    }, [_params?.code]);

    useEffect(() => {
        if (!_params?.gt || !_params?.lt) {
            setValueRangeTime([
                new Date(dayjs().subtract(29, "day").startOf("day")),
                new Date(dayjs().startOf("day")),
            ]);
            return;
        };

        let rangeTimeConvert = [_params?.gt, _params?.lt]?.map((_range) => new Date(_range * 1000));
        setValueRangeTime(rangeTimeConvert);
    }, [_params?.gt, _params?.lt]);

    const currentTimeType = useMemo(() => {
        if (!_params?.time_type) return OPTIONS_SEARCH_SESSION[0]

        const timeType = OPTIONS_SEARCH_SESSION?.find(type => type?.value == _params?.time_type);
        return timeType;
    }, [_params?.time_type]);

    const currentShippingCarrier = useMemo(() => {
        if (!_params?.shipping_carrier) return null;

        const shippingCarrier = optionsShippingCarrier?.find(item => item?.value == _params?.shipping_carrier);
        return shippingCarrier
    }, [_params?.shipping_carrier, optionsShippingCarrier]);

    const currentSmeWarehouse = useMemo(() => {
        if (!_params?.sme_warehouse_id) return null;

        const smeWarehouse = optionsSmeWarehouse?.find(item => item?.value == _params?.sme_warehouse_id);
        return smeWarehouse
    }, [_params?.sme_warehouse_id, optionsSmeWarehouse]);

    return <Fragment>
        <div className="row mb-4">
            <div className="col-6">
                <div className='row d-flex align-items-center'>
                    <div className="col-4 pr-0">
                        <Select
                            options={OPTIONS_SEARCH_SESSION}
                            className="w-100 custom-select-order"
                            style={{ borderRadius: 0 }}
                            value={currentTimeType}
                            onChange={(value) => {
                                let p = { ..._params, page: 1, time_type: value?.value, tab }
                                setParams(tab, p)
                                // history.push(`${location.pathname}?${queryString.stringify(p)}`);
                            }}
                            styles={{
                                container: (styles) => ({
                                    ...styles,
                                    zIndex: 9
                                }),
                            }}
                        />
                    </div>
                    <div className="col-8 pl-0">
                        <DateRangePicker
                            style={{ float: "right", width: "100%" }}
                            character={" - "}
                            className="custome__style__input__date"
                            format={"dd/MM/yyyy"}
                            value={valueRangeTime}
                            placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                            placement={"bottomEnd"}
                            disabledDate={disabledFutureDate}
                            onChange={(values) => {
                                let queryParams = {};
                                setValueRangeTime(values);
                                if (!!values) {
                                    let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).startOf("day").unix(), dayjs(values[1]).endOf("day").unix(),];
                                    queryParams = { ..._params, gt: gtCreateTime, lt: ltCreateTime }

                                    let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                                    setValueRangeTime(rangeTimeConvert);
                                } else {
                                    setValueRangeTime([
                                        new Date(dayjs().subtract(29, "day").startOf("day")),
                                        new Date(dayjs().startOf("day")),
                                    ]);
                                    queryParams = omit({ ..._params, }, ["gt", "lt"]);
                                }
                                setParams(tab, { ...queryParams, tab })
                                // history.push(`${location.pathname}?${queryString.stringify(queryParams)}`);
                            }}
                            locale={{
                                sunday: "CN",
                                monday: "T2",
                                tuesday: "T3",
                                wednesday: "T4",
                                thursday: "T5",
                                friday: "T6",
                                saturday: "T7",
                                ok: formatMessage({ defaultMessage: "Đồng ý" }),
                                today: formatMessage({ defaultMessage: "Hôm nay" }),
                                yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                                hours: formatMessage({ defaultMessage: "Giờ" }),
                                minutes: formatMessage({ defaultMessage: "Phút" }),
                                seconds: formatMessage({ defaultMessage: "Giây" }),
                                formattedMonthPattern: "MM/yyyy",
                                formattedDayPattern: "dd/MM/yyyy",
                                last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="col-3">
                <Select
                    options={optionsSmeWarehouse}
                    className="w-100 custom-select-order"
                    placeholder={session == "delivery" ? formatMessage({ defaultMessage: 'Kho vật lý' }) : formatMessage({ defaultMessage: 'Kho trả hàng' })}
                    value={currentSmeWarehouse}
                    isClearable
                    onChange={(value) => {
                        let p = { ..._params, page: 1, sme_warehouse_id: value?.value, tab }
                        setParams(tab, p)
                        // history.push(`${location.pathname}?${queryString.stringify(p)}`);
                    }}
                    styles={{
                        container: (styles) => ({
                            ...styles,
                            zIndex: 9
                        }),
                    }}
                />
            </div>
        </div>
        <div className="row">
            <div className="col-6">
                <div className="input-icon pl-0 w-100" style={{ height: "fit-content", width: '100%', position: 'relative' }}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={session == "delivery" ? formatMessage({ defaultMessage: 'Mã phiên giao' }) : formatMessage({ defaultMessage: 'Mã phiên nhận' })}
                        style={{ height: 37, borderRadius: 4, paddingLeft: "50px" }}
                        value={search || ''}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        onBlur={(e) => {
                            let p = { ..._params, page: 1, code: e.target.value, tab }
                            setParams(tab, p)
                            // history.push(`${location.pathname}?${queryString.stringify(p)}`);
                        }}
                        onKeyDown={(e) => {
                            if (e.keyCode == 13) {
                                let p = { ..._params, page: 1, code: e.target.value, tab }
                                setParams(tab, p)
                                // history.push(`${location.pathname}?${queryString.stringify(p)}`);
                            }
                        }}
                    />
                    <span>
                        <i className="flaticon2-search-1 icon-md ml-6"></i>
                    </span>
                </div>
            </div>
            <div className="col-3">
                <Select
                    options={optionsShippingCarrier}
                    className="w-100 custom-select-order"
                    placeholder={formatMessage({ defaultMessage: 'Vận chuyển' })}
                    value={currentShippingCarrier}
                    isClearable
                    onChange={(value) => {
                        let p = { ..._params, page: 1, shipping_carrier: value?.value, tab }
                        setParams(tab, p)
                        history.push(`${location.pathname}?${queryString.stringify(p)}`);
                    }}
                    styles={{
                        container: (styles) => ({
                            ...styles,
                            zIndex: 8
                        }),
                    }}
                />
            </div>
        </div>
    </Fragment>
}

export default memo(OrderSessionDeliveryFilter);