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

function ExportDialog({ show, onHide, params }) {
  const { formatMessage } = useIntl()
  const history = useHistory()
  const { addToast } = useToasts();
  const [channel, setChannel] = useState()
  const [store, setStore] = useState()
  const [status, setStatus] = useState()
  const [valueRangeTime, setValueRangeTime] = useState(null);
  const _disableClick = useRef(false)

  useEffect(() => {
    setStore()
    setStatus()
    setChannel()
    _disableClick.current = false;
  }, [show])

  useMemo(() => {
    setValueRangeTime([
      new Date(dayjs().subtract(96, "day").startOf("day")),
      new Date(dayjs().subtract(90, "day").startOf("day")),
    ]);
  }, [show]);

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
      ...(!!_statusParse.length > 0 ? { list_status: _statusParse } : {}),
      time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
      time_from: dayjs(valueRangeTime[0]).startOf('day').unix(),
      is_old_order: 1,
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
  }, [store, _statusParse, valueRangeTime, channel])

  const { data: dataOrderAggregate, loading: loadingOrderAggregate } = useQuery(query_scExportOrderAggregate, {
    variables: {
      ..._whereCondition
    }
  });


  const [mutate, { loading, data }] = useMutation(mutate_scExportOrder)

  useEffect(() => {
    if (!loading) {
      _disableClick.current = false;
    }
  }, [loading])

  const disabledFutureDate = useCallback((date) => {
    const unixDate = dayjs(date).unix();
    const fromDate = dayjs().startOf('day').add(-89, 'day').unix();
    const toDate = dayjs().endOf('day').add(-90, 'day').unix();

    return unixDate > toDate;
  }, []);

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
              <Select options={dataStore?.op_connector_channels?.map(_chanel => ({ ..._chanel, label: _chanel.name, value: _chanel.code }))}
                className='w-100'
                placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                isClearable
                value={channel}
                isLoading={loadingStore}
                isMulti
                onChange={value => {
                  console.log('value', value)
                  setChannel(value)
                  setStore(null)
                }}

                styles={{
                  container: (styles) => ({
                    ...styles,
                    zIndex: 9999999
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
                options={dataStore?.sc_stores?.filter(_store => !channel || channel.length == 0 || channel.some(__ch => __ch.value == _store.connector_channel_code)).map(_store => ({ ..._store, chanel: dataStore?.op_connector_channels?.find(__ch => __ch.code == _store.connector_channel_code), label: _store.name, value: _store.id }))}
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
                    zIndex: 9999998
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
                    zIndex: 9999997
                  }),
                }}
              />
            </div>
          </div>
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
                    ...(!!_statusParse.length > 0 ? { list_status: _statusParse } : {}),
                    time_to: dayjs(valueRangeTime[1]).endOf('day').unix(),
                    time_from: dayjs(valueRangeTime[0]).startOf('day').unix(),
                    is_old_order: 1,
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
                  history.push("/orders/export-histories")
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