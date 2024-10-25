import React, { useState, useCallback } from 'react'
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import mutate_userSetDefaultWarehouse from "../../../../graphql/mutate_userSetDefaultWarehouse";
import mutate_update_sme_warehouses_by_pk from "../../../../graphql/mutate_update_sme_warehouses_by_pk";
import mutate_userEnableWarehouse from '../../../../graphql/mutate_userEnableWarehouse';
import { useIntl } from "react-intl";
import RowTable from './RowTable';
import { useQuery, useMutation } from '@apollo/client';
import Pagination from '../../../../components/Pagination';
import { useMemo } from 'react';
import { useLocation } from "react-router-dom";
import queryString from 'querystring';
import WarehouseDialog from './dialogs/WarehouseDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';
import { useToasts } from 'react-toast-notifications'
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { typesAction } from './constants';
import mutate_userCreateWarehouse from '../../../../graphql/mutate_userCreateWarehouse';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';


const TableWarehouseList = () => {
    const { addToast } = useToasts()

    const { formatMessage } = useIntl();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))

    const [dialogWh, setDialogWh] = useState({
        isOpen: false,
        title: '',
        typeAction: '',
        infoWh: {}
    })
    const [dialogConfirm, setDialogConfirm] = useState({
        isOpen: false,
        idWh: null,
        title: '',
        typeAction: typesAction['SET_DEFAULT_WAREHOUSE'],
        preallocateType: null
    })


    const limit = useMemo(() => {
        return params?.limit ? +params?.limit : 25
    }, [params?.limit])

    const page = useMemo(() => {
        return params?.limit ? +params?.page : 1
    }, [params?.page])


    const { data: dataWarehouse, loading, error, refetch } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: "network-only",
        variables: {
            limit,
            offset: (page - 1) * limit,
            order_by: {
                created_at: 'desc'
            },
            where: {}
        }
    });

    const [mutateDefaultWarehouse, { loading: loadingSetWhDefault }] = useMutation(
        mutate_userSetDefaultWarehouse,
        {
            awaitRefetchQueries: true,
        }
    );

    const [mutateUpdateWarehouse, { loading: loadingUpdateWh }] = useMutation(mutate_update_sme_warehouses_by_pk, { awaitRefetchQueries: true, refetchQueries: ['sme_warehouses'] });
    
    const [mutateEnableWarehouse, { loading: loadingEnableWh }] = useMutation(mutate_userEnableWarehouse, { awaitRefetchQueries: true, refetchQueries: ['sme_warehouses'] });

    const [mutate_insertWarehouse, { loading: loadingCreateWh }] = useMutation(mutate_userCreateWarehouse, { awaitRefetchQueries: true, refetchQueries: ['sme_warehouses'] });

    const updatePreallocate = useCallback(async () => {
        await mutateUpdateWarehouse({
            variables: {
                userUpdateWarehouseInput: {
                    id: dialogConfirm.idWh,
                    allow_preallocate: dialogConfirm?.preallocateType
                }
            }
        })
    }, [dialogConfirm.idWh, dialogConfirm?.preallocateType])

    const setDefaultWarehouse = useCallback(async () => {
        const { data } = await mutateDefaultWarehouse({
            variables: {
                id: dialogConfirm.idWh
            }
        })
        if (data?.userSetDefaultWarehouse?.success) {
            addToast(data?.userSetDefaultWarehouse?.message, { appearance: 'success' })
            refetch()
            setDialogConfirm({
                isOpen: false,
                idWh: null,
                title: ''
            })
            return
        } else {
            addToast(data?.userSetDefaultWarehouse?.message || 'Có lỗi xảy ra', { appearance: 'error' })
        }

    }, [dialogConfirm.idWh])

    let totalRecord = dataWarehouse?.sme_warehouses_aggregate?.aggregate?.count || 0
    let totalPage = Math.ceil(totalRecord / limit)

    return (
        <Card>
            <CardBody>
                {dialogConfirm.isOpen && <ConfirmDialog action={dialogConfirm.typeAction == typesAction['SET_DEFAULT_WAREHOUSE'] ? setDefaultWarehouse : updatePreallocate}
                    onHide={() => setDialogConfirm({ isOpen: false, id: null })}
                    show={dialogConfirm.isOpen}
                    title={dialogConfirm.title} />}

                {dialogWh.isOpen && <WarehouseDialog mutate={dialogWh.typeAction == typesAction['CREATE_WAREHOUSE'] ? mutate_insertWarehouse : mutateUpdateWarehouse} refetch={refetch} dialogWh={dialogWh} onHide={() => setDialogWh({ isOpen: false })} setDialogWh={setDialogWh} />}

                <LoadingDialog show={loadingCreateWh || loadingSetWhDefault || loadingUpdateWh || loadingEnableWh} />
                <AuthorizationWrapper keys={['warehouse_action']}>
                    <div className='mb-4 d-flex justify-content-end'>
                        <button className='btn btn-primary'  onClick={() => setDialogWh({ isOpen: true, title: formatMessage({ defaultMessage: 'Thêm kho ' }), typeAction: typesAction['CREATE_WAREHOUSE'] })} >{formatMessage({ defaultMessage: 'Thêm kho' })}</button>
                    </div>
                </AuthorizationWrapper>

                <table className="table product-list table-borderless table-vertical-center fixed">
                    <thead
                        style={{
                            position: 'sticky',
                            top: 45,
                            background: "#F3F6F9",
                            borderBottom: '1px solid #F0F0F0',
                            borderRight: '1px solid #d9d9d9',
                            borderLeft: '1px solid #d9d9d9',
                        }}
                    >
                        <tr className="font-size-lg">
                            <th style={{ fontSize: '14px', width: '12%' }} className="pl-6">{formatMessage({ defaultMessage: "Tên kho" })}</th>
                            <th style={{ fontSize: '14px', width: '10%' }} className="pl-6">{formatMessage({ defaultMessage: "Kho dịch vụ" })}</th>
                            <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: "Hàng hoá" })}</th>
                            <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: "Tiền tố của phiếu" })}</th>
                            <th style={{ fontSize: '14px', width: '18%' }}>
                                {formatMessage({ defaultMessage: "Địa chỉ" })}
                            </th>
                            <th className="text-center" style={{ fontSize: '14px', width: '20%' }}>{formatMessage({ defaultMessage: "Cấu hình" })}
                            </th>
                            <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: "Trạng thái hoạt động" })}
                            </th>
                            <th className="text-center" style={{ fontSize: '14px', width: '10%' }}>{formatMessage({ defaultMessage: "Thao tác" })}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <div
                                className="text-center w-100 mt-4"
                                style={{ position: "absolute" }}
                            >
                                <span className="ml-3 spinner spinner-primary"></span>
                            </div>
                        )}
                        {!!error && !loading && (
                            <div
                                className="w-100 text-center mt-8"
                                style={{ position: "absolute" }}
                            >
                                <div className="d-flex flex-column justify-content-center align-items-center">
                                    <i
                                        className="far fa-times-circle text-danger"
                                        style={{ fontSize: 48, marginBottom: 8 }}
                                    ></i>
                                    <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        style={{ width: 100 }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            refetch();
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Tải lại' })}
                                    </button>
                                </div>
                            </div>
                        )}
                        {dataWarehouse?.sme_warehouses?.map(warehouse => (
                            <RowTable
                                mutateUpdateWarehouse={mutateUpdateWarehouse}
                                setDialogConfirm={setDialogConfirm}
                                mutateEnableWarehouse={mutateEnableWarehouse}
                                warehouse={warehouse}
                                setDialogWh={() => {
                                    setDialogWh({
                                        typeAction: typesAction['UPDATE_WAREHOUSE'],
                                        title: formatMessage({ defaultMessage: 'Cập nhật kho' }), isOpen: true,
                                        infoWh: {
                                            id: warehouse?.id, name: warehouse?.name,
                                            address: warehouse?.address,
                                            code: warehouse?.code,
                                            inbound_prefix: warehouse?.inbound_prefix,
                                            outbound_prefix: warehouse?.outbound_prefix,
                                            fulfillment_scan_export_mode: warehouse?.fulfillment_scan_export_mode || 2,
                                            fulfillment_scan_pack_mode: warehouse?.fulfillment_scan_pack_mode || 2,
                                            fulfillment_by: warehouse?.fulfillment_by,
                                            fulfillment_provider_wms_code: warehouse?.fulfillment_provider_wms_code,
                                            fulfillment_provider_connected_id: warehouse?.fulfillment_provider_connected_id,
                                            contact_phone: warehouse?.contact_phone,
                                            contact_name: warehouse?.contact_name,
                                            district_code: warehouse?.district_code,
                                            province_code: warehouse?.province_code,
                                            max_mio: warehouse?.max_mio,
                                            max_sio: warehouse?.max_sio,
                                            ward_code: warehouse?.ward_code
                                        }
                                    })
                                }
                                }
                            />
                        ))}
                    </tbody>
                </table>

                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading}
                    limit={limit}
                    totalRecord={totalRecord}
                    count={dataWarehouse?.sme_warehouses?.length}
                    basePath={'/products/warehouselist'}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có kho nào' })}
                />
            </CardBody>

        </Card>
    )
}

export default TableWarehouseList