import clsx from "clsx";
import React, { Fragment, memo, useCallback, useMemo } from "react";
import { useIntl } from "react-intl";
import { TYPE_ORDER_SESSION_RECEIVED } from "../OrderFulfillmentHelper";

const WAREHOUSE_NOT_IMPORT = 1;     // không nhập kho
const WAREHOUSE_IMPORTED_NOT_FULL = 2; // nhập kho 1 phần
const WAREHOUSE_IMPORTED_FULL = 3;      // nhập kho toàn phần
const _COLOR = ["#F3252E", "#FFA500", "#00DB6D"]
const TableReceivedPackages = ({
    shippingCarrier = "",
    loading,
    stores,
    packages,
    onSelectPackage,
    onRemovePackage,
    status = 'create' // create | new | complete | cancel
}) => {
    const { formatMessage } = useIntl();

    const viewStatus = useCallback((importStatus) => {
        return <span style={{
            padding: "4px 8px",
            borderRadius: "4px",
            color: "#fff",
            background: _COLOR[importStatus - 1],
            fontSize: "12px",
            lineHeight: "12px",
        }}>
            {
                importStatus == WAREHOUSE_NOT_IMPORT ? formatMessage({ defaultMessage: `Không nhập kho` }) :
                    importStatus == WAREHOUSE_IMPORTED_NOT_FULL ? formatMessage({ defaultMessage: `Nhập kho một phần` }) :
                        importStatus == WAREHOUSE_IMPORTED_FULL ? formatMessage({ defaultMessage: `Nhập kho toàn bộ` }) : ""
            }</span>
    }, [])

    const headerTableReceivedPackages = [
        {
            title: formatMessage({ defaultMessage: "Mã quét/nhập" }),
            width: 25
        },
        {
            title: formatMessage({ defaultMessage: "Loại đơn" }),
            width: 15,
        },
        {
            title: formatMessage({ defaultMessage: "Gian hàng" }),
            width: 15,
            isCenter: true,
        },
        {
            title: formatMessage({ defaultMessage: "Thông tin kiện" }),
            width: 35,
        },
        {
            title: formatMessage({ defaultMessage: "Thao tác" }),
            width: 10,
            isCenter: true,
        },
    ];

    const viewPackages = useMemo(
        () => {
            if (packages?.length == 0) {
                return <tr>
                    <td colSpan={5} className="text-center">
                        <div className="my-4">
                            <span>{formatMessage({ defaultMessage: 'Danh sách kiện hàng rỗng, xin vui lòng scan kiện' })}</span>
                        </div>
                    </td>
                </tr>
            }

            return <Fragment>
                {!!packages?.length && packages?.map((item, index) => {
                    const store = stores?.find(st => st?.value == item?.data?.store_id);
                    const importStatus = item?.data?.has_import_history;
                    return (
                        <tr key={`package-${index}`} className="font-size-lg">
                            <td style={{ fontSize: "15px" }}>
                                <span>{item?.code}</span>
                            </td>
                            {!item?.data && <td colSpan={3}>
                                {status != "cancel" && <span
                                    className="text-primary cursor-pointer"
                                    onClick={() => onSelectPackage(item)}
                                >
                                    {formatMessage({ defaultMessage: 'Chọn kiện' })}
                                </span>}
                            </td>}
                            {!!item?.data && <>
                                <td>
                                    <span>{TYPE_ORDER_SESSION_RECEIVED?.[item?.data?.object_type]}</span>
                                </td>
                                <td className="text-center">
                                    {!store && <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>}
                                    {!!store && <div className='d-flex justify-content-center align-items-center'>
                                        <img
                                            style={{ width: 16, height: 16 }}
                                            src={store?.logo}
                                            className="mr-2"
                                        />
                                        <span>{store?.label}</span>
                                    </div>}
                                </td>
                                <td className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex flex-column">
                                        <span className="mb-1">
                                            {formatMessage({ defaultMessage: `{name}: {code}` }, {
                                                name: item?.data?.object_type == 3 ? 'Mã trả hàng' : 'Mã đơn hàng',
                                                code: item?.data?.object_ref_id
                                            })}
                                        </span>
                                        <span>
                                            {formatMessage({ defaultMessage: `{name}: {code}` }, {
                                                name: item?.data?.object_type == 3 ? 'Mã vận đơn trả hàng' : 'Mã vận đơn',
                                                code: item?.data?.object_tracking_number
                                            })}
                                        </span>
                                    </div>
                                    {item?.data?.has_import_history != 0 && viewStatus(importStatus)}
                                </td>
                            </>}
                            <td className="text-center">
                                {status != 'cancel' && <div className="d-flex justify-content-center align-items-center">
                                    {(status == "create" || status == "new" || (status == "complete" && !!item?.isManual)) && <i
                                        className="fas fa-trash-alt text-danger cursor-pointer"
                                        style={{ cursor: packages?.length > 1 ? 'pointer' : 'not-allowed' }}
                                        onClick={() => onRemovePackage(item)}
                                    />}
                                    {item?.isManual && !!item?.data && <svg
                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        className="text-primary cursor-pointer ml-4 bi bi-repeat" viewBox="0 0 16 16"
                                        onClick={() => onSelectPackage(item)}
                                    >
                                        <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                                    </svg>}
                                </div>}
                            </td>
                        </tr>
                    )
                })}
            </Fragment>
        }, [packages, stores]
    );


    return (
        <table className="table  table-borderless product-list  table-vertical-center fixed">
            <tbody>
                {!!shippingCarrier && <tr className="font-size-lg">
                    <td width={"25%"}>
                        <b>{formatMessage({ defaultMessage: "Vận chuyển" })}</b>
                    </td>
                    <td colSpan={4}>
                        <b>{shippingCarrier}</b>
                    </td>
                </tr>}
                <tr className="font-size-lg">
                    {headerTableReceivedPackages?.map((item, index) => (
                        <td
                            width={`${item?.width}%`}
                            key={`header-package-${index}`}
                            className={clsx(item?.isCenter && 'text-center')}
                            style={!!shippingCarrier ? { borderTop: "0" } : {}}
                        >
                            <b>{item?.title}</b>
                        </td>
                    ))}
                </tr>
                {loading && <div className="text-center w-100 mt-12" style={{ position: "absolute" }}>
                    <span className="ml-3 spinner spinner-primary"></span>
                </div>}
                {viewPackages}
            </tbody>
        </table>
    )
}

export default memo(TableReceivedPackages);