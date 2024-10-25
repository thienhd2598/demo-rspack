import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import DeleteProductConnectDialog from './DeleteProductConnectDialog';
import query_getScProductVariantLinked from '../../../../../graphql/query_getScProductVariantLinked';
import InfoProduct from '../../../../../components/InfoProduct';
import { useIntl } from 'react-intl';

const ModalProductConnectVariant = ({
    onHide,
    variantId,
    refetch
}) => {

    let { data: dataVariantLinked, loading } = useQuery(query_getScProductVariantLinked, {
        fetchPolicy: 'network-only',
        variables: {
            list_sme_variant_id: [variantId]
        },
        skip: !variantId
    });
    
    const {formatMessage} = useIntl()
    const [productVariant, setproductVariant] = useState([]);
    const [isRemoveConnect, setRemoveConnect] = useState(false);
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        if (!variantId) {
            setproductVariant([]);
        }
    }, [variantId])

    useEffect(() => {
        if (!!dataVariantLinked?.scGetProductVariantLinked?.data && dataVariantLinked?.scGetProductVariantLinked?.data.length > 0) {
            setproductVariant(dataVariantLinked?.scGetProductVariantLinked?.data[0].sc_variants);
        } else {
            setproductVariant([]);
        }
    }, [dataVariantLinked]);

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

    const remoteIdInProductIds = (id) => {
        setproductVariant(productVariant.filter(function (item) {
            return item.id !== id
        }))
    };



    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url, connector_channel_code: _store?.connector_channel_code }
            }) || [];

            return [_options];
        }, [dataStore]
    );

    const combinationVariant = (variant) => {
            let combinationVariant = [];

            let _sc_product_attributes_value = variant?.sc_product_attributes_value ? JSON.parse(variant?.sc_product_attributes_value) : []
            let _sc_product_variant_attr = variant?.product?.productVariantAttributes
           
            let _variantAttributeValue = variant?.product?.variantAttributeValues?.filter(_value => {
                return _sc_product_attributes_value.includes(_value.ref_index)
            })
            _variantAttributeValue.forEach(variant_attr_value => {
                _sc_product_variant_attr.forEach(variant_attr => {
                    if (variant_attr_value.sc_variant_attribute_id == variant_attr.id) {
                        combinationVariant.push(variant_attr_value.value)
                    }
                });
            });
            return combinationVariant.join(' - ')
    }

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
                refetch={refetch}
            />

            <Modal
                show={!!variantId}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                onHide={onHide}
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({defaultMessage: 'Hàng hóa'})}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 15 }}>
                    <i
                        className="fas fa-times"
                        onClick={onHide}
                        style={{ position: 'absolute', top: -45, right: 20, fontSize: 20, cursor: 'pointer' }}
                    />
                    <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {!loading && productVariant?.map(
                            (_variant, index) => {
                                let _store = optionsStore?.find(store => store?.value == _variant?.storeChannel?.id) || {};
                                let _asset = null
                                let _sc_product_attributes_value = null
                                try {
                                    let _variantFinded = _variant?.product?.productVariants?.find(__ => __.id == _variant.id);
                                    _sc_product_attributes_value = JSON.parse(_variantFinded?.sc_product_attributes_value)
                                    let _variantAttributeValue = _variant?.product.variantAttributeValues?.find(_value => {
                                        return _value.scVariantValueAssets?.length > 0 && _sc_product_attributes_value.some(_v => _v == _value.ref_index)
                                    })
                                    if (!!_variantAttributeValue) {
                                        _asset = _variantAttributeValue.scVariantValueAssets[0]
                                    }
                                } catch (error) {

                                }

                                return (
                                    <div className="border mb-5 pt-3" key={`-row-variant-${_variant.id}`} >
                                        <div
                                            style={{ padding: '0rem 1rem' }}
                                            key={`choose-connect-${index}`}
                                        >
                                            <div className='row' style={{ padding: '6px 1rem', alignItems: 'center' }}>
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
                                                                src={_asset?.sme_url}
                                                                style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                                className={'cursor-pointer'}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    window.open(`/product-stores/edit/${_variant.product?.id}`, '_blank');
                                                                }}
                                                            />
                                                        </div>
                                                        <div className='w-100'>
                                                            <InfoProduct
                                                                name={_variant?.product?.name}
                                                                sku={_variant?.sku}
                                                                url={`/product-stores/edit/${_variant.product?.id}`}
                                                            />
            
                                                            {_sc_product_attributes_value.length > 0 && (
                                
                                                                 <p style={{ fontSize: 12 }} className="text-secondary-custom">{combinationVariant(_variant)}</p>
                                                            )}                                                
                                                            <div className="mt-1 d-flex align-items-center justify-content-between" >
                                                                <p>

                                                                    <img
                                                                        style={{ width: 10, height: 10 }}
                                                                        src={_store?.logo}
                                                                        className="mr-2"
                                                                    />
                                                                    <span >{_store?.label}</span>
                                                                </p>



                                                                <p
                                                                    style={{ cursor: 'pointer', color: '#f94e30' }}
                                                                    onClick={e => {
                                                                        e.preventDefault();
                                                                        onShowRemoveConnect();
                                                                        setSelectedValue(prevState => ({
                                                                            ...prevState,
                                                                            sc_variant_id: _variant?.id,
                                                                            action: 'unlink_product_variant'
                                                                        }))
                                                                    }}
                                                                >
                                                                    {formatMessage({defaultMessage:'Hủy liên kết'})}
                                                                </p>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='d-flex align-items-center p-2 border-top mb-3'>
                                            <b className='mr-4'>{formatMessage({defaultMessage:'Tồn kho'})}: {formatNumberToCurrency(_variant?.stock_on_hand || 0)}</b>
                                            <span>{formatMessage({defaultMessage:'Giá niêm yết'})}: {formatNumberToCurrency(_variant?.price || 0)}đ</span>
                                        </div>
                                    </div>
                                )
                            }
                        )}
                        {!loading && productVariant?.length == 0 &&
                            <p className='text-center'>{formatMessage({defaultMessage:'Chưa có hàng hóa'})}</p>
                        }
                        {
                            loading && <div className='text-center w-100' style={{ position: 'absolute' }} >
                                <span className="spinner spinner-primary"></span>
                            </div>
                        }
                    </div>
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

export default memo(ModalProductConnectVariant);

