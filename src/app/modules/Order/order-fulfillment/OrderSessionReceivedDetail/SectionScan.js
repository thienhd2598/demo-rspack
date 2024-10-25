import React from 'react'
import { useIntl } from 'react-intl';
import { useOrderSessionReceivedDetailContext } from '../context/OrderSesionReceivedDetailContext';
import useScanDetection from '../../../../../hooks/useScanDetection';

const SectionScan = ({ refetchPackages }) => {
    const { formatMessage } = useIntl();
    const { inputRefOrder, setSearch, setIsLoadPackages } = useOrderSessionReceivedDetailContext();

    useScanDetection({
        onComplete: async (value) => {
            if (document?.activeElement != inputRefOrder?.current) return;
            if (value?.trim()) {
                setIsLoadPackages(true);
                setSearch(value);
            }
        },
    });

    return (
        <div className="col-12 px-0">
            <div className="input-icon pl-0 flex-6">
                <input
                    type="text"
                    className="form-control"
                    placeholder={formatMessage({ defaultMessage: "Quét hoặc nhập mã" })}
                    style={{ height: 37, borderRadius: 0, paddingLeft: "50px", fontSize: "15px" }}
                    ref={inputRefOrder}
                    onKeyDown={(e) => {
                        if (e.keyCode == 13) {
                            const valueSearch = e.target.value?.trim();
                            if (valueSearch) {
                                setIsLoadPackages(true);
                                setSearch(valueSearch);
                                refetchPackages()
                            }
                        }
                    }}
                />
                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
            </div>
        </div>
    )
}

export default SectionScan