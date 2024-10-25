import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import mutate_scLinkSmeProductVariantToConnector from '../../../../graphql/mutate_scLinkSmeProductVariantToConnector';
import { formatNumberToCurrency } from '../../../../utils';
import { useFormikContext } from 'formik';

const ProductConnectClassify = memo(({
    show,
    onHide,
    sc_variant_id,
    smeProductData,
    scProductsData,
    code
}) => {
    const { values, setFieldValue } = useFormikContext();
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    const [linkProductVariant, { loading, data: dataLinkProductVariant, error: errorLinkProductVariant }] = useMutation(mutate_scLinkSmeProductVariantToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_product', 'sme_catalog_product_by_pk']
    });
    const [smeVariantId, setSmeVariantId] = useState(null);

    const optionSelectedClassify = useMemo(
        () => {
            if (smeProductData?.sme_catalog_product_variants?.length == 0 && scProductsData?.length == 0) return;

            if (
                smeProductData?.sme_catalog_product_variants?.length == 1
                && smeProductData?.sme_catalog_product_variants?.some(ii => ii.sku == smeProductData.sku)
            ) return [];
            let variantConnected = Object.keys(values)
                .filter(ii => ii.endsWith('sme_product_variant_id') && !!values[ii])
                .map(ii => values[ii]);

            let smeFindedData = smeProductData?.sme_catalog_product_variants?.filter(
                _sme => !variantConnected.some(x => x == _sme.id)
            ) || [];

            if (!!smeFindedData && smeFindedData.length > 0) {
                setSmeVariantId(smeFindedData[0]?.id || '');
            }

            return smeFindedData;
        }, [sc_variant_id, smeProductData, scProductsData, values]
    );

    const onLinkProductVariant = useCallback(
        async () => {
            if (!show) return;
            let res = await linkProductVariant({
                variables: {
                    sc_variant_id: sc_variant_id,
                    sme_variant_id: smeVariantId
                }
            });

            if (res?.data?.scLinkSmeProductVariantToConnector?.success) {
                onHide()
                addToast('Liên kết thuộc tính sản phẩm kho thành công', { appearance: 'success' });
                console.log('code', code)
                setFieldValue(`variant-${code}-sme_product_variant_id`, smeVariantId, false)
            } else {
                setError('error')
            }
        }, [show, sc_variant_id, smeVariantId, code]
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
                        <div className="mb-4" >Đang thực hiện</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                }
                {
                    !loading && !error && (
                        <>
                            <div className="text-center bold" style={{ fontSize: 16, fontWeight: 500, marginBottom: '2rem' }}>Chọn phân loại sản phẩm kho bạn muốn liên kết</div>
                            <div
                                className="radio-list"
                                onChange={e => {
                                    console.log(`=====e`, e.target.value)
                                    setSmeVariantId(e.target.value)
                                }} >
                                {
                                    optionSelectedClassify
                                        ?.map(_option => {
                                            return <label key={`_option--${_option.id}`} className="radio" style={{ marginBottom: '2rem' }}>
                                                <input
                                                    type="radio"
                                                    value={_option.id}
                                                    checked={smeVariantId == _option.id}
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
                            <div className="mb-4" >Liên kết sản phẩm bị lỗi (Mã lỗi 134)</div>
                            <p className='text-center'>Bạn vui lòng thử lại</p>
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
                                    <span className="font-weight-boldest">Huỷ</span>
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
                                    <span className="font-weight-boldest">Thử lại</span>
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
                                Huỷ
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
                                XÁC NHẬN
                            </button>
                        </div>
                    </Modal.Footer>
                )
            }
        </Modal>
    )
});

export default ProductConnectClassify;
