import React, { memo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import Select from 'react-select';

const ModalAssignPic = ({
    show,
    onConfirm,
    onHide,
    optionsSubUser,
}) => {
    const { formatMessage } = useIntl();
    const [currentPic, setCurrentPic] = useState(null);

    return (
        <Modal
            show={show}
            size="md"
            aria-labelledby="example-modal-sizes-title-sm"            
            dialogClassName="modal-export-income"
            centered
            onHide={() => { }}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>{formatMessage({ defaultMessage: 'Phân công nhân viên' })}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='row mb-4 d-flex align-items-center'>
                    <div className='col-3 text-right'>
                        <span>{formatMessage({ defaultMessage: 'Chọn nhân viên' })}</span>
                    </div>
                    <div className='col-9'>
                        <Select
                            options={optionsSubUser}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Chọn nhân viên kho' })}                            
                            isClearable                            
                            isLoading={false}
                            onChange={(value) => {
                                setCurrentPic(value?.value);
                            }}
                        />
                    </div>                    
                </div>                
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'center', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={() => {
                            onHide();    
                            setCurrentPic(null);
                        }}
                        className="btn btn-secondary mr-3"
                        style={{ width: 120 }}
                    >
                        {formatMessage({ defaultMessage: 'Hủy' })}
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: 120 }}
                        disabled={!currentPic}
                        onClick={() => onConfirm(currentPic)}
                    >
                        {formatMessage({ defaultMessage: 'Phân công' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
};


export default memo(ModalAssignPic);