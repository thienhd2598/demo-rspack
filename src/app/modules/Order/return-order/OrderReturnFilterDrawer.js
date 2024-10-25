import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import Select from "react-select";
import { useIntl } from "react-intl";
import _, { omit } from 'lodash'

const OrderReturnFilterDrawer = ({ dataWarehouse, isOpenDrawer, onToggleDrawer }) => {
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
    const RETURN_TYPES = [
        {
            value: "1",
            label: formatMessage({ defaultMessage: "Sản phẩm" }),
        },
        {
            value: "2",
            label: formatMessage({ defaultMessage: "Xử lý đơn hàng" }),
        },
        {
            value: "3",
            label: formatMessage({ defaultMessage: "Đơn vị vận chuyển" }),
        },
        {
            value: "4",
            label: formatMessage({ defaultMessage: "Người mua" }),
        },
    ];


    let optionsProcesedWarehouse = dataWarehouse?.map(wh => {
        return { label: wh?.name, value: wh?.id }
    })
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


    useMemo(() => {
        setFilterParams({
            reasontype: params?.reasontype || undefined,
            process_wh: params?.process_wh || undefined,
            processed_warehouse: params?.processed_warehouse || undefined,
        })
    }, [params?.reasontype, params?.process_wh, isOpenDrawer, params?.processed_warehouse]);

    const currentReason = useMemo(() => {
        let parseReason = filterParams?.reasontype?.split(',');
        let _current = RETURN_TYPES?.filter(_option => parseReason?.some(param => param == _option?.value));

        return _current || []
    }, [filterParams]);

    const currentStatusImportWarehouse = useMemo(() => {
        let parseStatus = filterParams?.process_wh?.split(',');
        let _current = STATUS_WAREHOUSING?.filter(_option => parseStatus?.some(param => param == _option?.value));

        return _current || []
    }, [filterParams]);



    const onResetFilterParams = useCallback(() => { setFilterParams({}) }, []);

    const onUpdateFilterParams = useCallback((key, value) => {
        setFilterParams(prevParams => ({ ...prevParams, [key]: value }))
    }, []);

    const onRemoveFilterProducts = useCallback(() => onResetFilterParams(), []);

    const onConfirmFilterProducts = useCallback(() => {
        let filtered = {
            ...omit(params, ['reasontype', 'process_wh', 'processed_warehouse']),
            ...filterParams,
            page: 1
        };

        for (const key in filtered) {
            if (filtered[key] === undefined) delete filtered[key]
        };

        history.push(`${location.pathname}?${queryString.stringify({ ...filtered })}`.replaceAll('%2C', '\,'));
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
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Trạng thái nhập kho" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isMulti
                            isClearable
                            value={currentStatusImportWarehouse || {}}
                            onChange={values => {
                                let paramsStatus = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('process_wh', paramsStatus);
                            }}
                            options={STATUS_WAREHOUSING}
                        />
                    </div>

                    <div className="drawer-filter-item p-4">
                        <p className="mb-2 font-weight-bold">{formatMessage({ defaultMessage: "Lỗi do" })}</p>
                        <Select
                            placeholder={formatMessage({ defaultMessage: "Tất cả" })}
                            isMulti
                            isClearable
                            value={currentReason || {}}
                            onChange={values => {
                                let paramsReasontype = values?.length > 0
                                    ? _.map(values, 'value')?.join(',')
                                    : undefined;

                                onUpdateFilterParams('reasontype', paramsReasontype);
                            }}
                            options={RETURN_TYPES}
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

export default memo(OrderReturnFilterDrawer);