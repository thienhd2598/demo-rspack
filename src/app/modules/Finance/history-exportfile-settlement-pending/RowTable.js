import React, { useCallback, useMemo, useState } from 'react'
import { formatNumberToCurrency } from '../../../../utils'
import mutate_cfRetryExportSettlement from '../../../../graphql/mutate_cfRetryExportSettlement'
import dayjs from 'dayjs'
import { useIntl } from 'react-intl'
import { AssignmentOutlined, AssignmentReturned } from '@material-ui/icons'
import { saveAs } from "file-saver";
import { useToasts } from "react-toast-notifications";
import { useMutation } from '@apollo/client'

const RowTable = ({ channels, item }) => {
  const { formatMessage } = useIntl()
  const { addToast } = useToasts();
  const [showAll, setShowAll] = useState(false)

  const [timeFrom, timeTo, listStore] = useMemo(() => { 
   
    const { time_from, time_to, list_store} = !!item?.params_payload ? JSON.parse(item?.params_payload) : {}

    return [time_from, time_to, list_store]
  },[item])

  const viewStores = useMemo(() => {

    if (listStore?.length == 0 || !listStore) {
      return "N/A"
    }
    const stores = listStore?.map((store, idx) => {
      let channel = channels?.find(channel => channel.code == store.connector_channel_code)

      return {
        ...store,
        logo: channel?.logo_asset_url,
        name: store?.name_store
      }
    })
    const viewStore = stores?.map(store => (
      <div key={store?.id} className="mt-2 mb-2">
        <img src={store?.logo} style={{ width: 20, height: 20, marginRight: 8 }} alt='' />
        <span>{store?.name}</span>
      </div>
    ))
    if (stores?.length == 1) {
      return viewStore
    }
    if (stores?.length > 1 && !showAll) {
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
  });
  }, [item])


  const [cfRetryExportSettlement, { loading: retryLoading }] = useMutation(
    mutate_cfRetryExportSettlement, {
    variables: { id: item.id },
    onCompleted: (data) => {
      if (!!data?.cfRetryExportSettlement?.success) {
        addToast(data?.cfRetryExportSettlement.message || '', {
          appearance: "success",
        });
        return
      }
      addToast(data?.cfRetryExportSettlement.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), {
        appearance: "error",
      });
    }
  });
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {viewStores}
        </div>
      </td>
      <td>{formatMessage({ defaultMessage: `Từ {timeFrom} đến {timeTo}` }, { timeFrom: dayjs(timeFrom * 1000).format("DD/MM/YYYY"), timeTo: dayjs(timeTo * 1000).format("DD/MM/YYYY") })}</td>
      <td className='text-center'>{formatNumberToCurrency(item?.total_order_settlement)}</td>
      <td className='text-center'>{item?.updated_at ? dayjs(item?.created_at).format("DD/MM/YYYY HH:mm") : ''}</td>
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