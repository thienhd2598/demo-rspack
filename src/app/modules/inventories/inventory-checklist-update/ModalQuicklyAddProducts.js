import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useMutation, useQuery } from "@apollo/client";
import query_sme_catalog_inventory_items from '../../../../graphql/query_sme_catalog_inventory_items';
import Form from 'react-bootstrap/Form';
import { useLocation, useHistory, Link } from "react-router-dom";
import { useProductsUIContext } from '../../Products/ProductsUIContext';
import { Checkbox } from '../../../../_metronic/_partials/controls'
import Pagination from '../../../../components/PaginationModal';
import mutate_inventoryChecklistAddProductFromManual from '../../../../graphql/mutate_inventoryChecklistAddProductFromManual';
import mutate_inventoryChecklistAddProductFromFilter from '../../../../graphql/mutate_inventoryChecklistAddProductFromFilter';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { Field, Formik, useFormikContext } from 'formik';
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import { formatNumberToCurrency } from '../../../../utils';
import query_sme_inventory_checklist_items from '../../../../graphql/query_sme_inventory_checklist_items';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from "react-intl";
import Select from 'react-select';
import { SEARCH_STATUS, SEARCH_TYPE } from '../InventoriesHelper';

const ModalQuicklyAddProducts = ({
    warehouseId,
    checklistid,
    onHide,
    totalSelectd
}) => {
    const history = useHistory()
    const { addToast } = useToasts();
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const [ids, setIds] = useState([]);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        searchStatus: 'new',
        page: 1,
        limit: 24,
    });
    const { formatMessage } = useIntl()

    const { data: data, loading } = useQuery(query_sme_catalog_inventory_items, {
        variables: {
            checklistid: Number(checklistid),
            limit: search.limit,
            offset: (search.page - 1) * search.limit,
            where: {
                ...(search.searchType == 'in-stock' ? {
                    stock_actual: { _gt: 0 },
                } : ""
                ),

                ...(search.searchType == 'out-stock' ? {
                    stock_actual: { _eq: 0 },
                } : ""
                ),

                ...(!!search.searchText ? {
                    _or: [
                        { variant: { sme_catalog_product: { name: { _ilike: `%${search.searchText.trim()}%` } } } },
                        { variant: { sku: { _ilike: `%${search.searchText.trim()}%` } } },
                    ],
                } : ""),
                is_main_unit: { _eq: true },
                variant: { 
                    is_combo: { _eq: 0 },
                    status: {_eq: 10},
                    ...(search.searchStatus == 'new' ? {
                        product_status_id: { _is_null: true },
                    } : {}
                    ),
                    ...(search.searchStatus == 'other' ? {
                        product_status_id: { _is_null: false },
                    } : {}
                    )
                },
                sme_store_id: {
                    _eq: warehouseId?.value
                },
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_catalog_inventory_items_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const handleSelectAll = () => {
        let product_not_available = data?.sme_catalog_inventory_items.filter(product => product.in_checklist != true)

        let product_in_page = [...product_not_available].map(product => {
            return {
                id: product?.variant.id,
                whId: product?.sme_store_id
            }
        })
        let data_filtered = product_in_page.filter(i => !ids?.map(i => i?.id).includes(i?.id))
        setIds(prevState => ([...prevState, ...data_filtered]));
    };

    const [inventoryChecklistAddProductFromManual] = useMutation(mutate_inventoryChecklistAddProductFromManual, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_items']
    })

    const [inventoryChecklistAddProductFromFilter] = useMutation(mutate_inventoryChecklistAddProductFromFilter, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_items']
    })

    const addProductFromFilter = async () => {
        setLoadingSubmit(true)
        let { data } = await inventoryChecklistAddProductFromFilter({
            variables: {
                checkListId: checklistid || null,
                filter: {
                    searchText: search.searchText,
                    searchType: search.searchType,
                    searchStatus: search.searchStatus
                }
            }
        })
        setLoadingSubmit(false)
        if (data?.inventoryChecklistAddProductFromFilter?.success == 1) {
            addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
            resetData();
        } else {
            addToast(data?.inventoryChecklistAddProductFromFilter?.message || formatMessage({ defaultMessage: "Thêm sản phẩm không thành công" }), { appearance: 'error' });
        }
    }

    const addProductFromManual = async () => {
        setLoadingSubmit(true)
        let { data } = await inventoryChecklistAddProductFromManual({
            variables: {
                checkListId: checklistid || null,
                variantIds: [...ids?.map(i => i?.id)]
            }
        })
        setLoadingSubmit(false)
        if (data?.inventoryChecklistAddProductFromManual?.success == 1) {
            addToast(formatMessage({ defaultMessage: 'Thêm sản phẩm thành công' }), { appearance: 'success' });
            resetData();
        } else {
            addToast(data?.inventoryChecklistAddProductFromManual?.message || formatMessage({ defaultMessage: "Thêm sản phẩm không thành công" }), { appearance: 'error' });
        }
    }

    const resetData = () => {
        setSearch({
            searchText: null,
            searchType: '',
            searchStatus: 'new',
            page: 1,
            limit: 24,
        })
        setIds([])
        onHide();
    }
    const formFilterStatusAmount = () => {
        return (
            <Select
                options={SEARCH_TYPE}
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                value={SEARCH_TYPE?.find(item => item?.value == search?.searchType)}
                onChange={value => {
                    setSearch({
                        ...search,
                        searchType: value?.value
                    })
                }}
                styles={{
                    container: (styles) => ({
                        ...styles,
                        zIndex: 9999999
                    }),
                }}
                formatOptionLabel={(option, labelMeta) => {
                    return <div className="d-flex align-items-center">
                        {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                        {option.label}
                    </div>
                }}
            />
        )
    }

    return (
        <Modal
            size="xl"
            show={!!checklistid}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName="modal-show-connect-product"
            centered
            onHide={resetData}
            backdrop={true}
        >
            <Modal.Header closeButton={true}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Thêm nhanh sản phẩm kiểm kho' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pb-0">
                <div className='row d-flex align-items-center'>
                    <div className='col-12 fs-14'>
                        {formatMessage({ defaultMessage: 'Kho' })}: {warehouseId?.label}
                    </div>
                    <div className="col-12 input-icon py-5" >
                        <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
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
                </div>
                <div className='row d-flex align-items-center'>
                    <div className='col-6 d-flex flex-column'>
                        <div className='mb-4'>
                            {formatMessage({defaultMessage: 'Loại sản phẩm'})}
                        </div>
                        <div>
                            {
                                formFilterStatusAmount()
                            }
                        </div>
                    </div>
                    <div className='col-6 d-flex flex-column'>
                        <div className='mb-4'>
                            {formatMessage({defaultMessage: 'Loại trạng thái'})}
                        </div>
                        <div>
                            <Select
                                options={SEARCH_STATUS}
                                className='w-100'
                                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                                value={SEARCH_STATUS?.find(item => item?.value == search?.searchStatus)}
                                onChange={value => {
                                    setSearch({
                                        ...search,
                                        searchStatus: value?.value
                                    })
                                }}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 9999999
                                    }),
                                }}
                                formatOptionLabel={(option, labelMeta) => {
                                    return <div className="d-flex align-items-center">
                                        {option.label}
                                    </div>
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className='row'>
                    <div className='col-12 py-5 fs-14'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn' })}: {ids.length + totalSelectd} <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Tổng sản phẩm hàng hóa trong phiếu kiểm kho' })}
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
                            }} className='py-2 w-100 font-weight-bold' style={{ color: '#FF5629' }} role="button"> {formatMessage({ defaultMessage: 'Chọn tất cả sản phẩm ở trang hiện tại' })}</span>
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
                                    let isSelected = product?.in_checklist || ids.find(e => (e?.whId == product?.sme_store_id) && (e?.id == product?.variant?.id))
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
                                                <div className='mb-3 d-flex'>
                                                    <div style={{ width: 80 }} className="mr-6">
                                                        <Checkbox
                                                            size="checkbox-md"
                                                            inputProps={{
                                                                'aria-label': 'checkbox',
                                                            }}
                                                            isSelected={isSelected}
                                                            disabled={product?.in_checklist}
                                                            onChange={(e) => {
                                                                e.target.checked ?
                                                                    setIds(prevState => ([...prevState, { id: product?.variant?.id, whId: product?.sme_store_id }])) :
                                                                    setIds(ids?.filter(item => item?.id !== product?.variant?.id));

                                                            }}
                                                        />
                                                    </div>
                                                    {product?.in_any_checklist_not_complete == 1 && <span style={{ color: '#ff5629' }}>Đang kiểm kho</span>}
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
                                                    <div>
                                                        <InfoProduct
                                                            name={product.variant?.sme_catalog_product?.name}
                                                            sku={product.variant?.sku}
                                                            url={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`}
                                                        />
                                                        {/* <Link to={!hasAttribute ? `/products/edit/${product?.variant?.sme_catalog_product?.id}` : `/products/stocks/detail/${product.variant_id}`} target="_blank">
                                                            <p className='font-weight-normal text-truncate-sku mb-1 fs-14' style={{ color: 'black' }} >{product.variant?.sme_catalog_product?.name}</p>
                                                        </Link>
                                                        <p className='mb-2 d-flex align-items-center'>
                                                            <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                            <span className='text-truncate-sku fs-12 ml-2'>{product.variant?.sku}</span>
                                                        </p> */}
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
                        totalPage={totalPage}
                        loading={loading}
                        limit={search.limit}
                        quickAdd={true}
                        totalRecord={totalRecord}
                        count={data?.sme_catalog_inventory_items?.length}
                        onPanigate={(page) => setSearch({ ...search, page: page })}
                        onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}
                        // basePath={`/products/edit/${smeId}/affiliate`}
                        emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
                    />
                </div>
                {
                    <LoadingDialog show={loadingSubmit} />
                }
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
                        type="button"
                        className="btn mr-4"
                        onClick={addProductFromFilter}
                        style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff', width: 250 }}
                    >
                        {formatMessage({ defaultMessage: 'Chọn tất cả theo điều kiện lọc' })} ({formatNumberToCurrency(data?.sme_catalog_inventory_items_aggregate?.aggregate?.count || 0)})
                    </button>
                    <button
                        disabled={ids.length + totalSelectd == 0}
                        type="button"
                        onClick={addProductFromManual}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        OK
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
};

export default memo(ModalQuicklyAddProducts);