import React, { Fragment, memo, useCallback, useMemo, useState } from "react";
import { CardBody } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import Select from "react-select";
import { OPTIONS_FILTER_PICKUP, OPTIONS_PROCESSING_DEADLINE, OPTIONS_TYPE_PARCEL } from "../OrderFulfillmentHelper";
import { useOrderFulfillmentContext } from "../context/OrderFulfillmentContext";
import { randomString } from "../../../../../utils";
import { useFormikContext } from "formik";
import { useToasts } from "react-toast-notifications";
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from "dayjs";

const MAX_FILTERS = 8;

const SectionFilter = () => {
    const { formatMessage } = useIntl();
    const { setFieldValue, values } = useFormikContext();
    const { setIds, setIsLoadPackages, setIsInitLoadPackages, filtersPackage, setFiltersPackage, optionsSmeWarehouse, optionsChannel, optionsStore, optionsShippingUnit } = useOrderFulfillmentContext();
    const { addToast } = useToasts();

    const currentWarehouse = useMemo(() => {
        return optionsSmeWarehouse?.find(sw => sw?.value == values?.smeWarehouse)
    }, [values?.smeWarehouse, optionsSmeWarehouse]);

    const optionsFilterPickup = useMemo(() => {
        const options = OPTIONS_FILTER_PICKUP?.filter(item => !filtersPackage?.some(pk => pk?.type == item?.value));
        return options || [];
    }, [filtersPackage]);

    const isDisableSearch = useMemo(() => {
        const hasEmptyFiltersPackage = filtersPackage?.every(pk => {
            const isTypeCheck = pk?.type == "ref_order_id" || pk?.type == "tracking_number" || pk?.type == "range_time" || pk?.type == "processing_deadline";
            if (isTypeCheck || !pk?.type) {
                return !pk?.value
            }
            return false
        });

        return hasEmptyFiltersPackage
    }, [filtersPackage]);

    const disabledFutureDate = useCallback((date, selectDate, selectedDone, target) => {
        const unixDate = dayjs(date).unix();
        const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
        const toDate = dayjs().endOf("day").unix();

        return unixDate < fromDate || unixDate > toDate;
    }, []);

    const onSearchPackages = useCallback(() => {
        if (!values?.smeWarehouse) {
            addToast(formatMessage({ defaultMessage: 'Vui lòng chọn kho vật lý' }), { appearance: 'error' });
            return;
        }

        setFieldValue('__changed__', true);
        setIds([]);
        setFiltersPackage(prev => prev.map(item => ({ ...item, valueActive: item?.value })));
        setIsInitLoadPackages(false);
        setIsLoadPackages(true);
    }, [values?.smeWarehouse]);

    return (
        <CardBody>
            <div className="row">
                <div className="col-10">
                    <div className="row w-100 mb-4 d-flex align-items-center">
                        <div className="col-3">
                            <span>{formatMessage({ defaultMessage: 'Kho vật lý' })}</span>
                            <span className="ml-1 text-danger">*</span>
                        </div>
                        <div className="col-9 pr-0">
                            <Select
                                value={currentWarehouse}
                                options={optionsSmeWarehouse}
                                placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                                onChange={value => setFieldValue('smeWarehouse', value?.value)}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 20
                                    }),
                                }}
                            />
                        </div>
                    </div>
                    {filtersPackage?.map((item, index) => {
                        let optionsFilter = [];

                        if (item?.type == 'store') optionsFilter = optionsStore;
                        if (item?.type == 'channel') optionsFilter = optionsChannel;
                        if (item?.type == 'shipping_unit') optionsFilter = optionsShippingUnit;
                        // if (item?.type == 'processing_deadline') optionsFilter = OPTIONS_PROCESSING_DEADLINE;
                        // if (item?.type == 'type_parcel') optionsFilter = OPTIONS_TYPE_PARCEL;

                        return <Fragment>
                            <div className="mb-4 px-4 py-2" style={{ border: '1px solid rgb(235, 237, 243)', borderRadius: 20 }}>
                                <div className="row d-flex align-items-center">
                                    <div className="col-3">
                                        <span>{item?.label || formatMessage({ defaultMessage: 'Chọn điều kiện lọc' })}</span>
                                    </div>
                                    {/* Chưa chọn điều kiện lọc */}
                                    <div className="col-7 pl-0">
                                        {!item?.type && <Select
                                            options={optionsFilterPickup}
                                            onChange={value => {
                                                console.log({ value })
                                                setFiltersPackage(prev => prev.map(pk => {
                                                    if (pk?.id == item?.id) {
                                                        return {
                                                            ...pk,
                                                            ...value,
                                                            type: value?.value,
                                                            value: null
                                                        }
                                                    }

                                                    return pk
                                                }))
                                            }}
                                            placeholder={formatMessage({ defaultMessage: 'Chọn điều kiện lọc' })}
                                            styles={{
                                                container: (styles) => ({
                                                    ...styles,
                                                    zIndex: 3 + (filtersPackage?.length - index)
                                                }),
                                            }}
                                        />}
                                        {/* Lọc theo mã đơn hàng || mã vận đơn || SKU hàng hóa */}
                                        {(item?.type == 'ref_order_id' || item?.type == 'tracking_number' || item?.type == 'sku') && <div
                                            className="input-icon px-0"
                                            style={{ height: "fit-content" }}
                                        >
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder={item?.placeholder}
                                                style={{ height: 38, borderRadius: 0, paddingLeft: "50px" }}
                                                value={item?.value}
                                                onKeyDown={e => {
                                                    if (e.keyCode == 13) {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }
                                                }}
                                                onChange={(e => {
                                                    const value = e?.target?.value;
                                                    setFiltersPackage(prev => prev.map(pk => {
                                                        if (pk?.id == item?.id) {
                                                            return {
                                                                ...pk,
                                                                value: value
                                                            }
                                                        }

                                                        return pk
                                                    }))
                                                })}
                                            />
                                            <span>
                                                <i className="flaticon2-search-1 icon-md ml-6"></i>
                                            </span>
                                        </div>}

                                        {/* Lọc theo mã đơn hàng */}
                                        {(item?.type == 'store' || item?.type == 'channel' || item?.type == 'shipping_unit' || item?.type == 'type_parcel')
                                            && <Select
                                                value={item?.value}
                                                options={optionsFilter}
                                                isMulti={item?.type == 'store' || item?.type == 'channel' || item?.type == 'shipping_unit'}
                                                placeholder={item?.placeholder}
                                                onChange={values => {
                                                    setFiltersPackage(prev => prev.map(pk => {
                                                        if (pk?.id == item?.id) {
                                                            return {
                                                                ...pk,
                                                                value: values,
                                                            }
                                                        }

                                                        return pk
                                                    }))
                                                }}
                                                styles={{
                                                    container: (styles) => ({
                                                        ...styles,
                                                        zIndex: 3 + (filtersPackage?.length - index)
                                                    }),
                                                }}
                                                formatOptionLabel={(option, labelMeta) => {
                                                    return (
                                                        <div className="d-flex align-items-center">
                                                            {!!option.logo && <img
                                                                src={option.logo}
                                                                style={{ width: 15, height: 15 }}
                                                            />}
                                                            <span className="ml-2">{option.label}</span>
                                                        </div>
                                                    );
                                                }}
                                            />}

                                        {(item?.type == 'range_time' || item?.type == 'processing_deadline') && <DateRangePicker
                                            style={{ float: "right", width: "100%" }}
                                            character={" - "}
                                            className="custome__style__input__date"
                                            format={"dd/MM/yyyy HH:mm"}
                                            value={item?.value}
                                            placeholder={"dd/mm/yyyy hh:mm - dd/mm/yyyy hh:mm"}
                                            placement={"bottomEnd"}
                                            disabledDate={disabledFutureDate}
                                            onChange={(values) => {
                                                let range = values;

                                                if (!!values) {
                                                    let [gtCreateTime, ltCreateTime] = [
                                                        dayjs(values[0]).startOf("minute").unix(),
                                                        dayjs(values[1]).endOf("minute").unix(),
                                                    ];
                                                    let rangeTimeConvert = [gtCreateTime, ltCreateTime]?.map((_range) => new Date(_range * 1000));
                                                    range = rangeTimeConvert;
                                                }
                                                setFiltersPackage(prev => prev.map(pk => {
                                                    if (pk?.id == item?.id) {
                                                        return {
                                                            ...pk,
                                                            value: range,
                                                        }
                                                    }

                                                    return pk
                                                }))
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
                                                // for DateRangePicker
                                                last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                                            }}
                                        />}
                                    </div>
                                    <div className="col-2 text-right text-danger">
                                        <svg
                                            onClick={() => setFiltersPackage(prev => prev.filter(pk => pk?.id != item?.id))}
                                            xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="cursor-pointer bi bi-x-lg" viewBox="0 0 16 16"
                                        >
                                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Fragment>
                    })}
                    {filtersPackage?.length < MAX_FILTERS && <span
                        className="cursor-pointer"
                        style={{ textDecoration: 'underline', color: '#0D6EFD' }}
                        onClick={() => setFiltersPackage(prev => prev.concat([{ id: randomString() }]))}
                    >
                        {formatMessage({ defaultMessage: 'Thêm điều kiện lọc' })}
                    </span>}
                </div>
                <div className="col-2">
                    <button
                        className="w-100 btn btn-primary btn-elevate"
                        disabled={isDisableSearch && !values?.smeWarehouse}
                        onClick={onSearchPackages}
                    >
                        {formatMessage({ defaultMessage: 'Tìm kiếm' })}
                    </button>
                </div>
            </div>
        </CardBody >
    )
}

export default memo(SectionFilter);