import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery } from "@apollo/client";
import { createApolloClientSSR } from '../../../../../apollo';
import query_sc_product_connected from "../../../../../graphql/query_sc_product_connected";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import DeleteProductConnectDialog from './DeleteProductConnectDialog';
import InfoProduct from '../../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
const ModalProductConnect = ({
    scProductIds,
    // hasAttribute,
    onHide,
    smeProductIdSelect
}) => {
    let client = createApolloClientSSR()
    const [loading, setLoading] = useState(false);
    const [productsConnected, setProductsConnected] = useState([]);
    const [isRemoveConnect, setRemoveConnect] = useState(false);
    const [listProductIds, setListProductIds] = useState([]);
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });
    const {formatMessage} = useIntl()

    useEffect(() => {
        setListProductIds(scProductIds);
    }, [scProductIds]);
    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || [];

            return [_options];
        }, [dataStore]
    );

    const remoteIdInProductIds = (id) => {
        setListProductIds(listProductIds.filter(function (item) {
            return item !== id
        }))
    }

    useMemo(
        async () => {
            setLoading(true);
            const scProductConnected = await Promise.all(listProductIds?.map(_scProductId => {
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

            // console.log({ scProductConnected })
            setLoading(false);
            setProductsConnected(scProductConnected);
        }, [listProductIds]
    );

    const onShowRemoveConnect = useCallback(
        () => {
            setRemoveConnect(true);
        }, [isRemoveConnect, setRemoveConnect]
    );

    const [selectedValue, setSelectedValue] = useState({
        variant_attributes: [],
        sme_product_id: '',
        sc_product_id: null,
        sc_variant_id: null,
        sme_variant_id: '',
        action: '',
    });

    return (
        <>
            <DeleteProductConnectDialog
                show={isRemoveConnect}
                onHide={() => setRemoveConnect(false)}
                sme_product_id={selectedValue.sme_product_id}
                sc_product_id={selectedValue.sc_product_id}
                sc_variant_id={selectedValue.sc_variant_id}
                action={selectedValue.action}
                remoteIdInProductIds={(id) => remoteIdInProductIds(id)}
            />
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
                        {formatMessage({defaultMessage:'Sản phẩm'})}
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
                        <div style={{ maxHeight: 350, overflowY: 'auto', padding: '15px' }}>
                            {productsConnected?.map(
                                (_product, index) => {
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
                                    let hasAttribute = (_product?.productVariants?.length == 1 && _product.variantAttributeValues?.length > 0) || _product?.productVariants?.length > 1;

                                    if (!_product) return null;

                                    return (
                                        <div
                                            style={{ padding: '0rem 1rem' }}
                                            key={`choose-connect-${index}`}
                                        >
                                            <div className='row border' style={{ padding: '15px 1rem', alignItems: 'center' }}>
                                                <div className='col-12 p-0'>
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
                                                                className={'cursor-pointer'}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    window.open(`/product-stores/edit/${_product.id}`, '_blank');
                                                                }}
                                                            />
                                                        </div>
                                                        <div className='w-100'>
                                                            <InfoProduct
                                                                name={_product?.name}
                                                                sku={_product?.sku}
                                                                short={true}
                                                                url={`/product-stores/edit/${_product.id}`}
                                                            />

                                                            <div className="mt-1 d-flex align-items-center justify-content-between" >
                                                                <div>
                                                                    <img
                                                                        style={{ width: 10, height: 10 }}
                                                                        src={_store?.logo}
                                                                        className="mr-2"
                                                                    />
                                                                    <span >{_store?.label}</span>
                                                                </div>

                                                                <div
                                                                    style={{ cursor: 'pointer', color: '#f94e30' }}
                                                                    onClick={e => {
                                                                        e.preventDefault();
                                                                        onShowRemoveConnect();
                                                                        setSelectedValue(prevState => ({
                                                                            ...prevState,
                                                                            sme_product_id: smeProductIdSelect,
                                                                            sc_product_id: _product.id,
                                                                            action: 'unlink_product'
                                                                        }))
                                                                    }}
                                                                >
                                                                    {formatMessage({defaultMessage:'Hủy liên kết'})}
                                                                </div>

                                                            </div>
                                                            {/* <div className='d-flex align-items-center mt-1'>
                                                            <span className='mr-4'>Tồn kho: {formatNumberToCurrency(_product?.sum_stock_on_hand || 0)}</span>
                                                            {!hasAttribute && <span>Giá bán: {formatNumberToCurrency(_product?.price || 0)}đ</span>}
                                                        </div> */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            )}
                            {productsConnected.length == 0 &&
                                <p className='text-center'>{formatMessage({defaultMessage:'Chưa có sản phẩm'})}</p>
                            }
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
        </>
    )
};

export default memo(ModalProductConnect);
