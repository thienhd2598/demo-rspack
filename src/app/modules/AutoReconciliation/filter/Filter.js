import React, { useMemo, useState } from 'react'
import { BOX_OVERVIEW, RESULT_RECONCILIATION, TABS, TYPE_IMPORTWAREHOUSE } from '../AutoReconciliationHelper'
import queryString from "querystring";
import { useHistory, useLocation } from "react-router-dom";
import { useIntl } from 'react-intl';
import DateRangePicker from "rsuite/DateRangePicker";
import dayjs from 'dayjs';
import makeAnimated from 'react-select/animated';
import _ from 'lodash';
import Select from "react-select";
import query_verify_public_summary from '../../../../graphql/query_verify_public_summary';
import { useQuery } from '@apollo/client';
const Filter = ({ smeWarehouses, dataStore }) => {
    const history = useHistory();
    const location = useLocation();
    const animatedComponents = makeAnimated();
    const params = queryString.parse(location.search.slice(1, 100000));
    const { formatMessage}  = useIntl()

    const [valueRangeTime, setValueRangeTime] = useState([
        new Date(dayjs().subtract(7, "day").startOf("day")),
        new Date(dayjs().subtract(1, "day").endOf("day")),
    ]);
    const disabledFutureDate = (date) => {
        const unixDate = dayjs(date).unix();
        const today = dayjs().startOf('day').add(1, 'day').unix();

        return unixDate >= today;
    }


    const [stores, currentStores] = useMemo(() => {
        const stores = dataStore?.stores?.map(store => ({value: store?.id, label: store?.name, logo: store?.logoChannel}))
        let currentStores = !!params?.stores ? stores?.filter(store => !!store?.value && params?.stores?.split(',').some(_id => _id == store.value)) : null;

        
        return [stores, currentStores]
    }, [dataStore, params.stores])

    const whereCondition = useMemo(() => {
      const from_date = dayjs(valueRangeTime[0])?.startOf('day')?.unix()
      const to_date = dayjs(valueRangeTime[1])?.endOf('day')?.unix()
      
      return {
        from_date,
        to_date,
        store_id: currentStores?.map(item => item?.value)
      }
    }, [valueRangeTime, currentStores])

    const {data: dataSummary, loading: loadingDataSummary} = useQuery(query_verify_public_summary, {
      variables: whereCondition,
      fetchPolicy: 'network-only'
    })

    const subMenu = useMemo(() => {
      if(params?.type_order == 2) {
        return BOX_OVERVIEW?.filter(item => item?.code != 'order_sync')
      }
      return BOX_OVERVIEW
    }, [params?.type_order])

  return (
    <div>
        <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <ul className="nav nav-tabs">
              {TABS.map((tab) => {
               const isTabActive = tab.value == (params?.type_order || 1);
                return (
                  <li style={{cursor: 'pointer'}} key={`tab-${tab?.status}`} onClick={() => {
                    history.push(`${location.pathname}?${queryString.stringify({page: 1, type_order: tab.value})}`)
                  }
                   }>
                    <span style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                      {tab?.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="row col-12 mb-4">
            <div className="d-flex align-items-center">
                <span className="p-0 mr-2">{formatMessage({ defaultMessage: "Thời gian" })}:</span>
                <div className="m-0 p-0">
                <DateRangePicker
                    style={{ width: "100%" }}
                    character={" - "}
                    format={"dd/MM/yyyy"}
                    value={valueRangeTime}
                    disabledDate={disabledFutureDate}
                    placeholder={"dd/mm/yyyy - dd/mm/yyyy"}
                    placement={"bottomStart"}
                    onClean={() => {
                      setValueRangeTime([
                        new Date(dayjs().subtract(7, "day").startOf("day")),
                        new Date(dayjs().subtract(1, "day").endOf("day")),
                    ])
                    }}
                    onChange={(values) => {
                        let queryParams = {};
                        setValueRangeTime(values);
                        
                        if (!!values) {
                            let [ltCreateTime, gtCreateTime] = [dayjs(values[0]).startOf("day").unix(),dayjs(values[1]).endOf("day").unix()];

                            queryParams = {...params,page: 1,gt: gtCreateTime, lt: ltCreateTime};
                        } else {
                            queryParams = _.omit({ ...params, page: 1 }, ["gt", "lt"]);
                        }

                        history.push(`/auto-reconciliation?${queryString.stringify(queryParams)}`);
                    }}
                    locale={{
                        sunday: "CN",
                        monday: "T2",
                        tuesday: "T3",
                        wednesday: "T4",
                        thursday: "T5",
                        friday: "T6",
                        saturday: "T7",
                        ok: formatMessage({ defaultMessage: "Đồng ý" }),
                        today: formatMessage({ defaultMessage: "Hôm nay" }),
                        yesterday: formatMessage({ defaultMessage: "Hôm qua" }),
                        hours: formatMessage({ defaultMessage: "Giờ" }),
                        minutes: formatMessage({ defaultMessage: "Phút" }),
                        seconds: formatMessage({ defaultMessage: "Giây" }),
                        formattedMonthPattern: "MM/yyyy",
                        formattedDayPattern: "dd/MM/yyyy",
                        // for DateRangePicker
                        last7Days: formatMessage({ defaultMessage: "7 ngày qua" }),
                    }}
                />
            </div>
            </div>
               
            <div className='col-2' style={{ zIndex: 95 }}>
              <div className='d-flex align-items-center'>
                <Select
                  options={stores || []}
                  className='w-100 select-report-custom'
                  placeholder={formatMessage({ defaultMessage: 'Gian hàng' })}
                  components={animatedComponents}
                  isClearable
                  isMulti
                  value={currentStores}
                  isLoading={dataStore?.loadingGetStore}
                  onChange={values => {
                    const stores = values?.length > 0 ? _.map(values, 'value')?.join(',') : undefined;

                    history.push(`/auto-reconciliation?${queryString.stringify({ ...params, page: 1, stores: stores })}`.replaceAll('%2C', '\,'))
                  }}
                  formatOptionLabel={(option, labelMeta) => {
                    return <div>
                      {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 4 }} alt=""/>}
                      {option.label}
                    </div>
                  }}
                />
              </div>
            </div>
        </div>
      
        <div className="d-flex row align-items-center mb-4 justify-content-center">
             {subMenu?.filter(item => item?.code != 'settlement').map((box, index) => {
                const { code } = box;
              const validTotal = dataSummary?.verify_public_summary[`${code}_total_valid`]
              const invalidTotal = dataSummary?.verify_public_summary[`${code}_total_invalid`]
              return (
                <div className='d-flex align-items-center justify-content-center col-2'>
                    <div>
                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px'}}>
                        <div className='d-flex align-items-center'>
                            <span className='mr-2' style={{ color: '#00db6d', fontWeight: 'bold', fontSize: '24px'}}>{validTotal}</span>
                            <span style={{fontSize: '24px'}}>|</span>
                            <span className='ml-2' style={{ color: '#ff0201', fontWeight: 'bold', fontSize: '24px'}}>{invalidTotal}</span>
                        </div>
                        <div className='d-flex align-items-center'>
                            <div className='mr-2' style={{width: '12px', height: '12px', background: '#ff0201', borderRadius: '50%'}}></div>
                            <div>{box?.title}</div>
                        </div>
                    </div>
                   
                     </div>
                     {(index !== BOX_OVERVIEW.length - 2) && <div style={{border: '1px solid gray',width: 0,opacity: 0.3, height: '30px', margin: 'auto'}}></div>}
                </div>
                
            )})}
           </div>


        <div className="d-flex w-100 mt-3">
          <div style={{ flex: 1 }}>
            <ul className="nav nav-tabs" id="myTab" role="tablist">
              {subMenu.map((_tab, index) => {
                const { title, value } = _tab;
                const isActive = params?.type_order != 2 ? (params?.type || 1) == value : (params?.type || 2) == value
                return (
                  <li style={{ cursor: 'pointer'}} key={`tab-order-${index}`} className={`nav-item ${isActive ? "active" : null} `}>
                    <div className={`nav-link font-weight-normal ${isActive ? "active" : ""}`} style={{ fontSize: "13px", padding: "11px" }}
                      onClick={() => { history.push(`/auto-reconciliation?${queryString.stringify({...params,page: 1,type: value})}`);                      }}
                    >
                      {<>{title}</>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          
        </div>

        <div className="row mt-6">
            {[2].includes(+params?.type) && <div className='col-2'>
            <Select
              placeholder={formatMessage({ defaultMessage: "Kho" })}
              isClearable={true}
              className="w-100 custom-select-warehouse-sme"
              value={_.find(smeWarehouses,(_item) => _item?.value == params?.warehouseId) || null}
              options={smeWarehouses}
              onChange={(values) => {
                if (!values) {
                  history.push(`/auto-reconciliation?${queryString.stringify(_.omit({...params},["warehouseId"]))}`);
                  return;
                }
                history.push(`/auto-reconciliation?${queryString.stringify({...params, page: 1, warehouseId: values.value})}`);
              }}
            />
            </div>}

            {[2].includes(+params?.type) && <div className='col-2'>
              <Select
                placeholder={formatMessage({ defaultMessage: "Hình thức" })}
                isClearable={true}
                className="w-100 custom-select-warehouse-sme"
                value={_.find(TYPE_IMPORTWAREHOUSE,(_item) => _item?.value == params?.type_import) || null}
                options={TYPE_IMPORTWAREHOUSE}
                onChange={(values) => {
                  if (!values) {
                    history.push(`/auto-reconciliation?${queryString.stringify(_.omit({...params},["type_import"]))}`);
                    return;
                  }
                  history.push(`/auto-reconciliation?${queryString.stringify({...params, page: 1, type_import: values.value})}`);
                }}
              />
            </div>}

            <div className='col-2'>
              <Select
                placeholder={formatMessage({ defaultMessage: "Kết quả đối soát" })}
                isClearable={true}
                className="w-100 custom-select-warehouse-sme"
                value={_.find(RESULT_RECONCILIATION,(_item) => _item?.value == params?.result) || null}
                options={RESULT_RECONCILIATION}
                onChange={(values) => {
                  if (!values) {
                    history.push(`/auto-reconciliation?${queryString.stringify(_.omit({...params},["result"]))}`);
                    return;
                  }
                  history.push(`/auto-reconciliation?${queryString.stringify({...params, page: 1, result: values.value})}`);
                }}
              />
            </div>
        </div>
    </div>
  )
}

export default Filter