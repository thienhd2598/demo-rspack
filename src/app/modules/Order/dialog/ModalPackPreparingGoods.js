import dayjs from 'dayjs';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import weekday from 'dayjs/plugin/weekday';
import ModalSelectAddress from './ModalSelectAddress';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import { useMutation, useQuery } from "@apollo/client";
import mutate_coPreparePackage from "../../../../graphql/mutate_coPreparePackage";
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { useIntl } from 'react-intl'
import query_scFindWarehouse from '../../../../graphql/query_scFindWarehouse';
dayjs.extend(weekday);

const COORDINATE_STATUS = "Đang điều phối ĐVVC";
const FLAG_DEFAUTL_ADDRESS = "pickup_address";
const SHOPEE_EXPRESS_STATUS = ["Shopee Xpress Instant", "SPX Instant", "GrabExpress", "beDelivery", "AhaMove"];

const ModalPackPreparingGoods = ({
    dataOrder,
    openModal,
    onHide
}) => {
    const { formatMessage } = useIntl()
    const isCoordinating = dataOrder?.connector_channel_code == 'shopee' && dataOrder?.shipping_carrier === COORDINATE_STATUS;
    const isShopeeExpress = dataOrder?.connector_channel_code == 'shopee' && SHOPEE_EXPRESS_STATUS.some(_item => _item === dataOrder?.shipping_carrier);
    const [deliveryMethod, setDeliveryMethod] = useState(1);
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [listShipmentDetails, setListShipmentDetails] = useState(null);
    const [shipmentDetails, setShipmentDetails] = useState();
    const [showModalAddress, setShowModalAddress] = useState(false);
    const [loading, setLoading] = useState(false)
    console.log('dataOrder', dataOrder)

    const [mutate] = useMutation(mutate_coPreparePackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages']
    })
    const { addToast } = useToasts();

    const { data: dataScWarehouse } = useQuery(query_scFindWarehouse, {
        variables: {
            id: dataOrder?.sc_warehouse_id
        },
        fetchPolicy: 'cache-and-network'
    });

    const scWarehouseAddress = useMemo(() => {
        if (!dataScWarehouse?.scFindWarehouse) return null;
        return {
            address_id: +dataScWarehouse?.scFindWarehouse?.address_id,
            address_flag: [],
            address: dataScWarehouse?.scFindWarehouse?.address,
            city: dataScWarehouse?.scFindWarehouse?.city,
            district: dataScWarehouse?.scFindWarehouse?.district,
            state: dataScWarehouse?.scFindWarehouse?.state,
            time_slot_list: []
        }
    }, [dataScWarehouse]);


    useEffect(() => {
        let address_list = !!dataOrder?.order?.shipment_param_payload
            ? dataOrder?.order?.shipment_param_payload?.pickup?.address_list
            : (!!scWarehouseAddress && dataOrder?.connector_channel_code == 'shopee' ? [scWarehouseAddress] : []);

        const defaultAddress = address_list?.find(address => address?.address_id == +scWarehouseAddress?.address_id)
            || address_list?.find(address => address?.address_flag?.includes(FLAG_DEFAUTL_ADDRESS))
            || address_list?.[0];            

        setListShipmentDetails(address_list)
        setShipmentDetails(address_list ? defaultAddress : null)
        setDeliveryDate(address_list ? defaultAddress?.['time_slot_list']?.[0]?.pickup_time_id : null)
    }, [dataOrder, scWarehouseAddress]);

    const coPreparePackage = async () => {
        setLoading(true)
        let variables = {}
        if (dataOrder?.connector_channel_code == 'shopee' && deliveryMethod == 1) {
            variables = {
                delivery_method: 1,
                list_package: [{
                    package_id: dataOrder?.id,
                    pickup_time_id: deliveryDate,
                    ...(isShopeeExpress ? {} : {
                        address_id: shipmentDetails?.address_id
                    })
                }]
            }
        }

        if (dataOrder?.connector_channel_code == 'shopee' && deliveryMethod == 2) {
            variables = {
                delivery_method: 2,
                list_package: [{ package_id: dataOrder?.id }]
            }
        }

        if (dataOrder?.connector_channel_code == 'tiktok') {
            variables = {
                delivery_method: deliveryMethod,
                list_package: [{ package_id: dataOrder?.id }]
            }
        }

        if (dataOrder?.connector_channel_code == 'lazada') {
            variables = {
                list_package: [{ package_id: dataOrder?.id }]
            }
        }


        let { data } = await mutate({
            variables: variables
        })
        setLoading(false)
        if (data?.coPreparePackage?.data?.list_package_fail?.length == 0) {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng thành công' }), { appearance: 'success' });
            onHide()
        } else {
            addToast(data?.coPreparePackage?.data?.list_package_fail[0]['error_message'] || formatMessage({ defaultMessage: 'Chuẩn bị hàng thất bại' }), { appearance: 'error' });
            onHide()
        }
    }


    return (
        <Modal
            show={openModal == 'ModalPackPreparingGoods'}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect modal-pack-order'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Chuẩn bị hàng' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ minHeight: isCoordinating ? 0 : '220px' }}>
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                {isCoordinating && (
                    <p className='fs-14 text-center my-4'>
                        {formatMessage({ defaultMessage: 'Đơn hàng đang được sàn điều phối ĐVVC, vui lòng thử lại sau.' })}
                    </p>
                )}
                {!isCoordinating && (
                    <>
                        {(dataOrder?.connector_channel_code == 'shopee' || dataOrder?.connector_channel_code == 'tiktok') && <div className='row'>
                            <div className='mb-5'>
                                <div className='col-12 fs-16 mb-5'>
                                    <span>{formatMessage({ defaultMessage: 'Chọn phương thức giao hàng' })}</span>
                                </div>
                                <div className='col-12 d-flex justify-content-between'>
                                    <div className='p-3  mr-4' style={{ cursor: 'pointer', width: '48%', border: deliveryMethod == 1 ? '1px solid #FE5629' : '1px solid #D9D9D9' }} onClick={() => setDeliveryMethod(1)}>
                                        <div className='d-flex' >
                                            <span className='mr-3'>
                                                <SVG src={toAbsoluteUrl("/media/svg/box-arrow-right.svg")} />
                                            </span>
                                            <div>
                                                <p className='fs-16'>{formatMessage({ defaultMessage: 'Lấy hàng' })}</p>
                                                <p className='fs-12 text-secondary-custom'>{formatMessage({ defaultMessage: 'ĐVVC sẽ đến lấy hàng tại địa chỉ mà bạn đã xác nhận' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className='p-3'
                                        style={{ cursor: isShopeeExpress ? 'not-allowed' : 'pointer', width: '48%', border: deliveryMethod == 2 ? '1px solid #FE5629' : '1px solid #D9D9D9' }}
                                        onClick={() => {
                                            if (isShopeeExpress) return;
                                            setDeliveryMethod(2)
                                        }}
                                    >
                                        <div className='d-flex'>
                                            <span className='mr-3'>
                                                <SVG src={toAbsoluteUrl("/media/svg/box-arrow-left.svg")} />
                                            </span>
                                            <div>
                                                <p className='fs-16'>{formatMessage({ defaultMessage: 'Tự mang hàng ra bưu cục' })}</p>
                                                <p className='fs-12 text-secondary-custom'>{formatMessage({ defaultMessage: 'Bạn cần mang hàng ra bưu cục của ĐVVC' })}</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>

                            {/* {isShopeeExpress && <div className='mb-4 col-12'>
                                <span>{formatMessage({ defaultMessage: 'Chú ý: Sau khi xác nhận thì ĐVVC sẽ đến lấy hàng trong vòng' })} <span className='text-primary'>4</span> {formatMessage({ defaultMessage: 'giờ tới' })}</span>
                            </div>} */}

                            {deliveryMethod == 1 && dataOrder?.connector_channel_code == 'shopee' && <div className='w-100'>

                                {/* {!isShopeeExpress &&  */}
                                <>
                                    <div className='col-12 mb-5'>
                                        <p className='fs-16 my-4'>{formatMessage({ defaultMessage: 'Thông tin giao hàng' })}</p>
                                        <p className='fs-16'>{formatMessage({ defaultMessage: 'Ngày' })}</p>
                                    </div>

                                    <div className='col-12 d-flex flex-wrap mb-5'>
                                        {shipmentDetails?.time_slot_list?.filter(time => time.pickup_time_id - 3600 >= dayjs().unix())?.map((time, index) =>
                                            <div className='px-4 py-4 mx-2' style={{ border: deliveryDate == time.pickup_time_id ? '1px solid #FE5629' : '1px solid #D9D9D9', width: '22%', cursor: 'pointer' }} onClick={() => setDeliveryDate(time.pickup_time_id)} key={index}>
                                                {dayjs.unix(time.pickup_time_id).format('DD-MM-YYYY ')} <br />  {`T${dayjs.unix(time.pickup_time_id).weekday() + 1}`}
                                            </div>
                                        )}

                                    </div>
                                </>
                                {/* } */}

                                <div className='col-12'>
                                    <p className='mb-5 fs-16'>{formatMessage({ defaultMessage: 'Địa chỉ lấy hàng' })}</p>
                                    <div className='border p-3 position-relative'>
                                        {/* <p className='fs-16'>UpEcom - 0978321231</p> */}
                                        <p className='fs-14'>{shipmentDetails?.address}</p>
                                        <p className='fs-14'>{shipmentDetails?.city}</p>
                                        <p className='fs-14'>{shipmentDetails?.state}</p>

                                        {!isShopeeExpress && !!dataOrder?.order?.shipment_param_payload && <span className='position-absolute' style={{ textDecorationLine: 'underline', cursor: 'pointer', right: '5px', top: '5px', color: 'blue' }} onClick={() => setShowModalAddress(true)}>{formatMessage({ defaultMessage: 'Đổi' })}</span>}
                                    </div>

                                </div>
                            </div>


                            }
                            {deliveryMethod == 1 && dataOrder?.connector_channel_code == 'tiktok' && <div className='w-100'>
                                <p style={{ color: '#6C757D' }} className="col-12">
                                    {formatMessage({ defaultMessage: 'Chú ý: Sau khi xác nhận thì ĐVVC sẽ đến lấy hàng trong vòng' })} <span style={{ color: '#ff5629' }}>48</span> {formatMessage({ defaultMessage: 'giờ tới' })}
                                </p>
                            </div>
                            }
                        </div>
                        }

                        {dataOrder?.connector_channel_code == 'lazada' && <div className='row' style={{ color: '#6C757D' }}>
                            <div className='col-12'>
                                {/* Chú ý phương thức giao hàng:
                        <ul className='pl-8'>
                            <li>Tự mang hàng ra bưu cục : Với ĐVVC thuộc Lazada như Lex VN (với hầu hết các
                                mặt hàng tiêu chuẩn).</li>
                            <li> Lấy hàng : Với những bên ĐVVC ngoài ví dụ như J&T, Ninja Van,…</li>
                        </ul> */}
                                {formatMessage({ defaultMessage: 'Chú ý : Hình thức giao hàng cho đơn vị vận chuyển thì hệ thống sẽ lấy theo hình thức được cài đặt mặc định trên kênh người bán.' })}
                            </div>
                        </div>}
                    </>
                )}

                {
                    <LoadingDialog show={loading} />
                }

            </Modal.Body>
            {
                isCoordinating && (
                    <Modal.Footer style={{ justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={onHide}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Đóng' })}
                            </button>
                        </div>
                    </Modal.Footer>
                )
            }
            {
                !isCoordinating && (
                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={onHide}
                                className="btn btn-secondary mr-5"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                            </button>
                            <button
                                type="button"
                                onClick={coPreparePackage}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Xác nhận' })}
                            </button>
                        </div>
                    </Modal.Footer>
                )
            }

            <ModalSelectAddress
                listShipmentDetails={listShipmentDetails}
                shipmentDetails={shipmentDetails}
                showModalAddress={showModalAddress}
                setShipmentDetails={setShipmentDetails}
                onHide={() => setShowModalAddress(false)}
            />
        </Modal >
    )
};

export default memo(ModalPackPreparingGoods);