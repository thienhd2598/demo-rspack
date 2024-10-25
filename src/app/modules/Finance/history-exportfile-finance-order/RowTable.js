import React, { useCallback, useMemo, useState } from 'react'
import { formatNumberToCurrency } from '../../../../utils'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import { AssignmentOutlined, AssignmentReturned } from '@material-ui/icons'
import { saveAs } from "file-saver";
import { useToasts } from "react-toast-notifications";
import { useMutation } from '@apollo/client'
import mutate_cfRetryExportFinanceOrder from '../../../../graphql/mutate_cfRetryExportFinanceOrder'
import { MISA_TEMPLATE_STATUS } from '../manage-finance-orders/constants'

const RowTable = ({ stores, channels, item }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const [showAll, setShowAll] = useState(false)

    const viewStores = useMemo(() => {
        const list_store = JSON.parse(item?.list_store) || []
        if (list_store.length == 0 || !item?.list_store) {
            return "N/A"
        }
        const selectStoreFromItem = stores?.flatMap(store => {
            if (list_store?.includes(store?.id)) {
                return store
            }
            return []
        })

        const storesView = selectStoreFromItem.map((store, idx) => {
            let channel = channels?.find(channel => channel.code == store.connector_channel_code)

            return {
                ...store,
                logo: channel?.logo_asset_url,
            }
        })

        const viewStore = storesView?.map(store => (
            <div key={store?.id} className="mt-2 mb-2">
                <img src={store?.logo} style={{ width: 20, height: 20, marginRight: 8 }} alt='' />
                <span>{store?.name}</span>
            </div>
        ))
        if (storesView?.length == 1) {
            return viewStore
        }
        if (storesView?.length > 1 && !showAll) {
            return (
                <>
                    <div className="mt-2 mb-2" > <AssignmentOutlined /> {formatMessage({ defaultMessage: 'Nhiều gian hàng' })}</div>
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

    }, [item, showAll, channels])


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
        fetch(item?.link_file_export).then((response) => {
            response.blob().then((blob) => {
                const fileURL =window.URL.createObjectURL(blob) 
                let alink = document.createElement("a");
                alink.href = fileURL;
                alink.download = item?.file_name;
                alink.click();
            });
        })
        // saveAs(item?.link_file_export, item?.file_name);
    }, [item])


    const [cfRetryExportSettlement, { loading: retryLoading }] = useMutation(
        mutate_cfRetryExportFinanceOrder, {
        variables: { id: item.id },
        onCompleted: (data) => {
            if (!!data?.cfRetryExportFinanceOrder?.success) {
                addToast(data?.cfRetryExportFinanceOrder.message || '', { appearance: "success" });
                return
            }
            addToast(data?.cfRetryExportFinanceOrder.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), { appearance: "error" });
        }
    });
    return (
        <tr>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {viewStores}
                </div>
            </td>
            <td>{formatMessage({ defaultMessage: `Từ {timeFrom} đến {timeTo}` }, { timeFrom: dayjs(item?.time_from * 1000).format("DD/MM/YYYY"), timeTo: dayjs(item?.time_to * 1000).format("DD/MM/YYYY") })}</td>
            <td className='text-center'>{formatNumberToCurrency(item?.total_order_settlement)}</td>
            <td className='text-center'>{item?.updated_at ? dayjs(item?.created_at).format("DD/MM/YYYY HH:mm") : ''}</td>
            <td className='text-left'>{item?.templateExport?.name || formatMessage({ defaultMessage: 'Mẫu cơ bản' })}</td>
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
                            <span role="button" className='text-primary' onClick={async () => { await cfRetryExportSettlement() }}>Thử lại</span> : ''}
            </td>
        </tr>
    )
}

export default RowTable