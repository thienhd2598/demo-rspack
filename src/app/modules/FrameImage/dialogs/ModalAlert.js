import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import Table from 'rc-table';
import { Link } from "react-router-dom";
import InfoProduct from '../../../../components/InfoProduct';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';

const ModalAlert = ({
    type,
    dataError,
    onHide,
}) => {
    const { formatMessage } = useIntl();

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên sản phẩm sàn' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '50%',
            render: (_item, record) => {
                return (
                    <div className="d-flex">
                        <div className='ml-1 d-flex flex-column'>
                            <InfoProduct
                                name={record?.name}
                                isSingle
                                productOrder={true}
                                url={() => window.open(`/product-stores/edit/${record?.id}`, "_blank")}
                            />
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Mã lỗi' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '50%',
            render: (_item, record) => {
                return <span>{record?.error_message}</span>
            }
        }
    ];

    return (
        <Modal
            show={!!dataError}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={() => {}}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {type == 'create' ? formatMessage({ defaultMessage: 'Kết quả tạo lịch áp khung cho sản phẩm' }) : formatMessage({ defaultMessage: 'Kết quả cập nhật lịch áp khung cho sản phẩm' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='d-flex flex-column'>
                    <div>
                        <span>{formatMessage({ defaultMessage: 'Số sản phẩm cần tạo lịch' })}: <span className='font-weight-bold'>{dataError?.total}</span></span>
                    </div>
                    <div className='mt-3'>
                        <span>{formatMessage({ defaultMessage: 'Số sản phẩm tạo lịch thành công' })}: <span className='font-weight-bold text-success'>{dataError?.total_success}</span></span>
                    </div>
                    <div className='mt-3 mb-4'>
                        <span>{formatMessage({ defaultMessage: 'Số sản phẩm tạo lịch thất bại' })}: <span className='font-weight-bold text-danger'>{dataError?.total_error}</span></span>
                    </div>
                    <Table
                        className="upbase-table"
                        columns={columns}
                        data={dataError?.product_errors || []}
                        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                        </div>}
                        tableLayout="auto"
                        scroll={{ y: 350 }}
                        sticky={{ offsetHeader: 0 }}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={() => onHide(dataError?.idScheduleFrame, dataError?.type)}
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

export default memo(ModalAlert);