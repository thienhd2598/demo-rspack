import dayjs from 'dayjs';
import React, { Fragment, memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const ReplyDialog = ({ show, onHide, data }) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={show}
            size="md"
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={"body-dialog-connect"}
            centered
            onHide={() => { }}
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thông tin chi tiết phản hồi' })}
                </Modal.Title>
                <span>
                    <i
                        className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"
                        onClick={onHide}
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Phản hồi' })}:</span>
                    </div>
                    <div className='col-9'>
                        {data?.reply || '--'}
                    </div>
                </div>
                <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Thời gian phản hồi' })}:</span>
                    </div>
                    <div className='col-9'>
                        {!!data?.reply_time ? dayjs.unix(+data?.reply_time).format('HH:mm DD/MM/YYYY') : '--'}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
};

export default memo(ReplyDialog);