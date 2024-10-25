import React, { useCallback, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import op_connector_channels from '../../../../graphql/op_connector_channels'
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import { useLazyQuery, useQuery } from "@apollo/client";
import { useLocation } from "react-router";
import { useIntl } from "react-intl";
import AddStoreDialog from "./AddStoreDialog";
function ChannelsAddDialog({ show, onHide }) {
  const [channelsSelected, setChannelsSelected] = useState()
  const [addStoreDialog, setAddStoreDialog] = useState()
  const { data } = useQuery(op_connector_channels)
  const [authorize, { data: dataAuthozie, loading }] = useLazyQuery(scSaleAuthorizationUrl)
  const location = useLocation()
  const { formatMessage } = useIntl()



  const _onHide = useMemo(() => {
    if (!!dataAuthozie || loading) {
      return null
    }
    return onHide
  }, [dataAuthozie, loading,channelsSelected])

  const saveClick = useCallback(() => {
    if(channelsSelected == 'other') {
      setAddStoreDialog(true)
      setChannelsSelected()
      return
    }
    authorize({
      variables: {
        connector_channel_code: channelsSelected
      }
    })
  }, [channelsSelected]);

  useMemo(() => {
    if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
      window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
    }

  }, [dataAuthozie])

  return (
    <Modal
      show={show}
      onHide={() => {
        setChannelsSelected()
        _onHide()
      }}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      size='lg'
      backdrop={(!_onHide) ? 'static' : true}
      dialogClassName='width-fit-content'
    >
      <Modal.Body className="overlay overlay-block cursor-default pb-0" style={{ width: 600 }} >
        <AddStoreDialog show={addStoreDialog} onHide={() => {
          onHide()
          setAddStoreDialog(false)
        }}/>
        <h5 className='text-center pb-4' ><FormattedMessage defaultMessage="Vui lòng chọn sàn có gian hàng bạn muốn thêm mới." /></h5>
        <div className="form-group d-flex align-items-center justify-content-center px-10">
          {
            (data?.op_connector_channels|| []).map(_channel => {
              return (
               <>
                 <label key={_channel.code} className="mx-8 checkbox checkbox-outline checkbox-primary mt-3 mb-1">
                  <input type="checkbox" name={`channel-${_channel.code}`}
                    checked={channelsSelected == _channel.code}
                    onChange={(e) => {
                      // setFieldValue(_channel.code, e.target.checked)
                      setChannelsSelected(_channel.code)
                    }}
                    disabled={!_onHide}
                  />
                  <span className="mx-2"></span>
                  {_channel.logo_asset_url && <img src={_channel.logo_asset_url} className={` mr-2`}
                    style={{ width: 30 }} />}{_channel.name}
                </label>
                
               </>
              )
            })
            
          }
        </div>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={() => {
              setChannelsSelected()
              _onHide()
            }}
            disabled={!_onHide}
            className="btn btn-light btn-elevate mr-3"
            style={{ width: 150 }}
          >
            <span className="font-weight-boldest"><FormattedMessage defaultMessage="ĐÓNG" /></span>
          </button>
          <button
            id="kt_login_signin_submit"
            onClick={saveClick}
            disabled={!channelsSelected || !_onHide}
            className={`btn btn-primary font-weight-bold px-9 `}
            style={{ width: 150 }}
          >
            <span className="font-weight-boldest"><FormattedMessage defaultMessage="THÊM" /></span>
            {loading && <span className="ml-3 spinner spinner-white"></span>}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default ChannelsAddDialog;