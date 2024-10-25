import React, { memo, useMemo } from "react";
import { Card, CardBody } from "../../../../../_metronic/_partials/controls";
import { useIntl } from "react-intl";
import { formatNumberToCurrency } from "../../../../../utils";
import { useOrderSessionDeliveryContext } from "../context/OrderSessionDeliveryContext";
import { sum, sumBy } from "lodash";
import { PackStatusName } from "../../OrderStatusName";

const SectionPackages = ({ loading }) => {
    const { formatMessage } = useIntl();
    const { packagesSession, setPackagesSession } = useOrderSessionDeliveryContext();

    const [totalItemOrder, totalPriceOrder] = useMemo(() => {
        const totalItemOrder = sumBy(packagesSession, 'total_purchased');
        const totalPriceOrder = sumBy(packagesSession?.map(pk => pk?.order), 'paid_price');

        return [totalItemOrder, totalPriceOrder]
    }, [packagesSession]);

    console.log({ totalItemOrder, totalPriceOrder });

    return (
        <Card className="mb-4">
            <CardBody>
                <div className="mb-8">
                    <span className="font-weight-bolder">
                        {formatMessage({ defaultMessage: 'DANH SÁCH KIỆN HÀNG' })}
                    </span>
                </div>
                <div className="d-flex align-items-center mb-4" style={{ gap: '10%' }}>
                    <div className="d-flex align-items-center">
                        <span>{formatMessage({ defaultMessage: 'TỔNG KIỆN HÀNG' })}:</span>
                        <span className="font-weight-bolder ml-2">{formatNumberToCurrency(packagesSession?.length)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <span>{formatMessage({ defaultMessage: 'TỔNG HÀNG HÓA' })}:</span>
                        <span className="font-weight-bolder ml-2">{formatNumberToCurrency(totalItemOrder)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <span>{formatMessage({ defaultMessage: 'TỔNG GIÁ TRỊ' })}:</span>
                        <span className="font-weight-bolder ml-2">{formatNumberToCurrency(totalPriceOrder)}đ</span>
                    </div>
                </div>
                <div className="mb-10 d-flex justify-content-between">
                    <table className="table  table-borderless product-list  table-vertical-center fixed">
                        <tbody>
                            <tr className="font-size-lg">
                                <td width={"25%"}>
                                    <b>{formatMessage({ defaultMessage: "Vận chuyển" })}</b>
                                </td>
                                <td colSpan={4}>
                                    {packagesSession && <b>{packagesSession[0]?.shipping_carrier}</b>}
                                </td>
                            </tr>
                            <tr className="font-size-lg">
                                <td width="25%" style={{ borderTop: "0" }}>
                                    <b>{formatMessage({ defaultMessage: "Mã kiện hàng" })}</b>
                                </td>
                                <td width="20%" className="text-center" style={{ borderTop: "0" }}>
                                    <b>{formatMessage({ defaultMessage: "Số lượng hàng hóa" })}</b>
                                </td>
                                <td width="20%" className="text-center" style={{ borderTop: "0" }}>
                                    <b>{formatMessage({ defaultMessage: "Thành tiền" })}</b>
                                </td>
                                <td width="25%" className="text-center" style={{ borderTop: "0" }}>
                                    <b>{formatMessage({ defaultMessage: "Vận chuyển" })}</b>
                                </td>
                                <td width="10%" className="text-center" style={{ borderTop: "0" }}>
                                    <b>{formatMessage({ defaultMessage: "Thao tác" })}</b>
                                </td>
                            </tr>
                            {loading && <div className="text-center w-100 mt-12" style={{ position: "absolute" }}>
                                <span className="ml-3 spinner spinner-primary"></span>
                            </div>}
                            {packagesSession?.length == 0 && <tr>
                                <td colSpan={5} className="text-center">
                                    <div className="my-4">
                                        <span>{formatMessage({ defaultMessage: 'Danh sách kiện hàng rỗng, xin vui lòng scan kiện' })}</span>
                                    </div>
                                </td>
                            </tr>}
                            {!!packagesSession?.length && packagesSession?.map((item, index) => {
                                const { status, pack_status } = PackStatusName(
                                    item?.pack_status,
                                    item?.order?.status,
                                );

                                let color = '';
                                switch (pack_status) {
                                    case 'pending':
                                        color = '#FFA500'
                                        break;
                                    case 'waiting_for_packing':
                                        color = '#FF4500'
                                        break;
                                    case 'packing':
                                        color = '#5e7e1b'
                                        break;
                                    case 'packed':
                                        color = '#35955b'
                                        break;
                                    case 'shipped':
                                        color = '#3699ff'
                                        break;
                                    case 'shipping':
                                        color = '#913f92'
                                        break;
                                    case 'completed':
                                        color = '#03a84e'
                                        break;
                                    case 'cancelled':
                                        color = '#808080'
                                        break;
                                    default:
                                        color = '#000'
                                        break;
                                };

                                const renderStatusColor = <span className='fs-12' style={{
                                    color: '#fff',
                                    backgroundColor: color,
                                    fontWeight: 'bold',
                                    padding: '4px 8px',
                                    borderRadius: 20
                                }}>
                                    {formatMessage(status)}
                                </span>

                                return (
                                    <tr key={`package-${index}`} className="font-size-lg">
                                        <td style={{ fontSize: "15px" }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span>{item?.system_package_number}</span>
                                                {renderStatusColor}
                                            </div>
                                        </td>
                                        <td className="text-center" style={{ fontSize: "22px" }}>
                                            <b>{item?.total_purchased}</b>
                                        </td>
                                        <td className="text-center" style={{ fontSize: "18px" }}>
                                            <b>{formatNumberToCurrency(item?.order?.paid_price)}đ</b>
                                        </td>
                                        <td style={{ fontSize: "15px" }}>
                                            <span>{item?.shipping_carrier}</span>
                                            <br />
                                            <span>{formatMessage({ defaultMessage: "Mã vận đơn: {name}" }, { name: item?.tracking_number })}</span>
                                        </td>
                                        <td className="text-center" style={{ fontSize: "15px" }}>
                                            <i
                                                className="fas fa-trash-alt text-danger cursor-pointer"
                                                style={{ cursor: packagesSession?.length > 1 ? 'pointer' : 'not-allowed' }}
                                                onClick={() => {
                                                    if (packagesSession?.length == 1) return;
                                                    setPackagesSession(prev => prev.filter(pck => pck?.id != item?.id))
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    )
}

export default memo(SectionPackages);