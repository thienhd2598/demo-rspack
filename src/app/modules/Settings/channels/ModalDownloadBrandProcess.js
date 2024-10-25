import React, { memo } from 'react';
import { Modal, ProgressBar } from 'react-bootstrap';
import { useIntl } from "react-intl";

// const POLL_TIME = 5000;
const ModalDownloadBrandProcess = ({ show, onHide, currentInfoStore, nameStore, progressBar }) => {
  const { formatMessage } = useIntl();
  // const [pollTime, setPollTime] = useState(0);
  // const [trackingId, setTrackingId] = useState(0);
  // const [progressBar, setProgressBar] = useState(0)
  // const [syncBrandByCategory] = useMutation(mutate_scSyncBrandByCategory)

  const _onHide = () => {
    // setPollTime(0);
    // setTrackingId(0);
    // setProgressBar(0);
    onHide();
  }

  // async function _syncBrandByCategory(connector_channel_code, list_category_id, store_id) {
  //   if (!activeTrackingId) {
  //     const { data } = await syncBrandByCategory({
  //       variables: {
  //         connector_channel_code,
  //         list_category_id,
  //         store_id
  //       }
  //     })

  //     if (data?.scSyncBrandByCategory?.tracking_id) {
  //       setTrackingId(data.scSyncBrandByCategory.tracking_id);
  //       setPollTime(POLL_TIME);
  //     }
  //   }
  //   else {
  //     setTrackingId(activeTrackingId);
  //     setPollTime(POLL_TIME);
  //   }
  // }

  // useEffect(() => {
  //   if (show) {
  //     let channelCode = currentInfoStore.connector_channel_code;
  //     if (!!currentInfoStore?.id) {
  //       if (channelCode === "lazada" || (channelCode !== "lazada" && listCategoryIds.length > 0))
  //         _syncBrandByCategory(channelCode, listCategoryIds, currentInfoStore.id)
  //     }
  //   }
  // }, [show, currentInfoStore, listCategoryIds])

  // const { data: dataJobTrackingSync } = useQuery(query_scJobTracking,
  //   {
  //     fetchPolicy: "cache-and-network",
  //     variables: {
  //       id: trackingId
  //     },
  //     skip: !trackingId,
  //     pollInterval: !!trackingId ? pollTime : 0,
  //   }
  // )

  // useMemo(() => {
  //   if (!dataJobTrackingSync) return;
  //   let failedJob = dataJobTrackingSync?.sc_job_tracking?.failed_job;
  //   let successJob = dataJobTrackingSync?.sc_job_tracking?.success_job;
  //   let totalJob = dataJobTrackingSync?.sc_job_tracking?.total_job;

  //   if (totalJob > 0) {
  //     let _progressBar = Math.floor(((successJob + failedJob) / totalJob) * 100);
  //     if (_progressBar > progressBar)
  //       setProgressBar(_progressBar)
  //   }

  //   if (successJob + failedJob == totalJob) {
  //     setPollTime(0); //
  //     setTimeout(() => {
  //       _onHide();
  //     }, 1000)
  //   }
  // }, [dataJobTrackingSync])

  return (
    <Modal
      onHide={_onHide}
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
    >
      <Modal.Header className='px-3 py-1'>
        <h5 class="modal-title" style={{ fontWeight: 600 }}>{formatMessage({ defaultMessage: "Tải thương hiệu" })}</h5>
        <button type="button" data-dismiss="modal" aria-label="Close" style={{ background: "transparent" }} onClick={_onHide}>
          <span aria-hidden="true" style={{ fontSize: "32px", lineHeight: "32px" }}>&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default text-center">
        <div className="fs-14 d-flex mb-4">
          <label className='text-left' style={{ color: '#000000', width: "100px" }}>{formatMessage({ defaultMessage: 'Gian hàng' })}:</label>
          {currentInfoStore && nameStore(currentInfoStore)}
        </div>
        <div className="fs-14 d-flex">
          <ProgressBar style={{ height: '21px', fontSize: '14px', width: "100%" }}
            now={progressBar} label={`${progressBar}%`} />
        </div>
      </Modal.Body>
      <Modal.Footer className='p-2'>

        <button
          onClick={() => {
            _onHide()
          }}
          type='submit'
          className="btn btn-primary py-2 px-6"
          style={{ color: "#fff" }}
        >
          {formatMessage({ defaultMessage: "Đóng" })}
        </button>
      </Modal.Footer>
    </Modal>

  )
}

export default memo(ModalDownloadBrandProcess)