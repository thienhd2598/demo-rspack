import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import mutate_coLinkSmeProductOrder from '../../../../graphql/mutate_coLinkSmeProductOrder';
import { useIntl } from 'react-intl';
const DeleteProductOrder = memo(({
    show, onHide, order_item_id
}) => {
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    const {formatMessage} = useIntl()
    const [mutate_unlink, { loading }] = useMutation(mutate_coLinkSmeProductOrder, {
        awaitRefetchQueries: true,
        refetchQueries: ['findOrderDetail'],
    });

    const onUnLink = useCallback(
        async () => {
            let res = await mutate_unlink({
                variables: {
                    order_item_id,
                    sme_variant_id: ""
                }
            });
            if (res?.data?.coLinkSmeProductOrder?.success) {
                onHide();                
                addToast(formatMessage({defaultMessage:'Hủy liên kết đơn hàng với hàng hóa kho thành công'}), { appearance: 'success' });
            } else {
                setError('error')
            }
        }, [order_item_id]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            onHide={onHide}
            backdrop={loading ? 'static' : true}
            dialogClassName={loading ? 'width-fit-content' : ''}
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center">
                {
                    loading && <>
                        <div className="mb-4" >{formatMessage({defaultMessage:'Đang thực hiện'})}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </>
                }
                {
                    !loading && !error && (
                        <>
                            <div className="mb-4" >{formatMessage({defaultMessage:'Bạn có chắc muốn huỷ liên kết đơn hàng với hàng hoá kho này không ?'})}</div>
                            <div className="form-group mb-0" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 150 }}
                                    onClick={() => {
                                        onHide()
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Hủy bỏ'})}</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ width: 150 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        onUnLink();
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Hủy liên kết'})}</span>
                                </button>
                            </div>
                        </>
                    )
                }
                {
                    !loading && !!error && (
                        <>
                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                            <div className="mb-4" ></div>
                            <div className="mb-4" >{formatMessage({defaultMessage:'Huỷ liên kết sản phẩm bị lỗi'})}</div>
                                <p className='text-center mb-3'>{formatMessage({defaultMessage:'Bạn vui lòng thử lại'})}</p>
                            <div>
                                <button
                                    type="button"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 150 }}
                                    onClick={() => {
                                        setError(null)
                                        onHide()
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
                                </button>
                                <button
                                    id="kt_login_signin_submit"
                                    className={`btn btn-primary font-weight-bold px-9 `}
                                    style={{ width: 150 }}
                                    onClick={e => {
                                        setError(null)
                                        onUnLink();
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Thử lại'})}</span>
                                </button>
                            </div>
                        </>
                    )
                }
            </Modal.Body>
        </Modal>
    )
});

export default memo(DeleteProductOrder);