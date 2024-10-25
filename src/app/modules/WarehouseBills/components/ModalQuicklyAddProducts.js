import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useMutation, useQuery } from "@apollo/client";
import query_sme_catalog_inventory_items from '../../../../graphql/query_sme_catalog_inventory_items';
import { useLocation, useHistory, Link } from "react-router-dom";
import { Checkbox } from '../../../../_metronic/_partials/controls'
import Pagination from '../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useFormikContext } from 'formik';
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';

const MAX_LIMIT = 200;

const ModalQuicklyAddProducts = ({
    type,
    show,
    warehouse,
    isExpireItems,
    onHide, 
    selectedVariants,
    setSelectedVariants
}) => {
    const { formatMessage } = useIntl();
    const [tempSelected, setTemSelected] = useState([])
    const [search, setSearch] = useState({
        searchText: null,
        page: 1,
        limit: 24,
    });
    useEffect(() => {
        setTemSelected(selectedVariants)
    }, [selectedVariants])

    const { data: data, loading } = useQuery(query_sme_catalog_inventory_items, {
        variables: {
            limit: search.limit,
            offset: (search.page - 1) * search.limit,
            where: {
                ...(!!search.searchText ? {
                    _or: [
                        { variant: { sme_catalog_product: { name: { _ilike: `%${search.searchText.trim()}%` } } } },
                        { variant: { sku: { _ilike: `%${search.searchText.trim()}%` } } },
                    ],
                } : ""),
                variant: { 
                    is_combo: { _eq: 0 }, status: {_eq: 10},
                    sme_catalog_product: {is_expired_date: {_eq: isExpireItems}},
                    product_status_id: {_is_null: true}
                },
                sme_store_id: {
                    _eq: warehouse?.id
                }
            },
        },
        fetchPolicy: 'network-only',
    });

    let totalRecord = data?.sme_catalog_inventory_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const handleSelectAll = () => {
        const currentTotal = tempSelected.length
        let product_not_available = data?.sme_catalog_inventory_items
        let data_filtered = product_not_available.filter(i => !tempSelected?.map(i => i?.variant?.id).includes(i?.variant?.id))?.slice(0, MAX_LIMIT - currentTotal)

        setTemSelected(prevState => ([...prevState, ...data_filtered]));
    };

    const resetData = () => {
        setSearch({
            searchText: null,
            page: 1,
            limit: 24,
        })
        setTemSelected(selectedVariants)
        onHide();
    }

    return (
        <Modal
            size="xl"
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={resetData}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {type == 'in'
                        ? formatMessage({ defaultMessage: 'Thêm nhanh sản phẩm nhập kho' })
                        : formatMessage({ defaultMessage: 'Thêm nhanh sản phẩm xuất kho' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pb-0">
                <div className='row'>
                    <div className='col-12 fs-14'>
                        {formatMessage({ defaultMessage: 'Kho' })}: {warehouse?.name}
                    </div>
                    <div className="col-4 input-icon py-2" >
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage({ defaultMessage: 'Tên/SKU' })}
                            style={{ height: 40 }}
                            onBlur={(e) => {
                                setSearch({ ...search, searchText: e.target.value })
                            }}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    setSearch({ ...search, searchText: e.target.value })
                                }
                            }}
                        />
                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                    </div>
                    <div className='col-12 py-2 fs-14'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn' })}: {tempSelected.length} / {MAX_LIMIT} <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {type == 'in'
                                        ? formatMessage({ defaultMessage: 'Tổng sản phẩm hàng hóa trong phiếu nhập kho' })
                                        : formatMessage({ defaultMessage: 'Tổng sản phẩm hàng hóa trong phiếu xuất kho' })}
                                </Tooltip>
                            }
                        >
                            <i className="ml-2 fs-14 fas fa-info-circle"></i>
                        </OverlayTrigger></span>
                    </div>
                </div>
                <div className='row'
                    style={{
                        maxHeight: 400, overflowY: 'auto', overflowX: 'hidden',
                        minHeight: loading ? 400 : 0,
                    }}
                >
                    <div className='m-3 w-100' style={{ border: '1px solid #ebedf3', }}>
                        <div className='row py-2 px-8 flex-wrap justify-content-between'>
                            <span onClick={() => {
                                handleSelectAll()
                            }} className='py-2 w-100 font-weight-bold' style={{ color: '#FF5629' }} role="button">
                                {formatMessage({ defaultMessage: 'Chọn tất cả sản phẩm ở trang hiện tại' })}
                            </span>
                            {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                <span className="ml-3 spinner spinner-primary"></span>
                            </div>
                            }
                            {
                                data && data?.sme_catalog_inventory_items?.map((product, index) => {

                                    let imgAssets = null
                                    if (!!product?.variant?.sme_catalog_product_variant_assets[0] && product?.variant?.sme_catalog_product_variant_assets[0].asset_url) {
                                        imgAssets = product?.variant?.sme_catalog_product_variant_assets[0]
                                    }
                                    let hasAttribute = product?.variant?.attributes?.length > 0;// variants.length > 0 && variants[0].attributes.length > 0;
                                    let isSelected = tempSelected.find(e => (e?.sme_store_id == product?.sme_store_id) && (e?.variant?.id == product?.variant?.id))
                                    isSelected = isSelected ? true : false
                                    let _attributes = null;

                                    let attributes = [];
                                    if (product?.variant?.attributes && product?.variant?.attributes.length > 0) {
                                        for (let index = 0; index < product?.variant?.attributes.length; index++) {
                                            const element = product?.variant?.attributes[index];
                                            attributes.push(`${element.sme_catalog_product_attribute_value?.name}`);

                                        }
                                        _attributes = attributes.join(' - ');
                                    }

                                    return (
                                        <div className='mb-5' style={{ width: '32%', border: '1px solid #C4C4C4' }} key={index}>
                                            <div className='p-3' style={{ verticalAlign: 'top', flexDirection: 'row', marginBottom: 16, overflow: "hidden" }}>
                                                <div className='mb-3'>
                                                    <Checkbox
                                                        size="checkbox-md"
                                                        inputProps={{
                                                            'aria-label': 'checkbox',
                                                        }}
                                                        isSelected={isSelected}
                                                        onChange={(e) => {
                                                            if(e.target.checked) {
                                                                if ((tempSelected.length) >= MAX_LIMIT) return;
                                                                setTemSelected(prevState => ([...prevState, product]))
                                                            } else {
                                                                setTemSelected(tempSelected?.filter(item => item?.variant?.id !== product?.variant?.id));
                                                            }

                                                        }}
                                                    />
                                                </div>
                                                <div className='d-flex'>
                                                    <Link to={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`} target="_blank">
                                                        <div style={{
                                                            backgroundColor: '#F7F7FA',
                                                            width: 80, height: 80,
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            minWidth: 80
                                                        }} className='mr-6' >
                                                            {
                                                                !!imgAssets && <img src={imgAssets?.asset_url}
                                                                    style={{ width: 80, height: 80, objectFit: 'contain' }} />
                                                            }
                                                        </div>
                                                    </Link>
                                                    <div className='w-100'>
                                                        <InfoProduct
                                                            name={product.variant?.sme_catalog_product?.name}
                                                            sku={product.variant?.sku}

                                                            url={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`}
                                                        />
                                                        {!!_attributes && <p className='font-weight-normal mb-2 text-secondary-custom fs-12' >{_attributes}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>


                </div>
                <div style={{ padding: '1rem', boxShadow: 'rgb(0 0 0 / 20%) 0px -2px 2px -2px' }}>
                    <Pagination
                        page={search.page}
                        quickAdd={true}
                        totalPage={totalPage}
                        loading={loading}
                        limit={search.limit}
                        totalRecord={totalRecord}
                        count={data?.sme_catalog_inventory_items?.length}
                        onPanigate={(page) => setSearch({ ...search, page: page })}
                        onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={resetData}
                        className="btn btn-secondary mr-5"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Hủy' })}
                    </button>
                    <button
                        disabled={tempSelected.length == 0}
                        type="button"
                        onClick={() => {
                            setSelectedVariants(tempSelected)
                            onHide()
                        }}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đồng ý' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
};

export default memo(ModalQuicklyAddProducts);