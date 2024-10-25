import React, { Fragment, useMemo, useState, memo, useCallback } from 'react'
import { useIntl } from 'react-intl';
import { useHistory, useParams } from "react-router-dom";
import Table from 'rc-table';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import ServiceDialog from '../dialogs/ServiceDialog';
import query_crmGetOptionSupport from '../../../../../graphql/query_crmGetOptionSupport';
import query_crmSupportByCustomer from '../../../../../graphql/query_crmSupportByCustomer';
import { useMutation, useQuery } from '@apollo/client';
import PaginationModal from '../../../../../components/PaginationModal';
import mutate_crmDeleteSupport from '../../../../../graphql/mutate_crmDeleteSupport';
import ConfirmDialog from '../dialogs/ConfirmDialog';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { useToasts } from 'react-toast-notifications';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const DetailCustomerService = () => {
    const params = useParams();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();
    const [limit, setLimit] = useState(25);
    const [showModalAdd, setShowModalAdd] = useState(false);
    const [currentSupportUpdate, setCurrentSupportUpdate] = useState(null);
    const [currentIdDelete, setCurrentIdDelete] = useState(null);
    const [page, setPage] = useState(1);

    const { loading: loadingCrmGetOptionSupport, data: dataCrmGetOptionSupport } = useQuery(query_crmGetOptionSupport, {
        fetchPolicy: "cache-and-network",
    });

    const { loading: loadingCrmSupportByCustomer, data: dataCrmSupportByCustomer } = useQuery(query_crmSupportByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            crm_customer_id: Number(params?.id),
            first: Number(limit),
            page,
        }
    });

    const [crmDeleteSupport, { loading: loadingCrmDeleteSupport }] = useMutation(mutate_crmDeleteSupport, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmSupportByCustomer']
    });

    console.log({ dataCrmGetOptionSupport, dataCrmSupportByCustomer });

    const optionsCrmGetOptionSupport = useMemo(() => {
        return dataCrmGetOptionSupport?.crmGetOptionSupport?.map(province => ({
            value: province?.key,
            label: province?.name
        }));
    }, [dataCrmGetOptionSupport]);

    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Kênh liên hệ' }),
                dataIndex: 'type',
                key: 'type',
                width: '25%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    const support = optionsCrmGetOptionSupport
                        ?.filter(op => !!item ? JSON.parse(item)?.some(_item => _item == op?.value) : false)
                        ?.map(op => op?.label)?.join(', ')

                    return <span>{support || '--'}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Ghi chú' }),
                dataIndex: 'content',
                key: 'content',
                width: '45%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <span>{item || '--'}</span>
                }
            },
            {
                title: <div>
                    <span>{formatMessage({ defaultMessage: 'Thời gian' })}</span>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({ defaultMessage: 'Thời gian cập nhật hoạt động CSKH' })}
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
                </div>,
                dataIndex: 'updated_at',
                key: 'updated_at',
                width: '20%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <span>{dayjs(item).format('HH:mm DD/MM/YYYY')}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Thao tác' }),
                dataIndex: 'id',
                key: 'id',
                width: '10%',
                fixed: 'right',
                align: 'center',
                render: (item, record) => {
                    return <div className='d-flex justify-content-center align-items-center'>
                        <span
                            role='button'
                            className='mr-4'
                            onClick={() => {
                                setCurrentSupportUpdate(record);
                                setShowModalAdd(true);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-success bi bi-pencil-square" viewBox="0 0 16 16">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                            </svg>
                        </span>
                        <span
                            role='button'
                            onClick={() => setCurrentIdDelete(item)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-danger bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
                            </svg>
                        </span>
                    </div>
                }
            },
        ]
    }, [optionsCrmGetOptionSupport]);

    const onDeleteSupport = useCallback(async () => {
        const { data } = await crmDeleteSupport({
            variables: { id: currentIdDelete }
        });

        setCurrentIdDelete(null);
        if (!!data?.crmDeleteSupport?.success) {
            addToast(formatMessage({ defaultMessage: 'Xóa hoạt động thành công' }), { appearance: "success" });
        } else {
            addToast(formatMessage({ defaultMessage: 'Xóa hoạt động thất bại' }), { appearance: "error" });
        }
    }, [currentIdDelete]);

    return (
        <Fragment>
            <LoadingDialog show={loadingCrmDeleteSupport} />
            <ConfirmDialog
                show={!!currentIdDelete}
                title={formatMessage({ defaultMessage: 'Hệ thống sẽ xoá hoạt động chăm sóc khách hàng này. Bạn có đồng ý tiếp tục?' })}
                onConfirm={onDeleteSupport}
                onHide={() => setCurrentIdDelete(null)}
            />
            <ServiceDialog
                show={showModalAdd}
                onHide={() => {
                    setShowModalAdd(false);
                    setCurrentSupportUpdate(null);
                }}
                optionsSupport={optionsCrmGetOptionSupport}
                idCustomer={Number(params?.id)}
                currentSupportUpdate={currentSupportUpdate}
            />
            <AuthorizationWrapper keys={['customer_service_customer_info_update']}>
                <button
                    className="btn btn-primary d-flex align-items-center justify-content-center mb-4"
                    style={{ minWidth: 120 }}
                    onClick={() => {
                        setCurrentSupportUpdate(null);
                        setShowModalAdd(true)
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                    </svg>
                    <span>{formatMessage({ defaultMessage: "Thêm mới" })}</span>
                </button>
            </AuthorizationWrapper>
            <div style={{ position: 'relative' }}>
                {loadingCrmSupportByCustomer && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingCrmSupportByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataCrmSupportByCustomer?.crmSupportByCustomer?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hoạt động chăm sóc khách hàng' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataCrmSupportByCustomer?.crmSupportByCustomer?.paginatorInfo?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onPanigate={(page) => setPage(page)}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    totalPage={Math.ceil(dataCrmSupportByCustomer?.crmSupportByCustomer?.paginatorInfo?.total / limit)}
                    totalRecord={dataCrmSupportByCustomer?.crmSupportByCustomer?.paginatorInfo?.total || 0}
                    count={dataCrmSupportByCustomer?.crmSupportByCustomer?.data?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                />
            )}
        </Fragment>
    )
};

export default memo(DetailCustomerService);