import React, { memo, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, InputVertical } from '../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { Field, useFormikContext } from 'formik';
import clsx from 'clsx';
import { useHistory, Link } from 'react-router-dom';
import InfoProduct from '../../../../../components/InfoProduct';
import ModalCombo from '../../products-list/dialog/ModalCombo';
import { formatNumberToCurrency } from '../../../../../utils';
import PaginationModal from '../../../../../components/PaginationModal';

const PAGE_SIZE = 10;
const MAX_STAMP = 2000;

const SectionPrintBarcode = ({ products, idsRemove, setIdsRemove, totalStamp }) => {
    const { setFieldValue } = useFormikContext();
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [search, setSearch] = useState('');
    const [dataCombo, setDataCombo] = useState(null);
    const [typeSort, setTypeSort] = useState('asc');
    const [page, setPage] = useState(1);

    const columns = [
        {
            title: 'SKU/GTIN',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '35%',
            render: (item, record, index) => {
                return <div className='d-flex flex-column'>
                    <div className='cursor-pointer' onClick={() => window.open(!record?.variant?.attributes?.length ? `/products/${record?.is_combo == 1 ? 'edit-combo' : 'edit'}/${record?.product_id}` : `/products/stocks/detail/${record?.variant?.id}`, '_blank')}>
                        <InfoProduct
                            sku={record?.variant?.sku || '--'}
                            isSingle
                        />
                    </div>
                    <div className='mt-1 cursor-pointer' onClick={() => window.open(!record?.variant?.attributes?.length ? `/products/${record?.is_combo == 1 ? 'edit-combo' : 'edit'}/${record?.product_id}` : `/products/stocks/detail/${record?.variant?.id}`, '_blank')}>
                        <InfoProduct
                            gtin={record?.variant?.gtin || '--'}
                            isSingle
                        />
                    </div>
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'ĐVT' }),
            dataIndex: 'variant_unit',
            key: 'variant_unit',
            align: 'center',
            width: '10%',
            render: (item, record, index) => {
                return <div className='d-flex flex-column'>
                    {record?.variant?.unit || '--'}
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tên sản phẩm' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '30%',
            render: (item, record, index) => {
                return <div className='d-flex flex-column'>
                    <div className='mb-1'>
                        <InfoProduct
                            name={record?.variant?.sme_catalog_product?.name}
                            isSingle
                            setDataCombo={setDataCombo}
                            combo_items={record?.variant?.combo_items}
                            url={!record?.variant?.attributes?.length ? `/products/${record?.is_combo == 1 ? 'edit-combo' : 'edit'}/${record?.product_id}` : `/products/stocks/detail/${record?.variant?.id}`}
                        />
                    </div>
                    <div>
                        <span className='text-secondary-custom mr-1'>{formatMessage({ defaultMessage: 'Kho' })}:</span>
                        <span>{record?.sme_store?.name || '--'}</span>
                    </div>
                </div>
            }
        },
        {
            title: <div className='d-flex align-items-center justify-content-between'>
                <span>{formatMessage({ defaultMessage: 'Số lượng tem' })}</span>
                <div className='d-flex align-items-center'>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        className={clsx("bi bi-sort-down cursor-pointer", { 'text-primary': typeSort == 'asc' })}
                        onClick={() => setTypeSort('asc')}
                        viewBox="0 0 16 16"
                    >
                        <path d="M3.5 2.5a.5.5 0 0 0-1 0v8.793l-1.146-1.147a.5.5 0 0 0-.708.708l2 1.999.007.007a.497.497 0 0 0 .7-.006l2-2a.5.5 0 0 0-.707-.708L3.5 11.293V2.5zm3.5 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                    </svg>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        className={clsx("ml-4 bi bi-sort-up cursor-pointer", { 'text-primary': typeSort == 'desc' })}
                        onClick={() => setTypeSort('desc')}
                        viewBox="0 0 16 16"
                    >
                        <path d="M3.5 12.5a.5.5 0 0 1-1 0V3.707L1.354 4.854a.5.5 0 1 1-.708-.708l2-1.999.007-.007a.498.498 0 0 1 .7.006l2 2a.5.5 0 1 1-.707.708L3.5 3.707V12.5zm3.5-9a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM7.5 6a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0 3a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3zm0 3a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1h-1z" />
                    </svg>
                </div>
            </div>,
            dataIndex: 'count',
            key: 'count',
            align: 'left',
            width: '25%',
            render: (item, record, index) => {
                return <div className='d-flex align-items-center justify-content-between'>
                    <Field
                        name={`variant-${record?.variant?.id}-${record?.sme_store_id}`}
                        component={InputVertical}
                        placeholder={''}
                        label={""}
                        type="number"
                        nameTxt={"--"}
                        required
                        customFeedbackLabel={' '}
                        addOnRight={''}
                    />
                    <i
                        className="fas fa-trash-alt ml-4"
                        style={{ color: 'red', cursor: 'pointer' }}
                        onClick={() => {
                            setFieldValue('__changed__', true);
                            setIdsRemove(prev => [...prev, `${record?.variant?.id}-${record?.sme_store_id}`]);
                        }}
                    />
                </div>
            }
        },
    ];

    const productsVisible = useMemo(() => {
        return products
            ?.filter(item => !idsRemove?.some(id => id == `${item?.variant?.id}-${item?.sme_store_id}`))
            ?.filter(item => {
                if (!search) return true;

                return item?.variant?.sku?.toLowerCase()?.includes(search?.toLowerCase())
                    || item?.variant?.gtin?.toLowerCase()?.includes(search?.toLowerCase())
                    || item?.variant?.sme_catalog_product?.name?.toLowerCase()?.includes(search?.toLowerCase())
            })
    }, [products, idsRemove, search]);

    return (
        <Card className="mb-4">
            {!!dataCombo && <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo(null)}
            />}
            <CardHeader
                title={formatMessage({ defaultMessage: "In mã vạch" })}
            />
            <CardBody>
                <div className='d-flex align-items-center mb-6'>
                    <span>{formatMessage({ defaultMessage: 'Tìm kiếm sản phẩm' })}</span>
                    <div className='ml-4 col input-icon' style={{ height: 'fit-content', maxWidth: '60%' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={formatMessage({ defaultMessage: "Nhập tên hoặc SKU/GTIN" })}
                            style={{ height: 37, borderRadius: 4 }}
                            onBlur={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            defaultValue={search || ''}
                            onKeyDown={e => {
                                if (e.keyCode == 13) {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }
                            }}
                        />
                        <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                    </div>
                </div>
                <div className='d-flex justify-content-between align-items-center mb-6'>
                    <div className='d-flex algin-items-center'>
                        <span className="mr-2" style={{ position: 'relative', top: '-1px' }}>
                            <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                            </svg>
                        </span>
                        <span>{formatMessage({ defaultMessage: 'Hệ thống hỗ trợ một lần in tối đa 2000 tem' })}</span>
                    </div>
                    <div className='d-flex algin-items-center'>
                        <span className='mr-1'>{formatMessage({ defaultMessage: 'Tổng số tem cần in' })}:</span>
                        <span className='text-primary'>{formatNumberToCurrency(totalStamp)}/{MAX_STAMP}</span>
                    </div>
                </div>
                <Table
                    // style={(loadingTable || loadingScProductImproveGMV) ? { opacity: 0.4 } : {}}
                    className="upbase-table"
                    columns={columns}
                    data={(typeSort == 'asc' ? productsVisible : [...productsVisible].reverse())?.slice(PAGE_SIZE * (page - 1), PAGE_SIZE + PAGE_SIZE * (page - 1))}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
                {productsVisible?.length > 0 && (
                    <div className='row mt-2'>
                        <div style={{ width: '100%' }}>
                            <PaginationModal
                                page={page}
                                limit={PAGE_SIZE}
                                onPanigate={(page) => setPage(page)}
                                totalPage={Math.ceil(productsVisible?.length / PAGE_SIZE)}
                                totalRecord={productsVisible?.length || 0}
                                count={productsVisible?.slice(PAGE_SIZE * (page - 1), PAGE_SIZE + PAGE_SIZE * (page - 1))?.length}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}
                            />
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    )
};

export default memo(SectionPrintBarcode);