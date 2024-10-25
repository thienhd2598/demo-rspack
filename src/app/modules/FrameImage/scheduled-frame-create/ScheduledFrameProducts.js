import { useFormikContext } from "formik";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useMemo, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader } from "../../../../_metronic/_partials/controls";
import InfoProduct from "../../../../components/InfoProduct";
import PaginationModal from "../../../../components/PaginationModal";

const LIMIT_ADD_VARIANT = 300;

const ScheduledFrameProducts = ({
    optionsStore,
    onShowModalAddProduct,
    productsScheduled,
    onRemoveProduct,
    loadingProduct
}) => {
    const { setFieldValue, values } = useFormikContext();
    const { formatMessage } = useIntl();        
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    console.log('productsScheduled', productsScheduled);

    useMemo(() => {
        if (productsScheduled?.length == 0) {
            setPage(1);
            setLimit(25);
        }
    }, [productsScheduled]);

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên sản phẩm sàn' }),
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '45%',
            render: (_item, record) => {
                const imgOrigin = record?.productAssets?.find(_asset => _asset.type == 4);
                const urlImage = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (record?.productAssets || []).filter(_asset => _asset.type == 1)[0];

                const store = optionsStore?.find(st => st?.value == record?.store_id);

                return (
                    <div className="d-flex">
                        <Link to={`/product-stores/edit/${record?.id}`} target="_blank">
                            <div style={{
                                backgroundColor: '#F7F7FA',
                                width: 40, height: 40,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 40
                            }} className='mr-6' >
                                {
                                    !!urlImage && <img src={urlImage?.sme_url}
                                        style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                }
                            </div>
                        </Link>
                        <div className='ml-1 d-flex flex-column'>
                            <InfoProduct
                                name={record?.name}
                                productOrder={true}
                                url={() => window.open(`/product-stores/edit/${record?.id}`, "_blank")}
                            />
                            <div className="mt-1 d-flex align-items-center">
                                <img src={store?.logo} style={{ width: 15, height: 15, marginRight: 6 }} />
                                <span>{store?.label}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'SKU sản phẩm sàn' }),
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '45%',
            render: (_item, record) => {
                return <InfoProduct
                    sku={record?.sku || '--'}
                    isSingle
                />
            }
        },
        {
            title: <></>,
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '10%',
            render: (_item, record) => {
                return (
                    <i
                        className="fas fa-trash-alt"
                        style={{ color: 'red', cursor: 'pointer' }}
                        onClick={() => {
                            setFieldValue('__changed__', true);
                            onRemoveProduct(record?.id)
                        }}
                    />
                )
            }
        },
    ];    

    return (
        <Fragment>
            <Card>
                <CardHeader
                    title={formatMessage({ defaultMessage: 'Sản phẩm áp khung' })}
                />
                <CardBody>
                    <div className="mb-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <span className="ml-1">
                                {formatMessage({ defaultMessage: 'Tổng sản phẩm: {count} / {max}' }, { count: productsScheduled?.length, max: LIMIT_ADD_VARIANT })}
                            </span>
                            <OverlayTrigger
                                overlay={
                                    <Tooltip>
                                        {formatMessage({ defaultMessage: 'Tổng số sản phẩm sàn sẽ được áp khung theo lịch' })}
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
                        <button
                            className="btn btn-primary d-flex align-items-center"
                            style={{ minWidth: 120, cursor: productsScheduled?.length >= LIMIT_ADD_VARIANT ? 'not-allowed' : 'pointer' }}
                            disabled={productsScheduled?.length >= LIMIT_ADD_VARIANT}
                            onClick={onShowModalAddProduct}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                            <span>{formatMessage({ defaultMessage: "Thêm nhanh sản phẩm" })}</span>
                        </button>
                    </div>
                    {loadingProduct && <div className="d-flex justify-content-center align-items-center">
                        <span className="spinner spinner-primary mt-10 mb-20" />
                    </div>}
                    {!loadingProduct && productsScheduled?.length > 0 && (
                        <div>
                            <Table
                                className="upbase-table"
                                columns={columns}
                                data={productsScheduled?.slice(limit * (page - 1), limit + limit * (page - 1)) || []}                                
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                sticky={{ offsetHeader: 0 }}
                            />
                        </div>
                    )}
                    {productsScheduled?.length > 0 && (
                        <div style={{ width: '100%', marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                            <PaginationModal
                                page={page}
                                limit={limit}
                                onSizePage={(limit) => {
                                    setPage(1)
                                    setLimit(Number(limit));
                                }}
                                onPanigate={(page) => setPage(page)}
                                totalPage={Math.ceil(productsScheduled?.length / limit)}
                                totalRecord={productsScheduled?.length || 0}
                                count={productsScheduled?.slice(limit * (page - 1), limit + limit * (page - 1))?.length}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                            />
                        </div>
                    )}                    
                </CardBody>
            </Card>
        </Fragment>
    )
}

export default memo(ScheduledFrameProducts);