/* eslint-disable no-unused-expressions */
import { useQuery } from "@apollo/client";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import Select from "react-select";
import { useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import InfoProduct from '../../../../components/InfoProduct';
import Pagination from '../../../../components/PaginationModal';
import query_scGetProductVariants from '../../../../graphql/query_scGetProductVariants';
import { useFormikContext } from "formik";

const LIMIT_ADD_PRODUCT = 300;

const ModalAddVariants = ({
    show,
    onHide,
    productsScheduled,
    onAddProductsScheduled,
    optionsStore,
    currentStore
}) => {
    const history = useHistory()
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();
    const [productSelect, setProductSelect] = useState([]);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        tag: [],
        page: 1,
        limit: 25,
    });
    const { setFieldValue, errors, touched } = useFormikContext();

    const { data, loading } = useQuery(query_scGetProductVariants, {
        variables: {
            page: search?.page,
            per_page: search?.limit,
            product_status: 10,
            status: 10,
            ...(currentStore ? {
                store_id: +currentStore
            } : {}),
            ...(!!search.searchText ? {
                q: search.searchText,
            } : {}),
            out_of_stock: 1
        },
        fetchPolicy: 'cache-and-network'
    });

    let totalRecord = data?.scGetProductVariants?.total || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const isSelectedAll = useMemo(() => {
        if (!data || data?.scGetProductVariants?.variants?.length == 0) return false;

        return data?.scGetProductVariants?.variants?.every(variant => productsScheduled?.some(item => item?.id == variant?.id) || productSelect?.some(item => item?.id == variant?.id));
    }, [productSelect, productsScheduled, data]);
    const handleSelectAll = useCallback(
        (e) => {
            if (isSelectedAll) {
                setProductSelect(prev => prev.filter(item => !data?.scGetProductVariants?.variants?.some(variant => variant?.id == item?.id)))
            } else {
                const currentTotal = productSelect.length + productsScheduled.length;

                const data_filtered = data?.scGetProductVariants?.variants?.filter(
                    _product => !productSelect?.some(__ => __?.id == _product?.id) && !productsScheduled?.some(__ => __?.id == _product?.id)
                )?.slice(0, LIMIT_ADD_PRODUCT - currentTotal);

                setProductSelect(prevState => ([...prevState, ...data_filtered]));
            }
        }, [data?.scGetProductVariants, productSelect, productsScheduled, isSelectedAll]
    );

    const resetData = useCallback(() => {
        setSearch({
            searchText: null,
            searchType: '',
            tag: [],
            originImg: null,
            page: 1,
            limit: 25,
        })
        setProductSelect([])
        onHide();
    }, []);

    const addProductFromFilter = useCallback(
        () => {
            onAddProductsScheduled(productSelect);
            productSelect?.forEach(product => {
                setFieldValue(`campaign-${product?.id}-discount-value`, '')
                setFieldValue(`campaign-${product?.id}-discount-percent`, '')
                setFieldValue(`campaign-${product?.id}-promotion_price`, '')
                setFieldValue(`campaign-${product?.id}-purchase_limit`, {value: 1, label: "Không giới hạn"})
                setFieldValue(`campaign-${product?.id}-quantity_per_user`, {value: 1, label: "Không giới hạn"})
                setFieldValue(`campaign-${product?.id}-purchase_limit_number`, 1)
                setFieldValue(`campaign-${product?.id}-quantity_per_user_number`, 1)
            })
            resetData();
        }, [productSelect]
    );

    const columns = [
        {
            title: <div className='d-flex align-items-center'>
                <Checkbox
                    size="checkbox-md"
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    disabled={loading}
                    isSelected={isSelectedAll}
                    onChange={handleSelectAll}
                />
                <span className='ml-1'>{formatMessage({ defaultMessage: 'Tên hàng hóa' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '37.5%',
            render: (_item, record) => {
                const [isSelected, isDisabled] = [
                    productSelect?.map(_product => _product?.id).includes(record?.id) || productsScheduled?.map(_product => _product?.id).includes(record?.id),
                    productsScheduled?.map(_product => _product?.id).includes(record?.id)
                ];

                const imgOrigin = record?.productAssets?.find(_asset => _asset.type == 4);
                const urlImage = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (record?.productAssets || []).filter(_asset => _asset.type == 1)[0];

                return <div className='d-flex align-items-center'>
                    <Checkbox
                        size="checkbox-md"
                        inputProps={{
                            'aria-label': 'checkbox',
                        }}
                        isSelected={isSelected}
                        disabled={isDisabled || loading}
                        onChange={(e) => {
                            if (e.target.checked) {
                                if ((productSelect.length + productsScheduled.length) >= LIMIT_ADD_PRODUCT) return;
                                setProductSelect(prevState => ([...prevState, record]))
                            } else {
                                setProductSelect(prevState => prevState.filter(_state => _state.id !== record?.id))
                            }
                        }}
                    />
                    <div className='ml-1'>
                        <InfoProduct
                            name={record?.product?.name}
                            isSingle
                            productOrder={true}
                            url={() => window.open(`/product-stores/edit/${record?.product?.id}`, "_blank")}
                        />
                        {<span className="text-muted">{record?.name}</span>}
                    </div>
                </div>
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '37.5%',
            render: (_item, record) => {
                return <InfoProduct
                    sku={record?.sku || '--'}
                    isSingle
                />
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Gian hàng' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '25%',
            render: (_item, record) => {
                const store = optionsStore?.find(store => store?.value == record?.product?.store_id);
                if (!store) return <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>;

                return <div className='d-flex justify-content-center align-items-center'>
                    <img
                        style={{ width: 15, height: 15 }}
                        src={store?.logo}
                        className="mr-2"
                    />
                    <span>{store?.label}</span>
                </div>
            }
        },
    ];

    return (
        <Fragment>
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
                        {formatMessage({ defaultMessage: 'Thêm hàng hóa' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className='row mb-4'>
                        <div className="col-4 input-icon" >
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
                    <div className='mb-4 d-flex align-items-center'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn: {count} / {max}' }, { count: productSelect.length + productsScheduled.length, max: LIMIT_ADD_PRODUCT })}</span>
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {formatMessage({ defaultMessage: 'Tổng số sản phẩm đã được chọn' })}
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
                            {loading && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}
                            <Table
                                style={loading ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={data?.scGetProductVariants?.variants || []}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
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
                                    loading={loading}                                    
                                    quickAdd={false}
                                    limit={search.limit}
                                    totalRecord={totalRecord}
                                    count={data?.scGetProductVariants?.variants?.length}
                                    onPanigate={(page) => setSearch({ ...search, page: page })}
                                    onSizePage={(limit) => setSearch({ ...search, limit: Number(limit), page: 1 })}
                                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}
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
                            disabled={(productSelect.length + productsScheduled.length) == 0}
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