import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, ProgressBar } from "react-bootstrap";
import { injectIntl } from "react-intl";
import Select from "react-select";
import { useHistory } from "react-router";
import DateRangePicker from 'rsuite/DateRangePicker';
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import mutate_scOrderLoad from "../graphql/mutate_scOrderLoad";
import query_sc_stores_basic from "../graphql/query_sc_stores_basic";
import { Field, Formik } from "formik";
import { ReSelect } from "../_metronic/_partials/controls/forms/ReSelect";
import * as Yup from "yup";
import mutate_scLoadReturnOrder from "../graphql/mutate_scLoadReturnOrder";
import LoadingDialog from "../app/modules/ProductsStore/product-new/LoadingDialog";
import query_co_get_tracking_load_order from "../graphql/query_co_get_tracking_load_order";
import { ReSelectVertical } from "../_metronic/_partials/controls/forms/ReSelectVertical";
import { useIntl } from 'react-intl';
import { add, min, startOfDay } from "date-fns";
import { endOfDay } from "date-fns";

function ModalTrackingLoadOrder({ show, onHide, idTrackingOrder, refetchGetTrackingSme, type, currentInfoStore, params = null }) {
  const { addToast } = useToasts();
  const [valueRangeTime, setValueRangeTime] = useState(null);
  const _disableClick = useRef(false)
  const [initialValues, setInitialValues] = useState({});
  const [disabled, setDisabled] = useState(false);
  const { combine, allowedMaxDays, afterToday, after, before } = DateRangePicker;
  const { formatMessage } = useIntl()
  const { data: dataTrackingOrder, loading: loadingTracking, refetch } = useQuery(query_co_get_tracking_load_order, {
    variables: {
      id: idTrackingOrder
    },
  });  

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });

  useEffect(() => {

    // Hàm để gọi lại API
    let tracking_load_order = dataTrackingOrder?.co_get_tracking_load_order
    if (tracking_load_order && show && tracking_load_order?.total_job_load > tracking_load_order?.total_job_load_processed) {
      const callAPI = () => {
        refetch(); // Gọi lại API bằng cách sử dụng refetch
      };

      // Sử dụng setInterval để gọi lại hàm callAPI cách nhau 2s
      const interval = setInterval(callAPI, 1000);

      // Trả về một hàm từ useEffect để dọn dẹp khi component unmount
      return () => clearInterval(interval);
    }

  }, [dataTrackingOrder?.co_get_tracking_load_order, refetch, loadingTracking, idTrackingOrder, show]);

  const checkCurrentInfoStore = (currentInfoStore) => {
    if (currentInfoStore) {
      setInitialValues({
        channel: { a: 2 },
        store: { a: 2 },
        range_time: [],
      })
    }

    if (!currentInfoStore) {
      let rangeTimeConvert = [
        dayjs(new Date()).subtract(!!params?.is_old_order ? 104 : 14, 'day').startOf('day').unix(),
        dayjs(new Date()).subtract(!!params?.is_old_order ? 90 : 0, 'day').endOf('day').unix()
      ]?.map(
        _range => new Date(_range * 1000)
      );
      setValueRangeTime(rangeTimeConvert)
    } else {
      setValueRangeTime(null)
    }
  }


  useEffect(() => {
    refetchGetTrackingSme()
    if (show) {
      setInitialValues({
        channel: '',
        store: '',
        range_time: [1, 2],
      })
    } else {
      setInitialValues({})
      setValueRangeTime(null)
    }

    if (!dataTrackingOrder?.co_get_tracking_load_order) {
      setDisabled(false)
    }

    checkCurrentInfoStore(currentInfoStore)

  }, [show, dataTrackingOrder?.co_get_tracking_load_order, currentInfoStore, params?.is_old_order])


  let storeInfo = (store_id) => {

    const store = dataStore?.sc_stores?.find((st) => st.id == store_id);
    const channel = dataStore?.op_connector_channels?.find((st) => st.code == store?.connector_channel_code);
    return {
      logo: channel?.logo_asset_url,
      name: store?.name
    }
  }

  const [mutateLoadOrder, { loading, data }] = useMutation(mutate_scOrderLoad)
  const [mutateLoadOrderReturn, { loadingReturn }] = useMutation(mutate_scLoadReturnOrder)

  useEffect(() => {
    if (!loading) {
      _disableClick.current = false;
    }
  }, [loading])


  return (
    <Formik
      initialValues={initialValues}
      validationSchema={Yup.object().shape({
        channel: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn sàn" })),
        store: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn gian hàng" })),
        range_time: Yup.array().required(`${formatMessage({ defaultMessage: "Vui lòng chọn thời gian" })} ${type == 1 ? formatMessage({ defaultMessage: 'tạo đơn' }) : formatMessage({ defaultMessage: 'tạo hoàn' })}`)
      })}
      enableReinitialize
      onSubmit={async values => {
        let variablesLoad = {
          store_id: values?.store?.value,
          ref_shop_id: values?.store?.ref_shop_id,
          connector_channel_code: values?.channel?.value,
          time_range_field: 'order_at',
          time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
          time_from: dayjs(valueRangeTime[0]).startOf('day').unix()
        }

        if (currentInfoStore) {
          variablesLoad = {
            store_id: currentInfoStore.id,
            ref_shop_id: currentInfoStore?.ref_shop_id,
            connector_channel_code: currentInfoStore?.connector_channel_code,
            time_range_field: 'order_at',
            time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
            time_from: dayjs(valueRangeTime[0]).startOf('day').unix()
          }
        }


        if (type == 1) {
          const { data } = await mutateLoadOrder({
            variables: variablesLoad
          });
          if (data?.scOrderLoad?.success) {
            addToast(formatMessage({ defaultMessage: 'Bắt đầu tải lại đơn hàng' }), { appearance: 'success' });
            refetchGetTrackingSme()
            setDisabled(true)
          } else {
            addToast(data?.scOrderLoad?.message || formatMessage({ defaultMessage: 'Tải lại lỗi' }), { appearance: 'error' });
          }
        } else {
          delete variablesLoad.time_range_field;
          const { data } = await mutateLoadOrderReturn({
            variables: variablesLoad
          });
          if (data?.scLoadReturnOrder?.success) {
            addToast(formatMessage({ defaultMessage: 'Bắt đầu tải lại đơn hoàn' }), { appearance: 'success' });
            refetchGetTrackingSme()
            setDisabled(true)
          } else {
            addToast(data?.scLoadReturnOrder?.message || formatMessage({ defaultMessage: 'Tải lại lỗi' }), { appearance: 'error' });
          }
        }


      }}
    >
      {({
        values,
        handleSubmit,
        validateForm,
        setFieldValue,
        errors,
        touched
      }) => {
        return (
          <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            onHide={() => {
              !!onHide && !loading && onHide()
            }}
          >
            {
              <LoadingDialog show={loading || loadingReturn} />
            }

            <Modal.Header>
              <Modal.Title>
                {type == 1 ? formatMessage({ defaultMessage: 'Tải đơn hàng' }) : formatMessage({ defaultMessage: 'Tải đơn hoàn' })}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" >
              {!dataTrackingOrder?.co_get_tracking_load_order ? <div className="col-12" >

                {!currentInfoStore ?
                  <>
                    <div className="row mt-3 display-flex align-items-center " >
                      <div className="col-12" style={{
                        position: 'relative',
                        zIndex: 999999999
                      }} >
                        <Field
                          options={dataStore?.op_connector_channels?.map(_chanel => ({ ..._chanel, label: _chanel.name, value: _chanel.code }))?.filter(cn => cn?.value != 'other')}
                          className='w-100'
                          placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                          isClearable
                          value={values.channel}
                          isLoading={loadingStore}
                          hideBottom={true}
                          component={ReSelect}
                          label={formatMessage({ defaultMessage: 'Sàn' })}
                          cols={['col-4', 'col-8']}
                          required={true}
                          onChanged={value => {
                            setFieldValue('store', '')
                          }}
                          name="channel"
                          formatOptionLabel={(option, labelMeta) => {
                            return <div>
                              {!!option.logo_asset_url && <img src={option.logo_asset_url} style={{ width: 15, height: 15, marginRight: 4 }} />}
                              {option.label}
                            </div>
                          }}
                        />
                      </div>
                    </div>
                    <div className="row mt-3 display-flex align-items-center " >
                      <div className="col-12" style={{
                        position: 'relative',
                        zIndex: 999999998
                      }}>
                        <Field
                          options={dataStore?.sc_stores?.filter(_store => _store.connector_channel_code == values?.channel?.value)
                            .map(_store => {
                              let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                              return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url, ref_shop_id: _store?.ref_shop_id }
                            }) || []}
                          className='w-100 mb-0'
                          placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                          isClearable
                          value={values.store}
                          hideBottom={true}
                          label={formatMessage({ defaultMessage: 'Gian hàng' })}
                          required={true}
                          cols={['col-4', 'col-8']}
                          component={ReSelect}
                          name="store"
                          formatOptionLabel={(option, labelMeta) => {
                            return <div>
                              {!!option?.logo && <img src={option?.logo} style={{ width: 15, height: 15, marginRight: 4 }} />}
                              {option.label}
                            </div>
                          }}
                        />
                      </div>
                    </div>
                  </> : <div>
                    <div className="fs-14 mb-3">{formatMessage({ defaultMessage: 'Gian hàng' })}:
                      <span className="ml-2">
                        <img
                          src={storeInfo(currentInfoStore?.id)?.logo}
                          style={{ width: 20, height: 20, objectFit: "contain" }}
                        />
                        <span className="ml-1">{storeInfo(currentInfoStore?.id)?.name}</span>
                      </span>
                    </div>
                  </div>}
                <div className="row mt-3 display-flex align-items-center" >
                  <label className="col-4 col-form-label" style={{ color: '#000000' }}>
                    {type == 1 ? formatMessage({ defaultMessage: 'Thời gian tạo đơn' }) : formatMessage({ defaultMessage: 'Thời gian tạo hoàn' })}
                    <span className='text-danger' > *</span></label>
                  <div className="col-8">
                    <DateRangePicker
                      style={{
                        float: 'right',
                        width: '100%',
                        // border: (errors?.range_time && touched['range_time']) ? '1px solid #f14336' : 'none',
                        // borderRadius: '4px'
                      }}
                      character={' - '}
                      format={'dd/MM/yyyy'}
                      value={valueRangeTime}
                      placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                      placement={'auto'}
                      name="range_time"
                      onChange={range => {
                        if(range) {
                          setValueRangeTime(range);
                          setFieldValue('range_time', range)
                        } else {
                          setValueRangeTime([]);
                          setFieldValue('range_time', [])
                        }
                        
                      }}
                      disabledDate={!params?.is_old_order
                          ? combine(allowedMaxDays(7),afterToday())
                          : combine(allowedMaxDays(90), after(dayjs().startOf('day').add(-89, 'day').format('YYYY-MM-DD')))
                      }
                      size='sm'
                      locale={{
                        sunday: 'CN',
                        monday: 'T2',
                        tuesday: 'T3',
                        wednesday: 'T4',
                        thursday: 'T5',
                        friday: 'T6',
                        saturday: 'T7',
                        ok: formatMessage({ defaultMessage: 'Đồng ý' }),
                        today: formatMessage({ defaultMessage: 'Hôm nay' }),
                        yesterday: formatMessage({ defaultMessage: 'Hôm qua' }),
                        hours: formatMessage({ defaultMessage: 'Giờ' }),
                        minutes: formatMessage({ defaultMessage: 'Phút' }),
                        seconds: formatMessage({ defaultMessage: 'Giây' }),
                        formattedMonthPattern: 'MM/yyyy',
                        formattedDayPattern: 'dd/MM/yyyy',
                        // for DateRangePicker
                        last7Days: formatMessage({ defaultMessage: '7 ngày qua' })
                      }}
                    />

                  </div>

                </div>
                <div className="row">
                  <div className="col-4"></div>
                  <div className="col-8">
                    {(errors?.range_time && touched['range_time']) && <div className="invalid-feedback d-block">{errors?.range_time}</div>}

                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <i className="fas fa-info-circle mr-2" style={{ fontSize: 14 }}></i>
                    {formatMessage({ defaultMessage: 'Hệ thống cho phép một lần tải lại tối đa 1 tuần' })}
                  </div>
                </div>
              </div>
                :
                <div className="row">
                  <div className="col-12">
                    <div className="fs-14 mb-3">{formatMessage({ defaultMessage: 'Gian hàng' })}:
                      <span className="ml-2">
                        <img
                          src={storeInfo(dataTrackingOrder?.co_get_tracking_load_order?.store_id)?.logo}
                          style={{ width: 20, height: 20, objectFit: "contain" }}
                        />
                        <span className="ml-1">{storeInfo(dataTrackingOrder?.co_get_tracking_load_order?.store_id)?.name}</span>
                      </span>
                    </div>
                    <div className="fs-14 mb-3">{formatMessage({ defaultMessage: 'Thời gian' })} {type == 1 ? formatMessage({ defaultMessage: 'tạo đơn' }) : formatMessage({ defaultMessage: 'tạo hoàn' })} : {`${dayjs(dataTrackingOrder?.co_get_tracking_load_order.start_time).format("DD/MM/YYYY")}`} - {`${dayjs(dataTrackingOrder?.co_get_tracking_load_order.finish_time).format("DD/MM/YYYY")}`}</div>
                    <div className="fs-14 mb-3">
                      <ProgressBar style={{ height: '30px', fontSize: '14px' }} now={(dataTrackingOrder?.co_get_tracking_load_order?.total_job_load_processed / dataTrackingOrder?.co_get_tracking_load_order?.total_job_load * 100).toFixed()} label={`${(dataTrackingOrder?.co_get_tracking_load_order?.total_job_load_processed / dataTrackingOrder?.co_get_tracking_load_order?.total_job_load * 100).toFixed()}%`} />
                    </div>
                    <div className="fs-14 mb-3">
                      {type == 1 ? formatMessage({ defaultMessage: 'Đơn hàng' }) : formatMessage({ defaultMessage: 'Đơn hoàn' })} {formatMessage({ defaultMessage: 'tải thành công' })}: <span style={{ color: "#00DB6D" }} >{dataTrackingOrder?.co_get_tracking_load_order?.total_order_success}</span>
                    </div>
                    <div className="fs-14 mb-3">
                      {type == 1 ? formatMessage({ defaultMessage: 'Đơn hàng' }) : formatMessage({ defaultMessage: 'Đơn hoàn' })} {formatMessage({ defaultMessage: 'tải thất bại' })}: <span style={{ color: "#F80D0D" }}>{dataTrackingOrder?.co_get_tracking_load_order?.total_order_fail}</span>
                    </div>
                  </div>
                </div>
              }

            </Modal.Body>
            <Modal.Footer className="form" >
              <div className="form-group">
                <button
                  type="button"
                  onClick={onHide}
                  className="btn btn-secondary mr-3"
                  style={{ width: 100 }}
                  disabled={loading}
                >
                  {formatMessage({ defaultMessage: 'Đóng' })}
                </button>
                {!dataTrackingOrder?.co_get_tracking_load_order && <button
                  type="button"
                  className="btn btn-primary btn-elevate"
                  style={{ width: 100 }}
                  disabled={disabled}
                  onClick={handleSubmit}
                >
                  {formatMessage({ defaultMessage: 'Tải đơn' })}

                </button>}
              </div>
            </Modal.Footer>
          </Modal >
        )
      }}
    </Formik>
  );
}

export default injectIntl(ModalTrackingLoadOrder);