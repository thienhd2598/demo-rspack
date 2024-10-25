import React, { memo, useCallback, useMemo, useRef } from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { useOrderSessionDeliveryContext } from "../context/OrderSessionDeliveryContext";
import Select from 'react-select';
import { OPTIONS_SEARCH_SCAN } from "../OrderFulfillmentHelper";
import useScanDetection from "../../../../../hooks/useScanDetection";
import { useOnKeyPress } from "../../../../../hooks/useOnKeyPress";

const SectionScan = ({ onCreateOrderSessionDelivery, onCleanScanPackages, refetchPackages }) => {
    const { formatMessage } = useIntl();
    const { setIsLoadPackages, inputRefOrder, optionsSmeWarehouse, searchParams, setSearchParams, setPackagesSession } = useOrderSessionDeliveryContext();

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefOrder?.current) return;
            setIsLoadPackages(true);
            setSearchParams(prev => ({ ...prev, search: value }));
        },
    });    

    const currentWarehouse = useMemo(() => {
        return optionsSmeWarehouse?.find(sw => sw?.value == searchParams?.warehouseId)
    }, [searchParams?.warehouseId, optionsSmeWarehouse]);

    
    const currentSearchType = useMemo(() => {
        return OPTIONS_SEARCH_SCAN?.find(op => op?.value == searchParams?.search_type)
    }, [searchParams?.search_type, OPTIONS_SEARCH_SCAN]);    

    useOnKeyPress(onCreateOrderSessionDelivery, "F1");
    useOnKeyPress(onCleanScanPackages, "F3");

    return (
        <Card>
            <CardBody>
                <div className="mb-8">
                    <span className="font-weight-bolder">
                        {formatMessage({ defaultMessage: 'QUÉT MÃ VẠCH' })}
                    </span>
                </div>
                <div className="row d-flex align-items-center justify-content-between mb-6">
                    <div className="col-3 d-flex align-items-center">
                        <span className="mr-8" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Kho' })}
                        </span>
                        <Select
                            className="w-100"
                            value={currentWarehouse}
                            options={optionsSmeWarehouse}
                            placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                            onChange={value => setSearchParams(prev => ({ ...prev, warehouseId: value?.value }))}
                            styles={{
                                container: (styles) => ({
                                    ...styles,
                                    zIndex: 10
                                }),
                            }}
                        />
                    </div>
                    <div className="col-7 d-flex align-items-center">
                        <div className="row w-100">
                            <div className="col-3 pr-0">
                                <Select
                                    options={OPTIONS_SEARCH_SCAN}
                                    // ref={refSelectOrder}
                                    className="w-100 custom-select-order flex-4"
                                    style={{ borderRadius: 0 }}
                                    value={currentSearchType}
                                    onKeyDown={e => {
                                        if (e.keyCode === 39 && !e.target.value) {
                                            inputRefOrder.current.focus();
                                            return;
                                        }
                                    }}
                                    onChange={(value) => {
                                        setSearchParams(prev => ({ ...prev, search_type: value?.value }));
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>{option.label}</div>;
                                    }}
                                />
                            </div>
                            <div className="col-9 px-0">
                                <div className="input-icon pl-0 flex-6">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder={searchParams?.search_type == "system_package_number"
                                            ? formatMessage({ defaultMessage: "Quét hoặc nhập mã kiện hàng" })
                                            : formatMessage({ defaultMessage: "Quét hoặc nhập mã vận đơn" })
                                        }
                                        style={{ height: 37, borderRadius: 0, paddingLeft: "50px", fontSize: "15px" }}
                                        ref={inputRefOrder}                                        
                                        onKeyDown={(e) => {
                                            // if (e.keyCode === 37 && !e.target.value) {
                                            //     // refSelectOrder.current.focus();
                                            //     return;
                                            // }

                                            if (e.keyCode == 13) {
                                                const valueSearch = e.target.value;
                                                setIsLoadPackages(true);
                                                setSearchParams(prev => ({ ...prev, search: valueSearch }));
                                                if (valueSearch == searchParams?.search) {
                                                    refetchPackages();
                                                    return;
                                                }
                                            }
                                        }}
                                    />
                                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center justify-content-end mb-4">
                    <button
                        className="btn btn-primary font-weight-bolder mr-8"
                        style={{ minWidth: 150 }}
                        onClick={onCreateOrderSessionDelivery}
                    >
                        {formatMessage({ defaultMessage: "TẠO PHIÊN (F1)" })}
                    </button>
                    <button
                        className="btn btn-primary btn-elevate font-weight-bolder"
                        style={{ background: "#6C757D", border: "#6C757D", minWidth: 150 }}
                        onClick={onCleanScanPackages}
                    >
                        {formatMessage({ defaultMessage: "XÓA VÀ QUÉT TIẾP (F3)" })}
                    </button>
                </div>
            </CardBody>
        </Card>
    )
}

export default memo(SectionScan);