import { useQuery } from "@apollo/client";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
// import Select from "react-select";
import { useToasts } from 'react-toast-notifications';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Checkbox } from "../../../../_metronic/_partials/controls";
import InfoProduct from "../../../../components/InfoProduct";
import Pagination from "../../../../components/PaginationModal";
import query_scGetProductsModal from "../../../../graphql/query_scGetProductsModal";
import query_report_productSoldScByGMV from "../../../../graphql/query_report_productSoldScByGMV";
import dayjs from "dayjs";
import { queryGetScProductVariants } from "../Constants";
import { formatNumberToCurrency } from "../../../../utils";
import query_scTags from "../../../../graphql/query_scTags";
import Select from 'react-select';

const LIMIT_ADD_PRODUCT = 100;

const TABS_MODAL_ADD_PRODUCT = [
    { type: 'list', title: <FormattedMessage defaultMessage="Danh sách sản phẩm" /> },
    { type: 'top', title: <FormattedMessage defaultMessage="Top 20 sản phẩm" /> },
];

const ModalAddProducts = ({
    show,
    onHide,
    productsCampaign,
    onAddProductsCampaign,
    optionsStore,
    currentStore
}) => {
    const history = useHistory()
    const { addToast } = useToasts();
    const { formatMessage } = useIntl();

    const [isCopied, setIsCopied] = useState(false);
    const [currentTab, setCurrentTab] = useState('list');
    const [productSelect, setProductSelect] = useState([]);
    const [dataTableGVM, setDataTableGVM] = useState([]);
    const [search, setSearch] = useState({
        searchText: null,
        searchType: '',
        tag: [],
        page: 1,
        limit: 25,
    });

    const { data: dataProductTags } = useQuery(query_scTags, {
        fetchPolicy: 'cache-and-network'
    });

    const { data, loading } = useQuery(query_scGetProductsModal, {
        variables: {
            page: search?.page,
            per_page: search?.limit,
            status: 10,
            order_by: {
                column: 'updated_at',
                direction: 'desc'
            },
            out_of_stock: 1,
            ...(currentStore ? {
                store_id: currentStore
            } : {}),
            ...(search?.tag?.length > 0 ? {
                tag_name: search?.tag?.map(_tag => _tag?.label)?.join(',')
            } : {}),
            ...(!!search.searchText ? {
                q: search.searchText,
            } : {}),
        },
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataProductGVM, loading: loadingProductGVM } = useQuery(query_report_productSoldScByGMV, {
        variables: {
            limit: 20,
            from: dayjs().subtract(30, 'day').startOf('days').unix(),
            to: dayjs().endOf('days').unix(),
            store_ids: `${currentStore}`
        },
        fetchPolicy: 'cache-and-network',
        skip: currentTab == 'list',
        onCompleted: async (data) => {
            const scProductVariants = await queryGetScProductVariants(data?.report_productSoldScByGMV?.map(item => item?.scVariantId));
            setDataTableGVM([...new Set(scProductVariants?.map(item => item?.product))]);
        }
    });

    let totalRecord = data?.ScGetSmeProducts?.total || 0;
    let totalPage = Math.ceil(totalRecord / search.limit);

    const optionsProductTag = useMemo(() => {
        return dataProductTags?.ScTags?.map(tag => ({
            value: tag?.id,
            label: tag?.tag_name
        }))
    }, [dataProductTags]);

    const isSelectedAll = useMemo(() => {
        if (!data || (currentTab == 'list' ? data?.ScGetSmeProducts?.products : dataTableGVM)?.length == 0) return false;

        return (currentTab == 'list' ? data?.ScGetSmeProducts?.products : dataTableGVM)?.every(variant => productsCampaign?.some(item => item?.id == variant?.id) || productSelect?.some(item => item?.id == variant?.id));
    }, [productSelect, productsCampaign, data, dataTableGVM, currentTab]);

    const handleSelectAll = useCallback(
        (e) => {
            if (isSelectedAll) {
                setProductSelect(prev => prev.filter(item => !(currentTab == 'list' ? data?.ScGetSmeProducts?.products : dataTableGVM)?.some(variant => variant?.id == item?.id)))
            } else {
                const currentTotal = productSelect.length + productsCampaign.length;

                const data_filtered = (currentTab == 'list' ? data?.ScGetSmeProducts?.products : dataTableGVM)?.filter(
                    _product => !productSelect?.some(__ => __?.id == _product?.id) && !productsCampaign?.some(__ => __?.id == _product?.id)
                )?.slice(0, LIMIT_ADD_PRODUCT - currentTotal);

                setProductSelect(prevState => ([...prevState, ...data_filtered]));
            }
        }, [data?.ScGetSmeProducts, productSelect, productsCampaign, isSelectedAll, dataTableGVM, currentTab]
    );

    const resetData = useCallback(() => {
        setSearch({
            searchText: null,
            searchType: '',
            tag: [],
            originImg: null,
            page: 1,
            limit: 20,
        })
        setProductSelect([])
        onHide();
    }, []);

    const addProductFromFilter = useCallback(
        () => {
            onAddProductsCampaign(productSelect);
            resetData();
        }, [productSelect]
    );

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1000)
    };
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
                <span className='ml-1'>{formatMessage({ defaultMessage: 'ID' })}</span>
            </div>,
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '15%',
            render: (_item, record) => {
                const [isSelected, isDisabled] = [
                    productSelect?.map(_product => _product?.id).includes(record?.id) || productsCampaign?.map(_product => _product?.id).includes(record?.id),
                    productsCampaign?.map(_product => _product?.id).includes(record?.id)
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
                                if ((productSelect.length + productsCampaign.length) >= LIMIT_ADD_PRODUCT) return;
                                setProductSelect(prevState => ([...prevState, record]))
                            } else {
                                setProductSelect(prevState => prevState.filter(_state => _state.id !== record?.id))
                            }
                        }}
                    />
                    <div className='ml-1 d-flex align-items-center'>
                        <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                            <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(record?.ref_id)}>
                                {`${record?.ref_id}`}
                                <span className='ml-1'><i style={{ fontSize: 12 }} className="far fa-copy text-info"></i></span>
                            </span>
                        </OverlayTrigger>
                    </div>
                </div>
            }
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'id',
            key: 'id',
            align: 'left',
            width: '30%',
            render: (_item, record) => {
                return <InfoProduct
                    name={record?.name}
                    isSingle
                    productOrder={true}
                    url={() => window.open(`/product-stores/edit/${record?.id}`, "_blank")}
                />
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '25%',
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
            width: '20%',
            render: (_item, record) => {
                const store = optionsStore?.find(store => store?.value == record?.store_id);
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
        {
            title: formatMessage({ defaultMessage: 'Tồn kho' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                return <span>{formatNumberToCurrency(record?.sum_sellable_stock)}</span>
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
                        {formatMessage({ defaultMessage: 'Thêm sản phẩm sàn' })}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default pb-0">
                    <div className="d-flex w-100 mb-4">
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs" id="myTab" role="tablist">
                                {TABS_MODAL_ADD_PRODUCT.map((_tab, index) => {
                                    const { type, title } = _tab;
                                    const isActive = type == currentTab;
                                    return (
                                        <>
                                            <li style={{ cursor: 'pointer' }}
                                                key={`tab-order-${index}`}
                                                className={`nav-item ${isActive ? "active" : ""}`}>
                                                <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                                                    style={{ fontSize: "13px" }}
                                                    onClick={() => setCurrentTab(type)}
                                                >
                                                    {title}
                                                </span>
                                            </li>
                                        </>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                    {currentTab == 'list' && <div className='row mb-4'>
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
                        <div className="col-4">
                            <Select
                                className="w-100"
                                placeholder={formatMessage({ defaultMessage: "Chọn tags" })}
                                isMulti
                                isClearable
                                value={search?.tag}
                                styles={{
                                    container: (styles) => ({
                                        ...styles,
                                        zIndex: 9
                                    }),
                                }}
                                onChange={values => {
                                    const paramsTag = values?.length > 0 ? values : [];

                                    setSearch({ ...search, tag: paramsTag, page: 1 })
                                }}
                                options={optionsProductTag}
                            />
                        </div>
                    </div>}
                    <div className='mb-4 d-flex align-items-center'>
                        <span>{formatMessage({ defaultMessage: 'Đã chọn: {count} / {max}' }, { count: productSelect.length + productsCampaign.length, max: LIMIT_ADD_PRODUCT })}</span>
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
                            {(loading || loadingProductGVM) && (
                                <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                                    <span className="spinner spinner-primary" />
                                </div>
                            )}
                            <Table
                                style={(loading || loadingProductGVM) ? { opacity: 0.4 } : {}}
                                className="upbase-table"
                                columns={columns}
                                data={currentTab == 'list' ? (data?.ScGetSmeProducts?.products || []) : dataTableGVM}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                scroll={{ y: 350 }}
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                        {currentTab == 'list' && data?.ScGetSmeProducts?.products?.length > 0 && (
                            <div style={{ marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                                <Pagination
                                    page={search.page}
                                    totalPage={totalPage}
                                    loading={loading}
                                    quickAdd={false}
                                    limit={search.limit}
                                    totalRecord={totalRecord}
                                    count={data?.ScGetSmeProducts?.products?.length}
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
                            disabled={(productSelect.length + productsCampaign.length) == 0}
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

export default memo(ModalAddProducts);