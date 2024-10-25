import React, { Fragment, memo, useMemo, useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import Select from "react-select";
import queryString from 'querystring';
import query_sc_stores_basic from "../../../../../graphql/query_sc_stores_basic";
import { STATUS } from '../StockTrackingUIHelpers';
import _ from 'lodash';
import DateRangePicker from 'rsuite/DateRangePicker';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import mutate_scDeleteJobStockTracking from '../../../../../graphql/mutate_scDeleteJobStockTracking';
import LoadingDialog from '../../product-new/LoadingDialog';
import ConfirmDialog from '../dialog/ConfirmDialog';
import { useToasts } from 'react-toast-notifications';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const ProductsFilter = memo(({products, setProducts, defaultWarehouse, dataWarehouse, whereCondition, dataStore, loadingStore }) => {
  const location = useLocation();
  const history = useHistory();
  const params = queryString.parse(location.search.slice(1, 100000));
  const [valueRangeTime, setValueRangeTime] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const {addToast} = useToasts()
  const { formatMessage } = useIntl()
  useMemo(
    () => {
      if (!params?.gt || !params?.lt) return;

      let rangeTimeConvert = [params?.gt, params?.lt]?.map(
        _range => new Date(_range * 1000)
      );
      setValueRangeTime(rangeTimeConvert)
    }, [params?.gt, params?.lt]
  );


  const [current, options] = useMemo(() => {
    let _options = dataStore?.sc_stores
      .map(_store => {
        let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
        return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
      }) || [];

    let _current = _options.find(_store => _store.value == params?.store) || null
    return [_current, _options]
  }, [dataStore, params]);


  const [deleteJobStockTracking, {loading}] = useMutation(mutate_scDeleteJobStockTracking, {
    awaitRefetchQueries: true,
    refetchQueries: ['scGetJobStockTracking'],
    variables: {
      ids: products?.map(product => product?.id)
    }
  });

  const handleDeleteJobStockTracking = async () => {
    const {data} = await deleteJobStockTracking()

    if(data?.scDeleteJobStockTracking?.success) {
      addToast(formatMessage({defaultMessage: 'Xoá lịch sử đẩy tồn thành công.'}), {appearance: 'success'})
    } else {
      addToast(formatMessage({defaultMessage: 'Xoá lịch sử đẩy tồn thất bại.'}), {appearance: 'error'})
    }
  }

  return (
    <Fragment>
      {showDialog && <ConfirmDialog title={formatMessage({defaultMessage: 'Bạn có chắc chắn muốn xoá lịch sử đẩy tồn?'})} show={showDialog} onHide={() => setShowDialog(false)} onConfirm={handleDeleteJobStockTracking}/>}
      <LoadingDialog show={loading} />
      <div>
        <div className="form-group row mb-8">
          <div className="col-3 input-icon" style={{ height: 'fit-content' }} >
            <input
              type="text"
              className="form-control"
              placeholder={formatMessage({ defaultMessage: "Tên sản phẩm, SKU" })}
              style={{ height: 37 }}
              onBlur={(e) => {
                history.push(`/product-stores/list-stock-tracking?${queryString.stringify({
                  ...params,
                  page: 1,
                  search: e.target.value
                })}`)
              }}
              defaultValue={params.search || ''}
              onKeyDown={e => {
                if (e.keyCode == 13) {
                  history.push(`/product-stores/list-stock-tracking?${queryString.stringify({
                    ...params,
                    page: 1,
                    search: e.target.value
                  })}`)
                }
              }}
            />
            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
          </div>
          <div className='col-2' style={{ zIndex: '9' }}>
            <Select options={options}
              className='w-100'
              placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
              isClearable
              isLoading={loadingStore}
              value={current}
              onChange={value => {
                if (!!value) {
                  history.push(`/product-stores/list-stock-tracking?${queryString.stringify({
                    ...params,
                    page: 1,
                    store: value.value
                  })}`)
                } else {
                  history.push(`/product-stores/list-stock-tracking?${queryString.stringify({
                    ...params,
                    page: 1,
                    store: undefined
                  })}`)
                }
              }}
              formatOptionLabel={(option, labelMeta) => {
                return <div> <img src={option.logo} style={{ width: 20, height: 20, marginRight: 8 }} /> {option.label}</div>
              }}
            />
          </div>
          <div className="col-3" style={{ zIndex: 90 }}>
                    <Select
                        placeholder={formatMessage({ defaultMessage: "Kho" })}
                        isClearable={false}
                        className="w-100 custom-select-warehouse-sme"
                        value={
                            _.find(
                                _.map(dataWarehouse?.sme_warehouses, (_item) => ({
                                    value: _item?.id,
                                    label: _item?.name,
                                })),
                                (_item) => _item?.value == params?.warehouseId
                            ) || {
                                value: defaultWarehouse?.id,
                                label: defaultWarehouse?.name,
                            }
                        }
                        options={_.map(dataWarehouse?.sme_warehouses, (_item) => ({
                            value: _item?.id,
                            label: _item?.name,
                        }))}
                        onChange={(values) => {
                            if (!values) {
                                history.push(
                                    `/product-stores/list-stock-tracking?${queryString.stringify(
                                        _.omit(
                                            {
                                                ...params,
                                            },
                                            ["warehouseId"]
                                        )
                                    )}`
                                );
                                return;
                            }
                            history.push(
                                `/product-stores/list-stock-tracking?${queryString.stringify({
                                    ...params,
                                    page: 1,
                                    warehouseId: values.value,
                                })}`
                            );
                        }}
                    />
                </div>
          <div className="col-4">
            <div className='d-flex align-items-center justify-content-center'>
              <div>
                <span className='mr-2'>{formatMessage({ defaultMessage: 'Thời gian đẩy' })}</span>
              </div>
              <div className='pt-1 pr-2'>
                <DateRangePicker
                  style={{ float: 'right', width: '100%' }}
                  character={' - '}
                  format={'dd/MM/yyyy'}
                  value={valueRangeTime}
                  placeholder={'dd/mm/yyyy - dd/mm/yyyy'}
                  placement={'bottomEnd'}
                  onChange={values => {
                    let queryParams = {};
                    setValueRangeTime(values)

                    if (!!values) {
                      let [gtCreateTime, ltCreateTime] = [dayjs(values[0]).startOf('day').unix(), dayjs(values[1]).endOf('day').unix()];

                      queryParams = {
                        ...params,
                        gt: gtCreateTime,
                        lt: ltCreateTime
                      }
                    } else {
                      queryParams = _.omit({ ...params }, ['gt', 'lt'])
                    }

                    history.push(`/product-stores/list-stock-tracking?${queryString.stringify(queryParams)}`);
                  }}
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
          </div>
        </div>
        <div>
              <div>
                <div className={`col-12 d-flex align-items-center justify-content-between`}>
                  <div className="d-flex align-items-center">
                    <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                      {formatMessage({ defaultMessage: "Đã chọn: {length} {text}" }, {length: products?.length, text: 'sản phẩm'})} 
                    </div>
                    <AuthorizationWrapper keys={['product_store_stock_delete']}>
                      <button type="button" onClick={() => setShowDialog(true)} className="btn btn-elevate btn-primary mr-3 px-8" disabled={products?.length == 0} style={{color: "white", width: 120, background: products?.length == 0 ? "#6c757d" : "", border: []?.length == 0 ? "#6c757d" : "",}}>
                        {formatMessage({ defaultMessage: "Xóa lịch sử" })}
                      </button>
                    </AuthorizationWrapper>
                  </div>
                </div>
              </div>
      
        </div>
      </div>
    </Fragment>
  );
})

export default ProductsFilter;
