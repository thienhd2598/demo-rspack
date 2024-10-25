import React, { Fragment, memo, useMemo, useState } from 'react'
import _ from 'lodash';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import { useMutation, useQuery } from '@apollo/client';
import mutate_scRetryExportOrder from '../../../../graphql/mutate_scRetryExportOrder';
import { useToasts } from "react-toast-notifications";
import { AssignmentOutlined, AssignmentReturned } from '@material-ui/icons';
import query_co_get_job_tracking_export_order from '../../../../graphql/query_co_get_job_tracking_export_order';
import { useIntl } from "react-intl";
export default memo(({ params, order, op_connector_channels }) => {

    const _createdat = dayjs(order.created_at)
    const [mutate, { loading, data }] = useMutation(mutate_scRetryExportOrder)
    const [showAll, setShowAll] = useState(false)
    const { addToast } = useToasts();
    const {formatMessage} = useIntl()



    const { data: dataItem, refetch: refetchTracking } = useQuery(query_co_get_job_tracking_export_order, {
        variables: {
            id: order.id,
        },
        pollInterval: order.status == 0 ? 3000 : 0
    })

    const [status, link_file_export] = useMemo(() => {
        if (!!dataItem?.co_get_job_tracking_export_order) {
            return [dataItem?.co_get_job_tracking_export_order?.status, dataItem?.co_get_job_tracking_export_order?.link_file_export]
        }
        return [order.status, order.link_file_export]
    }, [dataItem, order])

    const [time_from , time_to, stores, template] = useMemo(() => {
            const {time_from , time_to, type, list_store, template_type} = order?.params_payload ? JSON.parse(order?.params_payload) : {}
            const template = template_type ? formatMessage({defaultMessage: 'Mẫu tải lên ViettelPost  '}) : formatMessage({defaultMessage: 'Mẫu thông tin cơ bản'})
            return [time_from , time_to, list_store, template]

    }, [order])

    const store = useMemo(() => {
        if (!stores) {
            return "N/A"
        }
        let list_store = []
        try {
            list_store = stores
        } catch (error) {

        }
        if (list_store.length == 0) {
            return "N/A"
        }
        if (list_store.length == 1) {
            return <>
                {
                    list_store.map((__store, idx) => {
                        let channel = op_connector_channels.find(__ => __.code == __store.connector_channel_code)
                        return <div key={`idx---${idx}`} className="mt-2 mb-2" > <img src={channel?.logo_asset_url} style={{ width: 20, height: 20, marginRight: 8 }} /> {__store.name_store}</div>
                    })
                }
            </>
        }

        if (!showAll) {
            return <>
                <div className="mt-2 mb-2" > <AssignmentOutlined /> {formatMessage({defaultMessage: 'Nhiều gian hàng'})}</div>
                <a href="#" onClick={e => {
                    setShowAll(true)
                }} >{formatMessage({defaultMessage: 'Xem thêm'})}</a>
            </>
        }

        return <>
            {
                list_store.map((__store, idx) => {
                    let channel = op_connector_channels.find(__ => __.code == __store.connector_channel_code)
                    return <div key={`idx---${idx}`} className="mt-2 mb-2" > <img src={channel?.logo_asset_url} style={{ width: 20, height: 20, marginRight: 8 }} /> {__store.name_store}</div>
                })
            }
            <a href="#" onClick={e => {
                setShowAll(false)
            }} >{formatMessage({defaultMessage: 'Thu gọn'})}</a>
        </>
    }, [order, op_connector_channels, showAll])
    
    return (
        <Fragment>
            <tr>
                <td >
                    {store}
                </td>
                <td style={{ whiteSpace: 'pre-wrap' }} >
                    {`${formatMessage({defaultMessage: 'Từ'})} ${dayjs.unix(time_from).format("DD/MM/YYYY")}\n${formatMessage({defaultMessage: 'đến'})} ${dayjs.unix(time_to).format("DD/MM/YYYY")}`}
                </td>
                <td >
                    {order.total_order}
                </td>
                <td style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }} >
                    {`${_createdat.format("DD/MM/YYYY")}\n${_createdat.format("HH:mm")}`}
                </td>
                <td>{template || '--'}</td>
                <td >
                    {status == 1 ? formatMessage({defaultMessage: "Thành công"}) : (status == 2 ? formatMessage({defaultMessage:"Lỗi"}) : formatMessage({defaultMessage:"Đang xử lý"}))}
                </td>
                <td >
                    {!!link_file_export ? 
                    <span className="btn btn-primary cursor-pointer" 
                    onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        fetch(link_file_export).then((response) => {
                            response.blob().then((blob) => {
                                const fileURL =window.URL.createObjectURL(blob) 
                                let alink = document.createElement("a");
                                alink.href = fileURL;
                                alink.download = order?.file_name;
                                alink.click();
                            });
                        });
                    }}>
                        <AssignmentReturned /> {formatMessage({defaultMessage: 'Tải file'})}
                    </span> : (status == 2 ? <span className='cursor-pointer' onClick={async e => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                            let { data } = await mutate({
                                variables: {
                                    id: order.id
                                },
                                refetchQueries: ['job_tracking_export_order'],
                            })
                            if (data?.scRetryExportOrder?.success == 1) {
                                addToast(formatMessage({defaultMessage:'Gửi yêu cầu xuất đơn hàng thành công'}), { appearance: 'success' });
                                refetchTracking()
                            } else {
                                addToast(data?.scRetryExportOrder?.message || formatMessage({defaultMessage:"Gửi yêu cầu xuất đơn hàng không thành công"}), { appearance: 'error' });
                            }
                        } catch (error) {
                            addToast(error.message || formatMessage({defaultMessage:"Gửi yêu cầu xuất đơn hàng không thành công"}), { appearance: 'error' });
                        }
                    }}>{formatMessage({defaultMessage:'Thử lại'})}</span> : '')}
                </td>
            </tr>
        </Fragment>
    )
});