import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, useIntl } from "react-intl";
import scSaleAuthorizationCancel from '../../../../graphql/mutate_scSaleAuthorizationCancel'
import { useMutation } from "@apollo/client";
import { useLocation, useRouteMatch } from "react-router";
import queryString from 'querystring'
import { useToasts } from 'react-toast-notifications';


function ChannelsConfirmUnlinkDialog({refetch, show, onHide, storeUnlinkCurrent }) {
  const [error, setError] = useState('')
  const { formatMessage } = useIntl()
  const [unlink, { loading, data, error: errorUnlink }] = useMutation(scSaleAuthorizationCancel)
  const { addToast } = useToasts();

  useMemo(() => {
    if (!!show) {
      if (!!data && data?.scSaleAuthorizationCancel?.success) {
        refetch()
        addToast(formatMessage({ defaultMessage: "Ngắt kết nối thành công!" }), { appearance: 'success' });
        onHide()
      }
      if (!!data && !data?.scSaleAuthorizationCancel?.success) {
        setError(data?.scSaleAuthorizationCancel?.message)
      }
    }
  }, [data, show, refetch])

  useMemo(() => {
    if (!!errorUnlink) {
      setError(errorUnlink.message)
    }

  }, [errorUnlink])

  const isSmall = false;

  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      backdrop={loading ? 'static' : true}
      dialogClassName='width-fit-content'
    >
      <Modal.Body className="overlay overlay-block cursor-default text-center" style={isSmall ? { width: 200 } : { width: 420 }} >
        {
          loading && <>
            <div className="mb-4" ><FormattedMessage defaultMessage="Đang ngắt kết nối" /></div>
            <div className="mb-8"><span className="spinner spinner-primary mb-8"></span></div>
          </>
        }
        {
          !loading && !error && <>
            <div className="mb-4" ><FormattedMessage defaultMessage="Bạn có chắc chắn muốn ngắt kết nối gian hàng này? UpBase sẽ không thể thực hiện đồng bộ 2 chiều các thông tin liên quan gian hàng khi bạn ngắt kết nối. " /></div>
            <div  >
              <button
                type="button"
                onClick={onHide}
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 180 }}
              >
                <span className="font-weight-boldest"><FormattedMessage defaultMessage="KHÔNG" /></span>
              </button>
              <button
                id="kt_login_signin_submit"
                className={`btn btn-primary font-weight-bold px-9 `}
                style={{ width: 180 }}
                onClick={async () => {
                  setError(null)
                  await unlink({
                    variables: {
                      store_id: storeUnlinkCurrent
                    },
                    awaitRefetchQueries: true,
                    refetchQueries: ['sc_stores', 'sc_store']
                  })
                }}
              >
                <span className="font-weight-boldest"><FormattedMessage defaultMessage="CÓ, NGẮT KẾT NỐI" /></span>
              </button>
            </div>
          </>
        }
        {
          !loading && !!error && <>
            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
            <div className="mb-4" ><FormattedMessage defaultMessage="Ngắt kết nối không thành công! (Mã lỗi: {error})" values={{ error }} /></div>
            <div className="mb-4" ><FormattedMessage defaultMessage="Bạn vui lòng ngắt kết nối lại hoặc liên hệ với CSKH qua số hotline 0944427799 để được hỗ trợ." /></div>
            <div  >
              <button
                type="button"
                onClick={onHide}
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 150 }}
              >
                <span className="font-weight-boldest"><FormattedMessage defaultMessage="KHÔNG" /></span>
              </button>
              <button
                id="kt_login_signin_submit"
                className={`btn btn-primary font-weight-bold px-9 `}
                style={{ width: 150 }}
                onClick={async () => {
                  setError(null)
                  await unlink({
                    variables: {
                      store_id: storeUnlinkCurrent
                    },
                    awaitRefetchQueries: true,
                    refetchQueries: ['sc_stores', 'sc_store']
                  })

                }}
              >
                <span className="font-weight-boldest"><FormattedMessage defaultMessage="NGẮT KẾT NỐI LẠI" /></span>
              </button>
            </div>
          </>
        }
      </Modal.Body>
    </Modal >
  );
}

export default ChannelsConfirmUnlinkDialog;