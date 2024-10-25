import React, { Fragment, memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

const BlockOperate = ({ loading, data }) => {
    const history = useHistory();
    const { formatMessage } = useIntl();

    const dataOperate = useMemo(
        () => {
            return [
                {
                    id: 1,
                    title: formatMessage({ defaultMessage: "Đơn chờ đóng gói" }),
                    count: data?.overview_index?.orderProcessing || 0,
                    link: '/orders/list?page=1&type=pending'
                },
                {
                    id: 2,
                    title: formatMessage({ defaultMessage: 'Đơn hàng thiếu hàng' }),
                    count: data?.overview_index?.orderError || 0,
                    link: '/orders/list?page=1&type=warehouse_error_code'
                },
                {
                    id: 3,                    
                    title: formatMessage({ defaultMessage: 'Yêu cầu hoàn mới' }),
                    count: data?.overview_index?.requestReturn || 0,
                    link: '/orders/refund-order'
                },
                {
                    id: 4,                    
                    title: formatMessage({ defaultMessage: 'Đơn huỷ bất thường' }),
                    count: data?.overview_index?.orderCancelAbnormal || 0,
                    link: 'orders/fail-delivery-order?return_process_status=returned'
                },
                {
                    id: 5,
                    title: formatMessage({ defaultMessage: 'Hàng hoá hết hàng ở kho' }),
                    count: data?.overview_index?.productOutStock || 0,
                    link: '/products/stocks?page=1&type=out_stock'
                },
                {
                    id: 6,
                    title: formatMessage({ defaultMessage: 'Hàng hoá sắp hết hàng' }),
                    count: data?.overview_index?.productNearOutStock || 0,
                    link: '/products/stocks?page=1&type=near_out_stock'
                },
                {
                    id: 7,
                    title: formatMessage({ defaultMessage: 'Đẩy tồn thất bại trong ngày' }),
                    count: data?.overview_index?.pushInventoryFail || 0,
                    link: '/product-stores/list-stock-tracking?page=1&status=0'
                },
                {
                    id: 8,
                    title: formatMessage({ defaultMessage: "Sản phẩm sàn bị vi phạm" }),
                    count: data?.overview_index?.storeProductViolate || 0,
                    link: '/product-stores/list?page=1&type=other'
                },
            ]
        }, [data]
    );

    return (
        <Fragment>
            <h3 className="txt-title mb-4">{formatMessage({ defaultMessage: "Vận hành" })}</h3>
            <div className="row section-top py-4">
                {dataOperate?.slice(0, 4).map((_operate, index) => (
                    <div
                        key={`operate-${index}`}
                        className={`box-vh col-3 d-flex flex-column align-items-center justify-content-center ${index != 0 ? 'divider-db' : ''} cursor-pointer py-2`}
                        onClick={() => {
                            history.push(_operate.link)
                        }}
                    >
                        {loading ? <div className='mb-8'>
                            <span className='spinner spinner-primary' />
                        </div> : <span className="txt-vh-title mb-2">{_operate?.count}</span>}
                        <div className="d-flex align-items-center">
                            <div className="dot-vh-des mr-2" style={index != 0 ? {} : { background: '#09dc72' }} />
                            <span className="txt-vh-des fs-14">{_operate?.title}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="row py-4">
                {dataOperate?.slice(4, dataOperate?.length).map((_operate, index) => (
                    <div
                        key={`operate-${index}`}
                        className={`box-vh col-3 d-flex flex-column align-items-center justify-content-center ${index != 0 ? 'divider-db' : ''} cursor-pointer py-2`}
                        onClick={() => {
                            history.push(_operate.link)
                        }}
                    >
                        {loading ? <div className='mb-8'>
                            <span className='spinner spinner-primary' />
                        </div> : <span className="txt-vh-title mb-2">{_operate?.count}</span>}
                        <div className="d-flex align-items-center">
                            <div className="dot-vh-des mr-2" />
                            <span className="txt-vh-des fs-14">{_operate?.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </Fragment>
    )
};

export default memo(BlockOperate);