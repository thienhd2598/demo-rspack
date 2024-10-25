import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage } from "react-intl";
import op_connector_channels from '../../../../graphql/op_connector_channels'
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import sc_store from '../../../../graphql/query_sc_store'
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { useLocation } from "react-router";
import { Card, CardBody, CardHeader, CardHeaderToolbar } from "../../../../_metronic/_partials/controls";
import { Link, useRouteMatch } from "react-router-dom";
import dayjs from 'dayjs'
import { useSubheader } from "../../../../_metronic/layout/_core/MetronicSubheader";
import ChannelsConfirmUnlinkDialog from "./ChannelsConfirmUnlinkDialog";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";
import mutate_scUpdateStore from '../../../../graphql/mutate_scUpdateStore';
import mutate_scLoadInfoStore from '../../../../graphql/mutate_scLoadInfoStore';
import LoadingDialog from "../../ProductsStore/products-list/dialog/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";
import { ArrowBackIos } from "@material-ui/icons";

const OPTIONS_PRINT_STATUS = [
  { value: 0, label: <FormattedMessage defaultMessage="Theo sàn" /> },
  { value: 1, label: <FormattedMessage defaultMessage="Theo Upbase" /> },
];

function ChannelsDetailPage() {
  const location = useLocation()
  const { formatMessage } = useIntl()
  const { appendBreadcrumbs, setToolbar } = useSubheader()
  const [storeUnlinkCurrent, setStoreUnlinkCurrent] = useState();
  const [showUpdateStore, setShowUpdateStore] = useState(false);
  const [isCheckedSpecical, setCheckedSpecial] = useState(false);
  const [authorize, { data: dataAuthozie }] = useLazyQuery(scSaleAuthorizationUrl)
  const route = useRouteMatch()
  const { data } = useQuery(sc_store, {
    variables: {
      id: parseInt(route.params.id)
    }
  });
  console.log('data', data)

  const [scUpdateStore, { loading: loadingUpdateStore }] = useMutation(mutate_scUpdateStore, {
    refetchQueries: ['sc_store'],
    awaitRefetchQueries: true
  });
  const [scLoadInfoStore, { loading: loadingScLoadInfoStore }] = useMutation(mutate_scLoadInfoStore, {
    refetchQueries: ['sc_store'],
    awaitRefetchQueries: true
  });


  const [scProductSyncDown] = useMutation(mutate_scProductSyncDown, {
    refetchQueries: ['sc_stores', 'sc_store'],
  })
  const { addToast } = useToasts();
  useEffect(() => {
    appendBreadcrumbs({
      title: formatMessage({ defaultMessage: 'Cài đặt' }),
      pathname: `/setting`
    })
    appendBreadcrumbs({
      title: formatMessage({ defaultMessage: 'Kết nối gian hàng' }),
      pathname: `/setting/channels`
    })
  }, [location.pathname])

  // useEffect(() => {
  //   if (!!data?.sc_store)
  //     setToolbar({
  //       key: `/setting/channel/${route.params.id}`,
  //       value: <>

  //       </>
  //     })
  // }, [data?.sc_store])


  useMemo(() => {
    if (!!data?.sc_store?.name)
      setTimeout(() => {
        appendBreadcrumbs({
          title: data?.sc_store?.name,
          pathname: `/setting/channel/${route.params.id}`
        })
      }, 500);
  }, [data?.sc_store?.name, location.pathname])

  useMemo(() => {
    if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
      window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
    }

  }, [dataAuthozie])

  const store = data?.sc_store || null

  const channel = (data?.op_connector_channels || []).find(_channel => _channel.code == store?.connector_channel_code)
  const company = useMemo(() => {
    if (!store) {
      return {}
    }
    try {
      return JSON.parse(store.payload)
    } catch (error) {
      return {}
    }
  }, [store]);


  const helmetRender = useMemo(
    () => {
      if (!store?.name) return null;

      return (
        <Helmet
          titleTemplate={`${store?.name} - UpBase`}
          defaultTitle={`${store?.name} - UpBase`}
        >
          <meta name="description" content={`${store?.name} - UpBase`} />
        </Helmet>
      )
    }, [store?.name]
  );

  const STATUS = {
    DISCONNECT: 0,
    CONNECTED: 1,
    LOST_CONNECTED: 2,
  }

  function converCountryCode(code) {
    try {
      return new Intl.DisplayNames(['vi'], { type: 'region' }).of(code?.toUpperCase())
    } catch (err) {

    }
  }

  return (
    <>
      {helmetRender}
      <Card >
        {
          !!data?.sc_store && (
            <CardBody>

              {/* <div className="d-flex justify-content-between mt-4 mb-12">
                
                <h6 ><FormattedMessage defaultMessage="THÔNG TIN GIAN HÀNG" /> </h6>

                {!!data?.sc_store?.status && <button className="btn btn-secondary" onClick={e => {
                  e.preventDefault()
                  setStoreUnlinkCurrent(parseInt(route.params.id))
                }} ><FormattedMessage defaultMessage="NGẮT KẾT NỐI" /></button>}
                {!data?.sc_store?.status && <a to={`#`} className="btn btn-primary"
                  onClick={e => {
                    authorize({
                      variables: {
                        connector_channel_code: data?.sc_store?.connector_channel_code
                      }
                    })
                  }}
                ><FormattedMessage defaultMessage="KẾT NỐI LẠI" /></a>}
                {!!data?.sc_store?.status && data?.sc_store?.total_product_loaded != data?.sc_store?.total_product_synced && <button
            className="btn btn-primary ml-4"
            onClick={async e => {
              e.preventDefault();
              let res = await scProductSyncDown({
                variables: {
                  store_id: parseInt(route.params.id),
                  products: []
                }
              })

              if (res?.data?.scProductSyncDown?.success) {
                addToast('Bắt đầu lưu xuống Upbase', { appearance: 'success' });
              } else {
                addToast(res?.data?.scProductSyncDown?.message || res.errors[0].message, { appearance: 'error' });
              }
            }}
          ><FormattedMessage id='SETTING_CHANNEL.SELECT_DIALOG.SYNC_PRODUCT_2' /></button>}
              </div>   */}
              <div className="mb-5">
                <a href="/setting/channels" style={{ color: '#ff5629' }} > <ArrowBackIos /> {formatMessage({ defaultMessage: 'Quay lại' })}</a>
              </div>

              <div className='row' >
                {store?.connector_channel_code !== 'other' && (
                  <div className='col-2'>
                    {(!!company.logo_url || !!company.shop_logo) ? <img src={company.logo_url || company.shop_logo} style={{ width: '81%' }} /> : <img src={toAbsoluteUrl("/media/default-placeholder.png")} style={{ width: '81%' }} />}
                  </div>
                )}

                <div className='col-10'>
                  <div className='row' >

                    <div className="col-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }}><FormattedMessage defaultMessage="Sàn:" /></p>
                        <span className="ml-2">{channel?.name || 'other'}</span>
                      </div>
                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }}  >
                          <FormattedMessage defaultMessage="Tên công ty:" /> </p>
                        <span className="ml-2" >{store?.company_name || '--'}</span>
                      </div>

                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }}  >
                          <FormattedMessage defaultMessage="Quốc gia:" /> </p>
                        <span className="ml-2">{converCountryCode(store?.country_code) || '--'}</span>
                      </div>


                    </div>

                    <div className="col-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }} ><FormattedMessage defaultMessage="Tên gian hàng:" /> </p>
                        <span className="ml-2">{store?.name}</span>
                      </div>
                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }} >
                          <FormattedMessage defaultMessage="Email:" /> </p>
                        <span className="ml-2">{store?.email || '--'}</span>
                      </div>
                      <div className='mb-8 d-flex align-items-center'>
                        <p style={{ fontWeight: 'bold', marginBottom: 0 }} >
                          <FormattedMessage defaultMessage="Trạng thái:" />
                        </p> {store?.connector_channel_code == 'other' ? '--' : store.status !== STATUS['LOST_CONNECTED'] ? <span className="text-success ml-2"><FormattedMessage defaultMessage="Đã kết nối" /></span> :
                          <span className="text-danger ml-2"><FormattedMessage defaultMessage="Mất kết nối" /></span>}
                      </div>
                      {/* <div className='mb-8 d-flex align-items-center'>
                      <p style={{ fontWeight: 'bold'}}>
                        <FormattedMessage defaultMessage="Trạng thái kết nối với UpBase:" /></p>
                       {!!store.status ?
                        <span className="text-success"><FormattedMessage defaultMessage="Đã kết nối" /></span> 
                        : 
                        <span className="text-danger"><FormattedMessage defaultMessage="Ngắt kết nối" /></span>}
                    </div> */}
                    </div>
                    {/* <div className='col-4 mb-4'>
                    <p className='mb-1 font-weight-bold' ><FormattedMessage id="SETTING_CHANNEL.CHANNELS.TITLE_TIME" /> </p> <p className='' >{dayjs(store.last_connected_at).format('HH:mm DD/MM/YYYY')}</p>
                  </div> */}


                    {/* <div className='col-12 mb-4'>
                      <p className='mb-1' >
                        <span className="mr-4 font-weight-bold">Loại gian hàng:</span>
                        <span style={{ cursor: 'pointer' }}>
                          {data?.sc_store?.special_type === 1 ? <span>Mall - Mô tả kèm hình ảnh</span> : <span>Thường</span>}
                        </span>
                      </p>
                    </div> */}

                  </div>
                </div>

              </div>
              <div className='mb-4 mt-4'>
                <span style={{ fontWeight: 'bold' }}>
                  <FormattedMessage defaultMessage="Mô tả gian hàng:" /></span>
                <p style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: store?.description }} >{ }</p>
              </div>

              {store?.connector_channel_code !== 'other' && (
                <>
                  <div className='mb-2 mt-4'>
                    <span className='mb-1 d-flex align-items-center'>
                      <span style={{ fontWeight: 'bold' }} className="mr-4">{formatMessage({ defaultMessage: 'Mô tả kèm hình ảnh' })}:</span>
                      <span className="switch" style={{ display: 'inline' }}>
                        <label>
                          <input
                            type={'checkbox'}
                            style={{ background: '#F7F7FA', border: 'none' }}
                            onChange={e => {
                              setShowUpdateStore(true);
                            }}
                            disabled={!store?.status || data?.sc_store?.special_type === 1 || data?.sc_store?.connector_channel_code != 'shopee'}
                            checked={data?.sc_store?.special_type === 1 ? true : false}
                          />
                          <span></span>
                        </label>
                      </span>
                    </span>
                  </div>
                  {data?.sc_store?.special_type === 1 && (
                    <div className="col-12">
                      <i
                        className="font-weight-bold"
                        style={{ fontSize: 12 }}
                      >
                        {formatMessage({ defaultMessage: 'Việc tắt tính năng sẽ gây ảnh hưởng mất dữ liệu mô tả của sản phẩm. Liên hệ CSKH của UpBase trường hợp bạn cần hỗ trợ.' })}
                      </i>
                    </div>
                  )}
                </>
              )}

              {store?.connector_channel_code == 'shopee' && <div className='my-2'>
                <span className='mb-1 d-flex align-items-center'>
                  <span style={{ fontWeight: 'bold' }} className="mr-4">{formatMessage({ defaultMessage: 'Mẫu phiếu vận đơn:' })}</span>
                  <div className="d-flex">
                    {OPTIONS_PRINT_STATUS?.map(item => (
                      <label key={`item--${item?.value}`} className="radio mr-4">
                        <input
                          type="radio"
                          checked={data?.sc_store?.is_custom_label == item?.value}
                          onChange={async (e) => {
                            let res = await scUpdateStore({
                              variables: {
                                store_id: data?.sc_store?.id || 0,
                                is_custom_label: item?.value,
                              }
                            });

                            if (res?.data?.scUpdateStore?.success) {
                              addToast(res?.data?.scUpdateStore?.message || formatMessage({ defaultMessage: 'Cập nhật gian hàng thành công' }), { appearance: 'success' });
                            } else {
                              addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
                            }

                          }}
                        />
                        <span></span>
                        &ensp;{item?.label}
                      </label>
                    ))}</div>
                </span>
                <i className="fs-12">{formatMessage({ defaultMessage: 'Việc chuyển đổi mẫu phiếu vận đơn sẽ chỉ được áp dụng với những đơn hàng mới, có thao tác “Chuẩn bị hàng” trên phần mềm UpBase SMEs.' })}</i>
              </div>}


              {store?.connector_channel_code !== 'other' && (
                <button onClick={async () => {
                  const { data: dataLoadInfo } = await scLoadInfoStore({
                    variables: {
                      store_id: +route.params.id,
                      connector_channel_code: data?.sc_store?.connector_channel_code
                    }
                  })
                  if (!!dataLoadInfo?.scLoadInfoStore?.success) {
                    addToast('Tải lại thông tin thành công', { appearance: 'success' })
                    return
                  }
                  addToast('Tải lại thông tin thất bại', { appearance: 'error' })
                }} className="btn btn-primary mt-4">Tải lại thông tin</button>
              )}


            </CardBody>
          )
        }
      </Card>
      <LoadingDialog show={loadingUpdateStore || loadingScLoadInfoStore} />

      <Modal
        onHide={() => setShowUpdateStore(false)}
        show={showUpdateStore}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        size='md'
      >
        <div className="d-flex mt-6 mx-8">
          <p>{formatMessage({ defaultMessage: 'Chỉ bật tính năng đối với gian hàng khi tạo/sửa sản phẩm trên sàn Shopee có phần mô tả sản phẩm như hình' })}:</p>
        </div>
        <div className="mt-6 mb-8 mx-8">
          <img
            src={`${toAbsoluteUrl("/media/description_extend.png")}`}
            alt="image"
            style={{ width: "100%" }}
          />
          <p>{formatMessage({ defaultMessage: 'Bạn có chắc chắn gian hàng của bạn được nhập mô tả kèm hình ảnh? Lưu ý: Bạn sẽ không thể tắt tính năng này nên cần cân nhắc kỹ trước khi bật tính năng' })}</p>
        </div>
        <div className="form-group mb-8 mx-16 text-center mt-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-elevate mr-6"
            style={{ width: '46%' }}
            onClick={e => {
              e.preventDefault()
              setShowUpdateStore(false)
            }}
          >
            {formatMessage({ defaultMessage: 'HUỶ' })}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-elevate"
            style={{ width: '46%' }}
            onClick={async e => {
              e.preventDefault();

              setShowUpdateStore(false);
              let res = await scUpdateStore({
                variables: {
                  store_id: data?.sc_store?.id || 0,
                  special_type: data?.sc_store?.special_type === 1 ? 0 : 1,
                }
              });
              if (res?.data?.scUpdateStore?.success) {
                addToast(res?.data?.scUpdateStore?.message || formatMessage({ defaultMessage: 'Cập nhật loại gian hàng thành công' }), { appearance: 'success' });
              } else {
                addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
              }
            }}
          >
            {formatMessage({ defaultMessage: 'BẬT TÍNH NĂNG' })}
          </button>
        </div>
      </Modal>
      <ChannelsConfirmUnlinkDialog
        show={!!storeUnlinkCurrent}
        storeUnlinkCurrent={storeUnlinkCurrent}
        onHide={() => {
          setStoreUnlinkCurrent(null)
        }}
      />
    </>
  );
}

export default ChannelsDetailPage;