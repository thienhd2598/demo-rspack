import React, { Fragment, memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import Table from 'rc-table';
import { Link } from "react-router-dom";
import InfoProduct from '../../../../components/InfoProduct';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_listScheduledAssetViaFrame from '../../../../graphql/query_listScheduledAssetViaFrame';
import { STATUS_LIST_SCHEDULED_FRAME } from '../FrameImageHelper';
import { useQuery } from '@apollo/client';
import { formatNumberToCurrency } from '../../../../utils';
import dayjs from 'dayjs';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';

const ModalScheduledFrame = ({
    currentFrameId,
    onHide,
}) => {
    const { formatMessage } = useIntl();

    const { data, loading } = useQuery(query_listScheduledAssetViaFrame, {
        fetchPolicy: 'cache-and-network',
        variables: {
            frame_id: currentFrameId
        }
    });

    const { data: dataStores } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const optionsStore = useMemo(() => {
        const stores = dataStores?.sc_stores?.filter(store => store?.status == 1)?.map(store => {
            let findedChannel = dataStores?.op_connector_channels?.find(_ccc => _ccc.code == store.connector_channel_code);

            return {
                label: store?.name,
                value: store?.id,
                logo: findedChannel?.logo_asset_url,
                connector_channel_code: store?.connector_channel_code
            };
        });

        return stores;
    }, [dataStores]);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên lịch thay khung' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (_item, record) => {
                return (
                    <div className="d-flex">
                        <div className='ml-1 d-flex flex-column'>
                            <InfoProduct
                                name={record?.title}
                                isSingle
                                productOrder={true}
                                url={() => window.open(`/frame-image/scheduled-frame/${record?.id}`, "_blank")}
                            />
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            dataIndex: 'id',
            key: 'id',
            align: 'left',
            width: '15%',
            render: (_item, record) => {
                const store = optionsStore?.find(st => st?.value == record?.store_id);

                return <Fragment>
                    {!!store && <div className='mt-2 d-flex align-items-center'>
                        <img
                            style={{ width: 15, height: 15 }}
                            src={store?.logo}
                            className="mr-2"
                        />
                        <span>{store?.label}</span>
                    </div>}
                </Fragment>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Thời gian' }),
            dataIndex: 'id',
            key: 'id',
            align: 'left',
            width: '25%',
            render: (_item, record) => {
                return <span>{dayjs(record?.apply_from_time).format('HH:mm DD/MM/YYYY')} - {dayjs(record?.apply_to_time).format('HH:mm DD/MM/YYYY')}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tổng sản phẩm' }),
            dataIndex: 'count_product_success',
            key: 'count_product_success',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                return <span>{formatNumberToCurrency(record?.count_product_success + record?.count_product_error)}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Trạng thái' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '15%',
            render: (item, record) => {
                const isStatusProcessing = record?.status != 1;
                const statusScheduled = STATUS_LIST_SCHEDULED_FRAME.find(item => item?.status == record?.status);

                return <div className={`d-flex align-items-center ${isStatusProcessing ? 'justify-content-between' : 'justify-content-center'}`}>
                    <div className='py-1' style={{ background: statusScheduled?.color, borderRadius: 6, minWidth: isStatusProcessing ? '80%' : '100%' }}>
                        <span className='text-white'>
                            {statusScheduled?.title}
                        </span>
                    </div>
                    {isStatusProcessing && (
                        <>
                            {record?.count_product_error > 0 ? (
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
            size="xl"
            show={!!currentFrameId}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={() => { }}
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin lịch thay khung' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div style={{ position: 'relative' }}>
                    {loading && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                            <span className="spinner spinner-primary" />
                        </div>
                    )}
                    <Table
                        className="upbase-table"
                        columns={columns}
                        data={!loading ? (data?.listScheduledAssetViaFrame || []) : []}
                        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có lịch áp khung nào' })}</span>
                        </div>}
                        tableLayout="auto"
                        scroll={{ y: 450 }}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
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
        </Modal >
    )
};

export default memo(ModalScheduledFrame);