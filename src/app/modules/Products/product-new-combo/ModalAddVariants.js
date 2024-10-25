import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useMutation, useQuery } from "@apollo/client";
import Form from 'react-bootstrap/Form';
import { useLocation, useHistory, Link } from "react-router-dom";
import { useProductsUIContext } from '../ProductsUIContext';
import { Checkbox } from '../../../../_metronic/_partials/controls'
import Pagination from '../../../../components/PaginationModal';
import { useToasts } from 'react-toast-notifications';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import query_sme_catalog_product_variant from '../../../../graphql/query_sme_catalog_product_variant';
import { Field, Formik } from 'formik';
import { RadioGroup } from '../../../../_metronic/_partials/controls/forms/RadioGroup';
import InfoProduct from '../../../../components/InfoProduct';
import { useIntl } from 'react-intl';
import { flatten } from 'lodash';

const ModalAddVariants = ({
    show,
    onHide
}) => {
    const history = useHistory()
    const { addToast } = useToasts();
    const { setVariantsCombo, variantsCombo } = useProductsUIContext();
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const { formatMessage } = useIntl()
    const [productsConnected, setProductsConnected] = useState([]);
    const [variantSelect, setVariantSelect] = useState([]);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        page: 1,
        limit: 24,
    });

    const searchType = [
        {
            value: '',
            label: formatMessage({ defaultMessage: 'Tất cả sản phẩm' })
        },
        {
            value: 'in-stock',
            label: formatMessage({ defaultMessage: 'Sản phẩm còn hàng' })
        },
        {
            value: 'out-stock',
            label: formatMessage({ defaultMessage: 'Sản phẩm hết hàng' })
        },

    ]

    const { data: data, loading } = useQuery(query_sme_catalog_product_variant, {
        variables: {
            limit: search.limit,
            offset: (search.page - 1) * search.limit,
            where: {
                ...(search.searchType == 'in-stock' ? {
                    inventory: { stock_actual: { _gt: 0 } },
                } : ""
                ),
                sme_catalog_product: { is_combo: { _eq: 0 } },
                ...(search.searchType == 'out-stock' ? {
                    inventory: { stock_actual: { _eq: 0 } },
                } : ""
                ),
                ...(!!search.searchText ? {
                    _or: [
                        { sme_catalog_product: { name: { _ilike: `%${search.searchText.trim()}%` } } },
                        { sku: { _ilike: `%${search.searchText.trim()}%` } },
                    ],
                } : ""),
                product_status_id: {_is_null: true}
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.sme_catalog_product_variant_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const handleSelectAll = useCallback(
        () => {
            const currentTotal = variantSelect.length + variantsCombo.length;
            if (currentTotal >= data?.sme_catalog_product_variant.length) return;

            const data_filtered = data?.sme_catalog_product_variant?.filter(
                _variant => !variantSelect?.some(__ => __?.id == _variant?.id) && !variantsCombo?.some(__ => __?.id == _variant?.id) && _variant?.in_any_checklist_not_complete != 1
            )?.slice(0, 10 - currentTotal);

            setVariantSelect(prevState => ([...prevState, ...data_filtered]));
        }, [data?.sme_catalog_product_variant, variantSelect, variantsCombo]
    );

    // chi co pl => all item !unit
    // co pl + unit => 
    // chi co unit => atributes rong

    const addProductFromFilter = useCallback(() => {
        const groupVariant = Object.groupBy(variantSelect || [], (variant) => variant?.sme_catalog_product?.id);
 
        const groupProduct = Object.keys(groupVariant)?.map(key => {
            let varianstAddCombo = []
            // case có variants và đơn vị tính
            const selectVariantAttributes = groupVariant[key]?.filter(variant => variant?.attributes?.length)
            const groupNameVariants = Object.groupBy(selectVariantAttributes || [], (att) => att?.attributes[0]?.sme_catalog_product_attribute_value?.name);

            varianstAddCombo.push(...Object.keys(groupNameVariants)?.flatMap(key => {
                const isAdd = groupNameVariants[key]?.some(variant => variantsCombo?.find(vrcb => (vrcb?.sme_catalog_product?.id == variant?.sme_catalog_product?.id && vrcb?.name == variant?.name)))
                return isAdd ? [] : groupNameVariants[key]?.find(item => variantSelect?.includes(item))
            }))

            // case chỉ có đơn vị tính
            const selectNotFoundVariantAttributes = groupVariant[key]?.filter(variant => !variant?.attributes?.length)
            const isAddUnit = selectNotFoundVariantAttributes?.some(variant => variantsCombo?.find(vrcb => vrcb?.sme_catalog_product?.id == variant?.sme_catalog_product?.id))
   
            if(!isAddUnit) {
                varianstAddCombo.push(selectNotFoundVariantAttributes?.find(item => variantSelect?.includes(item)))
            }
            
            return varianstAddCombo
       
        })

        setVariantsCombo(prevState => prevState.concat(flatten(groupProduct).filter(Boolean)));
        resetData();
    }, [variantSelect, variantsCombo]);

    const resetData = () => {
        setSearch({
            searchText: null,
            searchType: '',
            page: 1,
            limit: 24,
        })
        setVariantSelect([])
        onHide();
    }

    const setStateSearchType = (value) => {
        if (search.searchType != value) {
            setSearch({ ...search, searchType: value })
        }
    }
    const formFilterStatusAmount = () => {
        return (
            <Formik
                initialValues={{
                    searchType: search.searchType
                }}
            >
                {({ values }) => {
                    setStateSearchType(values?.searchType)

                    return (<Field
                        name="searchType"
                        component={RadioGroup}
                        curr
                        value={search.searchType}
                        // label={'Loại kiểm kho'}
                        customFeedbackLabel={' '}
                        // disabled={true}
                        options={searchType}
                    >

                    </Field>
                    )
                }}
            </Formik>
        )
    }

    const checkDisabledAdd = (variant) => {
        let isDisabled = false
        if(variant?.attributes?.length) {
            isDisabled = variantsCombo?.some(vrcb => (variant?.sme_catalog_product?.id == vrcb?.sme_catalog_product?.id && vrcb?.name == variant?.name))
        } else {
            isDisabled = variantsCombo?.some(vrcb => vrcb?.sme_catalog_product?.id == variant?.sme_catalog_product?.id)
        }
        
        return isDisabled
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
                    {formatMessage({ defaultMessage: 'Thêm hàng hóa' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default pb-0">
                <div className='row'>
                    <div className="col-4 input-icon pb-5" >
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage({ defaultMessage: "Tên sản phẩm/SKU" })}
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
                        <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                    </div>
                    <div className='col-12 d-flex fs-14' style={{ marginBottom: '-1.75rem' }}>
                        {formFilterStatusAmount()}
                    </div>
                    <div className='col-12 py-4 fs-14'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn' })}: {variantSelect.length + variantsCombo.length} / 10 <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Tổng sản phẩm con có trong combo' })}
                                </Tooltip>
                            }
                        >
                            <i className="ml-2 fs-14 fas fa-info-circle"></i>
                        </OverlayTrigger></span>
                    </div>
                </div>
                <div className='row' style={{ maxHeight: 400, overflowY: 'auto', overflowX: 'hidden', minHeight: loading ? 400 : 0}}>
                    <div className='mb-3 mx-3 w-100' style={{ border: '1px solid #ebedf3', }}>
                    <div className="d-flex align-items-center py-2 px-4" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
                        <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
                        </svg>
                        <span className="fs-14" style={{ color: '#055160' }}>
                        {formatMessage({ defaultMessage: 'Mỗi sản phẩm phân loại chỉ được chọn 1 đơn vị tính để thêm vào combo.' })}
                        </span>
                    </div>
                        <div className='row py-2 px-8 flex-wrap justify-content-between'>
                            {!loading && <span
                                className='py-2 w-100 font-weight-bold text-primary'
                                // style={{ color: '#FF5629' }}
                                role="button"
                                onClick={() => {
                                    handleSelectAll()
                                }}
                            >
                                {formatMessage({ defaultMessage: 'Chọn tất cả sản phẩm ở trang hiện tại' })}
                            </span>}
                            {
                                loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                                    <span className="ml-3 spinner spinner-primary"></span>
                                </div>
                            }
                            {
                                !loading && data?.sme_catalog_product_variant?.map((_variant, index) => {
                                    let imgAssets = null;
                                    if (_variant?.sme_catalog_product_variant_assets?.[0]?.asset_url) {
                                        imgAssets = _variant?.sme_catalog_product_variant_assets[0]
                                    }
                                    
                                    const [hasAttribute, isSelected, isDisabled] =
                                        [
                                            _variant?.attributes?.length > 0,
                                            variantSelect?.map(_variant => _variant?.id).includes(_variant?.id) || variantsCombo?.map(_variant => _variant?.id).includes(_variant?.id),
                                             variantsCombo?.map(_variant => _variant?.id).includes(_variant?.id) || _variant?.in_any_checklist_not_complete == 1 || checkDisabledAdd(_variant)
                                        ];
               

                                    return (
                                        <div className='mb-5' style={{ width: '32%', border: '1px solid #C4C4C4' }} key={index}>
                                            <div className='p-3' style={{ verticalAlign: 'top', flexDirection: 'row', marginBottom: 16, overflow: "hidden" }}>
                                                <div className='mb-3 d-flex align-items-center'>
                                                    <div style={{ width: 80 }} className="mr-6">
                                                        <Checkbox
                                                            size="checkbox-md"
                                                            inputProps={{
                                                                'aria-label': 'checkbox',
                                                            }}
                                                            isSelected={isSelected}
                                                            disabled={isDisabled}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    if ((variantSelect.length + variantsCombo.length) >= 10) return;
                                                                    setVariantSelect(prevState => ([...prevState, _variant]))
                                                                } else {
                                                                    setVariantSelect(prevState => prevState.filter(_state => _state.id !== _variant?.id))
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {_variant?.in_any_checklist_not_complete == 1 && <span style={{ color: '#ff5629' }}>Đang kiểm kho</span>}
                                                </div>
                                                <div className='d-flex'>
                                                    <Link to={`/products/edit/${_variant?.sme_catalog_product?.id}`} target="_blank">
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
                                                            name={_variant?.sme_catalog_product?.name}
                                                            sku={_variant?.sku}
                                                            url={`/products/edit/${_variant?.sme_catalog_product?.id}`}
                                                        />
                                                        {/* <Link to={`/products/edit/${_variant?.sme_catalog_product?.id}`} target="_blank">
                                                            <p className='font-weight-normal text-truncate-sku mb-1 fs-14 line-clamp' style={{ color: 'black' }} >
                                                                {_variant?.sme_catalog_product?.name}
                                                            </p>
                                                        </Link>
                                                        <p className='mb-2 d-flex align-items-center'>
                                                            <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                            <span className='text-truncate-sku fs-12 ml-2'>{_variant?.sku}</span>
                                                        </p> */}
                                                        {!!hasAttribute && <p className='font-weight-normal mb-2 text-secondary-custom fs-12' >{_variant?.name?.replaceAll(' + ', ' - ')}</p>}
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
                        quickAdd={true}
                        limit={search.limit}
                        totalRecord={totalRecord}
                        count={data?.sme_catalog_product_variant?.length}
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
                        className="btn btn-secondary mr-4"
                        style={{ width: 120 }}
                    >
                        {formatMessage({ defaultMessage: 'Hủy' })}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={(variantSelect.length + variantsCombo.length) == 0}
                        onClick={addProductFromFilter}
                        style={{ width: 120 }}
                    >
                        {formatMessage({ defaultMessage: 'Đồng ý' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
};

export default memo(ModalAddVariants);