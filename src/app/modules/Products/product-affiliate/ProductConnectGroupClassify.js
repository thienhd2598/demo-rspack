import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import mutate_scLinkSmeProductToConnector from '../../../../graphql/mutate_scLinkSmeProductToConnector';
import { useIntl } from 'react-intl';

const ProductConnectGroupClassify = memo(({
    show,
    onHide,
    sc_product_id,
    sme_product_id,    
    dataAttribute,
    setSelectedValue
}) => {
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    const [linkProduct, { loading, data, error: errorLinkProduct }] = useMutation(mutate_scLinkSmeProductToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_products']
    });
    const [valueSc, setValueSc] = useState(null);
    const [valueSme, setValueSme] = useState(null);
    const { formatMessage } = useIntl()
    useMemo(
        () => {
            let { scAttr, smeAttr } = dataAttribute;
            if (scAttr.length == 0 || smeAttr.length == 0) return;

            setValueSc(scAttr[0].value);
            setValueSme(smeAttr[0].value)
        }, [dataAttribute]
    );    

    const onLinkProduct = useCallback(
        async () => {
            if (!show) return;
            let { scAttr, smeAttr } = dataAttribute;
            let variant_attributes = [
                {
                    sc_variant_attribute_id: Number(valueSc),
                    sme_variant_attribute_id: Number(valueSme)
                },
                {
                    sc_variant_attribute_id: scAttr?.find(ii => ii.value != valueSc)?.value || null,
                    sme_variant_attribute_id: smeAttr?.find(ii => ii.value != valueSme)?.value || null
                }
            ].filter(ii => !!ii.sc_variant_attribute_id && !!ii.sme_variant_attribute_id);            

            let res = await linkProduct({
                variables: {
                    sc_product_id: sc_product_id,
                    sme_product_id: sme_product_id,
                    variant_attributes: variant_attributes
                }
            });

            if (res?.data?.scLinkSmeProductToConnector?.success) {
                onHide()
                addToast(formatMessage({defaultMessage:'Liên kết sản phẩm kho thành công'}), { appearance: 'success' });
            } else {
                setError('error');
            }
        }, [show, sc_product_id, sme_product_id, valueSc, valueSme, dataAttribute]
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
            <Modal.Body className={`overlay overlay-block cursor-default ${loading ? 'text-center' : ''}`} >
                {
                    loading && <>
                        <div className="mb-4" >{formatMessage({defaultMessage:'Đang thực hiện'})}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </>
                }
                {
                    !loading && !error && (
                        <>
                            <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>
                                {formatMessage({defaultMessage:'Chọn nhóm phân loại để liên kết'})}
                            </div>
                            <div>
                                <p style={{ marginBottom: 10 }}>{formatMessage({defaultMessage:'Nhóm phân loại trên sàn'})}</p>
                                <div
                                    className="radio-list"
                                    style={{ display: 'flex', flexDirection: 'row' }}
                                    onChange={e => {
                                        setValueSc(e.target.value)
                                    }}
                                >
                                    {
                                        dataAttribute.scAttr
                                            ?.map(_option => {
                                                return <label key={`_option--${_option?.value}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                                    <input type="radio" name="radios1" value={_option?.value} checked={_option?.value == valueSc} />
                                                    <span></span>
                                                    {_option?.label}
                                                </label>
                                            })
                                    }
                                </div>
                            </div>
                            <div>
                                <p style={{ marginBottom: 10 }}>{formatMessage({defaultMessage:'Nhóm phân loại kho'})}</p>
                                <div
                                    style={{ display: 'flex', flexDirection: 'row' }}
                                    className="radio-list" onChange={e => {
                                        setValueSme(e.target.value)
                                    }}
                                >
                                    {
                                        dataAttribute.smeAttr
                                            ?.map(_option => {
                                                return <label key={`_option--${_option?.value}`} className="radio" style={{ marginBottom: '2rem', paddingRight: '4rem' }}>
                                                    <input type="radio" name="radios2" value={_option?.value} checked={_option?.value == valueSme} />
                                                    <span></span>
                                                    {_option?.label}
                                                </label>
                                            })
                                    }
                                </div>
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
                                        onLinkProduct();
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
                                style={{ width: 100 }}
                                // disabled={!current}
                                onClick={e => {
                                    e.preventDefault()
                                    onLinkProduct()
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

export default ProductConnectGroupClassify;
