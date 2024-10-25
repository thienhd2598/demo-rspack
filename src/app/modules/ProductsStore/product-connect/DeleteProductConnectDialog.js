import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import mutate_scUnLinkSmeProductToConnector from '../../../../graphql/mutate_scUnLinkSmeProductToConnector';
import mutate_scUnLinkSmeProductVariantToConnector from '../../../../graphql/mutate_scUnLinkSmeProductVariantToConnector';
import { useIntl } from 'react-intl';

const DeleteProductConnectDialog = memo(({
    show,
    onHide,
    action,
    sme_product_id,
    sc_product_id,
    sc_variant_id
}) => {
    const { formatMessage } = useIntl();
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    const [unlinkProduct, { loading: loadingUnlinkProduct, data: dataUnlinkProduct, error: errorUnlinkProduct }] = useMutation(mutate_scUnLinkSmeProductToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_products']
    });
    const [unlinkProductVariant, { loading: loadingUnlinkProductVariant, data: dataUnlinkProductVariant, error: errorUnlinkProductVariant }] = useMutation(mutate_scUnLinkSmeProductVariantToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_products']
    });

    const onUnLink = useCallback(
        async () => {
            if (!show) return;
            switch (action) {
                case 'unlink_product':
                    let res = await unlinkProduct({
                        variables: {
                            sc_product_id: sc_product_id,
                            sme_product_id: sme_product_id
                        }
                    });
                    if (res?.data?.scUnLinkSmeProductToConnector?.success) {
                        onHide();
                        addToast(formatMessage({ defaultMessage: 'Hủy liên kết sản phẩm kho thành công' }), { appearance: 'success' });
                    } else {
                        setError('error')
                    }
                    break;
                case 'unlink_product_variant':
                    let resVariant = await unlinkProductVariant({
                        variables: {
                            sc_variant_id: Number(sc_variant_id)
                        }
                    });
                    if (resVariant?.data?.scUnLinkSmeProductVariantToConnector?.success) {
                        onHide();
                        addToast(formatMessage({ defaultMessage: 'Hủy liên kết hàng hóa thành công' }), { appearance: 'success' });
                    } else {
                        setError('error')
                    }
                    break;
                default:
                    break;
            }
        }, [action, sme_product_id, sc_product_id, sc_variant_id, show]
    )

    const loading = loadingUnlinkProduct || loadingUnlinkProductVariant;

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
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </>
                }
                {
                    !loading && !error && (
                        <>
                            <div className="mb-4">{formatMessage({ defaultMessage: 'Bạn có chắc muốn bỏ liên kết sản phẩm này không?' })}</div>
                            <div className="form-group mb-0" style={{ marginTop: 20 }}>
                                <button
                                    type="button"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 150 }}
                                    onClick={() => {
                                        onHide()
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'KHÔNG' })}</span>
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
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'BỎ LIÊN KẾT' })}</span>
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
                            <div className="mb-4">{formatMessage({ defaultMessage: 'Huỷ liên kết sản phẩm bị lỗi' })}</div>
                            <p className='text-center'>{formatMessage({ defaultMessage: 'Bạn vui lòng thử lại' })}</p>
                            <div  >
                                <button
                                    type="button"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 150 }}
                                    onClick={() => {
                                        setError(null)
                                        onHide()
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Huỷ' })}</span>
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
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Thử lại' })}</span>
                                </button>
                            </div>
                        </>
                    )
                }
            </Modal.Body>
        </Modal>
    )
});

export default DeleteProductConnectDialog;