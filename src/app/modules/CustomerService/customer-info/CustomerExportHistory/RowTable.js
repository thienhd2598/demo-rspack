import React, { useCallback, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import { AssignmentOutlined, AssignmentReturned } from '@material-ui/icons'
import { saveAs } from "file-saver";
import { useToasts } from "react-toast-notifications";
import { useMutation } from '@apollo/client'
import mutate_crmRetryExportCustomer from '../../../../../graphql/mutate_crmRetryExportCustomer'
import { formatNumberToCurrency } from '../../../../../utils';

const RowTable = ({ stores, channels, item, optionsTags, optionsChannelCode }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const [showAll, setShowAll] = useState(false)

    const viewStores = useMemo(() => {
        const payload = JSON.parse(item?.payload_params);        

        const list_channel = payload?.list_channel || []
        if (list_channel.length == 0 || !payload?.list_channel) {
            return "N/A"
        }        

        const storesView = optionsChannelCode?.filter(op => list_channel?.includes(op?.value));

        const viewStore = storesView?.map(store => (
            <div key={store?.value} className="mt-2 mb-2 d-flex align-items-center">
                <img src={store?.logo} style={{ width: 15, height: 15, marginRight: 8 }} alt='' />
                <span>{store?.label}</span>
            </div>
        ))
        if (storesView?.length == 1) {
            return viewStore
        }
        if (storesView?.length > 1 && !showAll) {
            return (
                <>
                    <div className="mt-2 mb-2" > <AssignmentOutlined /> {formatMessage({ defaultMessage: 'Nhiều kênh bán' })}</div>
                    <span className='text-primary' role='button' onClick={e => { setShowAll(true) }}>{formatMessage({ defaultMessage: 'Xem thêm' })}</span>
                </>
            )
        }
        return (
            <>
                {viewStore}
                <span className='text-primary' role='button' onClick={e => setShowAll(false)}>
                    {formatMessage({ defaultMessage: 'Thu gọn' })}
                </span>
            </>
        )

    }, [item, showAll, channels, stores, optionsChannelCode])


    const STATUS_CODE = {
        WAITING: 0,
        DONE: 1,
        FAILED: 2,
    }

    const status = {
        [STATUS_CODE.WAITING]: formatMessage({ defaultMessage: "Đang xử lý" }),
        [STATUS_CODE.DONE]: formatMessage({ defaultMessage: "Thành công" }),
        [STATUS_CODE.FAILED]: formatMessage({ defaultMessage: "Thất bại" }),
    }

    const dowloadFile = useCallback(() => {
        saveAs(item?.link_file_export, item?.file_name);
    }, [item])


    const [crmRetryExportCustomer, { loading: retryLoading }] = useMutation(mutate_crmRetryExportCustomer, {
        awaitRefetchQueries: true,
        refetchQueries: ['crmGetJobTrackingExport'],
        variables: { id: item.id },
        onCompleted: (data) => {
            if (!!data?.crmRetryExportCustomer?.success) {
                addToast(data?.crmRetryExportCustomer.message || '', { appearance: "success" });
                return
            }
            addToast(data?.crmRetryExportCustomer.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: "error" });
        }
    });

    const viewTags = useMemo(() => {
        const payload = JSON.parse(item?.payload_params);        

        if (!payload?.list_tag || payload?.list_tag?.length == 0) return formatMessage({ defaultMessage: 'Tất cả' });

        const tags = optionsTags?.filter(op => payload?.list_tag?.some(tag => tag == op?.value));

        return tags?.map(tag => tag?.label)?.join(', ')
    }, [optionsTags, item]);

    return (
        <tr>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {viewStores}
                </div>
            </td>
            <td>{viewTags}</td>
            <td>{formatMessage({ defaultMessage: `Từ {timeFrom} đến {timeTo}` }, { timeFrom: dayjs.unix(JSON.parse(item?.payload_params)?.range_time[0]).format("DD/MM/YYYY"), timeTo: dayjs.unix(JSON.parse(item?.payload_params)?.range_time[1]).format("DD/MM/YYYY") })}</td>
            <td className='text-center'>{formatNumberToCurrency(item?.total)}</td>
            <td className='text-center'>{status[item?.status]}</td>
            <td className='text-center'>
                {item?.status == STATUS_CODE.DONE ? (
                    <button onClick={(e) => {
                        e.stopPropagation()
                        dowloadFile()
                    }} className="btn btn-primary">
                        <AssignmentReturned /> {formatMessage({ defaultMessage: "Tải file" })}
                    </button>
                ) :
                    item?.status == STATUS_CODE.FAILED ?
                        retryLoading ? <span className="spinner spinner-primary"></span> :
                            <span role="button" className='text-primary' onClick={async () => { await crmRetryExportCustomer() }}>Thử lại</span> : ''}
            </td>
        </tr>
    )
}

export default RowTable