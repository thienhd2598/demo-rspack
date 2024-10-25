import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { injectIntl } from "react-intl";
import Select from "react-select";
import { useHistory } from "react-router";
import DateRangePicker from 'rsuite/DateRangePicker';
import op_connector_channels from "../../../../graphql/op_connector_channels";
import { useMutation, useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import OrderCount from "./filter/OrderCount";
import { STATUS_PACK_MAIN_ORDER_TAB, STATUS_PACK_TAB } from "../OrderUIHelpers";
import dayjs from "dayjs";
import _ from "lodash";
import mutate_scExportOrder from "../../../../graphql/mutate_scExportOrder";
import { useToasts } from "react-toast-notifications";
import query_scExportOrderAggregate from "../../../../graphql/query_scExportOrderAggregate";
import { useIntl } from 'react-intl'
import query_coGetShippingCarrierFromListPackage from "../../../../graphql/query_coGetShippingCarrierFromListPackage";
import { TooltipWrapper } from "../../Finance/payment-reconciliation/common/TooltipWrapper";
import query_cfGetTemplateExport from "../../../../graphql/query_cfGetTemplateExport";
import { optionsTemplate } from "../order-manual/OrderManualHelper";

function ExportDialog({ show, onHide, params }) {
  const { formatMessage } = useIntl()
  const history = useHistory()
  const { addToast } = useToasts();
  const [channel, setChannel] = useState()
  const [store, setStore] = useState()
  const [status, setStatus] = useState()
  const [shipping, setShipping] = useState()
  const [valueRangeTime, setValueRangeTime] = useState(null);
  const _disableClick = useRef(false)
  const [templateId, setTemplateId] = useState('');

  useEffect(() => {
    setStore()
    setStatus()
    setChannel()
    setShipping()
    _disableClick.current = false;
  }, [show])

  useMemo(() => {
    if (!!params?.is_old_order) {
      setValueRangeTime([
        new Date(dayjs().subtract(96, "day").startOf("day")),
        new Date(dayjs().subtract(90, "day").startOf("day")),
      ]);
      return;
    } else {
      setValueRangeTime(null)
    }
  }, [params?.is_old_order]);

  const [_statusParse] = useMemo(() => {
    let _status = (status || []).map(_sts => {
      if (_sts.sub.length > 0) {
        return _.map(_sts.sub, 'status')
      }
      return [_sts.status]
    })
    return [_.flatten(_status)]
  }, [status])

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network',
    variables: {
      context: 'order'
    },
  });
  const _whereCondition = useMemo(() => {
    if (!valueRangeTime) {
      return null
    }

    return {
      ...(!!_statusParse?.length > 0 ? { list_status: _statusParse } : {}),
      ...(!!shipping?.length > 0 ? { list_shipping_unit: shipping?.map(sp => sp?.value) } : {}),
      time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
      time_from: dayjs(valueRangeTime[0]).startOf('day').unix(),
      type: params?.list_source == 'manual' ? 3 : 0,
      ...(!!params?.is_old_order ? {
        is_old_order: 1
      } : {}),
      ...(!!store && store.length > 0 ? {
        list_store: store.map(_store => {
          return {
            connector_channel_code: _store.connector_channel_code,
            name_store: _store.name,
            store_id: _store.id
          }
        })
      } : (!!channel && channel.length > 0 ? {
        list_store: dataStore?.sc_stores?.filter(_store => channel.some(__cha => __cha.value == _store.connector_channel_code)).map(_store => {
          return {
            connector_channel_code: _store.connector_channel_code,
            name_store: _store.name,
            store_id: _store.id
          }
        })
      } : {
        list_store: dataStore?.sc_stores?.map(_store => {
          return {
            connector_channel_code: _store.connector_channel_code,
            name_store: _store.name,
            store_id: _store.id
          }
        })
      }))
    }
  }, [store, shipping,_statusParse, valueRangeTime,params?.list_source, channel, params?.is_old_order])

  const { data: dataOrderAggregate, loading: loadingOrderAggregate } = useQuery(query_scExportOrderAggregate, {
    variables: {
      ..._whereCondition
    }
  });

  const { data: dataTemplateExport, loading: loadingGetTemplateExport } = useQuery(query_cfGetTemplateExport, {
    fetchPolicy: "cache-and-network"
});

  const { data: dataShippingCarrier, refetch: refetchCoGetShippingCarrier } = useQuery(query_coGetShippingCarrierFromListPackage, {
    variables: {
        search: {
            connector_channel_code: channel?.map(cn => cn?.code),
            list_store: store?.map(st => st?.id),
            ...(!!_statusParse.length > 0 ? { list_status: _statusParse } : {}),
            is_connected: 1
        }
    },
    fetchPolicy: 'cache-and-network'
});



const shippingUnitOptions = useMemo(() => {
  return dataShippingCarrier?.coGetShippingCarrierFromListPackage?.data?.map(shipping => ({
    label: shipping?.shipping_carrier,
    value: shipping?.shipping_carrier,
  }))
}, [dataShippingCarrier])


  const [mutate, { loading, data }] = useMutation(mutate_scExportOrder)

  useEffect(() => {
    if (!loading) {
      _disableClick.current = false;
    }
  }, [loading])

  const disabledFutureDate = useCallback((date) => {
    const unixDate = dayjs(date).unix();
    const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
    const toDate = !!params?.is_old_order
      ? dayjs().endOf('day').add(-90, 'day').unix()
      : dayjs().endOf("day").unix();

    return !!params?.is_old_order
      ? unixDate > toDate
      : (unixDate < fromDate || unixDate > toDate);
  }, [params?.is_old_order]);

  return (
    <Modal
      show={show}
      aria-labelledby="example-modal-sizes-title-lg"
      centered
      onHide={() => {
        !!onHide && !loading && onHide()
      }}
    >
      <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'Xuất đơn hàng' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" >
        <p style={{ fontStyle: 'italic' }} >* {formatMessage({ defaultMessage: 'Tải thông tin các đơn hàng về dạng excel' })}</p>
        <div className="col-12" >
          <div className="row mt-3 display-flex align-items-center " >
            <div className="col-4" >{formatMessage({ defaultMessage: 'Sàn' })}</div>
            <div className="col-8" >
              <Select options={dataStore?.op_connector_channels?.map(_chanel => ({ ..._chanel, label: _chanel.name, value: _chanel.code }))?.filter(cn => params?.list_source == 'manual' || cn?.value != 'other')}
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                isClearable
                value={channel}
                isLoading={loadingStore}
                isMulti
                onChange={value => {
                  setChannel(value)
                  setStore(null)
                }}

                styles={{
                  container: (styles) => ({
                    ...styles,
                    zIndex: 99
                  }),
                }}
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
            <div className="col-4" >{formatMessage({ defaultMessage: 'Gian hàng' })}</div>
            <div className="col-8" >
              <Select
                options={dataStore?.sc_stores
                  ?.filter(_store => !channel || channel.length == 0 || channel.some(__ch => __ch.value == _store.connector_channel_code))
                  ?.map(_store => ({ ..._store, chanel: dataStore?.op_connector_channels?.find(__ch => __ch.code == _store.connector_channel_code), label: _store.name, value: _store.id }))
                  ?.filter(cn => params?.list_source == 'manual' || cn?.connector_channel_code != 'other')
                }
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                isClearable
                isMulti
                value={store}
                onChange={value => {
                  setStore(value)
                }}
                styles={{
                  container: (styles) => ({
                    ...styles,
                    zIndex: 98
                  }),
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return <div>
                    {!!option.chanel?.logo_asset_url && <img src={option.chanel?.logo_asset_url} style={{ width: 15, height: 15, marginRight: 4 }} />}
                    {option.label}
                  </div>
                }}
              />
            </div>
          </div>
          <div className="row mt-3 display-flex align-items-center " >
            <div className="col-4" >{formatMessage({ defaultMessage: 'Trạng thái' })}</div>
            <div className="col-8" >
              <Select options={STATUS_PACK_MAIN_ORDER_TAB.slice(1, 8).map((_status, _idx) => {
                return {
                  ..._status,
                  label: _status.title,
                  value: _idx
                }
              })}
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                isClearable
                isMulti
                value={status}
                onChange={value => {
                  setStatus(value)
                }}
                styles={{
                  container: (styles) => ({
                    ...styles,
                    zIndex: 97
                  }),
                }}
              />
            </div>
          </div>
          {params?.list_source == 'manual' && (
            <div className="row mt-3 display-flex align-items-center " >
            <div className="col-4" >{formatMessage({ defaultMessage: 'Đơn vị vận chuyển' })}</div>
            <div className="col-8" >
              <Select options={shippingUnitOptions}
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                isClearable
                isMulti
                value={shipping}
                onChange={value => {
                  setShipping(value)
                }}
                styles={{container: (styles) => ({...styles,zIndex: 96}),
                }}
              />
            </div>
          </div>
          )}
          

          <div className="row mt-3 display-flex align-items-center " >
            <div className="col-4" >{formatMessage({ defaultMessage: 'Thời gian tạo đơn' })}</div>
            <div className="col-8" style={{}} >
              <DateRangePicker
                style={{ float: 'right', width: '100%' }}
                character={' - '}
                format={'dd/MM/yyyy'}
                value={valueRangeTime}
                placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                placement={'auto'}
                onChange={values => {
                  setValueRangeTime(values)
                }}
                disabledDate={disabledFutureDate}
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
          {params?.list_source == 'manual' && (
          <div className="row mt-3 display-flex align-items-center " >
            <div className="col-4">
                {formatMessage({ defaultMessage: 'Loại tệp dữ liệu' })}
                <TooltipWrapper note={formatMessage({ defaultMessage: "Chọn loại tệp dữ liệu theo mẫu bạn muốn xuất." })}>
                    <i className="fas fa-info-circle fs-14 ml-2"></i>
                </TooltipWrapper>
            </div>

            <div className="col-8">
                <Select
                    options={optionsTemplate}
                    style={{ padding: 0 }}
                    disabled={loadingGetTemplateExport}
                    value={optionsTemplate.find((_op) => _op.value == templateId)}
                    onChange={({ value }) => {
                        if (!!value) {
                            setTemplateId(value)
                        } else {
                            setTemplateId(null)
                        }

                    }}
                    formatOptionLabel={(option, labelMeta) => {
                        return <div>{option.label}</div>;
                    }}
                />
            </div>

        </div>
          )}
          {
            !!dataOrderAggregate?.scExportOrderAggregate && <div className="row mt-3 display-flex align-items-center " >
              <div className="col-4" >{formatMessage({ defaultMessage: 'Số lượng đơn hàng' })}</div>
              <div className="col-8" >
                <strong>{dataOrderAggregate?.scExportOrderAggregate?.count || '0'}</strong> {formatMessage({ defaultMessage: 'đơn' })}
              </div>
            </div>
          }
        </div>
      </Modal.Body>
      <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
        <div className="form-group">
          <button
            type="button"
            onClick={onHide}
            className="btn btn-light btn-elevate mr-3"
            style={{ width: 100 }}
            disabled={loading}
          >
            {formatMessage({ defaultMessage: 'ĐÓNG' })}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-elevate"
            style={{ width: 100 }}
            disabled={!_whereCondition || !dataOrderAggregate?.scExportOrderAggregate?.count || loading}
            onClick={async e => {
              e.preventDefault()
              try {
                if (_disableClick.current) {
                  return
                }
                _disableClick.current = true

                let { data } = await mutate({
                  variables: {
                    ...(!!shipping?.length ? { list_shipping_unit: shipping?.map(sp => sp?.value) } : {}),
                     type: params?.list_source == 'manual' ? 3 : 0,
                    ...(!!templateId ? { template_type : templateId } : {}),
                    ...(!!_statusParse?.length ? { list_status: _statusParse } : {}),
                    time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
                    time_from: dayjs(valueRangeTime[0]).startOf('day').unix(),
                    ...(!!params?.is_old_order ? {
                      is_old_order: 1
                    } : {}),
                    ...(!!store && store.length > 0 ? {
                      list_store: store.map(_store => {
                        return {
                          connector_channel_code: _store.connector_channel_code,
                          name_store: _store.name,
                          store_id: _store.id
                        }
                      })
                    } : (!!channel && channel.length > 0 ? {
                      list_store: dataStore?.sc_stores?.filter(_store => channel.some(__cha => __cha.value == _store.connector_channel_code)).map(_store => {
                        return {
                          connector_channel_code: _store.connector_channel_code,
                          name_store: _store.name,
                          store_id: _store.id
                        }
                      })
                    } : {
                      list_store: dataStore?.sc_stores?.map(_store => {
                        return {
                          connector_channel_code: _store.connector_channel_code,
                          name_store: _store.name,
                          store_id: _store.id
                        }
                      })
                    }))

                  }
                })
                if (data?.scExportOrder?.success == 1) {
                  addToast(formatMessage({ defaultMessage: 'Gửi yêu cầu xuất đơn hàng thành công' }), { appearance: 'success' });
                  onHide()
                  history.push(`/orders/export-histories?type=${params?.list_source}`)
                } else {
                  addToast(data?.scExportOrder?.message || formatMessage({ defaultMessage: "Gửi yêu cầu xuất đơn hàng không thành công" }), { appearance: 'error' });
                }
              } catch (error) {
                addToast(error.message || formatMessage({ defaultMessage: "Gửi yêu cầu xuất đơn hàng không thành công" }), { appearance: 'error' });
              }
            }}
          >
            {formatMessage({ defaultMessage: 'XÁC NHẬN' })}
          </button>
        </div>
      </Modal.Footer>
    </Modal >
  );
}

export default injectIntl(ExportDialog);