import React from 'react'
import { Modal } from 'react-bootstrap';
import { useIntl } from 'react-intl';

export const ConfirmDialog = ({ confirmOffStatus, dataStores, handleDeleteTemplate, handleUpdateStatusAutoReply, confirmDialog, onHide }) => {
    const { formatMessage } = useIntl();

    const storesMapTemplate = confirmDialog?.template?.mapStoreReplyTemplates?.map(tl => {
        const findNameStore = dataStores?.sc_stores?.find(store => store?.id == tl?.store_id)
        return findNameStore?.name
    })

    const titleModal = () => {
        if (confirmDialog?.action == 'UPDATE_STATUS') {
            return formatMessage({ defaultMessage: "Nếu bạn tắt thì hệ thống sẽ không tự động phản hồi cho gian hàng này, bạn có đồng ý tắt?" })
        }
        if (confirmOffStatus) {
            return formatMessage({ defaultMessage: "Mẫu có thể đang được dùng để phản hồi tự động cho gian hàng việc tắt trả lời tự động của sao sẽ ảnh hưởng đến việc phản hồi tự động. Bạn có đồng ý tắt phản hồi tự động cho sao này." })
        }
        if (confirmDialog?.template?.mapStoreReplyTemplates?.length) {
            return <span><b>{confirmDialog?.template?.name}</b> đang được sử dụng để phản hồi tự động cho gian hàng <b>{storesMapTemplate?.join(', ')}</b>.Bạn có đồng ý xoá?</span>
        }
        return formatMessage({ defaultMessage: "Bạn có đồng ý xoá mẫu này?" })
    }
    return (
        <Modal
            onHide={onHide}
            show={true}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                <div className="mb-6">
                    {titleModal()}
                </div>
                <div>
                    <button onClick={onHide} className="btn btn-secondary mr-4" style={{ width: 150 }}>
                        {formatMessage({ defaultMessage: "Huỷ" })}
                    </button>
                    <button
                        onClick={confirmDialog?.action == 'UPDATE_STATUS' ? handleUpdateStatusAutoReply : !!confirmOffStatus ? confirmOffStatus : handleDeleteTemplate}
                        className="btn btn-primary"
                        style={{ width: 150 }}
                    >
                        {formatMessage({ defaultMessage: "Đồng ý" })}
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
};