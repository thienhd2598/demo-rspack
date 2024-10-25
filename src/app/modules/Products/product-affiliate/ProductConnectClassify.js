import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import mutate_scLinkSmeProductVariantToConnector from '../../../../graphql/mutate_scLinkSmeProductVariantToConnector';
import { formatNumberToCurrency } from '../../../../utils';
import { useIntl } from 'react-intl';
const ProductConnectClassify = memo(({
    show,
    onHide,
    sc_variant_id,
    sme_variant_id,
    sc_id,
    sme_id,
    smeProductData,
    scProductsData,
}) => {
    const [error, setError] = useState('');
    const {formatMessage} = useIntl()
    const { addToast } = useToasts();
    const [linkProductVariant, { loading, data: dataLinkProductVariant, error: errorLinkProductVariant }] = useMutation(mutate_scLinkSmeProductVariantToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_products']
    });
    const [scVariantId, setScVariantId] = useState(null);

    const optionSelectedClassify = useMemo(
        () => {
            if (scProductsData.length == 0 && !sc_id && !smeProductData && !sme_id) return;

            let dataOption = scProductsData
                .find(ii => ii.sc_id == sc_id)?.sc_product_variants
                ?.map(ii => {
                    if (ii.sme_product_variant_id) return null;
                    return ii
                })
                .filter(ii => !!ii) || []

            setScVariantId(dataOption[0]?.id || '')
            return dataOption;
        }, [sc_id, sme_id, smeProductData, scProductsData]
    );

    const onLinkProductVariant = useCallback(
        async () => {
            if (!show) return;
            let res = await linkProductVariant({
                variables: {
                    sc_variant_id: Number(scVariantId),
                    sme_variant_id: sme_variant_id
                }
            });

            if (res?.data?.scLinkSmeProductVariantToConnector?.success) {
                onHide()
                addToast(formatMessage({defaultMessage:'Liên kết thuộc tính sản phẩm kho thành công'}), { appearance: 'success' });
            } else {
                setError('error')
            }
        }, [show, sme_variant_id, scVariantId]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={loading ? 'static' : true}
            dialogClassName={loading ? 'width-fit-content' : ''}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                {
                    loading && <div className='text-center'>
                        <div className="mb-4" >{formatMessage({defaultMessage:'Đang thực hiện'})}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                }
                {
                    !loading && !error && (
                        <>
                            <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>{formatMessage({defaultMessage:'Chọn phân loại sản phẩm sàn bạn muốn liên kết'})}</div>
                            <div
                                className="radio-list"
                                onChange={e => {
                                    setScVariantId(e.target.value)
                                }} >
                                {
                                    optionSelectedClassify.length > 0 && optionSelectedClassify
                                        .map(_option => {
                                            return <label key={`_option--${_option.id}`} className="radio" style={{ marginBottom: '2rem' }}>
                                                <input
                                                    type="radio"
                                                    value={_option.id}
                                                    checked={scVariantId == _option.id}
                                                />
                                                <span></span>
                                                {`${_option.name} - ${_option.sku} - Tồn kho: ${formatNumberToCurrency(_option.stock_on_hand || 0)}`}
                                            </label>
                                        })
                                }
                            </div>
                        </>
                    )
                }
                {
                    !loading && !!error && (
                        <div className='text-center'>
                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                            <div className="mb-4" ></div>
                            <div className="mb-4" >{formatMessage({defaultMessage:'Liên kết sản phẩm bị lỗi (Mã lỗi 134)'})}</div>
                            <p className='text-center'>{formatMessage({defaultMessage:'Bạn vui lòng thử lại'})}</p>
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
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
                                </button>
                                <button
                                    id="kt_login_signin_submit"
                                    className={`btn btn-primary font-weight-bold px-9 `}
                                    style={{ width: 150 }}
                                    onClick={e => {
                                        setError(null)
                                        onLinkProductVariant();
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Thử lại'})}</span>
                                </button>
                            </div>
                        </div>
                    )
                }
            </Modal.Body>
            {
                !loading && !error && (
                    <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={onHide}
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                {formatMessage({defaultMessage:'Huỷ'})}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary btn-elevate"
                                style={{ width: 100, cursor: optionSelectedClassify.length == 0 ? 'not-allowed' : 'pointer' }}
                                disabled={optionSelectedClassify.length == 0}
                                onClick={e => {
                                    e.preventDefault()
                                    onLinkProductVariant()
                                }}
                            >
                                {formatMessage({defaultMessage:'XÁC NHẬN'})}
                            </button>
                        </div>
                    </Modal.Footer>
                )
            }
        </Modal>
    )
});

export default ProductConnectClassify;
