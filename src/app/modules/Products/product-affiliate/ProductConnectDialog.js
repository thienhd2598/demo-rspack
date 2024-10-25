import React, { FC, memo, useMemo, useCallback, Fragment, useEffect, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Formik } from 'formik';
import { formatNumberToCurrency } from '../../../../utils';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_ScGetSmeProducts from '../../../../graphql/query_ScGetSmeProducts';
import { useMutation, useQuery } from "@apollo/client";
import mutate_scLinkSmeProductToConnector from '../../../../graphql/mutate_scLinkSmeProductToConnector';
import Pagination from '../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import _ from 'lodash';
import { useIntl } from 'react-intl';

const ProductConnectDialog = memo(({
    show,
    onHide,
    smeId,
    smeVariantId,
}) => {
    const {formatMessage} = useIntl()
    const [name, setName] = useState('');
    const [searchText, setSearcText] = useState('');
    const [error, setError] = useState('');
    const _refDebounce = useRef(_.debounce(setName, 300))
    const { addToast } = useToasts();
    const [linkProduct, { loading: loadingLinkProduct, data: dataLinkProduct, error: errorLinkProduct }] = useMutation(mutate_scLinkSmeProductToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_products']
    });

    const [page, setPage] = useState(1);
    const perPage = 10;

    const { data, loading } = useQuery(query_ScGetSmeProducts, {
        variables: {
            sme_id: smeId,
            filter_map_sme: 0,
            page: page,
            q: name,
        },
        fetchPolicy: 'cache-and-network'
    });

    const totalRecord = data?.ScGetSmeProducts?.total || 0;
    const totalPage = Math.ceil(totalRecord / perPage);

    const {
        dataScGetSmeProduct,
        total
    } = useMemo(
        () => {
            if (!data
                || !data.ScGetSmeProducts
                || data.ScGetSmeProducts.products.length == 0
            ) return [];

            return {
                dataScGetSmeProduct: (data.ScGetSmeProducts?.products || [])
                    .map(item => {
                        let asset_url = _.minBy(item.productAssets, 'sme_asset_id');
                        return {
                            ...item,
                            asset_url: asset_url?.sme_url || asset_url?.ref_url || null,
                            sc_store: data?.sc_stores?.find(
                                _store => _store.id == item.store_id
                            ),
                            sc_channel: data?.op_connector_channels?.find(
                                _channel => _channel.code == item.connector_channel_code
                            ),
                        }
                    }),
                total: data.ScGetSmeProducts?.total || 0
            };
        }, [data]
    );

    const onConnectProduct = useCallback(
        async (hasScVariant, scProductId) => {
            if (!show) return;
            let res = await linkProduct({
                variables: {
                    sc_product_id: scProductId,
                    sme_product_id: smeId,
                    sme_variant_id: !!smeVariantId && !hasScVariant ? smeVariantId : '',
                    variant_attributes: []
                }
            });

            if (res?.data?.scLinkSmeProductToConnector?.success) {
                onHide()
                addToast(formatMessage({defaultMessage:'Liên kết sản phẩm kho thành công'}), { appearance: 'success' });
            } else {
                setError('error')
            }
            return;
        }, [show, smeVariantId]
    )


    useEffect(() => {
        setSearcText('')
        _refDebounce.current('')
    }, [show])

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={loadingLinkProduct ? 'static' : true}
            dialogClassName={loadingLinkProduct ? 'width-fit-content' : 'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={loadingLinkProduct || !!error ? {} : { padding: 0 }}>
                {
                    loadingLinkProduct && <div className='text-center'>
                        <div className="mb-4" >{formatMessage({defaultMessage:'Đang thực hiện'})}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                }
                {
                    !loadingLinkProduct && !error && (
                        <Formik
                            initialValues={{
                                status: "", // values => All=""/Selling=0/Sold=1
                                condition: "", // values => All=""/New=0/Used=1
                                searchText: "",
                            }}
                            onSubmit={(values) => {
                            }}
                        >
                            {({
                                values,
                                handleSubmit,
                                handleBlur,
                                handleChange,
                                setFieldValue,
                            }) => (
                                <form onSubmit={handleSubmit} className="form form-label-right">
                                    <div className="form-group">
                                        <div className=" bold" style={{ fontSize: 16, fontWeight: 500, margin: '1rem 2rem 1rem 2rem' }}>
                                        {formatMessage({defaultMessage:'Chọn sản phẩm liên kết'})}
                                        </div>
                                        <i
                                            className="ki ki-bold-close icon-md text-muted"
                                            style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                onHide();
                                            }}
                                        ></i>
                                        <div className="input-icon" style={{ margin: '0rem 2rem 1rem 2rem' }}>
                                            <input
                                                type="text"
                                                style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)' }}
                                                className="form-control"
                                                placeholder="Tên sản phẩm/SKU"
                                                value={searchText}
                                                onChange={e => {
                                                    setSearcText(e.target.value)
                                                    _refDebounce.current(e.target.value)
                                                }}
                                            />
                                            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                        </div>
                                        {
                                            loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                                <span className="ml-3 spinner spinner-primary"></span>
                                            </div>
                                        }
                                        <div style={{ maxHeight: 500, overflowY: 'auto', minHeight: 500 }}>
                                            {(dataScGetSmeProduct || []).map(
                                                (_item, index) => (
                                                    <div
                                                        style={dataScGetSmeProduct?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
                                                        key={`choose-connect-${index}`}
                                                    >
                                                        <div className='row' style={{ borderBottom: '2px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                                            <div className='col-10'>
                                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                                    <div style={{
                                                                        backgroundColor: '#F7F7FA',
                                                                        width: 60, height: 60,
                                                                        borderRadius: 2,
                                                                        overflow: 'hidden',
                                                                        border: 'none',
                                                                        minWidth: 60
                                                                    }} className='mr-6' >
                                                                        {!!_item.asset_url && (
                                                                            <img
                                                                                src={_item.asset_url}
                                                                                style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >{_item?.name || ''}</p>
                                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                            <p className='d-flex' style={{ fontSize: 10 }}><img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                                <span className='ml-2'>{_item?.sku || ''}</span>
                                                                            </p>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                            <p className='d-flex' style={{ alignItems: 'center' }}>
                                                                                <img style={{ width: 20, height: 20 }} src={_item.sc_channel?.logo_asset_url} className="mr-2 sku-img-custom" />
                                                                                <span style={{ position: 'relative', top: 5 }}>{_item.sc_store?.name}</span>
                                                                            </p>
                                                                        </div>
                                                                        <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >{formatMessage({defaultMessage:'Tồn kho'})}: {formatNumberToCurrency(_item?.stock_on_hand || 0)}</p>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-2">
                                                                <span
                                                                    className="text-primary font-weight-bold"
                                                                    style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                                    onClick={e => {
                                                                        console.log({ _item })
                                                                        e.preventDefault();                                                                                                                                                
                                                                        onConnectProduct(                                                                            
                                                                            _item?.variantAttributeValues?.length > 0,
                                                                            _item.id
                                                                        )
                                                                    }}
                                                                >
                                                                    {formatMessage({defaultMessage:'Liên kết'})}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem 1rem 1rem 1rem', boxShadow: 'rgb(0 0 0 / 40%) 0px -4px 4px -4px' }}>
                                            <Pagination
                                                page={page}
                                                totalPage={totalPage}
                                                loading={loading}
                                                limit={perPage}
                                                totalRecord={totalRecord}
                                                count={data?.ScGetSmeProducts?.products?.length}
                                                onPanigate={(page) => setPage(page)}
                                                // basePath={`/products/edit/${smeId}/affiliate`}
                                                emptyTitle={formatMessage({defaultMessage:'Chưa có sản phẩm nào'})}
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </Formik>
                    )}
                {
                    !loadingLinkProduct && !!error && (
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
                                        onHide()
                                        setError(null)
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
                                        // onConnectProduct();
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:'Thử lại'})}</span>
                                </button>
                            </div>
                        </div>
                    )
                }
            </Modal.Body>
        </Modal >
    )
});

export default ProductConnectDialog;