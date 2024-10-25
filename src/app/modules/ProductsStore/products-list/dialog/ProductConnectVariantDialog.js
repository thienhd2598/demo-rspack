import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal } from "react-bootstrap";
import { useMutation, useQuery } from "@apollo/client";
import { useToasts } from 'react-toast-notifications';
import { formatNumberToCurrency } from '../../../../../utils';
import { useFormikContext } from 'formik';
import mutate_scLinkSmeProductVariantToConnector from '../../../../../graphql/mutate_scLinkSmeProductVariantToConnector';
import query_sme_product_variants_by_pk from '../../../../../graphql/query_sme_product_variants_by_pk';
import query_sme_catalog_product_variant from '../../../../../graphql/query_sme_catalog_product_variant';
import Pagination from '../../../../../components/PaginationModal';
import gql from 'graphql-tag';
import _ from 'lodash';
import { Formik } from 'formik';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import ModalCombo from './ModalCombo';
import InfoProduct from '../../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const query_sc_product_variant_detail = gql`
    query sc_product_variant($id: Int!) {
        sc_product_variant(id: $id) {                        
            sku            
        }
    }
`;

const ProductConnectVariantDialog = memo(({
    show,
    onHide,
    scVariantId,
    is_new,
    sme_product_variant_id
}) => {
    const { formatMessage } = useIntl();
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const { addToast } = useToasts();
    const [nameSearch, setNameSearch] = useState('');
    const refInput = useRef(null);
    const [dataCombo, setDataCombo] = useState(null);


    let limit = 25;

    const [linkProductVariant, { loading: loadingLinkProductVariant }] = useMutation(mutate_scLinkSmeProductVariantToConnector, {
        awaitRefetchQueries: true,
        refetchQueries: ['ScGetSmeProducts', 'scGetProductVariants']
    });




    const { data: dataProductVariantDetail, loading: loadingProductVariantDetail } = useQuery(query_sc_product_variant_detail, {
        variables: {
            id: scVariantId
        }
    });

    const { data: dataProductVariant, loading: loadingProductVariant } = useQuery(query_sme_catalog_product_variant, {
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: {
                updated_at: 'desc'
            },
            where: {
                _and: {
                    ...(!!sme_product_variant_id ? { id: { _neq: sme_product_variant_id } } : {}),
                    _or: [{ sme_catalog_product: { name: { _ilike: `%${nameSearch.trim()}%` } } }, { sku: { _ilike: `%${nameSearch.trim()}%` } }],
                },
                product_status_id: {_is_null: true}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = dataProductVariant?.sme_catalog_product_variant_aggregate?.aggregate?.count || 0
    let totalPage = Math.ceil(totalRecord / limit)

    const _attributes = (item_attributes) => {

        let attributes = [];
        if (item_attributes && item_attributes.length > 0) {
            for (let index = 0; index < item_attributes.length; index++) {
                const element = item_attributes[index];
                attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

            }
            return attributes.join(' - ');
        }
        return null
    }

    console.log({ dataProductVariant })

    useMemo(() => {
        if (!show) {
            setPage(1);
            setNameSearch('');
        }
    }, [show]);

    const onLinkProductVariant = useCallback(
        async (smeVariantId) => {
            if (!show) return;
            let res = await (is_new ? linkProductVariant({
                variables: {
                    sc_variant_id: scVariantId,
                    sme_variant_id: smeVariantId
                }
            }) : linkProductVariant({
                variables: {
                    sc_variant_id: scVariantId,
                    sme_variant_id: smeVariantId
                }
            }));

            if (res?.data?.scLinkSmeProductVariantToConnector?.success) {
                onHide();
                addToast('Liên kết hàng hóa sản phẩm kho thành công', { appearance: 'success' });
            } else {
                setError('error')
            }
        }, [show, scVariantId, is_new]
    );

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={loadingLinkProductVariant ? 'static' : true}
            dialogClassName={loadingLinkProductVariant ? 'width-fit-content' : 'body-dialog-connect'}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={loadingLinkProductVariant || !!error ? {} : { padding: 0 }}>
                {
                    loadingLinkProductVariant && <div className='text-center'>
                        <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                        <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                    </div>
                }
                {
                    !loadingLinkProductVariant && !error && (
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
                                    <div className="form-group mb-0">
                                        <div className="text-center" style={{ fontSize: 18, fontWeight: 'bold', margin: '1rem 2rem 1rem 2rem' }}>
                                            {formatMessage({ defaultMessage: 'LIÊN KẾT HÀNG HÓA' })}
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
                                                {loadingProductVariantDetail
                                                    ? <span className="spinner spinner-primary" />
                                                    : <div className='d-flex flex-column text-primary cursor-pointer' style={{ fontSize: 14 }}>
                                                        <span
                                                            onClick={() => {
                                                                refInput.current.value = dataProductVariantDetail?.sc_product_variant?.[0]?.sku
                                                                setPage(1);
                                                                setNameSearch(dataProductVariantDetail?.sc_product_variant?.[0]?.sku)
                                                            }}
                                                        >
                                                            {dataProductVariantDetail?.sc_product_variant?.[0]?.sku}
                                                        </span>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                        <span className='' style={{ margin: '0rem 2rem 1rem 2rem', fontSize: 14 }}>{formatMessage({ defaultMessage: 'Gợi ý hàng hóa liên kết' })}</span>
                                        {
                                            loadingLinkProductVariant && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                                <span className="ml-3 spinner spinner-primary"></span>
                                            </div>
                                        }
                                        <div
                                            className='pt-3'
                                            style={{
                                                maxHeight: 400, overflowY: 'auto',
                                                minHeight: loadingProductVariant ? 400 : 0,
                                            }}
                                        >
                                            {
                                                loadingProductVariant && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                                    <span className="ml-3 spinner spinner-primary"></span>
                                                </div>
                                            }
                                            {(dataProductVariant?.sme_catalog_product_variant || []).map(
                                                (_item, index) => {
                                                    console.log('itennnn', _item)
                                                    let __assets = _item.sme_catalog_product_variant_assets[0]

                                                    return (
                                                        <div
                                                            style={dataProductVariant?.sme_catalog_product_variant?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
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
                                                                            {
                                                                                !!__assets ? <img src={__assets.asset_url}
                                                                                    style={{ width: 50, height: 50, objectFit: 'contain' }} /> : null
                                                                            }
                                                                        </div>
                                                                        <div className='d-flex flex-column w-100'>
                                                                            <InfoProduct
                                                                                name={_item?.sme_catalog_product?.name}
                                                                                sku={_item?.sku}
                                                                                url={`/products/${_item?.is_combo == 1 ? 'edit-combo/' + _item?.sme_catalog_product.id : _item?.attributes.length > 0 ? 'stocks/detail/' + _item?.id : 'edit/' + _item?.sme_catalog_product.id}`}
                                                                                setDataCombo={setDataCombo}
                                                                                combo_items={_item.combo_items}
                                                                            />
                                                                            {_item?.attributes?.length > 0 && (
                                                                                <span className='d-flex align-items-center fs-12 text-secondary-custom'>
                                                                                    {_attributes(_item?.attributes) || '--'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <AuthorizationWrapper keys={['product_store_variant_connect']}>
                                                                    <div className="col-2 d-flex justify-content-end">
                                                                        <span
                                                                            className="text-primary font-weight-bold text-right"
                                                                            style={{ cursor: 'pointer', paddingBottom: 10 }}
                                                                            onClick={e => {
                                                                                e.preventDefault();
                                                                                onLinkProductVariant(_item?.id)
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
                                                loading={loadingProductVariant}
                                                limit={limit}
                                                totalRecord={totalRecord}
                                                count={dataProductVariant?.sme_catalog_product_variant?.length}
                                                onPanigate={(page) => setPage(page)}
                                                // basePath={`/products/edit/${smeId}/affiliate`}
                                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                                            />
                                        </div>
                                    </div>
                                </form>
                            )}
                        </Formik>
                    )}
                {
                    !loadingLinkProductVariant && !!error && (
                        <div className='text-center'>
                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                            <div className="mb-4" ></div>
                            <div className="mb-4" >{formatMessage({ defaultMessage: 'Liên kết sản phẩm bị lỗi (Mã lỗi 134)' })}</div>
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

export default ProductConnectVariantDialog;
