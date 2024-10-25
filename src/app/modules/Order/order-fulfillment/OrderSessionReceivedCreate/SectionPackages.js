import React, { Fragment, memo, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { formatNumberToCurrency } from "../../../../../utils";
import ModalSelectPackage from "../components/ModalSelectPackage";
import TableReceivedPackages from "../components/TableReceivedPackages";
import { useOrderSessionReceivedContext } from "../context/OrderSessionReceivedContext";
import { components } from "react-select";

const MaxLengthInput = (props) => <components.Input {...props} maxLength={30} />;

const SectionPackages = ({ loading }) => {
    const { formatMessage } = useIntl();
    const { packagesSession, setPackagesSession, optionsSmeWarehouse, warehouseSelected, setWarehouseSelected, shippingCarrier, setShippingCarrier, optionsStore, optionsShippingCarrier } = useOrderSessionReceivedContext();
    const [showModalPackages, setShowModalPackages] = useState(false);
    const [currentCode, setCurrentCode] = useState(null);

    const currentWarehouse = useMemo(() => {
        return optionsSmeWarehouse?.find(sw => sw?.value == warehouseSelected)
    }, [optionsSmeWarehouse, warehouseSelected]);

    const currentShippingCarier = useMemo(() => {
        return optionsSmeWarehouse?.find(sw => sw?.value == shippingCarrier)
    }, [optionsSmeWarehouse, shippingCarrier]);

    return (
        <Fragment>
            {showModalPackages && <ModalSelectPackage
                show={showModalPackages}
                packages={packagesSession}
                stores={optionsStore}
                onHide={() => {
                    setShowModalPackages(false)
                    setCurrentCode(null);
                }}
                onSelectPackage={pack => setPackagesSession(prev => {
                    if (!!currentCode) {
                        return prev.map(item => {
                            if (item?.code == currentCode) {
                                return {
                                    ...item,
                                    data: pack?.data
                                }
                            }

                            return item
                        })
                    }

                    return prev.concat([pack])
                })}
            />}
            <Card className="mb-4">
                <CardBody>
                    <div className="mb-8">
                        <span className="font-weight-bolder">
                            {formatMessage({ defaultMessage: 'DANH SÁCH KIỆN HÀNG' })}
                        </span>
                    </div>
                    <div className="row mb-8 d-flex justify-content-between">
                        <div className="col-4 d-flex align-items-center">
                            <span className="mr-3" style={{ minWidth: 'fit-content' }}>
                                {formatMessage({ defaultMessage: 'Kho trả hàng' })}
                                <span className="text-danger">*</span>
                            </span>
                            <Select
                                className="w-100"
                                value={currentWarehouse}
                                options={optionsSmeWarehouse}
                                placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                                onChange={value => setWarehouseSelected(value?.value)}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 10
                                    }),
                                }}
                            />
                        </div>
                        <div className="col-4 d-flex align-items-center">
                            <span className="mr-3" style={{ minWidth: 'fit-content' }}>
                                {formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}
                                <span className="text-danger">*</span>
                            </span>
                            <CreatableSelect
                                className="w-100"
                                components={{ Input: MaxLengthInput }}
                                value={currentShippingCarier}
                                options={optionsShippingCarrier}
                                placeholder={formatMessage({ defaultMessage: 'Chọn đơn vị vận chuyển' })}
                                onChange={value => setShippingCarrier(value?.value)}
                                formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 10
                                    }),
                                }}
                            />
                        </div>
                    </div>
                    <div className="d-flex align-items-center mb-4" style={{ gap: '10%' }}>
                        <div className="d-flex align-items-center">
                            <span>{formatMessage({ defaultMessage: 'TỔNG KIỆN HÀNG' })}:</span>
                            <span className="font-weight-bolder ml-2">{formatNumberToCurrency(packagesSession?.length)}</span>
                        </div>
                    </div>
                    <TableReceivedPackages
                        loading={loading}
                        stores={optionsStore}
                        packages={packagesSession}
                        onSelectPackage={(pack) => {
                            setCurrentCode(pack?.code);
                            setShowModalPackages(true)
                        }}
                        onRemovePackage={(pack) => {
                            if (packagesSession?.length == 1) return;
                            setPackagesSession(prev => prev.filter(pck => pck?.code != pack?.code))
                        }}
                    />
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(SectionPackages);