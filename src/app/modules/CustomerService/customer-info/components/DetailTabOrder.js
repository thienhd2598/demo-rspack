import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl';
import { useHistory, useParams } from "react-router-dom";
import Table from 'rc-table';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_crmOrderByCustomer from '../../../../../graphql/query_crmOrderByCustomer';
import PaginationModal from '../../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import EditableVertical from './EditableVertical';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { STATUS_ORDER_DETAIL } from '../../../Order/OrderUIHelpers';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { ORDER_CUSTOMER_STATUS } from '../CustomerInfoConstants';

const DetailTabOrder = ({ optionsStore }) => {
    const params = useParams();
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const history = useHistory();

    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);

    const { loading: loadingOrderByCustomer, data: dataOrderByCustomer } = useQuery(query_crmOrderByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            crm_customer_id: Number(params?.id),
            first: Number(limit),
            page,
        }
    });

    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Mã đơn hàng' }),
                dataIndex: 'ref_id',
                key: 'ref_id',
                width: '18%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <span role="button" onClick={() => window.open(`/orders/${record?.sc_order_id}`, "_blank")}>{item}</span>
                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Số lượng hàng hóa' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Tổng số lượng mua trong đơn hàng' })}
                            </Tooltip>
                        }
                    >
                        <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                    </OverlayTrigger>
                </div>,
                dataIndex: 'count_variant',
                key: 'count_variant',
                width: '17%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Thanh toán' }),
                dataIndex: 'total_paid',
                key: 'total_paid',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}đ</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Gian hàng' }),
                dataIndex: 'store_id',
                key: 'store_id',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    const store = optionsStore?.find(st => st?.value == record?.store_id);

                    if (!store) return <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>

                    return <div className='d-flex align-items-center'>
                        <img
                            style={{ width: 15, height: 15 }}
                            src={store?.logo}
                            className="mr-2"
                        />
                        <span>{store?.label}</span>
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Trạng thái đơn hàng' }),
                dataIndex: 'status',
                key: 'status',
                width: '20%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {                    
                    return <span>{!!item ? (ORDER_CUSTOMER_STATUS[item] || 'Khác') : '--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Thời gian tạo đơn' }),
                dataIndex: 'order_at',
                key: 'order_at',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{!!item ? dayjs.unix(item).format('HH:mm DD/MM/YYYY') : '--'}</span>
                }
            },

        ]
    }, [optionsStore]);

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {loadingOrderByCustomer && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingOrderByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataOrderByCustomer?.crmOrderByCustomer?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có đơn hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataOrderByCustomer?.crmOrderByCustomer?.paginatorInfo?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    onPanigate={(page) => setPage(page)}
                    totalPage={Math.ceil(dataOrderByCustomer?.crmOrderByCustomer?.paginatorInfo?.total / limit)}
                    totalRecord={dataOrderByCustomer?.crmOrderByCustomer?.paginatorInfo?.total || 0}
                    count={dataOrderByCustomer?.crmOrderByCustomer?.data?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                />
            )}
        </Fragment>
    )
};

export default memo(DetailTabOrder);