import { HistoryRounded } from '@material-ui/icons';
import React, { useEffect, useState } from 'react'
import ExportDialog from '../../ExportDialog';
import { useHistory } from "react-router";
import ModalTrackingLoadOrder from '../../../../../../components/ModalTrackingLoadOrder';
import { Spinner } from 'react-bootstrap';
import query_scGetTrackingLoadOrder from '../../../../../../graphql/query_scGetTrackingLoadOrder';
import { useQuery } from '@apollo/client';
import { useIntl } from 'react-intl';
import AuthorizationWrapper from '../../../../../../components/AuthorizationWrapper';

const ExportOrders = ({ refetch, showExportDialog, setshowExportDialog, params }) => {
  const [trackingLoaderOrderModal, setshowModalTrackingAndLoadOrder] = useState(false);
  const { formatMessage } = useIntl()
  const [idTrackingOrder, setIdTrackingOrder] = useState(null);
  const { data: dataTrackingOrder, loading: loadingTrackingOrder, refetch: refetchGetTrackingSme } = useQuery(query_scGetTrackingLoadOrder, {
    variables: {
      type: 2
    },
  });

  useEffect(() => {
    // Hàm để gọi lại API
    if (dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.length > 0) {
      const callAPI = async () => {
        await refetchGetTrackingSme(); // Gọi lại API bằng cách sử dụng refetch        
      };

      if (!idTrackingOrder) {
        setIdTrackingOrder(dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.[0]?.id)
      }
      // Sử dụng setInterval để gọi lại hàm callAPI cách nhau 2 giây
      const interval = setInterval(callAPI, 1000);

      // Trả về một hàm từ useEffect để dọn dẹp khi component unmount
      return () => clearInterval(interval);
    }

  }, [dataTrackingOrder, refetchGetTrackingSme]);
  const history = useHistory();
  return (
    <div className="d-flex justify-content-end" style={{ gap: 10 }}>
      <div className='d-flex justify-content-center align-items-center'>
        {/* <button
          className="btn btn-primary btn-elevate mr-2"
          onClick={e => {
            e.preventDefault();
            history.push('/orders/process-return-order')
          }}
        >
          {formatMessage({ defaultMessage: 'Xử lý hàng loạt' })}
        </button> */}
        {/* {!params?.is_old_order && <button
          className="btn btn-primary btn-elevate"
          onClick={e => {
            e.preventDefault();
            setshowModalTrackingAndLoadOrder(true)
          }}
        >
          {dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.[0] && <Spinner
            className="mr-2"
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
          }
          {formatMessage({ defaultMessage: 'Tải lại đơn hoàn' })}
        </button>} */}
      </div>
      <AuthorizationWrapper keys={['order_return_list_export_order']}>
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-primary btn-elevate"
            style={{ flex: 1 }}
            onClick={(e) => {
              e.preventDefault();
              setshowExportDialog(true);
            }}
          >
            {formatMessage({ defaultMessage: 'Xuất đơn hàng' })}
          </button>
        </div>
        <div>
          <button
            className="btn btn-secondary btn-elevate"
            onClick={(e) => {
              e.preventDefault();
              history.push("/orders/return-export-histories");
            }}
          >
            <HistoryRounded />
          </button>
        </div>
      </AuthorizationWrapper>
      <ExportDialog
        params={params}
        show={showExportDialog}
        onHide={() => setshowExportDialog(false)}
        onChoosed={(_channel) => { }}
      />
      <ModalTrackingLoadOrder
        show={trackingLoaderOrderModal}
        params={params}
        idTrackingOrder={idTrackingOrder}
        onHide={() => (setshowModalTrackingAndLoadOrder(false), setIdTrackingOrder(null), refetch())}
        refetchGetTrackingSme={() => refetchGetTrackingSme()}
        type={2}
        onChoosed={_channel => {
        }}
      />
    </div>
  )
}

export default ExportOrders