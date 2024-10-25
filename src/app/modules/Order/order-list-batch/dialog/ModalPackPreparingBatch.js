import dayjs from 'dayjs';
import React, { memo, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import weekday from 'dayjs/plugin/weekday';

import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import SVG from "react-inlinesvg";
import { gql, useMutation, useQuery } from "@apollo/client";
import mutate_coPreparePackage from "../../../../../graphql/mutate_coPreparePackage";
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import ModalResult from './ModalResult';
import ModalSelectAddress from '../../dialog/ModalSelectAddress';
import mutate_coGetPrepareParamViaFilter from '../../../../../graphql/mutate_coGetPrepareParamViaFilter';
import _ from 'lodash';
import { useIntl } from 'react-intl'
import query_scFindWarehouse from '../../../../../graphql/query_scFindWarehouse';
dayjs.extend(weekday);

const COORDINATE_STATUS = "Đang điều phối ĐVVC";
const FLAG_DEFAUTL_ADDRESS = "pickup_address";
const SHOPEE_EXPRESS_STATUS = ["Shopee Xpress Instant", "SPX Instant", "GrabExpress", "beDelivery", "AhaMove"];

const ModalPackPreparingBatch = ({
    orderHandleBatch, action, onHide,
    ids, total, whereCondition, onActionPackageViaFilter
}) => {
    console.log('ids', ids)
    const { formatMessage } = useIntl()
    const [dataResults, setDataResults] = useState(null);
    const [totalOrder, setTotalOrder] = useState(0);
    const [deliveryMethod, setDeliveryMethod] = useState(1);
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [listShipmentDetails, setListShipmentDetails] = useState(null);
    const [listDateShopee, setListDateShopee] = useState([]);
    const [shipmentDetails, setShipmentDetails] = useState();
    const [showModalAddress, setShowModalAddress] = useState(false);
    const [connector_channel_code, setChannelCode] = useState('');
    const isOrderManual = orderHandleBatch?.order?.source == 'manual';

    const [mutate, { loading }] = useMutation(mutate_coPreparePackage, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetPackages', 'scPackageAggregate']
    });

    const [mutateGetParamsPrepare, { loading: loadingGetPrepare }] = useMutation(mutate_coGetPrepareParamViaFilter, {
        awaitRefetchQueries: true,
    });

    const { data: dataScWarehouse } = useQuery(query_scFindWarehouse, {
        variables: {
            id: orderHandleBatch?.sc_warehouse_id || ids[0]?.sc_warehouse_id
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

    const { addToast } = useToasts();

    const [isCoordinating, isShopeeExpress] = useMemo(() => {
        let [checkedCoordinating, checkedShopeeExpress] = [false, false];

        if (action == 'mutiple') {
            checkedCoordinating = ids[0]?.connector_channel_code == 'shopee' && ids[0]?.shipping_carrier === COORDINATE_STATUS;
            checkedShopeeExpress = ids[0]?.connector_channel_code == 'shopee' && SHOPEE_EXPRESS_STATUS.some(_item => _item === ids[0]?.shipping_carrier);
        } else {
            checkedCoordinating = orderHandleBatch?.connector_channel_code == 'shopee' && orderHandleBatch?.shipping_carrier === COORDINATE_STATUS
            checkedShopeeExpress = orderHandleBatch?.connector_channel_code == 'shopee' && SHOPEE_EXPRESS_STATUS.some(_item => _item === orderHandleBatch?.shipping_carrier);
        }

        return [checkedCoordinating, checkedShopeeExpress]
    }, [action, ids, orderHandleBatch]
    );

    useMemo(async () => {
        if (action != 'mutipleViaFilter') return;

        setChannelCode(orderHandleBatch?.connector_channel_code);
        const address_list = !!orderHandleBatch?.order?.shipment_param_payload
            ? orderHandleBatch?.order?.shipment_param_payload?.pickup?.address_list
            : (!!scWarehouseAddress && orderHandleBatch?.connector_channel_code == 'shopee' ? [scWarehouseAddress] : []);
        setListShipmentDetails(address_list)
        let shipment = address_list?.find(address => address?.address_id == scWarehouseAddress?.address_id)
            || address_list?.find(address => address?.address_flag?.includes(FLAG_DEFAUTL_ADDRESS))
            || address_list?.[0];
    

        await mutateGetParamsPrepare({ variables: { search: { ..._.omit(whereCondition, ['list_status']), status: whereCondition?.list_status } } }).then(({ data }) => {
            const { data: dataParams } = data?.coGetPrepareParamViaFilter || [];            
            setDeliveryDate(dataParams?.[0]?.pickup_time_id || null);
            shipment = {
                ...shipment,
                time_slot_list: _.uniqBy(dataParams, 'pickup_time_id')
            }
        })

        setShipmentDetails(shipment);
    }, [action, whereCondition, orderHandleBatch, scWarehouseAddress]
    );

    useMemo(() => {
        if (action != 'mutiple') return;

        const currentTime = dayjs(new Date).startOf('day').unix();

        const hasPackageNullSlotTime = ids?.some(pack => pack?.order?.shipment_param_payload?.pickup?.address_list?.[0]?.['time_slot_list']?.length == 0);
        const parseDeliveryDate = hasPackageNullSlotTime ? [] : _.filter(_.map(ids, pack => pack?.order?.shipment_param_payload?.pickup?.address_list?.[0]?.['time_slot_list']?.filter(_date => Number(_date?.pickup_time_id) >= currentTime)), _time => _time?.length > 0);

        const listDate = parseDeliveryDate.reduce((result, _time) => {
            return result.concat([..._.map(_time, __ => Number(__?.pickup_time_id))]);
        }, []);

        const currentDatePick = _.min(_.uniq(listDate)) || null;

        const lstDeliveryDateShopee = _.minBy(_.filter(parseDeliveryDate, _delivery =>
            _delivery?.some(_item => Number(_item?.pickup_time_id) == currentDatePick)), _item => _item?.length);

        let address_list = ids[0]?.order?.shipment_param_payload
            ? ids[0]?.order?.shipment_param_payload?.pickup?.address_list
            : (!!scWarehouseAddress && ids[0]?.connector_channel_code == 'shopee' ? [scWarehouseAddress] : []);

        setListShipmentDetails(address_list)
        setShipmentDetails(address_list?.find(address => address?.address_id == scWarehouseAddress?.address_id)
            || address_list?.find(address => address?.address_flag?.includes(FLAG_DEFAUTL_ADDRESS))
            || address_list?.[0]
        )
        setDeliveryDate(currentDatePick || null);
        setListDateShopee(lstDeliveryDateShopee);
        setChannelCode(ids[0]?.connector_channel_code);
    }, [ids, action, scWarehouseAddress]);

    const coActionPackageViaFilter = async () => {
        let variables = {
            action_type: 1,
            search: whereCondition
        }

        if (connector_channel_code == 'shopee' && deliveryMethod == 1) {
            variables = {
                ...variables,
                ...(isShopeeExpress ? {} : {
                    address_id: shipmentDetails?.address_id
                }),
                pickup_time_id: !!deliveryDate ? String(deliveryDate) : null,
                delivery_method: 1,
            }
        }

        if (connector_channel_code == 'shopee' && deliveryMethod == 2) {
            variables = {
                ...variables,
                delivery_method: 2,
            }
        }

        if (connector_channel_code == 'tiktok') {
            variables = {
                ...variables,
                delivery_method: deliveryMethod,
            }
        }

        onActionPackageViaFilter(variables);
        resetModal();

    }

    const resetModal = () => {
        setShipmentDetails(null);
        setDeliveryMethod(1);
        setDeliveryDate(null);
        setListShipmentDetails(null);
        setListDateShopee([]);
        onHide();
    };

    const coPreparePackage = async () => {
        let variables = {
            list_package: ids?.map(pack => ({ package_id: pack?.id }))
        };

        if (connector_channel_code == 'shopee' && deliveryMethod == 1) {
            variables = {
                delivery_method: 1,
                list_package: ids?.map(pack => ({
                    package_id: pack?.id,
                    pickup_time_id: !!deliveryDate ? String(deliveryDate) : null,
                    ...(isShopeeExpress ? {} : {
                        address_id: shipmentDetails?.address_id || null
                    }),
                }))
            }
        }

        if (connector_channel_code == 'shopee' && deliveryMethod == 2) {
            variables = {
                delivery_method: 2,
                list_package: ids?.map(_order => ({
                    package_id: _order?.id
                }))
            }
        }

        if (connector_channel_code == 'tiktok') {
            variables = {
                delivery_method: deliveryMethod,
                list_package: ids?.map(pack => ({
                    package_id: pack?.id
                }))
            }
        }


        let { data } = await mutate({
            variables: variables
        })

        if (data?.coPreparePackage?.success == 0) {
            addToast(data?.coPreparePackage?.message, { appearance: 'error' });
            return
        }

        if (!!data?.coPreparePackage?.data) {
            setTotalOrder(action === 'mutiple' ? ids?.length : total);
            setDataResults(data?.coPreparePackage?.data);
            resetModal()
        } else {
            addToast(formatMessage({ defaultMessage: 'Chuẩn bị hàng loạt thất bại' }), { appearance: 'error' });
            resetModal()
        }
    }

    console.log(`CHECK: `, shipmentDetails?.time_slot_list, listDateShopee, deliveryDate);

    return (
        <>
            <LoadingDialog show={loading} />
            {!!isOrderManual && <Modal
                show={!!action}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                onHide={resetModal}
                backdrop={true}
                dialogClassName={'body-dialog-connect modal-pack-order'}
            >
                <Modal.Header>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Chuẩn bị hàng hàng loạt' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ minHeight: 100 }}>
                    <i
                        className="fas fa-times"
                        onClick={resetModal}
                        style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                    />
                    <div className='mb-2'>
                        <span className='fs-16'>{formatMessage({ defaultMessage: 'Kiện hàng đã chọn' })}: <strong>{action === 'mutiple' ? ids.length : total}</strong></span>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            className="btn btn-secondary mr-5"
                            style={{ width: 100 }}
                            onClick={resetModal}
                        >
                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (action === 'mutiple') coPreparePackage();
                                if (action === 'mutipleViaFilter') coActionPackageViaFilter();
                            }}
                            className="btn btn-primary btn-elevate mr-3"
                            style={{ width: 100 }}
                        >
                            {formatMessage({ defaultMessage: 'Xác nhận' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal >}
            {!isOrderManual && <Modal
                show={!!action}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                onHide={resetModal}
                backdrop={true}
                dialogClassName={'body-dialog-connect modal-pack-order'}
            >
                <Modal.Header>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Chuẩn bị hàng hàng loạt' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ minHeight: isCoordinating ? 0 : '320px' }}>
                    <i
                        className="fas fa-times"
                        onClick={resetModal}
                        style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                    />
                    {isCoordinating && (
                        <p className='fs-14 text-center my-4'>
                            {formatMessage({ defaultMessage: 'Đơn hàng đang được sàn điều phối ĐVVC, vui lòng thử lại sau.' })}
                        </p>
                    )}
                    {!isCoordinating && (
                        <>
                            <div className='mb-5'>
                                <span className='fs-16'>{formatMessage({ defaultMessage: 'Kiện hàng đã chọn' })}: <strong>{action === 'mutiple' ? ids.length : total}</strong></span>
                            </div>
                            {(connector_channel_code == 'shopee' || connector_channel_code == 'tiktok') && <div className='row'>
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
                                                    <p className='fs-12 text-secondary-custom'>
                                                        {formatMessage({ defaultMessage: 'ĐVVC sẽ đến lấy hàng tại địa chỉ mà bạn đã xác nhận' })}
                                                    </p>
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

                                {deliveryMethod == 1 && connector_channel_code == 'shopee' && <div className='w-100'>

                                    <>
                                        <div className='col-12 mb-5'>
                                            <p className='fs-16 my-4'>{formatMessage({ defaultMessage: 'Thông tin giao hàng' })} {loadingGetPrepare && <span className="ml-3 spinner spinner-primary"></span>
                                            }</p>
                                            <p className='fs-16'>{formatMessage({ defaultMessage: 'Ngày' })}</p>
                                            <p className='fs-14 text-secondary-custom'>{formatMessage({ defaultMessage: 'Ngày hẹn giao hàng bị giới hạn bởi đơn hàng có thời gian gần nhất' })}</p>
                                        </div>

                                        <div className='col-12 d-flex flex-wrap mb-5'>
                                            {(action === 'mutipleViaFilter' ? shipmentDetails?.time_slot_list : listDateShopee)?.map((time, index) =>
                                                <div className='px-4 py-4 mx-2' style={{ border: deliveryDate == time.pickup_time_id ? '1px solid #FE5629' : '1px solid #D9D9D9', width: '22%', cursor: 'pointer' }} onClick={() => setDeliveryDate(time.pickup_time_id)} key={index}>
                                                    {dayjs.unix(time.pickup_time_id).format('DD-MM-YYYY ')} <br />  {`${dayjs.unix(time.pickup_time_id).weekday() + 1 == 1 ? 'CN' : 'T' + (dayjs.unix(time.pickup_time_id).weekday() + 1)}`}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                    <div className='col-12'>
                                        <p className='mb-5 fs-16'>{formatMessage({ defaultMessage: 'Địa chỉ lấy hàng' })}</p>
                                        <div className='border p-3 position-relative'>
                                            {/* <p className='fs-16'>UpEcom - 0978321231</p> */}
                                            <p className='fs-14'>{shipmentDetails?.address}</p>
                                            <p className='fs-14'>{shipmentDetails?.city}</p>
                                            <p className='fs-14'>{shipmentDetails?.state}</p>

                                            {!isShopeeExpress && (!!orderHandleBatch?.order?.shipment_param_payload || !!ids?.[0]?.order?.shipment_param_payload) && <span className='position-absolute' style={{ textDecorationLine: 'underline', cursor: 'pointer', right: '5px', top: '5px', color: 'blue' }} onClick={() => setShowModalAddress(true)}>{formatMessage({ defaultMessage: 'Đổi' })}</span>}
                                        </div>

                                    </div>
                                </div>


                                }
                                {deliveryMethod == 1 && connector_channel_code == 'tiktok' && <div className='w-100'>
                                    <p style={{ color: '#6C757D' }} className="col-12">
                                        {formatMessage({ defaultMessage: 'Chú ý: Sau khi xác nhận thì ĐVVC sẽ đến lấy hàng trong vòng' })} <span style={{ color: '#ff5629' }}>48</span> {formatMessage({ defaultMessage: 'giờ tới' })}
                                    </p>
                                </div>
                                }
                            </div>
                            }

                            {connector_channel_code == 'lazada' && <div className='row' style={{ color: '#6C757D' }}>
                                <div className='col-12'>
                                    {formatMessage({ defaultMessage: 'Chú ý : Hình thức giao hàng cho đơn vị vận chuyển thì hệ thống sẽ lấy theo hình thức được cài đặt mặc định trên kênh người bán.' })}
                                </div>
                            </div>}
                        </>
                    )}

                </Modal.Body>
                {isCoordinating && (
                    <Modal.Footer style={{ justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={resetModal}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Đóng' })}
                            </button>
                        </div>
                    </Modal.Footer>
                )}
                {!isCoordinating && (
                    <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                className="btn btn-secondary mr-5"
                                style={{ width: 100 }}
                                onClick={resetModal}
                            >
                                {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (action === 'mutiple') coPreparePackage();
                                    if (action === 'mutipleViaFilter') coActionPackageViaFilter();
                                }}
                                className="btn btn-primary btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({ defaultMessage: 'Xác nhận' })}
                            </button>
                        </div>
                    </Modal.Footer>
                )}

            </Modal >}
            <ModalSelectAddress
                listShipmentDetails={listShipmentDetails}
                shipmentDetails={shipmentDetails}
                showModalAddress={showModalAddress}
                setShipmentDetails={setShipmentDetails}
                onHide={() => setShowModalAddress(false)}
            />
            <ModalResult
                totalOrder={totalOrder}
                dataResults={dataResults}
                type={'pack-prepare'}
                onHide={() => setDataResults(null)}
            />
        </>
    )
};

export default memo(ModalPackPreparingBatch);