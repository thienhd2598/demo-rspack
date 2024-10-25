import React, { useMemo } from 'react'
import { Modal, ProgressBar } from "react-bootstrap";
import { useIntl } from 'react-intl';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import { useQuery } from '@apollo/client';

const ReloadProductModal = ({ reloadProductData, show, currentInfoStore, onHide }) => {
  const { formatMessage } = useIntl()

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });

  let stores = useMemo(() => {

    const store = dataStore?.sc_stores?.find((st) => st.id == currentInfoStore?.id);
    const channel = dataStore?.op_connector_channels?.find((st) => st.code == store?.connector_channel_code);
    return {
      logo: channel?.logo_asset_url,
      name: store?.name
    }
  }, [dataStore, currentInfoStore])



  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      onHide={() => onHide()}
    >
      {/* {
      <LoadingDialog show={loading || loadingReturn} />
    } */}

      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'Tải sản phẩm' })}
        </Modal.Title>
        <span><i style={{ cursor: "pointer" }} onClick={() => {
          onHide()
        }}
          className="drawer-filter-icon fas fa-times icon-md text-right"></i>
        </span>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" >
        <div className="row">
          <div className="col-12">
            <div className="fs-14 mb-3">{formatMessage({ defaultMessage: 'Gian hàng' })}:
              <span className="ml-2">
                <img
                  src={stores?.logo}
                  style={{ width: 20, height: 20, objectFit: "contain" }}
                />
                <span className="ml-1">{stores?.name}</span>
              </span>
            </div>
            <div className="fs-14 mb-3">
              <ProgressBar style={{ height: '30px', fontSize: '14px' }}
                now={reloadProductData?.progressBar} label={`${reloadProductData?.progressBar}%`} />
            </div>
            <div className='d-flex align-items-center'>
              <span>Sản phẩm tải thành công:</span>
              <span className='text-success ml-3'>{reloadProductData?.totalProductSuccess || 0}</span>
            </div>
          </div>
        </div>

      </Modal.Body>
      <Modal.Footer style={{ padding: '5px' }} className="form" >
        <button
          type="button"
          className="btn btn-secondary mr-3"
          style={{ width: 100 }}
          onClick={() => onHide()}
        >
          {formatMessage({ defaultMessage: 'Đóng' })}
        </button>
      </Modal.Footer>
    </Modal >
  )
}

export default ReloadProductModal