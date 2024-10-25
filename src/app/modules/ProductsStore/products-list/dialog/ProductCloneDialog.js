import React, { useMemo, useCallback, useState, memo } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useHistory, useLocation } from 'react-router-dom';
import Select from "react-select";
import queryString from 'querystring';
import { useToasts } from 'react-toast-notifications';
import op_connector_channels from "../../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import mutate_scCloneStoreProduct from '../../../../../graphql/mutate_scCloneStoreProduct';
import query_scStatisticScProducts from '../../../../../graphql/query_scStatisticScProducts';
import mutate_scGetTotalProductClone from '../../../../../graphql/mutate_scGetTotalProductClone';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import makeAnimated from 'react-select/animated';
import { Field, useFormikContext, Form, Formik } from "formik";
import { useIntl } from 'react-intl';
const animatedComponents = makeAnimated();


const ProductCloneDialog = memo(({
    show,
    onHide
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))
    // const channel = params?.channel || 'shopee';
    const { addToast } = useToasts();
    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels);
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const PRODUCT_CLONE_TYPE = [
        { value: 1, name: formatMessage({ defaultMessage: 'Tất cả sản phẩm' }) },
        { value: 2, name: formatMessage({ defaultMessage: 'Chỉ sản phẩm còn hàng' }) },
    ];

    const ALLOW_DUPLICATE = [
        { value: 1, name: formatMessage({ defaultMessage: 'Sao chép' }) },
        { value: 2, name: formatMessage({ defaultMessage: 'Bỏ qua' }) },
    ];
    const [currentType, setCurrentType] = useState(1);
    const [currentAllow, setCurrentAllow] = useState(1);
    const [currentChannel, setCurrentChannel] = useState('');
    const [valueChannel, setValueChannel] = useState(null);
    const [currentStore, setCurrentStore] = useState(null);
    const [currentStoreDestination, setCurrentStoreDestination] = useState(null);
    const [errorMess, setErrorMess] = useState('');
    const [errors, setErrors] = useState({});
    const [totalProductClone, setProductClone] = useState(0);
    const { data: dataStatis, loading: loadingStatics } = useQuery(query_scStatisticScProducts, {
        fetchPolicy: 'cache-and-network',
        variables: {
            store_id: currentStore?.value || null
        }
    })
    const [cloneStoreProduct, { loading: loadingCloneStoreProduct }] = useMutation(mutate_scCloneStoreProduct, {
        refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
        awaitRefetchQueries: true,
    });

    const [getTotalProductClone, { data: dataTotalProductClone, loading: loadingTotalProductClone }] = useMutation(mutate_scGetTotalProductClone);

    console.log({ dataTotalProductClone });

    useMemo(
        () => {
            setCurrentChannel(params?.channel || 'shopee');
        }, [show]
    )

    const [optionsStore, optionsChannel] = useMemo(
        () => {
            let _optionsChannel = dataChannel?.op_connector_channels?.map(
                _channel => ({
                    label: _channel?.name,
                    logo: _channel?.logo_asset_url,
                    value: _channel?.code
                }));

            let _options = !!currentChannel ?
                dataStore?.sc_stores?.filter(_store => _store?.connector_channel_code === currentChannel)
                    .map(_store => {
                        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
                    })
                : [];

            return [_options, _optionsChannel];
        }, [dataChannel, dataStore, currentChannel]
    );

    const optionsStoreDestination = useMemo(
        () => {
            let _options = optionsStore?.filter(_option => _option?.value != currentStore?.value) || []

            return currentStore ? _options : []
        }, [optionsStore, currentStore]
    );

    const onCloseModal = useCallback(
        () => {
            onHide();
            setErrors({});
            setErrorMess('');
            setCurrentType(1);
            setCurrentAllow(1);
            setCurrentStore(null);
            setCurrentStoreDestination(null);
        }, []
    );

    const onGetTotalProductClone = useCallback(
        async ({ store_id, clone_product_type }) => {
            const res = await getTotalProductClone({
                variables: {
                    store_id,
                    clone_product_type
                }
            });
        }, []
    );

    const onCloneProduct = useCallback(
        async (sync) => {
            setErrorMess('');
            if (!currentChannel) {
                setErrors(prev => ({
                    ...prev,
                    channel: true
                }))
                setErrorMess(formatMessage({ defaultMessage: 'Vui lòng chọn sàn' }));
                return;
            }

            if (!currentStore) {
                setErrors(prev => ({
                    ...prev,
                    storeOrigin: true
                }))
                setErrorMess(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' }));
                return;
            }

            if (!currentStoreDestination) {
                setErrors(prev => ({
                    ...prev,
                    storeDestination: true
                }))
                setErrorMess(formatMessage({ defaultMessage: 'Vui lòng chọn gian hàng' }));
                return;
            }

            let res = await cloneStoreProduct({
                variables: {
                    allow_duplicate: currentChannel === 'lazada' ? 2 : currentAllow,
                    clone_product_type: currentType,
                    sync_up: sync,
                    from_store_id: currentStore?.value,
                    to_store_ids: currentStoreDestination?.map(_store => _store?.value) || []
                }
            });

            if (res?.data?.scCloneStoreProduct?.success) {
                onCloseModal();
                if (sync === 2) {
                    history.push('/product-stores/draf');
                }
                addToast(formatMessage({ defaultMessage: 'Sao chép dữ liệu sản phẩm thành công' }), { appearance: 'success' });
            } else {
                addToast(res?.data?.scCloneStoreProduct?.message || res?.errors[0]?.message, { appearance: 'error' });
            }
        }, [currentAllow, currentType, currentStore, currentStoreDestination, currentChannel]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onCloseModal}
            backdrop={loadingCloneStoreProduct ? 'static' : true}
            dialogClassName={loadingCloneStoreProduct ? 'width-fit-content' : 'product-clone-dialog'}
        >
            <Modal.Body className="overlay overlay-block cursor-default">
                {loadingCloneStoreProduct && <div className='text-center'>
                    <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                    <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                </div>}
                {!loadingCloneStoreProduct && (
                    <div className='product-clone-wrapper'>
                        <div className="mb-1 text-center font-weight-bold" style={{ fontSize: 16, fontWeight: 'bold' }} >
                            {formatMessage({ defaultMessage: 'Sao chép sản phẩm' })}
                        </div>
                        {errorMess && (
                            <div className='row my-4'>
                                <div className='col-12'>
                                    <div className='bg-danger text-white py-4 px-4  rounded-sm' >
                                        {errorMess}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className='row mt-8'>
                            <div className='col-12 d-flex align-items-center'>
                                <p className="mr-4">{formatMessage({ defaultMessage: 'Sàn' })}</p>
                                <Select
                                    options={optionsChannel}
                                    className='col-4 select-channel-clone'
                                    placeholder='Chọn sàn'
                                    components={animatedComponents}
                                    isClearable
                                    styles={{
                                        control: (styles) => ({
                                            ...styles,
                                            ...(!!errors?.channel ? { borderColor: '#f14336' } : {}),
                                            backgroundColor: '#F7F7FA',
                                        })
                                    }}
                                    value={optionsChannel?.find(_channel => _channel.value === currentChannel)}
                                    isLoading={loadingChannel}
                                    onChange={value => {
                                        setErrors(prev => ({
                                            ...prev,
                                            channel: false
                                        }))
                                        setCurrentChannel(value?.value);
                                        setCurrentStore(null);
                                        setCurrentStoreDestination(null);
                                    }}
                                    formatOptionLabel={(option, labelMeta) => {
                                        return <div>
                                            {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                                            {option.label}
                                        </div>
                                    }}
                                />
                                <p className='w-50 ml-4 text-danger'>
                                    {
                                        currentChannel == 'tiktok' &&
                                        <>
                                            <i class="fas text-danger fa-exclamation-triangle mr-2"></i>
                                            {formatMessage({ defaultMessage: 'Các sản phẩm có thuộc tính tự tạo sẽ không đăng bán được.' })}
                                        </>
                                    }
                                </p>
                            </div>
                        </div>
                        <div className='row mt-6 mb-2'>
                            <div className='col-12'>
                                <div className='col-12'>
                                    <div className='row d-flex align-items-center'>
                                        <div className='col-5 product-clone-box py-4'>
                                            <div className='row d-d-flex align-items-center'>
                                                <div className='col-4'>
                                                    <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                                </div>
                                                <div className='col-8'>
                                                    <Select
                                                        options={optionsStore}
                                                        className='w-100 select-report-custom'
                                                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                                        components={animatedComponents}
                                                        isClearable
                                                        styles={{
                                                            control: (styles) => ({
                                                                ...styles,
                                                                ...(!!errors?.storeOrigin ? { borderColor: '#f14336' } : {}),
                                                                backgroundColor: '#F7F7FA',
                                                            })
                                                        }}
                                                        isLoading={loadingChannel}
                                                        value={currentStore}
                                                        onChange={async (value) => {
                                                            if (!!value) {
                                                                onGetTotalProductClone({
                                                                    store_id: value?.value || 0,
                                                                    clone_product_type: currentType
                                                                })
                                                            }

                                                            setErrors(prev => ({
                                                                ...prev,
                                                                storeOrigin: false
                                                            }))
                                                            setCurrentStore(value || null);
                                                            setCurrentStoreDestination(null);
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
                                            <div className='row mt-4'>
                                                <div className='col-4'></div>
                                                <div className='col-8'>
                                                    <div
                                                        className="radio-list"
                                                        onChange={e => {
                                                            let valueChecked = e.target.value;

                                                            if (currentStore) {
                                                                onGetTotalProductClone({
                                                                    store_id: currentStore?.value,
                                                                    clone_product_type: Number(valueChecked)
                                                                })
                                                            }
                                                            setCurrentType(Number(valueChecked))
                                                        }}
                                                    >
                                                        {PRODUCT_CLONE_TYPE.map(_type => (
                                                            <label
                                                                key={`option-connected-${_type.value}`}
                                                                className="radio"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    value={_type.value}
                                                                    checked={_type.value === currentType}
                                                                />
                                                                <span></span>
                                                                <p className="mb-0">{_type.name}</p>
                                                                <OverlayTrigger
                                                                    placement='bottom'
                                                                    overlay={
                                                                        <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                                            <div style={{ textAlign: 'left' }}>
                                                                                {_type.value === 1 ? (
                                                                                    <span>{formatMessage({ defaultMessage: 'Sao chép tất cả các sản phẩm ở gian hàng (không bao gồm sản phẩm ở trạng thái Lưu nháp).' })}</span>
                                                                                ) : (
                                                                                    <span>{formatMessage({ defaultMessage: 'Chỉ sao chép các sản phẩm có tồn kho lớn hơn 0.' })}</span>
                                                                                )}
                                                                            </div>
                                                                        </Tooltip>
                                                                    }
                                                                >
                                                                    <i className="fas fa-exclamation-circle ml-1" style={{ color: '#000', fontSize: 12 }} />
                                                                </OverlayTrigger>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='col-2'>
                                            <div className="icon-arrow-product"></div>
                                        </div>
                                        <div className='col-5 product-clone-box py-4'>
                                            <div className='row d-d-flex align-items-center'>
                                                <div className='col-4'>
                                                    <span>{formatMessage({ defaultMessage: 'Gian hàng' })}</span>
                                                </div>
                                                <div className='col-8'>
                                                    <Select
                                                        options={optionsStoreDestination}
                                                        className='w-100 select-report-custom'
                                                        placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                                                        components={animatedComponents}
                                                        isClearable
                                                        isMulti
                                                        styles={{
                                                            control: (styles) => ({
                                                                ...styles,
                                                                ...(!!errors?.storeDestination ? { borderColor: '#f14336' } : {}),
                                                                backgroundColor: '#F7F7FA',
                                                            })
                                                        }}
                                                        value={currentStoreDestination}
                                                        onChange={value => {
                                                            setErrors(prev => ({
                                                                ...prev,
                                                                storeDestination: false
                                                            }))
                                                            setCurrentStoreDestination(value || null)
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {currentStore && (
                            <>
                                {loadingTotalProductClone && (
                                    <div className='row my-4'>
                                        <span className="ml-3 spinner spinner-primary"></span>
                                    </div>

                                )}
                                {!loadingTotalProductClone && (
                                    <div className='row mt-2 mb-4'>
                                        <div className="col-12 text-primary">{formatMessage({ defaultMessage: `Đã chọn {count} sản phẩm` }, { count: dataTotalProductClone?.scGetTotalProductClone?.total || 0 })}</div>
                                    </div>
                                )}
                            </>
                        )}
                        <div className='row mt-6 mb-4'>
                            <div className='col-12'>
                                <span className='d-flex align-items-center'>
                                    {formatMessage({ defaultMessage: 'Trùng ID sản phẩm' })}
                                    <OverlayTrigger
                                        placement='bottom'
                                        overlay={
                                            <Tooltip title='#1234443241434' style={{ color: 'red' }}>
                                                <div style={{ textAlign: 'left' }}>
                                                    <span>{formatMessage({ defaultMessage: 'Trường hợp sản phẩm từ gian hàng sao chép có ID trùng với sản phẩm bạn đã tạo ở gian hàng còn lại.' })}</span>
                                                    <ul className='pl-2'>
                                                        <li>{formatMessage({ defaultMessage: 'Chọn "Sao chép" để sao chép tất cả các sản phẩm, bao gồm sản phẩm trùng ID.' })}</li>
                                                        <li>{formatMessage({ defaultMessage: 'Chọn "Bỏ qua" để không sao chép các sản phẩm trùng ID.' })}</li>
                                                    </ul>
                                                </div>
                                            </Tooltip>
                                        }
                                    >
                                        <i className="fas fa-exclamation-circle ml-2" style={{ color: '#000' }} />
                                    </OverlayTrigger>
                                    <span>{`:`}</span>
                                    <div
                                        className="d-flex flex-row align-items-center ml-12" style={{ gap: 18 }}
                                        onChange={e => {
                                            let valueChecked = e.target.value;
                                            setCurrentAllow(Number(valueChecked))
                                        }}
                                    >
                                        {ALLOW_DUPLICATE.map(_type => (
                                            <label
                                                key={`option-connected-${_type.value}`}
                                                className="radio"
                                                style={{ cursor: currentChannel === 'lazada' ? 'not-allowed' : 'pointer' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    disabled={currentChannel === 'lazada' ? true : false}
                                                    value={_type.value}
                                                    checked={currentChannel === 'lazada' ? _type.value === 2 : _type.value === currentAllow}
                                                />
                                                <span></span>
                                                <p className="mb-0 pl-2">{_type.name}</p>
                                            </label>
                                        ))}
                                    </div>
                                </span>
                            </div>
                            {currentChannel === 'lazada' &&
                                <div className='col-12 mt-2'>
                                    <p style={{ color: 'red', fontSize: 12 }}>{formatMessage({ defaultMessage: 'Lazada không hỗ trợ tạo sản phẩm có trùng mã SKU' })}</p>
                                </div>
                            }
                        </div>
                        <div className='row'>
                            <div className='col-12 text-success'>
                                <i class="fas fa-lightbulb text-success mr-2"></i> {formatMessage({ defaultMessage: 'Vui lòng chỉnh sửa thông tin sản phẩm sao chép trước khi đăng bán để tránh bị phạt do giống sản phẩm gốc' })}
                            </div>
                        </div>
                        <div className='row d-flex align-items-center justify-content-center mt-12 mb-4' style={{ gap: 8 }}>
                            <button
                                className="btn btn-outline-primary btn-elevate"
                                type="submit"
                                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    onCloseModal();
                                }}
                            >
                                {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                            </button>
                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={!!currentStore && dataTotalProductClone?.scGetTotalProductClone?.total === 0}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    onCloneProduct(2);
                                }}
                            >
                                {formatMessage({ defaultMessage: 'SAO CHÉP & LƯU NHÁP' })}
                            </button>
                            <button
                                className="btn  btn-outline-primary btn-elevate"
                                style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                                type="submit"
                                disabled={!!currentStore && dataTotalProductClone?.scGetTotalProductClone?.total === 0}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    onCloneProduct(1);
                                }}
                            >
                                {formatMessage({ defaultMessage: 'SAO CHÉP & ĐĂNG BÁN' })}
                            </button>
                        </div>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    )
});

export default ProductCloneDialog;