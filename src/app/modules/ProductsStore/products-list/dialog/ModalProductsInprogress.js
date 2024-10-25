import React, { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal, ProgressBar } from "react-bootstrap";

const ModalProductsInprogress = ({ total, totalInprogress, totalProductError, totalProductSuccess, show }) => {
    const { formatMessage } = useIntl();    

    return (
        <Modal
            style={{ zIndex: 9999 }}
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            backdrop={'true'}
            dialogClassName='width-fit-content'
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Tải lại sản phẩm' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ width: 500, zIndex: 9999 }} >
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số sản phẩm cần tải lại: {count}' }, { count: total ?? 0 })}</span>
                </div>
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số sản phẩm tải lại thành công:' })}</span>
                    <span className="ml-1 text-success">{totalProductSuccess ?? 0}</span>
                </div>
                <div className="mb-4">
                    <span>{formatMessage({ defaultMessage: 'Tổng số sản phẩm tải lại thất bại:' })}</span>
                    <span className="ml-1 text-danger">{totalProductError ?? 0}</span>
                </div>
                <ProgressBar
                    style={{ height: 20 }}
                    className='fs-14 mb-6'
                    now={(((total - totalInprogress) / total) * 100).toFixed()}
                    label={`${(((total - totalInprogress) / total) * 100).toFixed()}%`}
                />
            </Modal.Body>
        </Modal>
    )
};

export default memo(ModalProductsInprogress);