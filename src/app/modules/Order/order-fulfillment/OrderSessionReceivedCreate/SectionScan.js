import React, { memo } from "react";
import { useIntl } from "react-intl";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useOnKeyPress } from "../../../../../hooks/useOnKeyPress";
import useScanDetection from "../../../../../hooks/useScanDetection";
import { useOrderSessionReceivedContext } from "../context/OrderSessionReceivedContext";

const SectionScan = ({ onCreateOrderSessionReceived, onCleanScanPackages, refetchPackages }) => {
    const { formatMessage } = useIntl();
    const { setIsLoadPackages, inputRefOrder, searchParams, setSearchParams } = useOrderSessionReceivedContext();

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefOrder?.current) return;
            setIsLoadPackages(true);
            setSearchParams(prev => ({ ...prev, search: value }));
        },
    });

    useOnKeyPress(onCreateOrderSessionReceived, "F1");
    useOnKeyPress(onCleanScanPackages, "F3");

    return (
        <Card>
            <CardBody>
                <div className="mb-8">
                    <span className="font-weight-bolder">
                        {formatMessage({ defaultMessage: 'QUÉT MÃ VẠCH' })}
                    </span>
                </div>
                <div className="row d-flex align-items-center justify-content-center mb-6">
                    <div className="col-7 d-flex align-items-center">
                        <div className="row w-100">
                            <div className="input-icon pl-0 flex-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={formatMessage({ defaultMessage: "Quét hoặc nhập mã" })}
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
                <div className="d-flex align-items-center justify-content-center mb-4">
                    <button
                        className="btn btn-primary font-weight-bolder mr-8"
                        style={{ minWidth: 150 }}
                        onClick={onCreateOrderSessionReceived}
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