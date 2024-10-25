import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import clsx from "clsx";
import dayjs from 'dayjs';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dropdown } from "react-bootstrap";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Helmet } from 'react-helmet-async';
import { FormattedMessage, useIntl } from "react-intl";
import { useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import AuthorizationWrapper from "../../../../components/AuthorizationWrapper";
import ModalTrackingLoadOrder from "../../../../components/ModalTrackingLoadOrder";
import mutate_scDisconnectStoreChannelOther from "../../../../graphql/mutate_scDisconnectStoreChannelOther";
import mutate_scProductLoad from "../../../../graphql/mutate_scProductLoad";
import mutate_scSyncCategory from "../../../../graphql/mutate_scSyncCategory";
import query_ScGetActiveProductSyncJob from "../../../../graphql/query_ScGetActiveProductSyncJob";
import query_scFindStoreProductSync from "../../../../graphql/query_scFindStoreProductSync";
import query_scGetTrackingLoadOrder from "../../../../graphql/query_scGetTrackingLoadOrder";
import query_stores_channel from '../../../../graphql/query_stores_channel';
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl';
import { TooltipWrapper } from "../../Finance/payment-reconciliation/common/TooltipWrapper";
import LoadingDialog from "../../ProductsStore/products-list/dialog/LoadingDialog";
import ChannelsConfirmUnlinkDialog from "./ChannelsConfirmUnlinkDialog";
import ConfirmDeleteStoreDialog from "./ConfirmDeleteStoreDialog";
import ModalDownloadBrand from "./ModalDownloadBrand";
import ModalDownloadBrandProcess from "./ModalDownloadBrandProcess";
import ReloadProductModal from "./components/ReloadProductModal";
import query_scGetLastJobTracking from "../../../../graphql/query_scGetLastJobTracking";
import query_scJobTracking from "../../../../graphql/query_scJobTracking";
import mutate_scSyncBrandByCategory from "../../../../graphql/mutate_scSyncBrandByCategory";

const POLL_TIME = 5000;

export default function ChannelsPage() {
  const location = useLocation()
  const { formatMessage } = useIntl()
  const [storeUnlinkCurrent, setStoreUnlinkCurrent] = useState()
  const [authorize, { data: dataAuthozie }] = useLazyQuery(scSaleAuthorizationUrl)
  const { addToast } = useToasts();
  const [typeLoadOrder, setTypeLoadOrder] = useState(null);
  const [dataDeleteStoreDialog, setDataDeleteStoreDialog] = useState({
    isOpen: false,
    idStore: null
  });
  const [loadingReload, setLoadingReload] = useState(false);


  const [trackingLoaderOrderModal, setshowModalTrackingAndLoadOrder] = useState(false);
  const [reloadProductModal, setReloadProductModal] = useState(false);
  const [currentInfoStore, setCurrentInfoStore] = useState(null);
  const [idTrackingOrder, setIdTrackingOrder] = useState(null);
  const [idProductSync, setIdProductSync] = useState(null);
  const [pollTime, setPoolTime] = useState(0);
  const [popupDownloadBrand, setPopupDownloadBrand] = useState({
    open: false, // mở popup chọn ngành hàng
    store: null, // currentStore
    openProcessPopup: false, // mở popup tải thương hiệu (openProcessPopup & open = false)
  })
  const [reloadProductData, setReloadProductData] = useState({
    progressBar: 0,
    totalProductSuccess: 0
  });

  const [pollTimeJobTracking, setPollTimeJobTracking] = useState(0);
  const [trackingId, setTrackingId] = useState(0);
  const [progressBar, setProgressBar] = useState(0)
  const [syncBrandByCategory] = useMutation(mutate_scSyncBrandByCategory)
  const [getLastJobTracking] = useLazyQuery(query_scGetLastJobTracking)
  const [scSyncCategory] = useMutation(mutate_scSyncCategory, {
  });
  const [scProductLoad, { loading: loadingProductload }] = useMutation(mutate_scProductLoad);
  const [deleteStoreOther, { loading: loadingDeleteStoreOther }] = useMutation(mutate_scDisconnectStoreChannelOther, {
    refetchQueries: ['sc_store', 'sc_stores'],
    awaitRefetchQueries: true
  });

  const { data: dataTrackingOrder, loading: loadingTrackingOrder, refetch: refetchGetTrackingSme } = useQuery(query_scGetTrackingLoadOrder, {

  });

  useEffect(() => {

    // Hàm để gọi lại API
    if (dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.length > 0) {
      const callAPI = () => {

        refetchGetTrackingSme(); // Gọi lại API bằng cách sử dụng refetch
      };

      if (!idTrackingOrder) {
        setIdTrackingOrder(dataTrackingOrder?.scGetTrackingLoadOrder?.trackingLoadOrder?.find(element => (element.store_id == currentInfoStore?.id && element.type == typeLoadOrder))?.id)
      }


      // Sử dụng setInterval để gọi lại hàm callAPI cách nhau 2s
      const interval = setInterval(callAPI, 1000);

      // Trả về một hàm từ useEffect để dọn dẹp khi component unmount
      return () => clearInterval(interval);
    }


  }, [dataTrackingOrder, refetchGetTrackingSme, loadingTrackingOrder, currentInfoStore]);

  const { data, loading, refetch } = useQuery(query_stores_channel, {
    fetchPolicy: 'network-only',
    variables: {
      context: 'order'
    }
  })


  useEffect(() => {
    if (location.state?.reloadStore) {
      setTimeout(() => {
        refetch()
      }, 500);
    }
  }, [location.state?.reloadStore])

  // ============ Reload Product ===============

  const [getActiveProductSyncJob, { data: dataScGetActiveProductSyncJob, error }] = useLazyQuery(query_ScGetActiveProductSyncJob, {
    fetchPolicy: "cache-and-network",
    variables: {
      st_sync_store_id: currentInfoStore?.id
    },
    onCompleted: async () => {
      if (!currentInfoStore?.id) return
      if (dataScGetActiveProductSyncJob?.scGetActiveProductSyncJob?.id) {
        setIdProductSync(+dataScGetActiveProductSyncJob?.scGetActiveProductSyncJob?.id)
        setPoolTime(1000)
        return
      }
      let { data: dataProductLoad, errors } = await scProductLoad({ variables: { store_id: currentInfoStore?.id } })
      if (dataProductLoad?.scProductLoad?.success && currentInfoStore?.id) {
        getActiveProductSyncJob()
        addToast(dataProductLoad?.scProductLoad?.message || 'Đang tải lại sản phẩm', { appearance: 'success' });
      } else {
        addToast(dataProductLoad?.scProductLoad?.message || errors[0].message, { appearance: 'error' });
      }
    }
  })

  //============= tải lại thương hiệu =================
  async function _syncBrandByCategory(connector_channel_code, list_category_id, store_id) {
    const { data } = await syncBrandByCategory({
      variables: {
        connector_channel_code,
        list_category_id,
        store_id
      }
    })

    if (data?.scSyncBrandByCategory?.tracking_id) {
      setTrackingId(data.scSyncBrandByCategory.tracking_id);
      setPollTimeJobTracking(POLL_TIME);
    }

  }

  const { data: dataJobTrackingSync } = useQuery(query_scJobTracking,
    {
      fetchPolicy: "cache-and-network",
      variables: {
        id: trackingId
      },
      pollInterval: !!trackingId ? pollTimeJobTracking : 0,
    }
  )

  useMemo(() => {
    if (!dataJobTrackingSync) return;
    let failedJob = dataJobTrackingSync?.sc_job_tracking?.failed_job;
    let successJob = dataJobTrackingSync?.sc_job_tracking?.success_job;
    let totalJob = dataJobTrackingSync?.sc_job_tracking?.total_job;

    if (totalJob > 0) {
      let _progressBar = Math.floor(((successJob + failedJob) / totalJob) * 100);
      if (_progressBar > progressBar)
        setProgressBar(_progressBar)
    }

    if (successJob + failedJob == totalJob) {
      setPollTimeJobTracking(0); //
    }
  }, [dataJobTrackingSync])
  //==============================

  const handleReloadProduct = async (row) => {
    setCurrentInfoStore(row)
    getActiveProductSyncJob()
    setReloadProductModal(true)
  }

  const { data: dataFindStoreProductSync } = useQuery(query_scFindStoreProductSync, {
    fetchPolicy: "cache-and-network",
    variables: {
      id: idProductSync
    },
    pollInterval: (pollTime && !!idProductSync) ? pollTime : 0,
  })

  useMemo(() => {
    if (!dataFindStoreProductSync) return
    const totalProduct = dataFindStoreProductSync?.scFindStoreProductSync?.st_sync_total_product
    const totalProductProcessed = dataFindStoreProductSync?.scFindStoreProductSync?.st_sync_total_product_processed
    const progressBar = ((totalProductProcessed / totalProduct) * 100).toFixed()
    const totalProductSuccess = dataFindStoreProductSync?.scFindStoreProductSync?.total_product_success

    setReloadProductData({
      progressBar,
      totalProductSuccess
    })
    if (totalProduct == totalProductProcessed) {
      setPoolTime(0)
    }

  }, [dataFindStoreProductSync])


  // ============ Reload Product ===============
  useMemo(() => {
    if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
      window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
    }

  }, [dataAuthozie]);


  const nameStore = (row) => {
    let channel = (data?.op_connector_channels || []).find(_channel => _channel.code == row.connector_channel_code)
    return (
      <div style={{ cursor: 'pointer' }} onClick={() => window.open(`/setting/channel/${row.id}`, '_blank')}>
        {!!channel && <img src={channel.logo_asset_url} className={` mr-2`} style={{ width: 24, height: 24 }} />}
        <span className={`font-size-h7`}>
          {row.name}
        </span>
      </div>
    );
  }

  const setInfoLoadOrder = (data_store, type) => {
    setCurrentInfoStore(data_store)
    setTypeLoadOrder(type)
    setshowModalTrackingAndLoadOrder(true)
  }

  const STATUS = {
    DISCONNECT: 0,
    CONNECTED: 1,
    LOST_CONNECTED: 2,
  }


  const statusStore = useCallback((row) => {

    switch (row?.status) {
      case STATUS['CONNECTED']:
        return <span style={{ color: '#3DA153' }}><FormattedMessage defaultMessage="Đã kết nối" /></span>
      case STATUS['LOST_CONNECTED']:
        return <div className="d-flex align-items-center justify-content-center">
          <span style={{ color: '#FF0000' }}><FormattedMessage defaultMessage="Mất kết nối" /></span>
          <TooltipWrapper note={formatMessage({ defaultMessage: "Gian hàng bị hết hạn uỷ quyền, vui lòng kết nối lại." })}>
            <img style={{ cursor: 'pointer', marginLeft: '4px' }} src={toAbsoluteUrl("/media/warningsvg.svg")}></img>
          </TooltipWrapper>

        </div>
      default:
        return <span style={{ color: '#FF0000' }}><FormattedMessage defaultMessage="Ngắt kết nối" /></span>
    }
  }, [data])


  const formatAuthorizeTime = useCallback((authorization_expired_at) => {
    let view;

    if (!authorization_expired_at) {
      view = <span>
        {formatMessage({ defaultMessage: 'Không giới hạn' })}
      </span>
    }

    if (!!authorization_expired_at) {
      let [daysStill, hoursStill] = [
        dayjs(authorization_expired_at).diff(dayjs(), 'days'),
        dayjs(authorization_expired_at).diff(dayjs(), 'hours'),
      ];
      const hours = hoursStill - daysStill * 24
      const textStill = formatMessage({ defaultMessage: `còn {time} {date_type}` }, {
        time: daysStill > 0 ? daysStill : (hours <= 0 ? '0' : hours > 10 ? hours : `0${hours}`),
        date_type: (daysStill > 0 || hours <= 0) ? 'ngày' : 'giờ'
      })

      view = <div className="d-flex align-items-center justify-content-center">
        <span className="mr-2">
          {dayjs(authorization_expired_at).format('DD/MM/YYYY HH:mm')}
        </span>
        (<span className={clsx(daysStill < 8 && 'text-danger')}>
          {textStill}
        </span>)
      </div>
    }

    return view;
  }, []);

  const actionStore = useCallback((row) => {
    return (
      <>
        <Dropdown drop='down' >
          <Dropdown.Toggle className='btn-outline-secondary' >
            {formatMessage({ defaultMessage: 'Chọn' })}
          </Dropdown.Toggle>

          <Dropdown.Menu>
          <AuthorizationWrapper keys={['setting_channel_detail']}>
            <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
              e.preventDefault();
                window.open(`/setting/channel/${row.id}`, '_blank')

              }} >{formatMessage({ defaultMessage: 'Xem chi tiết' })}</Dropdown.Item>
            </AuthorizationWrapper>
            <AuthorizationWrapper keys={['setting_channel_action']}>

              {row?.connector_channel_code !== 'other' && (
                <Dropdown.Item className="mb-1 d-flex" >

                  <div onClick={e => {
                    authorize({
                      variables: {
                        connector_channel_code: row.connector_channel_code
                      }
                    })
                  }} >
                    <FormattedMessage defaultMessage="Kết nối lại" />
                  </div>
                </Dropdown.Item>
              )}
              {row?.connector_channel_code !== 'other' && (
                <Dropdown.Item className="mb-1 d-flex" >
                  {
                    !!row.status &&
                    <div onClick={e => setStoreUnlinkCurrent(row.id)} >
                      <FormattedMessage defaultMessage="Ngắt kết nối" />
                    </div>
                  }

                </Dropdown.Item>)}


              {row?.connector_channel_code !== 'other' && row.status !== STATUS['LOST_CONNECTED'] && row.connector_channel_code != 'lazada' && row.status != 0 && (
                <Dropdown.Item className="mb-1 d-flex" >
                  <div
                    onClick={async e => {
                      e.preventDefault();
                      // setCurrentStoreId(row.id);
                      addToast(formatMessage({ defaultMessage: 'Hệ thống đang thực hiện tải lại danh mục' }), { appearance: 'success' });

                      setLoadingReload(true);
                      let res = await scSyncCategory({
                        variables: {
                          connector_channel_code: row.connector_channel_code,
                          store_id: row.id,
                        }
                      })
                      setLoadingReload(false);
                      if (res?.data?.scSyncCategory?.success) {
                        addToast(formatMessage({ defaultMessage: 'Đã tải lại danh mục' }), { appearance: 'success' });
                      } else {
                        addToast(res?.data?.scSyncCategory?.message || res.errors[0].message, { appearance: 'error' });
                      }
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Tải lại danh mục' })}
                  </div>

                </Dropdown.Item>
              )}

              {
                row?.connector_channel_code !== 'other' && row.status !== STATUS['LOST_CONNECTED'] && !!row.status && <Dropdown.Item className="mb-1 d-flex" onClick={e => { setInfoLoadOrder(row, 1) }} >

                  <div >
                    {formatMessage({ defaultMessage: 'Tải lại đơn hàng' })}
                  </div>

                </Dropdown.Item>
              }

              {
                row?.connector_channel_code !== 'other' && row.status !== STATUS['LOST_CONNECTED'] && !!row.status && <Dropdown.Item className="mb-1 d-flex" onClick={e => { setInfoLoadOrder(row, 2) }}>
                  <div>
                    {formatMessage({ defaultMessage: 'Tải lại đơn hoàn' })}
                  </div>

                </Dropdown.Item>
              }

              {
                row?.connector_channel_code === 'other' && <Dropdown.Item className="mb-1 d-flex"
                  onClick={async () => {
                    setDataDeleteStoreDialog({
                      isOpen: true,
                      idStore: row?.id
                    })

                  }}>
                  <div>
                    {formatMessage({ defaultMessage: 'Xóa gian hàng' })}
                  </div>

                </Dropdown.Item>
              }

              {row?.connector_channel_code !== 'other' && row.status !== STATUS['LOST_CONNECTED'] &&
                <Dropdown.Item className="mb-1 d-flex"
                  onClick={() => handleReloadProduct(row)}
                >
                  <div>
                    {formatMessage({ defaultMessage: 'Tải lại sản phẩm' })}
                  </div>

                </Dropdown.Item>}

              {row?.connector_channel_code !== 'other' && row.status !== STATUS['LOST_CONNECTED'] && (row.connector_channel_code == 'shopee' || row.connector_channel_code == 'tiktok') && row.status != 0 && (
                <Dropdown.Item className="mb-1 d-flex" onClick={async e => {
                  e.preventDefault();
                  const { data: dataLastJobStracking } = await getLastJobTracking({
                    variables: {
                      store_id: row.id
                    },
                    fetchPolicy: "no-cache"
                  })

                  let activeTrackingId = dataLastJobStracking?.scGetLastJobTracking?.id;
                  let total_job = dataLastJobStracking?.scGetLastJobTracking?.total_job;
                  let success_job = dataLastJobStracking?.scGetLastJobTracking?.success_job;
                  let failed_job = dataLastJobStracking?.scGetLastJobTracking?.failed_job;

                  if (total_job == success_job + failed_job) activeTrackingId = 0;
                  if (activeTrackingId) {
                    setPopupDownloadBrand({ open: false, store: row, openProcessPopup: true })
                    setTrackingId(activeTrackingId);
                    setPollTimeJobTracking(POLL_TIME)
                  }
                  else {
                    if (row.connector_channel_code == 'shopee' || row.connector_channel_code == 'tiktok') {
                      setPopupDownloadBrand({ open: true, store: row, openProcessPopup: false })
                    }
                  }
                }}>
                  <div>
                    {formatMessage({ defaultMessage: 'Tải thương hiệu' })}
                  </div>

                </Dropdown.Item>
              )}
            </AuthorizationWrapper>
          </Dropdown.Menu>
        </Dropdown>

      </>
    );
  }, [data])

  // let totalRecord = data?.scStoreByFilter?.total || 0
  // let totalPage = Math.ceil(totalRecord / limit);
  function converCountryCode(code) {
    try {
      return new Intl.DisplayNames(['vi'], { type: 'region' }).of(code?.toUpperCase())
    } catch (err) {

    }
  }
  return (
    <>
      <LoadingDialog show={loadingProductload || loadingDeleteStoreOther} />
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Kênh bán" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Kênh bán" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Kênh bán" }) + "- UpBase"} />
      </Helmet>

      <table className="table table-borderless table-vertical-center fixed">
        <thead
          style={{
            borderBottom: '1px solid #F0F0F0',
            borderRight: '1px solid #d9d9d9',
            borderLeft: '1px solid #d9d9d9',
            background: "#F3F6F9",
            fontWeight: "bold",
            fontSize: "14px",
            position: 'sticky',
            top: 44,
            zIndex: 10
          }}
        >
          <tr className="font-size-lg">
            <th style={{ fontSize: '14px' }} className="pl-6">{formatMessage({ defaultMessage: "Tên gian hàng" })}</th>
            <th style={{ fontSize: '14px' }} className="text-center">{formatMessage({ defaultMessage: "Trạng thái" })}</th>
            <th style={{ fontSize: '14px', width: "200px" }} className="text-center">{formatMessage({ defaultMessage: "Quốc gia" })}</th>
            {/* <th style={{ width: "200px", fontSize: '14px' }} className="text-center">Đơn hàng</th> */}
            <th className="text-center" style={{ fontSize: '14px' }}>{formatMessage({ defaultMessage: "Thời gian hết hạn ủy quyền" })}</th>
            <th style={{ width: "150px", fontSize: '14px' }} className="text-center">{formatMessage({ defaultMessage: "Thao tác" })}</th>
          </tr>
        </thead>
        <tbody>
          {!loading && _.sortBy(data?.sc_stores || [], _store => 1 - (_store.status || 0))?.map((store, index) => {
            return <tr key={index} className="borderRight" style={{ borderBottom: '0.5px solid #d9d9d9' }}>
              <td style={{ borderLeft: '1px solid #d9d9d9' }}>{nameStore(store)}</td>
              <td className="text-center">{store?.connector_channel_code === 'other' ? '--' : <span>{statusStore(store)}</span>}</td>
              <td className="text-center">
                {/* {productStore(store)} */}
                {converCountryCode(store?.country_code) || '--'}

              </td>
              {/* <td className="text-center">{orderStore(store)}</td> */}
              <td className="text-center">{store?.connector_channel_code === 'other' ? '--' : formatAuthorizeTime(store?.authorization_expired_at)}</td>
              <td className="text-center">{actionStore(store)}</td>
            </tr>
          }
          )}
        </tbody>
      </table>
      {
        loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
          <span className="ml-3 spinner spinner-primary"></span>
        </div>
      }
      {/* <Pagination
          page={page}
          totalPage={totalPage}
          loading={loading}
          limit={limit}
          totalRecord={totalRecord}
          count={data?.scStoreByFilter?.stores?.length}
          basePath={'/setting/channels'}
          emptyTitle={formatMessage({defaultMessage:'Chưa có gian hàng nào'})}
        /> */}
      {/* </CardBody>
      </Card> */}

      <LoadingDialog show={loadingReload} />

      {/* <Modal
        show={!loadingReload && currentStoreId > 0}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setCurrentStoreId(-1)}
      >
        <Modal.Body className="overlay overlay-block cursor-default">
          <div className="mb-4" style={{ fontSize: 16 }}>
            (Lưu ý) Với những sản phẩm sàn đã liên kết với sản phẩm UpBase thì các thông tin sau sẽ không được cập nhật:
          </div>
          <ul>
            <li style={{ fontSize: 14 }} className="mb-4">Hình ảnh/Video sản phẩm</li>
            <li style={{ fontSize: 14 }} className="mb-4">Phân loại sản phẩm</li>
          </ul>
          <div className="form-group mb-0 mt-8 d-flex justify-content-between">
            <button
              className="btn btn-light btn-elevate mr-6"
              style={{ width: '47%' }}
              onClick={() => setCurrentStoreId(-1)}
            >
              <span className="font-weight-boldest">HUỶ</span>
            </button>
            <button
              className="btn btn-primary btn-elevate mr-3"
              style={{ width: '47%' }}
              onClick={async () => {
                setLoadingReload(true);
                let res = await scProductLoad({
                  variables: {
                    store_id: currentStoreId,
                  }
                })

                setCurrentStoreId(-1);
                setLoadingReload(false);
                if (res?.data?.scProductLoad?.success) {
                  addToast('Bắt đầu tải lại sản phẩm', { appearance: 'success' });
                } else {
                  addToast(res?.data?.scProductLoad?.message || res.errors[0].message, { appearance: 'error' });
                }
              }}
            >
              <span className="font-weight-boldest">XÁC NHẬN</span>
            </button>
          </div>
        </Modal.Body>
      </Modal> */}
      {
        !!storeUnlinkCurrent && <ChannelsConfirmUnlinkDialog
          refetch={refetch}
          show={!!storeUnlinkCurrent}
          storeUnlinkCurrent={storeUnlinkCurrent}
          onHide={() => {
            setStoreUnlinkCurrent(null)
          }}
        />
      }

      <ReloadProductModal
        reloadProductData={reloadProductData}
        show={reloadProductModal}
        onHide={() => {
          setReloadProductData({
            progressBar: 0,
            totalProductSuccess: 0
          })
          setIdProductSync(null)
          setPoolTime(0)
          setReloadProductModal(false)
        }} currentInfoStore={currentInfoStore} />

      <ConfirmDeleteStoreDialog onDeleteStore={async () => {
        const { data } = await deleteStoreOther({
          variables: {
            store_id: dataDeleteStoreDialog.idStore
          }
        })
        if (!!data?.scDisconnectStoreChannelOther?.success) {
          addToast(formatMessage({ defaultMessage: 'Xoá gian hàng thành công' }), { appearance: 'success' })
          setDataDeleteStoreDialog({ isOpen: false, idStore: null })
          refetch()
        } else {
          addToast('Xoá gian hàng thất bại' || '', { appearance: 'error' })
          setDataDeleteStoreDialog({ isOpen: false, idStore: null })
        }
      }} show={dataDeleteStoreDialog.isOpen}
        onHide={() => setDataDeleteStoreDialog({ isOpen: false, idStore: null })}
      />
      <ModalTrackingLoadOrder
        show={trackingLoaderOrderModal}
        idTrackingOrder={idTrackingOrder}
        onHide={() => { setshowModalTrackingAndLoadOrder(false); setCurrentInfoStore(null); setIdTrackingOrder(null) }}
        refetchGetTrackingSme={() => refetchGetTrackingSme()}
        type={typeLoadOrder}
        currentInfoStore={currentInfoStore}
        onChoosed={_channel => {
        }}
      />

      <ModalDownloadBrand
        show={popupDownloadBrand.open}
        onHide={(list_category_id) => {
          if (!list_category_id) setPopupDownloadBrand({ open: false, isLazada: false, store: null })
          else {
            setPopupDownloadBrand({ ...popupDownloadBrand, openProcessPopup: true, open: false })
            _syncBrandByCategory(popupDownloadBrand.store.connector_channel_code, list_category_id, popupDownloadBrand.store.id)
          }
        }}
        currentInfoStore={popupDownloadBrand.store}
        nameStore={nameStore}
      />

      <ModalDownloadBrandProcess
        show={popupDownloadBrand.openProcessPopup}
        onHide={() => {
          setPopupDownloadBrand({ open: false, store: null, openProcessPopup: false });
          setPollTimeJobTracking(0);
          setTrackingId(0);
          setProgressBar(0)
        }}
        currentInfoStore={popupDownloadBrand.store}
        nameStore={nameStore}
        progressBar={progressBar}
      />
    </>
  )
}
