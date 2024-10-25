import React, { useMemo, useState } from 'react'
import RcTable from 'rc-table';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useIntl } from 'react-intl';
import { Field, useFormikContext } from 'formik';
import { InputVertical } from '../../../../_metronic/_partials/controls/forms/InputVertical'
import PopoverPush from './PopoverPush'
import { useToasts } from 'react-toast-notifications';
import EditVertical from './EditVertical';


const TableStore = ({ loading, openDialog }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()

    const { values, setFieldValue, setFieldError, errors } = useFormikContext()
    const [columns, dataTable] = useMemo(() => {
        let columns = []
        let dataTable = []

        columns = [
            {
                title: <div className='row col-12'>
                    <span className='col-3'>{formatMessage({ defaultMessage: "Kho kênh bán" })}</span>
                    <span className='col-3'>{formatMessage({ defaultMessage: "Tỷ lệ đẩy" })}</span>
                    <span className='col-3'>{formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })}</span>
                    <span className='col-3'>{formatMessage({ defaultMessage: "Kho vật lý" })}</span>
                </div>,
                render: (record, item) => {
                    return <>

                        <div className='row col-12'>
                            <div style={{ display: 'grid', gridTemplateColumns: '43% auto', alignItems: 'center' }} className='col-3'>
                                <div className='d-flex justify-content-end'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                        <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z">
                                        </path>
                                    </svg>
                                </div>
                                <span>{item?.scWarehouse?.warehouse_name}</span>
                            </div>
                            {!!item?.name ? (
                                <>
                                    <div style={{ pointerEvents: !Boolean(values['typePush']) ? 'none' : 'auto' }} className='col-3 d-flex align-items-center justify-content-center' >
                                        <span className='mr-2'>{values[`inventory_push_percent-${item?.sme_warehouse_id}`]}%</span>
                                        <EditVertical type="push" title={formatMessage({ defaultMessage: "Tỷ lệ đẩy" })} field={`inventory_push_percent-${item?.sme_warehouse_id}`} onConfirm={(value) => setFieldValue(`inventory_push_percent-${item?.sme_warehouse_id}`, value)}/>
                                    </div>
                                    <div className='col-3 d-flex align-items-center justify-content-center'>
                                        <span className='mr-2'>{values[`protection_threshold-${item?.sme_warehouse_id}`]}</span>
                                        <EditVertical type="protection" title={formatMessage({ defaultMessage: "Ngưỡng bảo vệ" })} field={`protection_threshold-${item?.sme_warehouse_id}`} onConfirm={(value) => setFieldValue(`protection_threshold-${item?.sme_warehouse_id}`, value)}/>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '47% auto', alignItems: 'center' }} className='col-3'>
                                        <div className='d-flex justify-content-end'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z">
                                                </path>
                                            </svg>
                                        </div>
                                        <span>{item?.name}</span>
                                    </div>
                                </>
                            ) :
                                <>
                                    <div style={{ marginLeft: '14.5%' }}>
                                        <span className='text-danger'>
                                            {formatMessage({ defaultMessage: "Không có liên kết kho nên không thể đẩy tồn được" })}
                                        </span>
                                    </div>
                                    <div className='d-flex align-items-center justify-content-center' style={{ flex: 1 }}>
                                    </div>
                                </>
                            }
                        </div>


                    </>
                }
            }
        ];
        dataTable = values['listWarehouseMapping']?.map(wh => ({
            ...wh
        }))

        return [columns, dataTable]

    }, [values, errors])


    return (
        <div>
            <RcTable
                style={loading ? { opacity: 0.4, borderBottom: '1px solid #d9d9d9' } : { borderBottom: '1px solid #d9d9d9' }}
                className="upbase-table"
                columns={columns}
                data={dataTable || []}
                emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                    <img src={toAbsoluteUrl("/media/empty.png")} alt="" width={80} />
                    <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                </div>}
                tableLayout="fixed"
                sticky={{ offsetHeader: 45 }}
            />
        </div>
    )
}

export default TableStore