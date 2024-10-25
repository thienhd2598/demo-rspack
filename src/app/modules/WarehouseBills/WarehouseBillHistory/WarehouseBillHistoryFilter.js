import dayjs from "dayjs";
import _ from "lodash";
import queryString from "querystring";
import React, { Fragment, memo, useMemo, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import isAfter from 'date-fns/isAfter';

import DateRangePicker from "rsuite/DateRangePicker";
import {
    ACTOR_HISTORY_TRANSACTION,
    SEARCH_OPTIONS_HISTORY,
    TYPE_HISTORY_TRANSACTION,
    SEARCH_OPTIONS_HISTORY_BY_GOODS,
} from "../WarehouseBillsUIHelper";
import { useIntl } from "react-intl";
import { isBefore } from "date-fns";
import { HistoryRounded } from "@material-ui/icons";
import ModalExportWarehouseHistory from "./ModalExportWarehouseHistory";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";

const WarehouseBillHistoryFilter = ({ defaultWarehouse, tabPage, dataWarehouse }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [openModal, setOpenModal] = useState(false)
    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(7, "day").startOf("day")),
        new Date(dayjs().subtract(1, "day").endOf("day")),
    ]);
    const [rangeTimeTabActions, setRangeTimeTabActions] = useState(null);

    const warehouses = useMemo(() => {
        return tabPage == 'goods' ? [{ id: 'all', name: 'Tất cả' }, dataWarehouse?.sme_warehouses].flat() : dataWarehouse?.sme_warehouses
    }, [dataWarehouse, tabPage])

    useMemo(() => {
        if (!params?.gt || !params?.lt) return;

        let rangeTimeConvert = [params?.gt, params?.lt]?.map(
            (_range) => new Date(_range * 1000)
        );
        setValueRangeTime(rangeTimeConvert);
    }, [params?.gt, params?.lt]);

    const TABS = [
        {
            title: formatMessage({ defaultMessage: "Theo hàng hóa" }),
            key: "goods",
        },
        {
            title: formatMessage({ defaultMessage: "Theo hoạt động" }),
            key: "actions",
        },
    ];

    const disabledFutureDate = (date, tab) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(tab != "goods" ? 1 : 0, 'day').unix();

        return unixDate >= today;
    }

    const {
        afterToday,
    } = DateRangePicker;
    return (
        <Fragment>
            {openModal && <ModalExportWarehouseHistory openModal={setOpenModal} />}
            <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {TABS.map((tab, index) => {
                            return (
                                <li key={index}>
                                    <a
                                        style={{ fontSize: "16px" }}
                                        className={`nav-link ${tabPage === tab.key ? "active" : ""
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setValueRangeTime([
                                                new Date(dayjs().subtract(7, "day").startOf("day")),
                                                new Date(dayjs().subtract(1, "day").endOf("day")),
                                            ]);
                                            setRangeTimeTabActions(null);
                                            history.push(
                                                `/products/warehouse-bill/history?tab=${tab.key}`
                                            );
                                        }}
                                    >
                                        {tab.title}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <div className="row mb-4 align-items-center">
                <div className="col-1">
                    <span className="p-0 m-0">{formatMessage({ defaultMessage: "Thời gian" })}:</span>
                </div>
                <div className="col-3 m-0 p-0">
                    <DateRangePicker
                        style={{ width: "100%" }}
                        character={" - "}
                        format={"dd/MM/yyyy"}
                        value={tabPage == "goods" ? valueRangeTime : rangeTimeTabActions}
                        disabledDate={(date) => disabledFutureDate(date, tabPage)}
                        placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                        placement={"bottomStart"}
                        cleanable={tabPage !== "goods"}
                        onChange={(values) => {
                            let queryParams = {};
                            if (tabPage == "goods") {
                                setValueRangeTime(values);
                            } else {
                                setRangeTimeTabActions(values);
                            }
                            if (!!values) {
                                let [gtCreateTime, ltCreateTime] = [
                                    dayjs(values[0])
                                        .startOf("day")
                                        .unix(),
                                    dayjs(values[1])
                                        .endOf("day")
                                        .unix(),
                                ];

                                queryParams = {
                                    ...params,
                                    page: 1,
                                    gt: gtCreateTime,
                                    lt: ltCreateTime,
                                };
                            } else {
                                queryParams = _.omit({ ...params, page: 1 }, ["gt", "lt"]);
                            }

                            history.push(
                                `/products/warehouse-bill/history?${queryString.stringify(
                                    queryParams
                                )}`
                            );
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
                    />
                </div>
                {tabPage == "actions" ? (
                    <>
                        <div className="col-3" style={{ zIndex: 98 }}>
                            <Select
                                placeholder={formatMessage({ defaultMessage: "Loại" })}
                                isClearable
                                className="w-100 custom-select-warehouse"
                                value={
                                    _.find(TYPE_HISTORY_TRANSACTION, (_item) => _item?.value == params?.type) || null
                                }
                                options={TYPE_HISTORY_TRANSACTION}
                                onChange={(values) => {
                                    if (!values) {
                                        history.push(`/products/warehouse-bill/history?${queryString.stringify(_.omit({ ...params, }, ["type"]))}`);
                                        return;
                                    }
                                    history.push(`/products/warehouse-bill/history?${queryString.stringify({ ...params, page: 1, type: values.value, })}`);
                                }}
                            />
                        </div>
                        <div className="col-3" style={{ zIndex: 91 }}>
                            <Select
                                placeholder={formatMessage({ defaultMessage: "Phát sinh từ" })}
                                isClearable
                                className="w-100 custom-select-warehouse"
                                value={
                                    _.find(
                                        ACTOR_HISTORY_TRANSACTION,
                                        (_item) => _item?.value == params?.actor
                                    ) || null
                                }
                                options={ACTOR_HISTORY_TRANSACTION}
                                onChange={(values) => {
                                    if (!values) {
                                        history.push(
                                            `/products/warehouse-bill/history?${queryString.stringify(
                                                _.omit(
                                                    {
                                                        ...params,
                                                    },
                                                    ["actor"]
                                                )
                                            )}`
                                        );
                                        return;
                                    }
                                    history.push(
                                        `/products/warehouse-bill/history?${queryString.stringify({
                                            ...params,
                                            page: 1,
                                            actor: values.value,
                                        })}`
                                    );
                                }}
                            />
                        </div>
                    </>
                ) : null}
            </div>
            <div className="row mb-4">
                <div className="col-2 pr-0" style={{ zIndex: 88 }}>
                    <Select
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        isLoading={false}
                        value={
                            _.find(
                                _.omit(
                                    tabPage == "goods"
                                        ? SEARCH_OPTIONS_HISTORY_BY_GOODS
                                        : SEARCH_OPTIONS_HISTORY,
                                    ["placeholder"]
                                ),
                                (_bill) => _bill?.value == params?.search_type
                            ) ||
                            _.omit(
                                tabPage == "goods"
                                    ? SEARCH_OPTIONS_HISTORY_BY_GOODS[0]
                                    : SEARCH_OPTIONS_HISTORY[0],
                                ["placeholder"]
                            )
                        }
                        defaultValue={_.omit(
                            tabPage == "goods"
                                ? SEARCH_OPTIONS_HISTORY_BY_GOODS[0]
                                : SEARCH_OPTIONS_HISTORY[0],
                            ["placeholder"]
                        )}
                        options={_.map(
                            tabPage == "goods"
                                ? SEARCH_OPTIONS_HISTORY_BY_GOODS
                                : SEARCH_OPTIONS_HISTORY,
                            (_bill) => _.omit(_bill, ["placeholder"])
                        )}
                        onChange={(value) => {
                            history.push(
                                `/products/warehouse-bill/history?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    search_type: value.value,
                                })}`
                            );
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>;
                        }}
                    />
                </div>
                <div
                    className="col-5 input-icon pl-0"
                    style={{ height: "fit-content" }}
                >
                    {tabPage == 'actions' && (
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage(_.find(SEARCH_OPTIONS_HISTORY, _bill => _bill.value == params?.search_type)?.placeholder || SEARCH_OPTIONS_HISTORY[0].placeholder)}
                            style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            onBlur={(e) => {
                                history.push(`/products/warehouse-bill/history?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    q: e.target.value
                                })}`)
                            }}
                            defaultValue={params.q || ''}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    history.push(`/products/warehouse-bill/history?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        q: e.target.value
                                    })}`)
                                }
                            }}
                        />
                    )}
                    {tabPage == 'goods' && (
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage(_.find(SEARCH_OPTIONS_HISTORY_BY_GOODS, _bill => _bill.value == params?.search_type)?.placeholder || SEARCH_OPTIONS_HISTORY_BY_GOODS[0].placeholder)}
                            style={{ height: 38, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            onBlur={(e) => {
                                history.push(`/products/warehouse-bill/history?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    q: e.target.value
                                })}`)
                            }}
                            defaultValue={params.q || ''}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    history.push(`/products/warehouse-bill/history?${queryString.stringify({
                                        ...params,
                                        page: 1,
                                        q: e.target.value
                                    })}`)
                                }
                            }}
                        />
                    )}

                    <span>
                        <i className="flaticon2-search-1 icon-md ml-6 mr-4"></i>
                    </span>
                </div>
                <div className="col-3" style={{ zIndex: 90 }}>
                    <Select
                        placeholder={formatMessage({ defaultMessage: "Kho" })}
                        isClearable={tabPage == 'goods' ? false : true}
                        className="w-100 custom-select-warehouse-sme"
                        value={
                            _.find(
                                _.map(warehouses, (_item) => ({
                                    value: _item?.id,
                                    label: _item?.name,
                                })),
                                (_item) => _item?.value == params?.warehouseId
                            ) || tabPage == 'goods' && {
                                value: defaultWarehouse?.id,
                                label: defaultWarehouse?.name,
                            }
                        }
                        options={_.map(warehouses, (_item) => ({
                            value: _item?.id,
                            label: _item?.name,
                        }))}
                        onChange={(values) => {
                            if (!values) {
                                history.push(
                                    `/products/warehouse-bill/history?${queryString.stringify(
                                        _.omit(
                                            {
                                                ...params,
                                            },
                                            ["warehouseId"]
                                        )
                                    )}`
                                );
                                return;
                            }
                            history.push(
                                `/products/warehouse-bill/history?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    warehouseId: values.value,
                                })}`
                            );
                        }}
                    />
                </div>
                {tabPage == 'goods' && (
                    <div className="col-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <AuthorizationWrapper keys={['warehouse_bill_history_export']}>
                            <button
                                type="submit"
                                className="w-100 btn btn-primary btn-elevate"
                                onClick={() => {
                                    setOpenModal(true)
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Xuất file' })}
                            </button>
                            <button
                                className="btn btn-secondary btn-elevate ml-1"
                                onClick={(e) => {
                                    e.preventDefault();
                                    history.push("/products/history-export-tab-goods");
                                }}
                            >
                                <HistoryRounded />
                            </button>
                        </AuthorizationWrapper>
                    </div>
                )}
            </div>
        </Fragment>
    );
};

export default memo(WarehouseBillHistoryFilter);
