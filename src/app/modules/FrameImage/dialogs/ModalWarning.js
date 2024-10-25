import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

const ModalWarning = memo(({
    productsWarning,
    onHide,     
}) => {
    const { formatMessage } = useIntl();

    return (
        <Modal
            show={!!productsWarning}
            aria-labelledby="example-modal-sizes-title-md"
            dialogClassName={"body-dialog-scheduled-frame"}
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='text-center'>
                    <div className="mb-10" >
                        {formatMessage({ defaultMessage: 'Lịch áp khung {time} tiếng tối đa {count} sản phẩm, vui lòng chọn lại số lượng' }, { time: productsWarning?.time, count: productsWarning?.count })}
                    </div>
                    <div className="form-group mb-0">                        
                        <button
                            className={`btn btn-primary font-weight-bold`}
                            style={{ width: 120 }}
                            onClick={onHide}
                        >
                            <span className="font-weight-boldest">
                                {formatMessage({ defaultMessage: 'Đóng' })}
                            </span>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default ModalWarning;