import { useLazyQuery, useMutation } from "@apollo/client";
import queryString from 'querystring';
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { FormattedMessage, useIntl } from "react-intl";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { Card, CardBody, } from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import mutate_scCancelProductJobSync from "../../../../graphql/mutate_scCancelProductJobSync";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl';
import ChannelsPage from "./ChannelsPage";
import InventorySettings from "./InventorySettings";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
const CancelJobSync = memo(({ id }) => {
  const { addToast } = useToasts();
  const [mutate, { loading }] = useMutation(mutate_scCancelProductJobSync, {
    refetchQueries: ['sc_store', 'sc_stores'],
    awaitRefetchQueries: true
  })
  const { formatMessage } = useIntl()
  return (
    <OverlayTrigger
      overlay={
        <Tooltip>
          <FormattedMessage defaultMessage="Huỷ lưu xuống UpBase" />
        </Tooltip>
      }
    >
      <button
        className="btn btn-icon btn-light btn-sm"
        disabled={loading}
        onClick={async e => {
          e.preventDefault()
          let res = await mutate({
            variables: {
              sc_product_sync_id: id
            }
          })
          if (!!res.errors) {
            addToast(formatMessage({ defaultMessage: 'Huỷ lưu xuống UpBase không thành công' }), { appearance: 'error' });
          } else {
            addToast(formatMessage({ defaultMessage: 'Huỷ lưu xuống UpBase thành công' }), { appearance: 'success' });
          }
        }}
      >
        {
          loading ? <span className="spinner spinner-primary" style={{ marginRight: 20 }} ></span> : <span className="svg-icon svg-icon-md svg-icon-control">
            <SVG src={toAbsoluteUrl("/media/svg/ic-cancel-sync.svg")} />
          </span>
        }
      </button>
    </OverlayTrigger>
  )
})

export default function Channels() {
  const location = useLocation()
  const history = useHistory()
  const params = queryString.parse(location.search.slice(1, 100000))
  const { formatMessage } = useIntl()
  const { setToolbar, appendBreadcrumbs, setBreadcrumbs } = useSubheader()
  const [storeUnlinkCurrent, setStoreUnlinkCurrent] = useState()
  const [authorize, { data: dataAuthozie }] = useLazyQuery(scSaleAuthorizationUrl)
  const { addToast } = useToasts();
  const [currentStoreId, setCurrentStoreId] = useState(-1);
  const [currentStoreSync, setCurrentStoreSync] = useState({});
  // const [tab, setTab] = useState(params.tab ?? 1);
  const [scProductSyncDown] = useMutation(mutate_scProductSyncDown, {
    refetchQueries: ['sc_stores'],
  })
  const [loadingReload, setLoadingReload] = useState(false);
  const _refCurrentStoreSync = useRef({});


  let tab = useMemo(() => {
    try {
      let _tab = Number(params.tab)
      if (!Number.isNaN(_tab)) {
        return Math.max(1, _tab)
      } else {
        return 1
      }
    } catch (error) {
      return 1
    }
  }, [params.tab])


  useEffect(() => {
    setToolbar({
      key: '/setting/channels',
      value: ""
    })
    let title = ""
    switch (tab) {
      case 1:
        setToolbar({
          key: '/setting/channels',
          value: ""
        })
        title = formatMessage({ defaultMessage: 'Quản lý gian hàng' })
        break;
      case 2:
        setToolbar({
          key: '/setting/channels',
          value: ""
        })
        title = formatMessage({ defaultMessage: 'Cài đặt đồng bộ tồn kho' })
        break;

      default:
        break;
    }
    setBreadcrumbs([])
    appendBreadcrumbs({
      title: formatMessage({ defaultMessage: 'Cài đặt' }),
      pathname: `/setting`
    })
    appendBreadcrumbs({
      title: title,
      pathname: `/setting/channels`
    })
  }, [location.pathname, tab])



  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Kết nối gian hàng" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Kết nối gian hàng" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Kết nối gian hàng" }) + "- UpBase"} />
      </Helmet>
      <Card >
        <CardBody>
          <AuthorizationWrapper keys={['setting_channel_action']}>
            <div className="d-flex justify-content-end my-3">
              <Link to='/setting/channels/add' className="btn btn-primary"><FormattedMessage defaultMessage="THÊM GIAN HÀNG" /></Link>
            </div>
          </AuthorizationWrapper>
          {/* <ul className="nav nav-tabs">
            <li className="nav-item" onClick={() => {
              history.push(`${location.pathname}?${queryString.stringify({
                ...params,
                tab: 1
              })}`)
            }}>
              <a className={`nav-link ${tab == 1 ? "active" : ""}`} ><i className="fas fa-store mr-3"></i> Kênh bán</a>
            </li>
            <li className="nav-item" onClick={() => {
              history.push(`${location.pathname}?${queryString.stringify({
                ...params,
                tab: 2
              })}`)
            }}>
              <a className={`nav-link ${tab == 2 ? "active" : ""}`}><i className="fas fa-box mr-3"></i> Cài đặt đồng bộ tồn kho</a>
            </li>
          </ul> */}

          <ChannelsPage />
          {/* {
            (() => {
              switch (tab) {
                case 1:
                  return <ChannelsPage />
                case 2:
                  return <InventorySettings />
                default:
                  return null
              }
            })()
          } */}
        </CardBody>
      </Card>
    </>
  )
}

export const actionKeys = {
  "setting_channel_view": {
    router: '/setting/channels',
    actions: [
      "sc_store",
      "scGetTrackingLoadOrder",
      "sc_stores",
      "op_connector_channels",
      "scFindStoreProductSync",
      "scGetWarehouseMapping",
      "sme_warehouses",
      "scSaleAuthorizationUrl"
    ],
    name: 'Danh sách quản lý gian hàng',
    group_code: 'setting_channel_list',
    group_name: 'Quản lý gian hàng',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  },
  "setting_channel_detail": {
    router: '/setting/channel/:id',
    actions: [
      "sc_store",      
      "scSaleAuthorizationUrl",
      "scProductSyncDown", 
      "scUpdateStore", 
      "scLoadInfoStore", 
      "scSaleAuthorizationCancel"
    ],
    name: 'Các thao tác trong màn chi tiết gian hàng',
    group_code: 'setting_channel_list',
    group_name: 'Quản lý gian hàng',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  },
  "setting_channel_action": {
    router: '/setting/channels',
    actions: [
      "scCreateStoreChannelOther",
      "scCheckNameStoreExist",
      "scSaleAuthorizationUrl",
      "scSaleAuthorizationCancel",
      "scSyncCategory",
      "scProductLoad",
      "scDisconnectStoreChannelOther",
      "scOrderLoad",
      "scLoadReturnOrder",
      "sc_stores",
      "op_connector_channels",
      "sc_sale_channel_categories",
      "scSyncBrandByCategory",
      "scGetLastJobTracking",
      "sc_job_tracking"
    ],
    name: 'Các thao tác trong màn quản lý gian hàng',
    group_code: 'setting_channel_list',
    group_name: 'Quản lý gian hàng',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  }
};
