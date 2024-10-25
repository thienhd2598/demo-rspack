import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import Table from "rc-table";

const ModalHotKeys = ({ show, onHide }) => {
    const { formatMessage } = useIntl();

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên phím tắt' }),
            dataIndex: 'name',
            align: 'left',
            width: '30%',
            render: (item) => {
                if (item == 'Up') {
                    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-up" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708z" />
                    </svg>
                }

                if (item == 'Down') {
                    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708" />
                    </svg>
                }

                return <span>{item}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Chức năng' }),
            dataIndex: 'func',
            align: 'left',
            width: '70%',
            render: (item) => {
                return <span>{item}</span>
            }
        },
    ];

    const data = [
        { name: 'F1', func: formatMessage({ defaultMessage: 'Thêm hoá đơn mới' }) },
        { name: 'F2', func: formatMessage({ defaultMessage: 'Tìm hàng hoá' }) },
        { name: 'F3', func: formatMessage({ defaultMessage: 'In' }) },
        { name: 'F4', func: formatMessage({ defaultMessage: 'Thanh toán' }) },
        { name: 'F5', func: formatMessage({ defaultMessage: 'Nhập mã giảm giá' }) },    
        { name: 'F6', func: formatMessage({ defaultMessage: 'Nhập số tiền khách hàng' }) },
        { name: 'Tab', func: formatMessage({ defaultMessage: 'Nhảy sang input nhập kế tiếp' }) },
        { name: 'Home', func: formatMessage({ defaultMessage: 'Nhập số lượng' }) },
        { name: 'Up', func: formatMessage({ defaultMessage: 'Tăng số lượng' }) },
        { name: 'Down', func: formatMessage({ defaultMessage: 'Giảm số lượng' }) },
    ];

    return (
        <Modal
            show={show}
            size="md"
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-actions-cost-income"
            centered
            onHide={() => { }}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Phím tắt chức năng' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <svg
                    style={{ position: 'absolute', top: -40, right: 20, fontSize: 20, cursor: 'pointer' }}
                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"
                    onClick={onHide}
                >
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                </svg>
                <Table
                    className="upbase-table"
                    columns={columns}
                    data={data}
                    tableLayout="auto"
                    scroll={{ y: 500 }}
                    sticky={{ offsetHeader: 0 }}
                />
            </Modal.Body>
        </Modal>
    )
};

export default memo(ModalHotKeys);