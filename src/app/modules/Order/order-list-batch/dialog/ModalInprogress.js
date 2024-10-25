import React, { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal, ProgressBar } from "react-bootstrap";

const ModalInprogress = ({ type, total, totalInprogress, totalOrderError, totalOrderSuccess, show }) => {
    const { formatMessage } = useIntl();

    const title = useMemo(() => {
        if (type == 'ready-to-deliver') {
            return formatMessage({ defaultMessage: 'Sẵn sàng giao hàng loạt' })
        }
        
        if (type == 'pack-prepare') {            
            return formatMessage({ defaultMessage: 'Chuẩn bị hàng hàng loạt' })
        }

        return formatMessage({ defaultMessage: 'Thao tác đơn hàng loạt' })
    }, [type]);

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
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ width: 500, zIndex: 9999 }} >
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số kiện cần xử lý: {count}' }, { count: total ?? 0 })}</span>
                </div>
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số kiện xử lý thành công:' })}</span>
                    <span className="ml-1 text-success">{totalOrderSuccess ?? 0}</span>
                </div>
                <div className="mb-4">
                    <span>{formatMessage({ defaultMessage: 'Tổng số kiện xử lý thất bại:' })}</span>
                    <span className="ml-1 text-danger">{totalOrderError ?? 0}</span>
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

export default memo(ModalInprogress);