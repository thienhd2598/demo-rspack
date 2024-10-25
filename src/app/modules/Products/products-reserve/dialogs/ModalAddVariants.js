import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useQuery } from "@apollo/client";
import { useHistory, Link } from "react-router-dom";
import { useToasts } from 'react-toast-notifications';
import { useIntl } from 'react-intl';
import { Checkbox } from '../../../../../_metronic/_partials/controls';
import Pagination from '../../../../../components/PaginationModal';
import InfoProduct from '../../../../../components/InfoProduct';
import query_scGetProductVariants from '../../../../../graphql/query_scGetProductVariants';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import ModalCombo from '../../products-list/dialog/ModalCombo';
import { formatNumberToCurrency } from '../../../../../utils';
import { sum } from 'lodash';
import { useFormikContext } from 'formik';
import { queryGetSmeVariantsByIds } from '../../ProductsUIHelpers';
import query_scGetWarehouseMapping from "../../../../../graphql/query_scGetWarehouseMapping";

const LIMIT_ADD_VARIANT = 100;

const ModalAddVariants = ({
    show,
    onHide,
    variantsReserve,
    onAddVariantsReserve,
}) => {
    const history = useHistory()
    const { addToast } = useToasts();
    const [dataCombo, setDataCombo] = useState(null);
    const [smeVariants, setSmeVariants] = useState([]);
    const [loadingSmeVariant, setLoadingSmeVariant] = useState(false);
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();

    const [variantSelect, setVariantSelect] = useState([]);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        page: 1,
        limit: 20,
    });

    const {data: dataWarehouseMapping} = useQuery(query_scGetWarehouseMapping, {
        variables: {
            store_id: +values?.store?.value
        }
    })

    const { data, loading } = useQuery(query_scGetProductVariants, {
        variables: {
            per_page: search?.limit,
            page:search?.page,
            ...(!!search.searchText ? {
                q: `%${search.searchText.trim()}%`
            } : ""),
            product_status: 10,
            status: 10,
            filter_map_sme: 1,
            product_status_id: {_is_null: true},
            store_id: values?.store?.value
        },
        fetchPolicy: 'cache-and-network',
        onCompleted: async(data) => {
            setLoadingSmeVariant(true)
            const smeVariantIds = data?.scGetProductVariants?.variants?.map(item => item?.sme_product_variant_id)
            const smeVariants = await queryGetSmeVariantsByIds(smeVariantIds);
            const newData = data?.scGetProductVariants?.variants?.map(variant => {
                const foundVariant = smeVariants?.sme_catalog_product_variant?.find(item => item?.id == variant?.sme_product_variant_id)
                return {
                    ...variant,
                    stock_available: foundVariant?.inventory?.stock_available,
                    attributes: foundVariant?.attributes,
                    is_combo: foundVariant?.is_combo,
                    inventories: foundVariant?.inventories,
                    inventory: foundVariant?.inventory,
                    combo_items: foundVariant?.combo_items,
                    sme_sku: foundVariant?.sku,
                    unit: foundVariant?.unit
                }
            })
            setSmeVariants(newData)
            setLoadingSmeVariant(false)
        }
    });

    let totalRecord = data?.scGetProductVariants?.total || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const isSelectedAll = useMemo(() => {
        if (!data || data?.scGetProductVariants?.variants?.length == 0) return false;

        return data?.scGetProductVariants?.variants?.every(variant => variantsReserve?.some(item => item?.id == variant?.id) || variantSelect?.some(item => item?.id == variant?.id));
    }, [variantSelect, variantsReserve, data]);

    const handleSelectAll = useCallback(
        (e) => {
            if (isSelectedAll) {
                setVariantSelect(prev => prev.filter(item => !smeVariants?.some(variant => variant?.id == item?.id)))
            } else {
                const currentTotal = variantSelect.length + variantsReserve.length;
                // if (currentTotal >= data?.sme_catalog_product_variant.length) return;

                const data_filtered = smeVariants?.filter(
                    _variant => !variantSelect?.some(__ => __?.id == _variant?.id) && !variantsReserve?.some(__ => __?.id == _variant?.id)
                )?.slice(0, LIMIT_ADD_VARIANT - currentTotal);

                setVariantSelect(prevState => ([...prevState, ...data_filtered]));
            }

        }, [smeVariants, variantSelect, variantsReserve, isSelectedAll]
    );

    const resetData = useCallback(() => {
        setSearch({
            searchText: null,
            searchType: '',
            page: 1,
            limit: 20,
        })
        setVariantSelect([])
        onHide();
    }, []);

    const addProductFromFilter = useCallback(
        () => {
            onAddVariantsReserve(variantSelect);
            resetData();
        }, [variantSelect]
    );

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    disabled={loading || loadingSmeVariant}
                    isSelected={isSelectedAll}
                    onChange={handleSelectAll}
                />
                <span className='ml-1'>{formatMessage({ defaultMessage: 'Tên hàng hóa' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '40%',
            render: (_item, record) => {
                const [isSelected, isDisabled] = [
                    variantSelect?.map(_variant => _variant?.id).includes(record?.id) || variantsReserve?.map(_variant => _variant?.sc_variant_id).includes(record?.id) || variantsReserve?.map(_variant => _variant?.id).includes(record?.id),
                    variantsReserve?.map(_variant => _variant?.sc_variant_id).includes(record?.id) || variantsReserve?.map(_variant => _variant?.id).includes(record?.id)
                ];

                return <div className='d-flex align-items-center'>
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        isSelected={isSelected}
                        disabled={isDisabled || loading || loadingSmeVariant}
                        onChange={(e) => {
                            if (e.target.checked) {
                                if ((variantSelect.length + variantsReserve.length) >= LIMIT_ADD_VARIANT) return;
                                setVariantSelect(prevState => ([...prevState, record]))
                            } else {
                                setVariantSelect(prevState => prevState.filter(_state => _state.id !== record?.id))
                            }
                        }}
                    />
                    <div className='ml-1 d-flex flex-column'>
                        <InfoProduct
                            name={record?.product?.name}
                            isSingle
                            sku={record?.sku}
                            productOrder={true}
                            url={() => window.open(`/product-stores/edit/${record?.product?.id}`, "_blank")}
                        />
                        <div className='text-muted'>
                            {record?.name || ''}
                        </div>
                    </div>
                </div>
            }
        },
        {
            title: 'SKU hàng hóa kho liên kết',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '45%',
            render: (_item, record) => {
                return (
                    <div className='d-flex flex-column'>
                        <div className='d-flex align-items-center'>
                            <InfoProduct
                                sku={record?.sme_sku}
                                isSingle
                            />
                            {
                                record?.combo_items?.length > 0 && (
                                    <span
                                        className='text-primary cursor-pointer ml-2'
                                        style={{ minWidth: 'fit-content' }}
                                        onClick={() => setDataCombo(record?.combo_items)}
                                    >
                                        Combo
                                    </span>
                                )
                            }
                        </div>
                    </div>
                )
            }
        },
        {
            title: <p><span>{formatMessage({ defaultMessage: 'Tồn sẵn sàng bán' })}</span>
                <OverlayTrigger
                    overlay={
                        <Tooltip>
                            {formatMessage({ defaultMessage: 'Tồn sẵn sàng bán của sản phẩm kho liên kết' })}
                        </Tooltip>
                    }
                >
                    <span className="ml-1" style={{ position: 'relative', top: '-1px' }}>
                        <svg xmlns="http://www.w3.org/1800/svg" width="12" height="12" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                        </svg>
                    </span>
                </OverlayTrigger>
            </p>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                const totalStockAvaiable = sum(record?.inventories?.filter(iv =>!!dataWarehouseMapping?.scGetWarehouseMapping?.find(item => item?.sme_warehouse_id == iv?.sme_store_id))?.map(item => item?.stock_available))
                // if (record?.is_combo) {
                //     // const stockReadyCombo = record?.combo_items?.map(item => {
                //     //     return Math.floor(sum(item?.combo_item?.inventories?.map(iv => iv?.stock_available))/item?.quantity)
                //     // })

                //     return (
                //         <div className="d-flex flex-column">
                //             <span>{formatNumberToCurrency(totalStockAvaiable)}</span>
                //             <div className="mt-6 d-flex flex-column" style={{ gap: 6 }}>
                //                 {record?.combo_items?.map(item => {
                //                     const stockReadyComboItem = Math.floor(sum(item?.combo_item?.inventories?.map(iv => iv?.stock_available)))

                //                     return (
                //                         <span>{formatNumberToCurrency(stockReadyComboItem)}</span>
                //                     )
                //                 })}
                //             </div>
                //         </div>
                //     )
                // } else {
                    return (
                        <span>{formatNumberToCurrency(totalStockAvaiable)}</span>
                    )
                // }
            }
        },
    ];

    return (
        <Fragment>
            <ModalCombo dataCombo={dataCombo} onHide={() => setDataCombo(null)} />
            <Modal
                size="xl"
                show={show}
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName="modal-show-connect-product"
                centered
                backdrop={true}
            >
                <Modal.Header closeButton={true}>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className='row mb-4'>
                        <div className="col-6 input-icon" >
                            <input
                                type="text"
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Tên/SKU" })}
                                style={{ height: 40 }}
                                onBlur={(e) => {
                                    setSearch({ ...search, searchText: e.target.value, page: 1 })
                                }}
                                onKeyDown={e => {
                                    if (e.keyCode == 13) {
                                        setSearch({ ...search, searchText: e.target.value, page: 1 })
                                    }
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6" style={{ position: 'absolute', top: 20 }}></i></span>
                        </div>
                    </div>
                    <div className='d-flex align-items-center mb-6'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{color: '#FFD700'}} class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                        </svg>
                        <span className='ml-2 text-success'>
                            {formatMessage({ defaultMessage: 'Hàng hóa sàn đang hoạt động và có liên kết với hàng hoá kho thì mới tạo được phiếu dự trữ.' })}
                        </span>
                    </div>
                    <div className='mb-4 d-flex align-items-center'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn: {count} / {max}' }, { count: variantSelect.length + variantsReserve.length, max: LIMIT_ADD_VARIANT })}</span>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Số lượng hàng hoá đã chọn' })}
                                </Tooltip>
                            }
                        >
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
                            {(loading || loadingSmeVariant) && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}
                            <Table
                                style={(loading || loadingSmeVariant) ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={smeVariants || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                scroll={{ y: 350 }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                        {data?.scGetProductVariants?.variants?.length > 0 && (
                            <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                                <Pagination
                                    page={search.page}
                                    totalPage={totalPage}
                                    loading={loading || loadingSmeVariant}
                                    isAddReserve={true}
                                    quickAdd={true}
                                    limit={search.limit}
                                    totalRecord={totalRecord}
                                    count={data?.scGetProductVariants?.variants?.length}
                                    onPanigate={(page) => setSearch({ ...search, page: page })}
                                    onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}
                                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}
                                />
                            </div>
                        )}
                    </div>
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
                            disabled={(variantSelect.length + variantsReserve.length) == 0}
                            onClick={addProductFromFilter}
                            style={{ width: 120 }}
                        >
                            {formatMessage({ defaultMessage: 'Đồng ý' })}
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        </Fragment>
    )
};

export default memo(ModalAddVariants);