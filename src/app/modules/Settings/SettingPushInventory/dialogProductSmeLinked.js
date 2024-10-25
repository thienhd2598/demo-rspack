import React, { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useMutation, useQuery } from "@apollo/client";
import { useHistory, Link, useLocation } from "react-router-dom";
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { sum } from 'lodash';
import Pagination from '../../../../components/PaginationModal';
import InfoProduct from '../../../../components/InfoProduct';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import query_scGetProductVariants from '../../../../graphql/query_scGetProductVariants'
import mutate_scAddVariantPushInventory from '../../../../graphql/mutate_scAddVariantPushInventory'
import queryString from 'querystring';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { useFormikContext } from 'formik';
import dayjs from "dayjs";
import ConfirmDialog from './confirmDialog';

const DialogProductSmeLinked = ({ totalVariant,radioChange, variantAdded, show, onHide }) => {
    const { addToast } = useToasts()
    const { formatMessage } = useIntl();
    const location = useLocation();
    const inputRef = useRef()
    const { values } = useFormikContext()
    const [confirmDialog, setConfirmDialog] = useState(false)
    const params = queryString.parse(location.search.slice(1, 100000))

    const [variantSelect, setVariantSelect] = useState([...variantAdded]);
    const [search, setSearch] = useState({
        searchText: null,
        page: 1,
        limit: 20,
    });
    const { data, loading, error, refetch } = useQuery(query_scGetProductVariants, {
        variables: {
            per_page: search.limit,
            page: search.page,
            q: !!search.searchText ? search.searchText : '',
            store_id: params?.store ? +params?.store : null,
            filter_map_sme: 1,
            order_by: {
                column: 'created_at'
            },
            is_virtual: 0
        },
        fetchPolicy: 'network-only',
    });

    const [addVariantInventory, { loading: loadingAddVariantInventory }] = useMutation(mutate_scAddVariantPushInventory,
        { awaitRefetchQueries: true, refetchQueries: ['scGetSettingPushInventory'] }
    );


    let totalRecord = data?.scGetProductVariants?.total || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);


    const combinationVariant = (variant) => {
        let hasAttribute = variant?.product?.product?.variantAttributeValues?.length > 0;
        if (hasAttribute) {
            let combinationVariant = [];

            let _sc_product_attributes_value = variant?.product?.sc_product_attributes_value ? JSON.parse(variant?.product?.sc_product_attributes_value) : []
            let _sc_product_variant_attr = variant?.product?.product.productVariantAttributes

            let _variantAttributeValue = variant?.product?.product.variantAttributeValues?.filter(_value => {
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
    }

    const isSelectedAll = useMemo(() => {
        if (!data || data?.scGetProductVariants?.variants?.length == 0) return false;

        return data?.scGetProductVariants?.variants?.flatMap(variant =>
            variantAdded?.map(elm => elm?.id)?.includes(variant?.id) ? [] : variant)?.every(variant =>
                variantSelect?.some(item => item?.id == variant?.id));
    }, [variantSelect, data, variantAdded]);

    const dataTable = useMemo(() => {
        return data?.scGetProductVariants?.variants?.map(item => ({
            sku: item?.sku,
            product: item,
            created_at: item?.created_at
        }))
    }, [data])


    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                <Checkbox
                    size="checkbox-md"
                    inputProps={{ 'aria-label': 'checkbox', }}
                    isSelected={isSelectedAll}
                    onChange={() => {
                        if (isSelectedAll) {
                            setVariantSelect(variantSelect.filter(x => {
                                return !data?.scGetProductVariants?.variants?.flatMap(variant =>
                                    variantAdded?.map(elm => elm?.id)?.includes(variant?.id) ? [] : variant).some(variant => variant.id === x?.id);
                            }))
                        } else {
                            const tempArray = [...variantSelect];
                            const filterVariantAdded = data?.scGetProductVariants?.variants
                            filterVariantAdded.forEach(variant => {
                                if (variant && !variantSelect.some(item => item.id === variant.id)) {
                                    tempArray.push(variant);
                                }
                            })
                            setVariantSelect(tempArray)
                        }
                    }}
                />
                <span className='ml-1'>{formatMessage({ defaultMessage: 'Tên hàng hóa' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '40%',
            render: (_item, record) => {
                return <div className='d-flex align-items-center'>
                    <Checkbox
                        size="checkbox-md"
                        disabled={variantAdded?.some(variant => variant?.id == record?.product?.id)}
                        notAllow={variantAdded?.some(variant => variant?.id == record?.product?.id)}
                        inputProps={{ 'aria-label': 'checkbox' }}
                        isSelected={variantSelect.some(_id => _id.id == record?.product?.id)}
                        onChange={(e) => {
                            if (variantSelect.some(_id => _id.id == record?.product?.id)) {
                                setVariantSelect(prev => prev.filter(_id => _id.id != record?.product?.id))
                            } else {
                                setVariantSelect(prev => prev.concat([record?.product]))
                            }
                        }}
                    />
                    <div className='ml-1 d-flex flex-column'>
                        <InfoProduct
                            isSingle
                            name={record?.product?.product?.name}
                            short={true}
                            url={`/product-stores/edit/${record?.product?.product?.id}`}
                        />
                        {<p className='font-weight-normal mb-2 text-secondary-custom' >{combinationVariant(record)}</p>}
                    </div>
                </div>
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '35%',
            render: (_item, record) => {
                return (
                    <div className='d-flex align-items-center'>
                        <InfoProduct
                            sku={record?.sku}
                            isSingle
                        />
                    </div>
                )
            }
        },
        // {
        //     title: 'Thời gian tạo',
        //     dataIndex: 'created_at',
        //     key: 'created_at',
        //     align: 'left',
        //     width: '25%',
        //     render: (_item, record) => {
        //         return (
        //             <div className='d-flex align-items-center'>
        //                {record?.created_at ? dayjs(record?.created_at).format("DD/MM/YYYY HH:mm") : '--'}
        //             </div>
        //         )
        //     }
        // },

    ];

    const handleAddVariant = async () => {
        const { data } = await addVariantInventory({
            variables: {
                list_variant_id: variantSelect?.map(variant => variant?.id),
                store_id: params?.store ? +params?.store : null
            }
        })
        if (!!data?.scAddVariantPushInventory?.success) {
            addToast(data?.scAddVariantPushInventory?.message || '', { appearance: 'success' })
            onHide()
            return
        }
        addToast(data?.scAddVariantPushInventory?.message || '', { appearance: 'error' })
    }

    return (
        <Fragment>
            <ConfirmDialog
                show={confirmDialog}
                onHide={() => setConfirmDialog(false)}
                handle={handleAddVariant}
            />
            <LoadingDialog show={loadingAddVariantInventory} />
            <Modal size="xl" show={show} aria-labelledby="example-modal-sizes-title-sm" dialogClassName="modal-show-connect-product" centered onHide={onHide} backdrop={true}>
                <Modal.Header closeButton={true}>
                    <Modal.Title>{formatMessage({ defaultMessage: 'Hàng hóa sàn' })}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className='row mb-4'>
                        <div className="col-6 input-icon" >
                            <input type="text" className="form-control" placeholder={formatMessage({ defaultMessage: "Tên/SKU" })}
                                style={{ height: 40 }}
                                ref={inputRef}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        if (search.searchText == inputRef?.current?.value) {
                                            refetch()
                                            return
                                        }
                                        setSearch({ ...search, searchText: e.target.value, page: 1 })
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                    </div>
                    <div className='mb-4 d-flex align-items-center'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn: {sum}' }, { sum: totalVariant + [...variantSelect]?.filter(variant => !variantAdded?.includes(variant))?.length })}</span>
                        <OverlayTrigger overlay={<Tooltip>{formatMessage({ defaultMessage: 'Số lượng hàng hoá đã chọn' })}</Tooltip>}>
                            <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                </svg>
                            </span>
                        </OverlayTrigger>
                    </div>
                    <div>
                        <div style={{ position: 'relative' }}>
                            {loading && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}

                            {(!!error && !loading) && (
                                <div className="col-12 text-center mt-8" style={{ position: 'absolute', zIndex: 101 }} >
                                    <div className="d-flex flex-column justify-content-center align-items-center">
                                        <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                        <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                        <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
                                            onClick={e => {
                                                e.preventDefault();
                                                refetch()
                                            }}>
                                            {formatMessage({ defaultMessage: 'Tải lại' })}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <Table
                                style={false ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={dataTable || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                scroll={{ y: 350 }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                        <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                            <Pagination
                                page={search.page}
                                totalPage={totalPage}
                                loading={loading}
                                isAddReserve={true}
                                quickAdd={true}
                                limit={search.limit}
                                totalRecord={totalRecord}
                                count={data?.scGetProductVariants?.variants?.length}
                                onPanigate={(page) => setSearch({ ...search, page: page })}
                                onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}
                                emptyTitle=''
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            className="btn btn-secondary mr-4"
                            style={{ width: 120 }}
                            onClick={onHide}
                        >
                            {formatMessage({ defaultMessage: 'Hủy' })}
                        </button>
                        <button
                            type="button"
                            disabled={!variantSelect?.length}
                            className="btn btn-primary"
                            style={{ width: 120 }}
                            onClick={async () => {
                                if (!!values['stateChange']) {
                                    setConfirmDialog(true)
                                } else {
                                    await handleAddVariant()
                                }
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Đồng ý' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
};

export default DialogProductSmeLinked