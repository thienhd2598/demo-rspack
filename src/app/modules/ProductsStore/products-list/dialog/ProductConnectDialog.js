import React, { FC, memo, useMemo, useCallback, Fragment, useEffect, useState, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Formik } from 'formik';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { useMutation, useQuery } from "@apollo/client";
import mutate_scLinkSmeProductToConnector from '../../../../../graphql/mutate_scLinkSmeProductToConnector';
import Pagination from '../../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import _ from 'lodash';
import query_sme_catalog_product from '../../../../../graphql/query_sme_catalog_product';
import gql from 'graphql-tag';
import ModalCombo from './ModalCombo';
import InfoProduct from '../../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const query_sc_product_detail = gql`
    query sc_product($id: Int!) {
        sc_product(id: $id) {            
            name
            sku
            variantAttributeValues {
                id
            }
        }
    }
`;

const ProductConnectDialog = memo(({
    show,
    onHide,
    scId,
    is_new,
    sme_product_id,
}) => {
    const { formatMessage } = useIntl();
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const { addToast } = useToasts();
    const refInput = useRef(null);
    const [nameSearch, setNameSearch] = useState('');
    const [dataCombo, setDataCombo] = useState(null);

    let limit = 25;

    const { data: dataProductDetail, loading: loadingProductDetail } = useQuery(query_sc_product_detail, {
        variables: {
            id: scId
        }
    });

    const { data, loading } = useQuery(query_sme_catalog_product, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: {
                updated_at: 'desc'
            },
            where: {
                _and: {
                    ...(!!sme_product_id ? { id: { _neq: sme_product_id } } : {}),
                    _or: [{ name: { _ilike: `%${nameSearch.trim()}%` } }, { sku: { _ilike: `%${nameSearch.trim()}%` } }],
                }
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_catalog_product_aggregate?.aggregate?.count || 0
    let totalPage = Math.ceil(totalRecord / limit)

    useMemo(() => {
        if (!show) {
            setPage(1);
            setNameSearch('');
        }
    }, [show]);

    const dataSmeProduct = useMemo(
        () => {
            if (!data || !data?.sme_catalog_product || data?.sme_catalog_product?.length == 0) return [];

            return data?.sme_catalog_product
        }, [data]
    );

    const [linkProduct, { loading: loadingLinkProduct }] = useMutation(mutate_scLinkSmeProductToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['ScGetSmeProducts', 'sc_product']
    });

    const onConnectProduct = useCallback(
        async (smeVariantId, smeProductId) => {
            if (!show) return;
            let res = await (!!is_new ? linkProduct({
                variables: {
                    sc_product_id: scId,
                    sme_product_id: smeProductId,
                    sme_variant_id: (!!smeVariantId && dataProductDetail?.sc_product?.variantAttributeValues?.length == 0) ? smeVariantId : '',
                    variant_attributes: []
                }
            }) : linkProduct({
                variables: {
                    sc_product_id: scId,
                    sme_product_id: smeProductId,
                    sme_variant_id: (!!smeVariantId && dataProductDetail?.sc_product?.variantAttributeValues?.length == 0) ? smeVariantId : '',
                    variant_attributes: []
                }
            }));

            if (res?.data?.scLinkSmeProductToConnector?.success) {
                addToast(formatMessage({ defaultMessage: 'Liên kết sản phẩm kho thành công' }), { appearance: 'success' });
                onHide();
            } else {
                setError('error')
            }
        }, [scId, is_new, show, dataProductDetail]
    );

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
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                }
                {
                    !loadingLinkProduct && !error && (
                        <div className="form-group mb-0">
                            <div className="text-center" style={{ fontSize: 18, fontWeight: 'bold', margin: '1rem 2rem 1rem 2rem' }}>
                                {formatMessage({ defaultMessage: 'LIÊN KẾT SẢN PHẨM' })}
                            </div>
                            <i
                                className="ki ki-bold-close icon-md text-muted"
                                style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }}
                                onClick={e => {
                                    e.preventDefault();
                                    onHide();
                                }}
                            ></i>
                            <div style={{ margin: '0rem 2rem 1rem 2rem' }}>
                                <div className="input-icon">
                                    <input
                                        ref={refInput}
                                        type="text"
                                        style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)' }}
                                        className="form-control"
                                        placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
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
                                <div className='d-flex mt-4'>
                                    <span className='mr-2' style={{ minWidth: 135 }}>{formatMessage({ defaultMessage: 'Tìm kiếm nhanh theo' })}:</span>
                                    {loadingProductDetail
                                        ? <span className="spinner spinner-primary" />
                                        : <div className='d-flex flex-column text-primary cursor-pointer' style={{ fontSize: 14 }}>
                                            <span
                                                className='mb-1'
                                                style={{ whiteSpace: 'nowrap', overflow: 'hidden', display: 'block', textOverflow: 'ellipsis', maxWidth: '450px' }}
                                                onClick={() => {
                                                    refInput.current.value = dataProductDetail?.sc_product?.name;
                                                    setPage(1);
                                                    setNameSearch(dataProductDetail?.sc_product?.name)
                                                }}
                                            >
                                                {dataProductDetail?.sc_product?.name}
                                            </span>
                                            <span
                                                onClick={() => {
                                                    refInput.current.value = dataProductDetail?.sc_product?.sku
                                                    setPage(1);
                                                    setNameSearch(dataProductDetail?.sc_product?.sku)
                                                }}
                                            >
                                                {dataProductDetail?.sc_product?.sku}
                                            </span>
                                        </div>
                                    }
                                </div>
                            </div>
                            <span className='' style={{ margin: '0rem 2rem 1rem 2rem', fontSize: 14 }}>{formatMessage({ defaultMessage: 'Gợi ý sản phẩm liên kết' })}</span>
                            {
                                loadingLinkProduct && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                    <span className="ml-3 spinner spinner-primary"></span>
                                </div>
                            }
                            <div
                                className='pt-3'
                                style={{
                                    maxHeight: 400, overflowY: 'auto',
                                    minHeight: loading ? 200 : 0,
                                }}
                            >
                                {
                                    loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                        <span className="ml-3 spinner spinner-primary"></span>
                                    </div>
                                }
                                {(dataSmeProduct || []).map(
                                    (_item, index) => {

                                        let imgAssets = _.minBy(_item.sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(_asset => ({
                                            ..._asset,
                                            position_show: _asset.position_show || 0
                                        })), 'position_show')

                                        return (
                                            <div
                                                style={dataSmeProduct?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
                                                key={`choose-connect-${index}`}
                                            >
                                                <div className='row' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
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
                                                            <InfoProduct
                                                                name={_item?.name}
                                                                sku={_item?.sku}
                                                                url={`/products/${_item?.is_combo == 1 ? 'edit-combo' : 'edit'}/${_item?.id}`}
                                                                setDataCombo={setDataCombo}
                                                                combo_items={_item.combo_items}
                                                            />
                                                        </div>
                                                    </div>
                                                    <AuthorizationWrapper keys={['product_store_connect']}>
                                                        <div className="col-2 d-flex justify-content-end">
                                                            <span
                                                                className="text-primary font-weight-bold text-right"
                                                                style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    let smeVariantId = _item?.sme_catalog_product_variants?.length == 1 && _item?.sme_catalog_product_variants?.[0]?.attributes?.length == 0
                                                                        ? _item?.sme_catalog_product_variants?.[0]?.id
                                                                        : null

                                                                    onConnectProduct(smeVariantId, _item.id)
                                                                }}
                                                            >
                                                                {formatMessage({ defaultMessage: 'Liên kết' })}
                                                            </span>
                                                        </div>
                                                    </AuthorizationWrapper>
                                                </div>
                                            </div>
                                        )
                                    }
                                )}
                            </div>
                            <div style={{ padding: '1rem 1rem 1rem 1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px' }}>
                                <Pagination
                                    page={page}
                                    totalPage={totalPage}
                                    loading={loading}
                                    limit={limit}
                                    totalRecord={totalRecord}
                                    count={dataSmeProduct?.length}
                                    onPanigate={(page) => setPage(page)}
                                    // basePath={`/products/edit/${smeId}/affiliate`}
                                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                                />
                            </div>
                        </div>
                    )}
                {
                    !loadingLinkProduct && !!error && (
                        <div className='text-center'>
                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                            <div className="mb-4" ></div>
                            <div className="mb-4" >{formatMessage({ defaultMessage: `Liên kết sản phẩm bị lỗi (Mã lỗi 134)` })}</div>
                            <p className='text-center'>{formatMessage({ defaultMessage: 'Bạn vui lòng thử lại' })}</p>
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
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Huỷ' })}</span>
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
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Thử lại' })}</span>
                                </button>
                            </div>
                        </div>
                    )
                }
                <ModalCombo
                    dataCombo={dataCombo}
                    onHide={() => setDataCombo(null)}
                />
            </Modal.Body>
        </Modal >
    )
});

export default ProductConnectDialog;