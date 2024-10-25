import React, { useCallback, memo, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import query_scGetJobAutoLinkSmeProduct from "../../../../../graphql/query_scGetJobAutoLinkSmeProduct";
import _ from 'lodash';
import { formatNumberToCurrency } from '../../../../../utils';
import { useIntl } from 'react-intl';

const ProductAutoLinkInfo = memo(({
    show,
    onHide,
    showStep1,
    product_type
}) => {
    const { formatMessage } = useIntl();
    const { data, loading, refetch } = useQuery(query_scGetJobAutoLinkSmeProduct, {
        fetchPolicy: 'network-only',
        pollInterval: 3000,
        skip: !show,
        variables: {
            product_type
        }
    })

    const [dataLink, setDataLink] = useState(null)


    const onCloseModal = useCallback(
        () => {
            onHide();
        }, []
    );

    useEffect(() => {
        if (!!data?.scGetJobAutoLinkSmeProduct && show) {
            // onHide()
            // !!showStep1 && showStep1(true)
            setDataLink(data?.scGetJobAutoLinkSmeProduct)
        }
    }, [data, show])

    useEffect(() => {
        if (!show) {
            setDataLink(null)
        }
    }, [show])

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onCloseModal}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                {
                    !loading && !!dataLink && <div className='product-clone-wrapper'>
                        <div className="mb-1 text-center font-weight-bold" style={{ fontSize: 16, fontWeight: 'bold' }} >
                            {formatMessage({ defaultMessage: 'Liên kết tự động' })}
                        </div>
                        <div className='row mt-2'>
                            <div className="col-12">{formatMessage({ defaultMessage: 'Sản phẩm chưa liên kết cần xử lý' })}: <strong>{formatNumberToCurrency(dataLink?.total_product)}</strong></div>
                        </div>
                        <div style={{
                            width: '100%', height: 16, backgroundColor: '#E8ECEF',
                            position: 'relative', marginTop: 8, marginBottom: 8,
                            borderRadius: 6, overflow: 'hidden'
                        }} >
                            <div style={{
                                height: 16, position: 'absolute', top: 0, left: 0,
                                right: `${formatNumberToCurrency(100 - dataLink?.total_processed * 100 / (dataLink?.total_product || 1), 2, true)}%`, backgroundColor: '#FF562A',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }} >
                                <span style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }} >{formatNumberToCurrency(dataLink?.total_processed * 100 / (dataLink?.total_product || 1), 2, true)}%</span>
                            </div>
                        </div>
                        <div className='row mt-2'>
                            <div className="col-12">{formatMessage({ defaultMessage: 'Sản phẩm liên kết thành công' })}: <strong className='text-primary'>{formatNumberToCurrency(dataLink?.total_linked)}</strong></div>
                        </div>
                        <div className='row mt-2'>
                            <div className="col-12">{formatMessage({ defaultMessage: 'Sản phẩm không liên kết' })}: <strong>{formatNumberToCurrency(dataLink?.total_not_link)}</strong></div>
                        </div>
                        <div className='row mt-2  justify-content-center '>
                            <div className="col-12" style={{ fontStyle: 'italic', fontSize: 12 }} ><i className="fas fa-exclamation-circle ml-2" style={{ color: '#000' }} />{formatMessage({ defaultMessage: 'Sản phẩm sàn và kho cùng SKU sẽ được tự động liên kết' })}</div>
                        </div>
                        <div className='row d-flex align-items-center justify-content-center mt-6 mb-4' style={{ gap: 8 }}>
                            <button
                                className="btn btn-primary"
                                type="submit"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    onCloseModal();
                                }}
                            >
                                Ok
                            </button>
                        </div>
                    </div>
                }
                {
                    (!!loading || !dataLink) && <div className='product-clone-wrapper  text-center '>
                        <div className="mb-1 text-center font-weight-bold" style={{ fontSize: 16, fontWeight: 'bold' }} >
                            {formatMessage({ defaultMessage: 'Liên kết tự động' })}
                        </div>
                        <span className="spinner" >&ensp;&ensp;&ensp;</span>
                    </div>}
            </Modal.Body>
        </Modal>
    )
});

export default ProductAutoLinkInfo;