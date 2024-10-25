import React, { Fragment, memo, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { useOrderProcessContext } from '../context';
import { useIntl } from 'react-intl';
import Select from 'react-select';
import { OPTIONS_SEARCH } from '../OrderProcessFailDeliveryHelper';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import OrderRowProcess from './OrderRowProcess';

const OrderListProcess = () => {
    const { formatMessage } = useIntl();
    const { orders } = useOrderProcessContext();
    const [searchType, setSearchType] = useState(OPTIONS_SEARCH[0].value);
    const [search, setSearch] = useState(null);

    useMemo(
        () => {

        }, [search]
    );

    const selectedOptionSearch = useMemo(
        () => {
            return OPTIONS_SEARCH.find(op => op.value == searchType)
        }, [searchType]
    );

    console.log(`-----ODRERS----`, orders);

    return (
        <Card className="mb-4">
            <CardHeader title={formatMessage({ defaultMessage: "Danh sách đơn cần xử lý" })} />
            <CardBody>
                <div className='row mt-2 mb-4'>
                    <div className='col-8'>
                        <div className='row'>
                            <div className='col-4 pr-0' style={{ zIndex: 2 }}>
                                <Select
                                    options={OPTIONS_SEARCH}
                                    className='w-100 custom-select-order'
                                    theme={(theme) => ({
                                        ...theme,
                                        borderRadius: 0,
                                        colors: {
                                            ...theme.colors,
                                            primary: '#ff5629'
                                        }
                                    })}
                                    value={selectedOptionSearch}
                                    onChange={value => {
                                        setSearchType(value?.value || undefined);
                                    }}
                                    formatOptionLabel={(option) => {
                                        return <div>{option.label}</div>
                                    }}
                                />
                            </div>
                            <div className="col-8 input-icon pl-0" style={{ height: 'fit-content' }} >
                                <input
                                    // ref={inputRefOrder}
                                    type="text"
                                    className="form-control"
                                    placeholder={formatMessage(selectedOptionSearch.placeholder)}
                                    style={{ height: 37, borderRadius: 0, paddingLeft: '50px', fontSize: '15px' }}
                                    onKeyDown={e => {
                                        if (e.keyCode == 13 && e.target.value) {
                                            setSearch(e.target.value);
                                        }
                                    }}
                                />
                                <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="warning__title mb-2 d-flex align-items-center">
                    <img
                        className="mr-2"
                        src={toAbsoluteUrl("/media/war.png")}
                    ></img>
                    <span className="text-danger fs-14">
                        {formatMessage({ defaultMessage: 'Chú ý: Khi đã xử lý nhập kho, thì không thể huỷ nhập kho cho đơn đã xử lý' })}
                    </span>
                </div>
                <table className="table table-borderless product-list table-vertical-center fixed">
                    <thead
                        style={{
                            position: 'sticky', top: 45, background: '#F3F6F9', fontWeight: 'bold', fontSize: '14px', zIndex: 1,
                            border: '0.5px solid #cbced4'
                        }}
                    >
                        <tr>
                            <th className="fs-14" width="35%">
                                {formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
                            </th>
                            <th className="fs-14" width="25%">
                                {formatMessage({ defaultMessage: 'Hàng hóa kho' })}
                            </th>
                            <th className="fs-14 text-center" width="20%">
                                {formatMessage({ defaultMessage: 'Số lượng' })}{" "}
                                <span className="ml-1">
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip>
                                                {formatMessage({ defaultMessage: 'Số lượng hàng hoá kho đã liên kết đơn với hàng hoá sàn của đơn hàng đó' })}
                                            </Tooltip>
                                        }
                                    >
                                        <i className="fas fa-info-circle fs-14"></i>
                                    </OverlayTrigger>
                                </span>
                            </th>
                            <th className="fs-14 text-center" width="20%">
                                {formatMessage({ defaultMessage: 'Số lượng nhập kho' })}
                            </th>
                        </tr>
                    </thead>
                    {orders?.map(order => (
                        <tbody key={`order-process-${order?.id}`}>
                            {order.totalItems?.map(item => (
                                <OrderRowProcess
                                    key={`order-process-${order?.id}-${item?.id}`}
                                    order={order}
                                    orderItem={item}
                                    store={order?.store}
                                />
                            ))}
                        </tbody>
                    ))}
                </table>
            </CardBody>
        </Card>
    )
};

export default memo(OrderListProcess);