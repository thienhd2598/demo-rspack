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
import { Field, Formik } from "formik";
import * as Yup from "yup";
import { useIntl } from 'react-intl';
import { add, min, startOfDay } from "date-fns";
import { endOfDay } from "date-fns";
import mutate_mktLoadCampaignByStore from "../../../../graphql/mutate_mktLoadCampaignByStore";
import query_mktFindTrackingLoadCampaign from "../../../../graphql/query_mktFindTrackingLoadCampaign";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import LoadingDialog from "../../ProductsStore/product-new/LoadingDialog";

function ModalTrackingCampaign({ show, onHide}) {
  const { addToast } = useToasts();
  const [initialValues, setInitialValues] = useState({});
  const [idTracking, setIdTracking] = useState();
  const [timeRefetch, setTimeRefetch] = useState(1000);
  const { combine, allowedMaxDays, afterToday, after, before } = DateRangePicker;
  const { formatMessage } = useIntl()

  const { data: dataTrackingLoadCampaign, loading: loadingTracking, refetch } = useQuery(query_mktFindTrackingLoadCampaign, {
    variables: {
      id: idTracking
    },
    skip: !idTracking,
    pollInterval: timeRefetch
  });  
  useMemo(() => {
    let trackingLoadCampaign = dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign
    if(trackingLoadCampaign && show && trackingLoadCampaign?.total_campaign == trackingLoadCampaign?.total_job_load_processed) {
      setTimeRefetch(0)
    }
  }, [dataTrackingLoadCampaign])

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network'
  });

  const [mktLoadCampaignByStore, { loading: retryLoading }] = useMutation(mutate_mktLoadCampaignByStore, {
      awaitRefetchQueries: true,
      refetchQueries: ['mktFindTrackingLoadCampaign'],
      onCompleted: (data) => {
        setIdTracking(data?.mktLoadCampaignByStore?.tracking_id)
      }
  });


  let storeInfo = (store_id) => {

    const store = dataStore?.sc_stores?.find((st) => st.id == store_id);
    const channel = dataStore?.op_connector_channels?.find((st) => st.code == store?.connector_channel_code);
    return {
      logo: channel?.logo_asset_url,
      name: store?.name
    }
  }
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={Yup.object().shape({
        channel: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn sàn" })),
        store: Yup.object().required(formatMessage({ defaultMessage: "Vui lòng chọn gian hàng" })),        
      })}
      enableReinitialize
      onSubmit={async values => {
        await mktLoadCampaignByStore({
          variables: {            
            store_id: values['store']?.value,            
          }
        })

      }}
    >
      {({values, handleSubmit, validateForm, setFieldValue, errors, touched}) => {
        console.log('values', values)
        return (
          <Modal show={true} aria-labelledby="example-modal-sizes-title-lg" centered
            onHide={onHide}
          >
            {<LoadingDialog show={retryLoading} />}

            <Modal.Header>
              <Modal.Title>
                {formatMessage({ defaultMessage: 'Tải chương trình' })}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" >
               <>
               {!dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign ?
                <div className="col-12" >
                <div className="row mt-3 display-flex align-items-center " >
                  <div className="col-12" style={{ position: 'relative', zIndex: 999999999}}>
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
                  <div className="col-12" style={{ position: 'relative', zIndex: 999999998}}>
                    <Field
                      options={dataStore?.sc_stores?.filter(_store => _store.connector_channel_code == values?.channel?.value).map(_store => {
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
                {/* <div className="row mt-3 display-flex align-items-center" >
                  <label className="col-4 col-form-label" style={{ color: '#000000' }}>{formatMessage({ defaultMessage: 'Thời gian tạo' })}<span className='text-danger' > *</span></label>
                  <div className="col-8">
                    <DateRangePicker
                      style={{ float: 'right', width: '100%'}}
                      character={' - '}
                      format={'dd/MM/yyyy'}
                      value={valueRangeTime}
                      placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                      placement={'auto'}
                      name="range_time"
                      onChange={range => {
                        console.log('range', range)
                        if(range) {
                          setValueRangeTime(range);
                          setFieldValue('range_time', range)
                        } else {
                          setValueRangeTime([]);
                          setFieldValue('range_time', [])
                        }
                        
                      }}
                      disabledDate={combine(allowedMaxDays(90), afterToday())}
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
                </div> */}
                <div className="row mt-3">
                  <div className="col-12">
                    <i className="fas fa-info-circle mr-2" style={{ fontSize: 14 }}></i>
                    {formatMessage({ defaultMessage: 'Hệ thống cho phép một lần tải lại tối đa 50 chương trình mỗi loại' })}
                  </div>
                </div>
              </div> : (
                <div className="row">
                <div className="col-12">
                  <div className="fs-14 mb-3">{formatMessage({ defaultMessage: 'Gian hàng' })}:
                    <span className="ml-2">
                      <img
                        src={storeInfo(values['store']?.value)?.logo}
                        style={{ width: 20, height: 20, objectFit: "contain" }}
                        alt=""
                      />
                      <span className="ml-1">{storeInfo(values['store']?.value)?.name}</span>
                    </span>
                  </div>                  
                  <div className="fs-14 mb-3">
                    <ProgressBar style={{ height: '30px', fontSize: '14px' }} 
                    now={((dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_job_load_processed || 1) / (dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_campaign || 1) * 100).toFixed()} 
                    label={`${((dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_job_load_processed || 1) / (dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_campaign || 1) * 100).toFixed()}%`} />
                  </div> 
                  <div className="fs-14 mb-3">
                    {formatMessage({ defaultMessage: 'Chương trình' })} {formatMessage({ defaultMessage: 'tải thành công' })}: <span style={{ color: "#00DB6D" }} >
                      {dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_success}
                    </span>
                  </div>
                  <div className="fs-14 mb-3">
                    {formatMessage({ defaultMessage: 'Chương trình' })} {formatMessage({ defaultMessage: 'tải thất bại' })}: <span style={{ color: "#F80D0D" }}>
                      {dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign?.total_fail}
                    </span>
                  </div>
                </div>
              </div>
              )
              }

               </>

            </Modal.Body>
            <Modal.Footer className="form" >
              <div className="form-group">
                <button
                  type="button" 
                  onClick={onHide}
                  className="btn btn-secondary mr-3"
                  style={{ width: 100 }}
                  disabled={false}
                >
                  {formatMessage({ defaultMessage: 'Đóng' })}
                </button>
                {!dataTrackingLoadCampaign?.mktFindTrackingLoadCampaign && 
                <button
                  type="button"
                  className="btn btn-primary btn-elevate"
                  style={{ width: 'max-content' }}
                  onClick={handleSubmit}
                >
                  {formatMessage({ defaultMessage: 'Tải chương trình' })}
                </button>}
              </div>
            </Modal.Footer>
          </Modal >
        )
      }}
    </Formik>
  );
}

export default injectIntl(ModalTrackingCampaign);