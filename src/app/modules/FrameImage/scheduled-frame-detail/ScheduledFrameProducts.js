import { useFormikContext } from "formik";
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import React, { Fragment, memo, useCallback, useState, useMemo } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useIntl } from "react-intl";
import { Link, useParams } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader, Checkbox } from "../../../../_metronic/_partials/controls";
import InfoProduct from "../../../../components/InfoProduct";
import clsx from "clsx";
import { useToasts } from "react-toast-notifications";
import { STATUS_LIST_SCHEDULED_FRAME } from "../FrameImageHelper";
import { useMutation } from "@apollo/client";
import mutate_scheduledAssetProductRetry from "../../../../graphql/mutate_scheduledAssetProductRetry";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";
import ModalResultsProduct from "../dialogs/ModalResultsProduct";
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
    const { addToast } = useToasts();
    const { id } = useParams();
    const [ids, setIds] = useState([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [dataResults, setDataResults] = useState(null);
    const [currentStatus, setCurrentStatus] = useState('success');

    useMemo(() => {
        if (productsScheduled?.length == 0) {
            setPage(1);
            setLimit(25);
        }
    }, [productsScheduled]);

    const TABS_SCHEDULE_FRAME_PRODUCT = useMemo(() => {
        return [
            {
                title: values?.status == 3 ? formatMessage({ defaultMessage: 'Gỡ khung thành công' }) : formatMessage({ defaultMessage: 'Áp khung thành công' }),
                status: 'success',
                count: [...productsScheduled]?.filter(item => !item?.error_msg)?.length
            },
            {
                title: values?.status == 3 ? formatMessage({ defaultMessage: 'Gỡ khung lỗi' }) : formatMessage({ defaultMessage: 'Áp khung lỗi' }),
                status: 'error',
                count: [...productsScheduled]?.filter(item => !!item?.error_msg)?.length
            },
        ]
    }, [productsScheduled, values?.status]);

    const statusScheduled = useMemo(() => {
        return STATUS_LIST_SCHEDULED_FRAME.find(item => item?.status == values?.status)
    }, [values?.status]);

    const isSelectAll = ids.length > 0 && ids.filter(_id => {
        return [...productsScheduled]?.filter(item => !!item?.error_msg)?.some(item => item?.id === _id?.id);
    })?.length == [...productsScheduled]?.filter(item => !!item?.error_msg)?.length;

    const columns = [
        {
            title: <div className="d-flex align-items-center">
                {(values?.status == 2 || values?.status == 3) && currentStatus == 'error' && (
                    <div className="mr-2">
                        <Checkbox
                            size="checkbox-md"
                            inputProps={{
                                'aria-label': 'checkbox',
                            }}
                            isSelected={isSelectAll}
                            onChange={e => {
                                if (isSelectAll) {
                                    setIds(ids.filter(x => {
                                        return ![...productsScheduled]?.filter(item => !!item?.error_msg)?.some(ticket => ticket.id === x.id);
                                    }))
                                } else {
                                    const tempArray = [...ids];
                                    ([...productsScheduled]?.filter(item => !!item?.error_msg) || []).forEach(ticket => {
                                        if (ticket && !ids.some(item => item.id === ticket.id)) {
                                            tempArray.push(ticket);
                                        }
                                    })
                                    setIds(tempArray)
                                }
                            }}
                        />
                    </div>
                )}
                <span>{formatMessage({ defaultMessage: 'Tên sản phẩm sàn' })}</span>
            </div>,
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
                        {(values?.status == 2 || values?.status == 3) && currentStatus == 'error' && (
                            <div className="mr-2">
                                <Checkbox
                                    size="checkbox-md"
                                    inputProps={{
                                        'aria-label': 'checkbox',
                                    }}
                                    isSelected={ids.some(_id => _id?.id == record?.id)}
                                    onChange={e => {
                                        if (ids.some((_id) => _id.id == record.id)) {
                                            setIds(prev => prev.filter((_id) => _id.id != record.id));
                                        } else {
                                            setIds(prev => prev.concat([record]));
                                        }
                                    }}
                                />
                            </div>
                        )}
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
            width: (values?.status == 2 || values?.status == 3) ? '40%' : '45%',
            render: (_item, record) => {
                return <InfoProduct
                    sku={record?.sku || '--'}
                    isSingle
                />
            }
        },
        (values?.status == 2 || values?.status == 3) ? {
            title: formatMessage({ defaultMessage: 'Trạng thái khung' }),
            dataIndex: 'status',
            key: 'status',
            align: 'center',
            width: '15%',
            render: (_item, record) => {
                return <div className="d-flex justify-content-center align-items-center">
                    <span className="mr-4">{statusScheduled?.title}</span>
                    {currentStatus == 'success' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-success bi bi-check-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />
                        </svg>
                    ) : (
                        <OverlayTrigger
                            overlay={
                                <Tooltip>
                                    {record?.error_msg}
                                </Tooltip>
                            }
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-danger bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                            </svg>
                        </OverlayTrigger>
                    )}
                </div>
            }
        } : null,
        values?.status == 1 ? {
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
        } : null,
    ];

    const dataFiltered = useMemo(() => {
        return productsScheduled?.filter(product => {
            if (currentStatus == 'success') {
                return !product?.error_msg
            }
            if (currentStatus == 'error') {
                return !!product?.error_msg
            }
        }) || []
    }, [productsScheduled, currentStatus]);

    const [scheduledAssetProductRetry, { loading: loadingScheduledAssetProductRetry }] = useMutation(mutate_scheduledAssetProductRetry, {
        awaitRefetchQueries: true,
        refetchQueries: ['get_scheduled_asset_frame_detail']
    });

    const onRetryMutilTicket = useCallback(async () => {
        try {
            const { data } = await scheduledAssetProductRetry({
                variables: {
                    scheduled_frame_id: Number(id),
                    list_id: ids?.map(item => item?.id),
                }
            });

            const newListError = data?.scheduledAssetProductRetry?.list_error?.map(item => {
                const findedProduct = ids?.find(product => product?.id == item?.id);
                return {
                    ...item,
                    name: findedProduct?.name
                }
            })

            setDataResults({ ...data?.scheduledAssetProductRetry, list_error: newListError });
            setIds([]);
        } catch (err) {
            setIds([]);
            addToast(formatMessage({ defaultMessage: 'Thử lại thất bại' }), { appearance: "error" });
        }
    }, [ids, id]);

    return (
        <Fragment>
            <LoadingDialog show={loadingScheduledAssetProductRetry} />
            {!!dataResults && <ModalResultsProduct
                dataResults={dataResults}
                onHide={() => setDataResults(null)}
            />}
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
                        {values?.status == 1 && <button
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
                        </button>}
                    </div>
                    {(values?.status == 2 || values?.status == 3) && currentStatus == 'error' && (
                        <div className="d-flex align-items-center mb-4" style={{ position: 'sticky', top: 45, background: '#ffffff', zIndex: 9 }}>
                            <div className="mr-2 text-primary" style={{ fontSize: 14 }}>
                                {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                            </div>
                            <button
                                type="button"
                                className="btn btn-elevate btn-primary ml-4"
                                disabled={ids?.length == 0}
                                style={{
                                    color: "white",
                                    width: 'max-content',
                                    minWidth: 120,
                                    background: ids?.length == 0 ? "#6c757d" : "",
                                    border: ids?.length == 0 ? "#6c757d" : "",
                                }}
                                onClick={onRetryMutilTicket}
                            >
                                {formatMessage({ defaultMessage: "Thử lại" })}
                            </button>
                        </div>
                    )}
                    {(values?.status == 2 || values?.status == 3) && <div className="d-flex w-100" style={currentStatus == 'error' ? { position: 'sticky', top: 80, background: '#fff', zIndex: 9, background: "#fff", borderBottom: 'none' } : { background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs" id="myTab" role="tablist">
                                {TABS_SCHEDULE_FRAME_PRODUCT.map((_tab, index) => {
                                    const { title, status, count } = _tab;
                                    const isActive = status == currentStatus;

                                    return (
                                        <>
                                            <li
                                                key={`tab-reserve-ticket-item-${index}`}
                                                className={clsx(`nav-item cursor-pointer`, { active: isActive })}
                                            >
                                                <span className={clsx(`nav-link font-weight-normal`, { active: isActive })}
                                                    style={{ fontSize: "13px" }}
                                                    onClick={() => {
                                                        setIds([]);
                                                        setLimit(25);
                                                        setPage(1);
                                                        setCurrentStatus(status);
                                                    }}
                                                >
                                                    {title}
                                                    <span className='ml-2'>
                                                        ({loadingProduct ? '--' : count})
                                                    </span>
                                                </span>
                                            </li>
                                        </>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>}
                    {loadingProduct && <div className="d-flex justify-content-center align-items-center">
                        <span className="spinner spinner-primary mt-10 mb-20" />
                    </div>}
                    {!loadingProduct && productsScheduled?.length > 0 && (
                        <div>
                            <Table
                                className="upbase-table"
                                columns={columns.filter(Boolean)}
                                data={dataFiltered?.slice(limit * (page - 1), limit + limit * (page - 1))}
                                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                    <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm nào' })}</span>
                                </div>}
                                tableLayout="auto"
                                sticky={(values?.status == 2 || values?.status == 3) && currentStatus == 'error' ? { offsetHeader: 120 } : { offsetHeader: 0 }}
                            />
                        </div>
                    )}
                    {dataFiltered?.length > 0 && (
                        <div style={{ width: '100%', marginLeft: '-0.75rem', marginRight: '-0.75rem' }}>
                            <PaginationModal
                                page={page}
                                limit={limit}
                                onSizePage={(limit) => {
                                    setPage(1)
                                    setLimit(Number(limit));
                                }}
                                onPanigate={(page) => setPage(page)}
                                totalPage={Math.ceil(dataFiltered?.length / limit)}
                                totalRecord={dataFiltered?.length || 0}
                                count={dataFiltered?.slice(limit * (page - 1), limit + limit * (page - 1))?.length}
                                emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </Fragment >
    )
}

export default memo(ScheduledFrameProducts);