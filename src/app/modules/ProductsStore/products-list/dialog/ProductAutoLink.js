import React, { useMemo, useCallback, useState, memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client';
import { useHistory, useLocation } from 'react-router-dom';
import Select from "react-select";
import queryString from 'querystring';
import { useToasts } from 'react-toast-notifications';
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import query_scSumProductToAutoLink from "../../../../../graphql/query_scSumProductToAutoLink";
import makeAnimated from 'react-select/animated';
import { useProductsUIContext } from '../../ProductsUIContext';
import _ from 'lodash';
import mutate_scAutoLinkSmeProduct from '../../../../../graphql/mutate_scAutoLinkSmeProduct';
import { formatNumberToCurrency } from '../../../../../utils';
import { useIntl } from 'react-intl';
const animatedComponents = makeAnimated();

const ProductAutoLink = memo(({
    show,
    onHide,
    onShowInfo,
    product_type
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))
    // const channel = params?.channel || 'shopee';
    const { addToast } = useToasts();


    const [currentChannel, setCurrentChannel] = useState('');
    const [tags, settags] = useState('');
    const [errrorMessage, seterrrorMessage] = useState('');
    const [currentStore, setCurrentStore] = useState(null);

    const [mutate, { loading }] = useMutation(mutate_scAutoLinkSmeProduct, {

    })

    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels, {
        skip: !show
    });
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network',
        skip: !show
    });
    const { data: dataSum, loading: loadingSum } = useQuery(query_scSumProductToAutoLink, {
        fetchPolicy: 'network-only',
        variables: {
            ...(!!currentChannel ? { connector_channel_code: currentChannel } : {}),
            ...(!!currentStore ? { store_id: currentStore.value } : {}),
            ...(!!tags && tags.length > 0 ? { tags: tags.map(__ => __.value) } : {}),
            product_type
        },
        skip: !show
    })

    const { optionsProductTag } = useProductsUIContext();

    const [optionsStore, optionsChannel] = useMemo(
        () => {
            let _optionsChannel = dataChannel?.op_connector_channels?.map(
                _channel => ({
                    label: _channel?.name,
                    logo: _channel?.logo_asset_url,
                    value: _channel?.code
                }));

            let _options = dataStore?.sc_stores?.filter(_store => !currentChannel || _store?.connector_channel_code === currentChannel)
                .map(_store => {
                    let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                    return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
                });

            return [_options, _optionsChannel];
        }, [dataChannel, dataStore, currentChannel]
    );

    const onCloseModal = useCallback(
        () => {
            if (loading) {
                return
            }
            seterrrorMessage('')
            onHide();
            setCurrentChannel('')
            settags('')
            setCurrentStore(null)
        }, [loading]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onCloseModal}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='product-clone-wrapper'>
                    <div className="mb-1 text-center font-weight-bold" style={{ fontSize: 16, fontWeight: 'bold' }} >
                        {formatMessage({ defaultMessage: `Liên kết tự động - {title}` }, { title: product_type == 1 ? "Sản phẩm" : "Hàng hoá" })}
                    </div>
                    <div className='row mt-8' style={{ zIndex: 10 }} >
                        <div className='col-3 d-flex align-items-center'>
                            <p className="">{formatMessage({ defaultMessage: 'Sàn' })}</p>

                        </div>
                        <div className='col-9'>
                            <Select
                                options={optionsChannel}
                                className='w-100 '
                                placeholder='Tất cả'
                                components={animatedComponents}
                                isClearable
                                styles={{
                                    control: (styles) => ({
                                        ...styles,
                                        backgroundColor: '#F7F7FA',
                                    })
                                }}
                                value={optionsChannel?.find(_channel => _channel.value === currentChannel)}
                                isLoading={loadingChannel}
                                onChange={value => {

                                    setCurrentChannel(value?.value);
                                    setCurrentStore(null);
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>
                                        {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                        {option.label}
                                    </div>
                                }}
                            />
                        </div>
                    </div>
                    <div className='row mt-2' style={{ zIndex: 6 }} >
                        <div className='col-3 d-flex align-items-center'>
                            <p className="">{formatMessage({ defaultMessage: 'Gian hàng' })}</p>

                        </div>
                        <div className='col-9'>
                            <Select
                                options={optionsStore}
                                className='w-100'
                                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                components={animatedComponents}
                                isClearable
                                styles={{
                                    control: (styles) => ({
                                        ...styles,
                                        backgroundColor: '#F7F7FA',
                                    })
                                }}
                                isLoading={loadingChannel}
                                value={currentStore}
                                onChange={async (value) => {
                                    setCurrentStore(value || null);
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div>
                                        {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                        {option.label}
                                    </div>
                                }}
                            />
                        </div>
                    </div>
                    {
                        product_type == 1 && <div className='row mt-2' style={{ zIndex: 3 }} >
                            <div className='col-3 d-flex align-items-center'>
                                <p className="">{formatMessage({ defaultMessage: 'Tag' })}</p>

                            </div>
                            <div className='col-9'>
                                <Select
                                    placeholder={formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
                                    isMulti
                                    isClearable
                                    value={tags}
                                    onChange={values => {
                                        settags(values)
                                    }}
                                    options={optionsProductTag}
                                />
                            </div>
                        </div>
                    }
                    <div className='row mt-2 mb-4'>
                        <div className="col-12">{formatMessage({ defaultMessage: 'Tổng {title} chưa liên kết cần xử lý: ' }, { title: product_type == 1 ? formatMessage({ defaultMessage: "sản phẩm" }) : formatMessage({ defaultMessage: "sản phẩm hàng hoá" }) })} <strong>{loadingSum || !dataSum ? <span className="spinner spinner-primary"></span> : formatNumberToCurrency(dataSum?.scSumProductToAutoLink?.total_product)}</strong></div>
                    </div>
                    {
                        !!errrorMessage && <div className='row mt-2 mb-4'>
                            <div className="col-12" style={{ color: 'red' }} >{errrorMessage}</div>
                        </div>
                    }
                    <div className='row d-flex align-items-center justify-content-center mt-6 mb-4' style={{ gap: 8 }}>
                        <button
                            className="btn btn-outline-primary btn-elevate"
                            type="submit"
                            style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 120 }}
                            onClick={async (e) => {
                                e.preventDefault();
                                onCloseModal();
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Huỷ' })}
                        </button>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading || loadingSum || !dataSum || !dataSum?.scSumProductToAutoLink?.total_product}
                            onClick={async (e) => {
                                e.preventDefault();
                                seterrrorMessage('')
                                let { data } = await mutate({
                                    variables: {
                                        ...(!!currentChannel ? { connector_channel_code: currentChannel } : {}),
                                        ...(!!currentStore ? { store_id: currentStore.value } : {}),
                                        ...(!!tags && tags.length > 0 ? { tags: tags.map(__ => __.value) } : {}),
                                        product_type
                                    }
                                })

                                if (data?.scAutoLinkSmeProduct?.success) {
                                    onCloseModal();
                                    !!onShowInfo && onShowInfo(true)
                                } else {
                                    // addToast(data?.scAutoLinkSmeProduct?.message || "Liên kết tự động không thành công.", { appearance: 'error' })
                                    seterrrorMessage(data?.scAutoLinkSmeProduct?.message || "Liên kết tự động không thành công.")
                                }

                            }}
                            style={{ width: 120 }}
                        >
                            {formatMessage({ defaultMessage: 'Liên kết' })} {loading && <span className="spinner" >&ensp;&ensp;&ensp;</span>}
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
});

export default ProductAutoLink;