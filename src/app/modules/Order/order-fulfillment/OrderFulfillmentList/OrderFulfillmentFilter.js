import dayjs from "dayjs";
import React, { Fragment, memo, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { useHistory, useLocation } from 'react-router-dom';
import Select from "react-select";
import queryString from "querystring";
import DateRangePicker from "rsuite/DateRangePicker";
import { omit } from 'lodash';
import makeAnimated from 'react-select/animated';
import { OPTIONS_TYPE_PICKUP, STATUS_PICKUP } from "../OrderFulfillmentHelper";

const OrderFulfillmentFilter = ({ optionsSmeWarehouse }) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const animatedComponents = makeAnimated();
    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(29, "day").startOf("day")),
        new Date(dayjs().startOf("day")),
    ]);
    const [search, setSearch] = useState(params?.code || '');

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().endOf("day").unix();
        return unixDate > today;
    };

    useEffect(() => {
        setSearch(params?.code);
    }, [params?.code]);

    useEffect(() => {
        if (!params?.gt || !params?.lt) {
            setValueRangeTime([
                new Date(dayjs().subtract(29, "day").startOf("day")),
                new Date(dayjs().startOf("day")),
            ]);
            return;
        };

        let rangeTimeConvert = [params?.gt, params?.lt]?.map((_range) => new Date(_range * 1000));
        setValueRangeTime(rangeTimeConvert);
    }, [params?.gt, params?.lt]);

    const optionsTypePickup = useMemo(() => {
        const options = Object.keys(OPTIONS_TYPE_PICKUP).map(key => ({
            value: key,
            label: OPTIONS_TYPE_PICKUP[key]
        }));

        return options;
    }, [OPTIONS_TYPE_PICKUP]);

    const optionsStatusPickup = useMemo(() => {
        const options = Object.keys(STATUS_PICKUP).map(key => ({
            value: key,
            label: STATUS_PICKUP[key]
        }));

        return options;
    }, [STATUS_PICKUP]);

    const currentTypePickup = useMemo(() => {
        if (!params?.type) return null;

        const typePickup = optionsTypePickup?.find(item => item?.value == params?.type);
        return typePickup
    }, [params?.type, optionsTypePickup]);

    const currentSmeWarehouse = useMemo(() => {
        if (!params?.sme_warehouse_id) return null;

        const smeWarehouse = optionsSmeWarehouse?.find(item => item?.value == params?.sme_warehouse_id);
        return smeWarehouse
    }, [params?.sme_warehouse_id, optionsSmeWarehouse]);

    return <Fragment>
        <div className="row mb-4">
            <div className="col-6">
                <div className='d-flex align-items-center'>
                    <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                        {formatMessage({ defaultMessage: 'Thời gian' })}
                    </span>
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
                                queryParams = { ...params, gt: gtCreateTime, lt: ltCreateTime }

                                let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                                setValueRangeTime(rangeTimeConvert);
                            } else {
                                setValueRangeTime([
                                    new Date(dayjs().subtract(29, "day").startOf("day")),
                                    new Date(dayjs().startOf("day")),
                                ]);
                                queryParams = omit({ ...params, }, ["gt", "lt"]);
                            }
                            history.push(`${location.pathname}?${queryString.stringify(queryParams)}`);
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
            <div className="col-3">
                <Select
                    options={optionsSmeWarehouse}
                    className="w-100 custom-select-order"
                    style={{ borderRadius: 0 }}
                    placeholder={formatMessage({ defaultMessage: 'Kho vật lý' })}
                    value={currentSmeWarehouse}
                    isClearable
                    onChange={(value) => {
                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, sme_warehouse_id: value?.value })}`);
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
                        placeholder={formatMessage({ defaultMessage: 'Mã danh sách' })}
                        style={{ height: 37, borderRadius: 4, paddingLeft: "50px" }}
                        value={search || ''}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                        onBlur={(e) => {
                            history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, code: e.target.value })}`);
                        }}
                        onKeyDown={(e) => {
                            if (e.keyCode == 13) {
                                history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, code: e.target.value })}`);
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
                    options={optionsTypePickup}
                    className="w-100 custom-select-order"
                    style={{ borderRadius: 0 }}
                    placeholder={formatMessage({ defaultMessage: 'Loại danh sách' })}
                    value={currentTypePickup}
                    isClearable
                    onChange={(value) => {
                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, type: value?.value })}`);
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

export default memo(OrderFulfillmentFilter);