import React, { useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, useIntl } from "react-intl";
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import scSaleAuthorizationGrant from '../../../../graphql/mutate_scSaleAuthorizationGrant'
import { useLazyQuery, useMutation } from "@apollo/client";
import { useLocation, useRouteMatch } from "react-router";
import queryString from 'querystring'
import { useToasts } from 'react-toast-notifications';
import mutate_scProductLoad from "../../../../graphql/mutate_scProductLoad";

function ChannelsAddRedirectDialog({ show, onHide }) {
  const [error, setError] = useState('')
  const { formatMessage } = useIntl()
  const [grant, { loading, data, error: errorGrant }] = useMutation(scSaleAuthorizationGrant)
  const [authorize, { data: dataAuthozie, loading: loadingAuthozie, error: errorAuthorize }] = useLazyQuery(scSaleAuthorizationUrl)
  const location = useLocation()
  const route = useRouteMatch()
  const { addToast } = useToasts();
  const params = queryString.parse(location.search.slice(1, location.search.length));
  const { channel } = (route || {}).params || {}
  const [showWarningShipping, setShowWarningShipping] = useState(false);

  const [scProductLoad] = useMutation(mutate_scProductLoad, {
    refetchQueries: ['sc_store', 'sc_stores'],
    awaitRefetchQueries: true
  })

  useMemo(() => {
    if (show)
      grant({
        variables: {
          connector_channel_code: channel,
          params: Object.keys(params).map(key => ({ key, value: params[key] }))
        },
        awaitRefetchQueries: true,
        refetchQueries: ['sc_store, query_stores_channel']
      })
  }, [show]);

  useMemo(async () => {
    if (!!show) {
      if (!!data && data?.scSaleAuthorizationGrant?.success == 1) {
        // scProductLoad({
        //   variables: {
        //     store_id: parseInt(params?.params?.shopID)
        //   }
        // })
        addToast(formatMessage({ defaultMessage: 'Đã kết nối thành công!' }), { appearance: 'success' });
        onHide();
        channel == 'shopee' && setShowWarningShipping(true);
      }
      if (!!data && data?.scSaleAuthorizationGrant?.success == 2) {
        setError(data?.scSaleAuthorizationGrant?.message)
      }
      if (!!data && !data?.scSaleAuthorizationGrant?.success) {
        setError(data?.scSaleAuthorizationGrant?.message)
      }
    }
  }, [data, show, channel])

  useMemo(() => {
    console.log('upbase')
    if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
      window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
    }

  }, [dataAuthozie])
  useMemo(() => {
    if (!!errorGrant) {
      setError(errorGrant.message)
    }

  }, [errorGrant])
  useMemo(() => {
    if (!!errorAuthorize) {
      setError(errorAuthorize.message)
    }

  }, [errorAuthorize])
  return (
    <>
      <Modal
        show={show}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        backdrop={'static'}
        dialogClassName='width-fit-content'
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center" style={(loading || loadingAuthozie) && !error ? { width: 200 } : { width: 400 }} >
          {
            (loading || loadingAuthozie) && !error && <>
              <div className="mb-4" ><FormattedMessage defaultMessage="Đang kết nối" /></div>
              <div className="mb-8"><span className="spinner spinner-primary mb-8"></span></div>
            </>
          }
          {
            (!!error) && <>
              <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
              <div className="mb-4" style={{wordBreak: 'break-word'}}>
                {error}
              </div>
              <div className="mb-4" ><FormattedMessage defaultMessage="Bạn vui lòng kết nối lại hoặc liên hệ với CSKH qua số hotline 0944427799 để được hỗ trợ." /></div>
              <div  >
                <button
                  type="button"
                  onClick={onHide}
                  className="btn btn-light btn-elevate mr-3"
                  style={{ width: 150 }}
                >
                  <span className="font-weight-boldest"><FormattedMessage defaultMessage="ĐÓNG" /></span>
                </button>
                <button
                  id="kt_login_signin_submit"
                  className={`btn btn-primary font-weight-bold px-9 `}
                  style={{ width: 150 }}
                  onClick={e => {
                    setError(null)
                    authorize({
                      variables: {
                        connector_channel_code: channel
                      }
                    })
                  }}
                >
                  <span className="font-weight-boldest"><FormattedMessage defaultMessage="KẾT NỐI LẠI" /></span>
                </button>
              </div>
            </>
          }
        </Modal.Body>
      </Modal >

      <Modal
        show={showWarningShipping}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        backdrop={'static'}
        dialogClassName='width-fit-content'
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center" style={{ width: 400 }} >
          <div className="mb-6">
            {formatMessage({ defaultMessage: 'Lưu ý cài đặt vận chuyển trên sàn Shopee: Với mỗi nhóm vận chuyển, vui lòng bật ít nhất 1 đơn vị vận chuyển để đảm bảo cho việc đồng bộ sản phẩm.' })}
          </div>
          <button
            type="button"
            onClick={() => setShowWarningShipping(false)}
            className="btn btn-primary mr-3"
            style={{ width: 150 }}
          >
            <span className="font-weight-boldest">OK</span>
          </button>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default ChannelsAddRedirectDialog;