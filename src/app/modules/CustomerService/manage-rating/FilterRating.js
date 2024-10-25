import React, { useMemo, useState } from 'react'
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import queryString from "querystring";
import { useIntl } from "react-intl";
import { useToasts } from "react-toast-notifications";
import _, { omit } from 'lodash';
import makeAnimated from 'react-select/animated';
import { optionsSearch } from './constants';


const FilterRating = ({ channelState }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts()
    const params = queryString.parse(location.search.slice(1, 100000));
    const animatedComponents = makeAnimated();

    const [valueRangeTime, setValueRangeTime] = useState((params?.gt && params?.lt) ? [new Date(+params?.gt * 1000), new Date(+params?.lt * 1000)] : null);
    const [userName, setUserName] = useState(params?.search_user || '');
    const [productName, setProductName] = useState(params?.q || '');
    const [refType, setRefType] = useState('ref_order_id');

    const { currentChannel, channelsActive, optionsStores, loadingStores, currentStores } = channelState ?? {}

    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().endOf("day").unix();
        return unixDate > today;
    };

    const placeholder = useMemo(() => {
        return `Nhập ${formatMessage(optionsSearch.find(option => option.value == refType).label).toLowerCase()}`
    }, [refType])

    return (
        <div>
            <div className="row">
                <div className='col-4'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Thời gian đánh giá' })}</span>
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
                                    queryParams = _.omit({ ...params, }, ["gt", "lt"]);
                                }
                                history.push(`/customer-service/manage-rating?${queryString.stringify(queryParams)}`);
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
                <div className='col-4' style={{ zIndex: 90 }}>
                    <div className='d-flex align-items-center' >
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Sàn' })}</span>
                        <Select
                            options={channelsActive}
                            className='w-100 select-report-custom'
                            placeholder='Tất cả'
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentChannel}
                            isLoading={loadingStores}
                            onChange={values => {
                                const channelsPush = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;
                                history.push(`/customer-service/manage-rating?${queryString.stringify(omit({ ...params, page: 1, channels: channelsPush }, ['stores']))}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>
                                    {!!option.logo && <img src={option.logo} alt="" style={{ width: 15, height: 15, marginRight: 4 }} />}
                                    {option.label}
                                </div>
                            }}
                        />
                    </div>
                </div>
                <div className='col-4' style={{ zIndex: 95 }}>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                        <Select
                            options={optionsStores}
                            className='w-100 select-report-custom'
                            placeholder='Tất cả'
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentStores}
                            isLoading={loadingStores}
                            onChange={values => {
                                const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;

                                history.push(`/customer-service/manage-rating?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                    {option.label}
                                </div>
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className='row mt-4'>
                <div className='col-6'>
                    <div className='d-flex align-items'>
                        <div className="col-4 pr-0" style={{ zIndex: 90 }}>
                            <Select
                                options={optionsSearch}
                                className="w-100 custom-select-order"
                                style={{ borderRadius: 0 }}
                                value={optionsSearch.find((_op) => _op.value == refType)}
                                onChange={({ value }) => {
                                    if (!!value) {
                                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, search_type: value })}`);
                                        setRefType(value);
                                    }
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>{formatMessage(option.label)}</div>;
                                }}
                            />
                        </div>
                        <div className="input-icon pl-0 col-8" style={{ height: "fit-content", width: '100%', position: 'relative' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={placeholder}
                                style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                                value={productName}
                                onChange={(e) => {
                                    setProductName(e.target.value)
                                }}
                                onBlur={() => {
                                    history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, q: productName })}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.keyCode == 13) {
                                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, q: productName })}`);
                                    }
                                }}
                            />
                            <span>
                                <i className="flaticon2-search-1 icon-md ml-6"></i>
                            </span>
                        </div>

                    </div>
                </div>
                <div className='col-6'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>{formatMessage({ defaultMessage: 'Tên người mua' })}</span>
                        <div className="input-icon pl-0" style={{ height: "fit-content", width: '100%' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: 'Nhập tên người mua' })}
                                style={{ height: 37, borderRadius: 0, paddingLeft: "50px" }}
                                onBlur={(e) => {
                                    history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, search_user: e.target.value })}`);
                                }}
                                value={userName}
                                onChange={(e) => {
                                    setUserName(e.target.value)
                                }}
                                onKeyDown={(e) => {
                                    if (e.keyCode == 13) {
                                        history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, search_user: e.target.value })}`);
                                    }
                                }}
                            />
                            <span>
                                <i className="flaticon2-search-1 icon-md ml-6"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FilterRating