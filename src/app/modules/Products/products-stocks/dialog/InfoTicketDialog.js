import React, { useMemo, useCallback, memo } from 'react';
import { useIntl } from "react-intl";
import { Modal } from 'react-bootstrap';
import Table from 'rc-table';
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import InfoProduct from '../../../../../components/InfoProduct';
import query_warehouse_reserve_ticket_items from '../../../../../graphql/query_warehouse_reserve_ticket_items';
import { groupBy } from 'lodash';
import dayjs from 'dayjs';

const InfoTicketDialog = ({ onHide, skuVariant, currentSmeWarehouse }) => {
    const { formatMessage } = useIntl();

    const { data, loading } = useQuery(query_warehouse_reserve_ticket_items, {
        fetchPolicy: 'network-only',
        variables: {
            where: {
                variant: { sku: { _eq: skuVariant } },
                warehouse_reserve_ticket: { status: { _eq: "processing" } }
            }
        },
    });

    const dataTickets = useMemo(() => {
        if (!data?.warehouse_reserve_ticket_items || data?.warehouse_reserve_ticket_items?.length == 0)
            return [];
        const newTicket = groupBy(data?.warehouse_reserve_ticket_items, 'warehouse_reserve_ticket_id');

        console.log({ newTicket })

        return Object.keys(newTicket).map(key => {
            const quantityWarehouse = newTicket[key]?.find(ticket => ticket?.warehouse_id == currentSmeWarehouse?.sme_store_id)?.quantity;

            return {
                ...newTicket[key]?.[0]?.warehouse_reserve_ticket,
                quantity: quantityWarehouse
            }
        })
    }, [data, currentSmeWarehouse]);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên phiếu dự trữ' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (_item, record) => {

                return <span className='cursor-pointer' onClick={() => window.open(`/products/reserve/${record?.id}`, '_blank')}>{record?.name}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian dự trữ' }),
            dataIndex: 'end_date',
            key: 'end_date',
            align: 'left',
            width: '35%',
            render: (item, record) => {
                const rangeTime = [
                    dayjs(record?.created_at).format('HH:mm DD/MM/YYYY'),
                    dayjs.unix(record?.end_date).format('HH:mm DD/MM/YYYY'),
                ];

                return <span>{rangeTime.join(' - ')}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng dự trữ' }),
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                return <span>{formatNumberToCurrency(item)}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '20%',
            render: (item, record) => {
                const isStatusProcessing = record?.status == 'processing';

                return <div className={`d-flex align-items-center ${isStatusProcessing ? 'justify-content-between' : 'justify-content-center'}`}>
                    <div className='py-1' style={{ background: record?.status == 'processing' ? '#FF5629' : '#00DB6D', borderRadius: 6, minWidth: isStatusProcessing ? '80%' : '100%' }}>
                        <span className='text-white'>
                            {isStatusProcessing ? formatMessage({ defaultMessage: 'Đang dự trữ' }) : formatMessage({ defaultMessage: 'Kết thúc' })}
                        </span>
                    </div>
                    {isStatusProcessing && (
                        <>
                            {record?.total_error > 0 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                                </svg>
                            )}
                        </>
                    )}
                </div>
            }
        },
    ];

    return (
        <Modal
            show={!!skuVariant}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={'body-dialog-connect modal-info-ticket'}
            centered
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin phiếu dự trữ' })}
                </Modal.Title>
                <span>
                    <i
                        className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"
                        onClick={onHide}
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='mb-4'>{formatMessage({ defaultMessage: 'Kho: {name}' }, { name: currentSmeWarehouse?.name })}</div>
                <div style={{ position: 'relative' }}>
                    {loading && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                            <span className="spinner spinner-primary" />
                        </div>
                    )}
                    <Table
                        style={loading ? { opacity: 0.4 } : {}}
                        className="upbase-table"
                        columns={columns}
                        data={dataTickets || []}
                        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có phiếu dự trữ nào' })}</span>
                        </div>}
                        tableLayout="auto"
                        scroll={{ y: 350 }}
                        sticky={{ offsetHeader: 0 }}
                    />
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default memo(InfoTicketDialog);