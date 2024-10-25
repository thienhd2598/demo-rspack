import React, { useCallback, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { injectIntl } from "react-intl";
import Select from "react-select";
import { useHistory } from "react-router";
import DateRangePicker from 'rsuite/DateRangePicker';
import { useMutation, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import _ from "lodash";
import { useToasts } from "react-toast-notifications";
import { useIntl } from 'react-intl'
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic'
import mutate_cfExportOrderSettlement from '../../../../../graphql/mutate_cfExportOrderSettlement'
import query_cfExportSettlementAggregate from '../../../../../graphql/query_cfExportSettlementAggregate'
import { DIFFERENCE_STATUS, PLATFORM_RECONCILIATION_EXPORT } from "../common/Constants";
import { omitBy } from "lodash";
import LoadingDialog from "../../../ProductsStore/product-new/LoadingDialog";

function ExportFileDialog({ status, show, onHide, params }) {
  const { formatMessage } = useIntl()
  const history = useHistory()
  const { addToast } = useToasts();

  const PENDING = 1
  const PROCESSED = 2

  const [channel, setChannel] = useState()
  const [store, setStore] = useState()
  const [differenceStatus, setDifferenceStatus] = useState(0)
  const [valueRangeTime, setValueRangeTime] = useState(null);
  const [platform, setPlatform] = useState(PLATFORM_RECONCILIATION_EXPORT[0]?.value);
  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
    fetchPolicy: 'cache-and-network',
    variables: {
      context: 'order'
   },
  });

  useMemo(() => {
    if (!!params?.is_old_order) {
      setValueRangeTime([
        new Date(dayjs().subtract(96, "day").startOf("day")),
        new Date(dayjs().subtract(90, "day").startOf("day")),
      ]);
    } else {
      setValueRangeTime(null);
    }
  }, [params?.is_old_order]);

  const range_time = useMemo(() => {
    if (valueRangeTime) {
      let [time_from, time_to] = [
        dayjs(valueRangeTime[0])
          .startOf("day")
          .unix(),
        dayjs(valueRangeTime[1])
          .endOf("day")
          .unix(),
      ];
      return {
        time_from,
        time_to
      }
    }
  }, [valueRangeTime])

  const list_store = useMemo(() => {
    if (!channel?.length && !store?.length) {
      return dataStore?.sc_stores.map(st => {
        return {
          connector_channel_code: st?.connector_channel_code,
          name_store: st?.name,
          store_id: st?.id
        }
      })
    } else if (channel?.length && !store?.length) {
      const channel_code = channel?.map(cn => cn.code)
      return dataStore?.sc_stores?.map(st => {
        if (channel_code?.includes(st?.connector_channel_code)) {
          return {
            connector_channel_code: st?.connector_channel_code,
            name_store: st?.name,
            store_id: st?.id
          }
        }
      }).filter(e => e)
    } else {
      return store?.map(st => {
        return !!st ? {
          connector_channel_code: st?.connector_channel_code,
          name_store: st?.name,
          store_id: st?.id
        } : {}
      })
    }
  }, [store, channel])

  const whereCondition = useMemo(() => {
    return {
      list_store: list_store,
      type: status == 'PENDING' ? PENDING : PROCESSED,
      payment_system: platform,
      settlement_abnormal: status == 'PROCESSED' ? differenceStatus : null,
      time_from: range_time?.time_from,
      time_to: range_time?.time_to,
      ...params?.is_old_order ? { is_old_order: 1 } : {}
    }
  }, [differenceStatus, platform, list_store, range_time, params?.is_old_order])

  const { data, loading } = useQuery(
    query_cfExportSettlementAggregate,
    {
      variables: {
        ...omitBy(whereCondition, (v) => v == 0 ? v : !v)
      },
      fetchPolicy: "cache-and-network",
      skip: !valueRangeTime || !list_store?.length
    },
  );

  const [cfExportOrderSettlement, { loading: loadingExport }] = useMutation(
    mutate_cfExportOrderSettlement,
    {
      variables: {
        ...omitBy(whereCondition, (v) => v == 0 ? v : !v)
      },
      onCompleted: (data) => {
        if (!!data?.cfExportOrderSettlement?.job_tracking_export) {
          addToast(data?.cfExportOrderSettlement.message || '', { appearance: "success" });
          onHide()
          if (status == 'PENDING') {
            history.push("/finance/exportfile-settlement-pending");
            return;
          }
          history.push("/finance/exportfile-settlement-processed");
          return
        }
        addToast(data?.cfExportOrderSettlement?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra' }), {
          appearance: "error",
        });
      },
    }
  );

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
    <>
      <LoadingDialog show={loadingExport} />
      <Modal
        size="md"
        show={show}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={onHide}
      >
        <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
          <Modal.Title>
            {status == 'PENDING' ? formatMessage({ defaultMessage: 'Xuất file phiếu chờ quyết toán' }) : formatMessage({ defaultMessage: 'Xuất file phiếu đã quyết toán' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="overlay overlay-block cursor-default" >
          <p style={{ fontStyle: 'italic' }} >* {formatMessage({ defaultMessage: 'Thông tin được tải về dưới dạng file excel' })}</p>
          <div className="col-12" >
          <div className="row mt-3 display-flex align-items-center " >
              <div className="col-4" >{formatMessage({ defaultMessage: 'Nền tảng đối soát' })}</div>
              <div className="col-8">
                <Select options={PLATFORM_RECONCILIATION_EXPORT}
                  className='w-100'
                  placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                  value={PLATFORM_RECONCILIATION_EXPORT?.find(it => it?.value == platform)}
                  isLoading={loadingStore}
                  onChange={item => {
                    if(!!item) {
                      setPlatform(item?.value)
                    }
                    
                  }}

                  styles={{
                    container: (styles) => ({
                      ...styles,
                      zIndex: 100
                    }),
                  }}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div>
                      {formatMessage(option.label)}
                    </div>
                  }}
                />
              </div>
            </div>


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

            {status == 'PROCESSED' && (
              <div className="row mt-3 display-flex align-items-center " >
                <div className="col-4" >{formatMessage({ defaultMessage: 'Chênh lệch' })}</div>
                <div style={{ zIndex: 95 }} className="col-8" >
                  <Select
                    options={DIFFERENCE_STATUS}
                    className="w-100 custom-select-order"
                    style={{ padding: 0 }}
                    value={DIFFERENCE_STATUS.find(
                      (_op) => _op.value == differenceStatus
                    )}
                    onChange={(value) => {
                      if (!!value) {
                        setDifferenceStatus(value.value)
                      }
                    }}
                    formatOptionLabel={(option, labelMeta) => {
                      return <div>{formatMessage(option.label)}</div>;
                    }}
                  />
                </div>
              </div>
            )}

            <div className="row mt-3 display-flex align-items-center " >
              <div className="col-4" >{status == 'PENDING' ? formatMessage({ defaultMessage: 'Thời gian đơn hàng hoàn thành' }) : formatMessage({ defaultMessage: 'Thời gian quyết toán' })}</div>
              <div className="col-8">
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
            {(valueRangeTime && list_store?.length) ? (
              <div className="row mt-3 display-flex align-items-center " >
                <div className="col-4" >{formatMessage({ defaultMessage: 'Tổng phiếu cần xuất' })}</div>
                <div className="col-8" >
                  <strong>
                    {loading ? (<span className="ml-3 mr-6 spinner spinner-primary"></span>) : (+data?.cfExportSettlementAggregate?.count || 0)}
                  </strong> {formatMessage({ defaultMessage: 'phiếu' })}
                </div>
              </div>
            ) : null}
          </div>
        </Modal.Body>
        <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
          <div className="form-group">
            <button
              type="button"
              onClick={onHide}
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 100 }}
            >
              {formatMessage({ defaultMessage: 'Đóng' })}
            </button>
            <button
              type="button"
              onClick={() => cfExportOrderSettlement()}
              className="btn btn-primary btn-elevate"
              style={{ width: 100 }}
              disabled={loading || !+data?.cfExportSettlementAggregate?.count}
            >
              {formatMessage({ defaultMessage: 'Xác nhận' })}
            </button>
          </div>
        </Modal.Footer>
      </Modal >
    </>
  );
}

export default injectIntl(ExportFileDialog);
