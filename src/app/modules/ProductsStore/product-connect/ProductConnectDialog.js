import React, { FC, memo, useMemo, useCallback, Fragment, useEffect, useState } from 'react';
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
import query_sme_catalog_product from '../../../../graphql/query_sme_catalog_product';

const ProductConnectDialog = memo(({
    show,
    onHide,
    scId,
    dataAttributeSc,
    hasVariants
}) => {
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const { addToast } = useToasts();
    const [nameSearch, setNameSearch] = useState('');

    let limit = 25;

    const { data, loading } = useQuery(query_sme_catalog_product, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: {
                updated_at: 'desc'
            },
            where: {
                _or: [{ name_clear_text: { _iregex: encodeURI(nameSearch.trim()).replace(/%/g, '') } }, { sme_catalog_product_variants: { sku_clear_text: { _iregex: encodeURI(nameSearch.trim()).replace(/%/g, '') } } }],
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_catalog_product_aggregate?.aggregate?.count || 0
    let totalPage = Math.ceil(totalRecord / limit)

    const dataSmeProduct = useMemo(
        () => {
            if (!data || !data?.sme_catalog_product || data?.sme_catalog_product?.length == 0) return [];

            return data?.sme_catalog_product
        }, [data]
    );

    const [linkProduct, { loading: loadingLinkProduct, data: dataLinkProduct, error: errorLinkProduct }] = useMutation(mutate_scLinkSmeProductToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['sc_product']
    });

    const onConnectProduct = useCallback(
        async (smeVariantId, smeProductId) => {
            if (!show) return;
            let res = await linkProduct({
                variables: {
                    sc_product_id: scId,
                    sme_product_id: smeProductId,
                    sme_variant_id: !!smeVariantId && !hasVariants ? smeVariantId : '',
                    variant_attributes: []
                }
            });

            if (res?.data?.scLinkSmeProductToConnector?.success) {
                addToast('Liên kết sản phẩm kho thành công', { appearance: 'success' });
            } else {
                setError('error')
            }
            onHide();
        }
        , [scId, dataAttributeSc, show, hasVariants]
    )

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
                        <div className="mb-4" >Đang thực hiện</div>
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
                                            Chọn sản phẩm liên kết
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
                                                onBlur={(e) => {
                                                    setNameSearch(e.target.value)
                                                }}
                                                defaultValue={nameSearch}
                                                onKeyDown={e => {
                                                    if (e.keyCode == 13) {
                                                        setNameSearch(e.target.value)
                                                    }
                                                }}
                                            />
                                            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                                        </div>
                                        {
                                            loadingLinkProduct && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                                <span className="ml-3 spinner spinner-primary"></span>
                                            </div>
                                        }
                                        <div
                                            style={{
                                                maxHeight: 450, overflowY: 'auto',
                                                minHeight: loading ? 450 : 0,
                                            }}
                                        >
                                            {
                                                loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                                    <span className="ml-3 spinner spinner-primary"></span>
                                                </div>
                                            }
                                            {(dataSmeProduct || []).map(
                                                (_item, index) => {

                                                    let imgAssets = _.minBy(_item?.sme_catalog_product_assets?.filter(_asset => !_asset.is_video), 'asset_id')

                                                    return (
                                                        <div
                                                            style={dataSmeProduct?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
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
                                                                            {!!imgAssets && (
                                                                                <img
                                                                                    src={imgAssets?.asset_url}
                                                                                    style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >{_item?.name || ''}</p>
                                                                            <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                                <p style={{ fontSize: 10 }}><img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                                    <span className='ml-2'>{_item?.sku || ''}</span>
                                                                                </p>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                                <p className='d-flex' style={{ alignItems: 'center' }}>
                                                                                    {/* <img style={{ width: 20, height: 20 }} src={_item.sc_channel?.logo_asset_url} className="mr-2 sku-img-custom" />
                                                                                    <span style={{ position: 'relative', top: 5 }}>{_item.sc_store?.name}</span> */}
                                                                                </p>
                                                                            </div>
                                                                            <p className='font-weight-normal mb-1' style={{ fontSize: 14 }} >Tồn kho: {formatNumberToCurrency(_item?.stock_on_hand || 0)}</p>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-2">
                                                                    <span
                                                                        className="text-primary font-weight-bold"
                                                                        style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                                        onClick={e => {
                                                                            e.preventDefault();
                                                                            let smeVariantId = _item?.sme_catalog_product_variants?.length == 1 && _item?.sme_catalog_product_variants?.[0]?.attributes?.length == 0
                                                                                ? _item?.sme_catalog_product_variants?.[0]?.id
                                                                                : null

                                                                            onConnectProduct(smeVariantId, _item.id)
                                                                        }}
                                                                    >
                                                                        Liên kết
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                            )}
                                        </div>
                                        <div style={{ padding: '1rem 1rem 1rem 1rem', boxShadow: 'rgb(0 0 0 / 40%) 0px -4px 4px -4px' }}>
                                            <Pagination
                                                page={page}
                                                totalPage={totalPage}
                                                loading={loading}
                                                limit={limit}
                                                totalRecord={totalRecord}
                                                count={dataSmeProduct?.length}
                                                onPanigate={(page) => setPage(page)}
                                                // basePath={`/products/edit/${smeId}/affiliate`}
                                                emptyTitle='Chưa có  phẩm nào'
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
                            <div className="mb-4" >Liên kết sản phẩm bị lỗi (Mã lỗi 134)</div>
                            <p className='text-center'>Bạn vui lòng thử lại</p>
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
                                    <span className="font-weight-boldest">Huỷ</span>
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
                                    <span className="font-weight-boldest">Thử lại</span>
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