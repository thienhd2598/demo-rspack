import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery } from "@apollo/client";
import { createApolloClientSSR } from '../../../../../apollo';
import query_sc_product_connected from "../../../../../graphql/query_sc_product_connected";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import { useIntl } from 'react-intl';

const ModalProductConnectDistribute = ({
    scProductIds,
    onHide
}) => {
    let client = createApolloClientSSR()
    const [loading, setLoading] = useState(false);
    const [productsConnected, setProductsConnected] = useState([]);
    const {formatMessage} = useIntl()
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || [];

            return [_options];
        }, [dataStore]
    );

    useMemo(
        async () => {
            setLoading(true);
            const scProductConnected = await Promise.all(scProductIds?.map(_scProductId => {
                return new Promise((resolve) => {
                    client.query({
                        query: query_sc_product_connected,
                        fetchPolicy: 'network-only',
                        variables: {
                            id: _scProductId
                        }
                    })
                        .then(values => resolve(values?.data?.sc_product))
                        .catch(_err => resolve([]))
                })
            }));

            setLoading(false);
            setProductsConnected(scProductConnected);
        }, [scProductIds]
    );

    return (
        <Modal
            show={scProductIds?.length > 0}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={onHide}
            backdrop={true}            
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({defaultMessage: 'Sản phẩm liên kết - Sản phẩm chính'})}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                <i
                    className="fas fa-times"
                    onClick={onHide}
                    style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                />
                {loading && (
                    <div className='text-center'>
                        <div className="my-8" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                )}
                {!loading && (
                    <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {productsConnected?.map(
                            (_product, index) => {
                                console.log({ _product })

                                let _store = optionsStore?.find(store => store.value == _product?.store_id) || {};
                                let imgOrigin = (_product?.productAssets || [])?.filter(_asset => _asset.type == 4)?.map(
                                    _asset => {
                                        return {
                                            id: _asset.sme_asset_id,
                                            source: _asset.origin_image_url || _asset.sme_url,
                                            scId: _asset.id,
                                            source_draft: _asset.origin_image_url || _asset.sme_url,
                                            merged_image_url: _asset.sme_url,
                                            template_image_url: _asset.template_image_url,
                                        }
                                    }
                                )[0];

                                const imgAvatar = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (_product?.productAssets || [])?.filter(_asset => _asset.type == 1)[0]

                                return (
                                    <div
                                        style={{ padding: '0rem 1rem' }}
                                        key={`choose-connect-${index}`}
                                    >
                                        <div className='row' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem', alignItems: 'center' }}>
                                            <div className='col-12'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img
                                                            src={imgAvatar?.merged_image_url || imgAvatar?.sme_url}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                window.open(`/product-store/edit/${_product.id}`, '_blank');
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p
                                                            className='font-weight-normal mb-1'
                                                            style={{ fontSize: 14 }}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                window.open(`/product-store/edit/${_product.id}`, '_blank');
                                                            }}
                                                        >
                                                            {_product?.name || ''}
                                                        </p>
                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                            <p style={{ fontSize: 10 }}><img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                <span className='ml-2'>{_product?.sku || ''}</span>
                                                            </p>
                                                        </div>
                                                        <p className="mt-1 d-flex align-items-center" >
                                                            <img
                                                                style={{ width: 10, height: 10 }}
                                                                src={_store?.logo}
                                                                className="mr-2"
                                                            />
                                                            <span >{_store?.label}</span>
                                                        </p>
                                                        <p className='mt-1'>{formatMessage({defaultMessage:'Giá bán'})}: {formatNumberToCurrency(_product?.price || 0)}đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        )}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                {/* <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        OK
                    </button>
                </div> */}
            </Modal.Footer>
        </Modal>
    )
};

export default memo(ModalProductConnectDistribute);

