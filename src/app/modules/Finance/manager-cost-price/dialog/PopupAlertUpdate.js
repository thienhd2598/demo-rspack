import React, { memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

const PopupAlertUpdate = memo(({
    data,
    onHide
}) => {
    const history = useHistory();
    const {formatMessage} = useIntl()
    return (
        <Modal
            show={!!data}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='text-center'>
                    <div className="mb-6" >
                        {formatMessage({defaultMessage: 'Lưu ý: Những sản phẩm sàn đang liên kết kho mà có ảnh gốc đã áp khung thì sẽ không được cập nhật dữ liệu từ sản phẩm kho sang'})}
                    </div>
                    <button
                        id="kt_login_signin_submit"
                        className={`btn btn-primary font-weight-bold px-9 `}
                        style={{ width: 150 }}
                        onClick={e => {
                            e.preventDefault();

                            history.push({
                                pathname: data?.urlTo,
                                state: {
                                    list_product: data?.list_product
                                }
                            })
                        }}
                    >
                        <span className="font-weight-boldest">OK</span>
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default PopupAlertUpdate;