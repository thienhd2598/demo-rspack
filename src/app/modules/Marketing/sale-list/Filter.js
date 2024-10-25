import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl'
import { useHistory, useLocation } from 'react-router-dom';
import Select from 'react-select';
import queryString from 'querystring';
import _, { flatMap, omit, sum, xor } from 'lodash';
import DateRangePicker from 'rsuite/DateRangePicker';
import dayjs from 'dayjs';
import makeAnimated from 'react-select/animated';
import { useIntl } from 'react-intl';
import 'react-loading-skeleton/dist/skeleton.css';
import SaleCount from './SaleCount';
import randomColor from 'randomcolor';
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_mktCampaignAggregate from "../../../../graphql/query_mktCampaignAggregate";
import { useMutation, useQuery } from "@apollo/client";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import ModalTrackingCampaign from '../dialog/ModalTrackingCampaign';
import CampaignTemplateCount from './CampaignTemplateCount';

const STATUS_PACK_TAB = [
  {
    title: <FormattedMessage defaultMessage="Tất cả" />,
    status: '',
    sub: []
  },
  {
    title: <FormattedMessage defaultMessage="Chờ duyệt" />,
    status: 'pending',
    sub: []
  },
  {
    title: <FormattedMessage defaultMessage="Đã duyệt" />,
    sub: [
      {
        status: 'syncing',
        name: <FormattedMessage defaultMessage='Đang đồng bộ' />,
      },
      {
        status: 'coming_soon',
        name: <FormattedMessage defaultMessage='Sắp diễn ra' />,
        default: true
      },
      {
        status: 'happening',
        name: <FormattedMessage defaultMessage='Đang diễn ra' />,
      },
      {
        status: 'finished',
        name: <FormattedMessage defaultMessage='Đã kết thúc' />,
      },
      {
        status: 'sync_error',
        name: <FormattedMessage defaultMessage='Đồng bộ lỗi' />,
      },

    ]
  }
];

const STATUS_TEMPLATE = [
  {
    title: <FormattedMessage defaultMessage="Tất cả" />,
    status: '',
  },
  {
    title: <FormattedMessage defaultMessage="Chờ duyệt" />,
    status: 'pending',
  },
  {
    title: <FormattedMessage defaultMessage="Đã duyệt" />,
    status: 'approved',
  }
];

const COLOR_CHANNEL = {
  'shopee': '#FE5629',
  'lazada': '#0a62f3',
  'tiktok': '#323232',
  'other': randomColor({ luminosity: 'light', count: 100 })
};

const Filter = memo(
  ({
    valueRangeTime,
    setValueRangeTime,
    whereCondition,
    dataFilterStoreChannel,    
  }) => {
    const location = useLocation();
    const history = useHistory();
    const { formatMessage } = useIntl();
    const animatedComponents = makeAnimated();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [currentStatus, setCurrentStatus] = useState(
      STATUS_PACK_TAB[0]?.title || ''
    );
    const [search, setSearch] = useState(params?.q || '');
    const [modalTrackingCampaign, setModalTrackingCampaign] = useState(false);

    useEffect(() => {
      setSearch(params.q);
    }, [params.q]);

    useEffect(() => {
      if (!params?.gt || !params?.lt) setValueRangeTime([]);
    }, [params?.gt, params?.lt]);

    useMemo(() => {
      if (!params.type) {
        setCurrentStatus(STATUS_PACK_TAB[0]?.title);
      }

      let findedStatus =
        _.find(STATUS_PACK_TAB, { status: params?.type }) ||
        _.find(STATUS_PACK_TAB, (_status) =>
          _status?.sub?.some((_sub) => _sub?.status === params?.type)
        );

      setCurrentStatus(findedStatus?.title);
    }, [params?.type]);

    const {
      channelsActive,
      currentChannels,
      currentStores,
      optionsStores,
      loadingStore,
      currentTypes,
      filterType
    } = dataFilterStoreChannel || {};
    return (
      <Fragment>
        {modalTrackingCampaign && <ModalTrackingCampaign onHide={() => setModalTrackingCampaign(false)} show={modalTrackingCampaign} />}
        <div className="mb-4">
          {/* <div className="row mb-4" style={{marginLeft: 0}}>
            <div className='col-8 d-flex justify-content-between pl-0'>
            {data?.op_connector_channels?.map(channel => {
              let isActiceChannel = !!currentChannels?.filter(item => item?.value == channel?.code)?.length
              if (channel?.code == 'shopee' && currentChannels?.length == 0) {
                isActiceChannel = true
              }
              return (
                <div style={{ width: '30%', padding: '10px', border:`0.5px solid ${isActiceChannel ? '#FE5629' : 'rgb(217, 217, 217)'}`, borderRadius:'4px'}} onClick={() => {
                  history.push(`/marketing/sale-list?${queryString.stringify(omit({ ...params, page: 1, channel: channel.code }, ['stores']))}`.replaceAll('%2C', '\,'))
                }}>
                  <div className='mt-2'>
                    {!!channel?.logo_asset_url && <img src={channel?.logo_asset_url} alt="" style={{ width: 15, height: 15, marginRight: 4 }}/>}
                    <span>{channel?.name}</span>
                  </div>
                  <div className='mt-2 mb-2 d-flex align-items-center'>
                    <span style={{fontSize: '18px', fontWeight:'bold', marginRight: '4px'}}><SaleCount whereCondition={{list_channel_code: [channel?.code]}}/></span>
                    <span> chương trình</span>
                  </div>
                </div>
              )
            })}
            </div>
          </div> */}
          <div className="row mb-4">
            <div className='col-6'>
              <DateRangePicker
                style={{ float: 'right', width: '100%' }}
                character={' - '}
                className="custome__style__input__date"
                format={'dd/MM/yyyy'}
                value={valueRangeTime}
                placeholder={'Chọn khoảng thời gian'}
                placement={'bottomEnd'}
                onChange={(values) => {
                  let queryParams = {};
                  setValueRangeTime(values);

                  if (!!values) {
                    let [gtCreateTime, ltCreateTime] = [
                      dayjs(values[0])
                        .startOf('day')
                        .unix(),
                      dayjs(values[1])
                        .endOf('day')
                        .unix(),
                    ];
                    queryParams = _.omit(
                      {
                        ...params,
                        page: 1,
                        gt: gtCreateTime,
                        lt: ltCreateTime,
                      }
                    );
                    let rangeTimeConvert = [
                      gtCreateTime,
                      ltCreateTime,
                    ]?.map((_range) => new Date(_range * 1000));

                    setValueRangeTime(rangeTimeConvert);
                  } else {
                    queryParams = _.omit({ ...params, page: 1 }, [
                      'gt',
                      'lt',
                    ]);
                  }
                  history.push(
                    `/marketing/sale-list?${queryString.stringify(
                      queryParams
                    )}`
                  );
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
                  last7Days: formatMessage({
                    defaultMessage: '7 ngày qua',
                  }),
                }}
              />
            </div>
            <div className='col-3'>
              <Select
                options={channelsActive}
                className="select-report-custom w-100"
                placeholder={formatMessage({ defaultMessage: 'Chọn sàn' })}
                components={animatedComponents}
                isClearable
                isMulti
                value={currentChannels}
                isLoading={loadingStore}
                styles={{
                  container: (styles) => ({
                    ...styles,
                    zIndex: 9
                  }),
                }}
                onChange={(values) => {
                  const channels =
                    values?.length > 0
                      ? _.map(values, 'value')?.join(',')
                      : undefined;

                  history.push(
                    `/marketing/sale-list?${queryString.stringify(
                      omit({ ...params, page: 1, channels }, ['stores'])
                    )}`.replaceAll('%2C', ',')
                  );
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return (
                    <div>
                      {!!option.logo && (
                        <img
                          src={option.logo}
                          style={{
                            width: 15,
                            height: 15,
                            marginRight: 4,
                          }}
                        />
                      )}
                      {option.label}
                    </div>
                  );
                }}
              />
            </div>
            <div className='col-3'>
              <Select
                options={optionsStores}
                className="select-report-custom w-100"
                placeholder={formatMessage({ defaultMessage: 'Chọn gian hàng' })}
                components={animatedComponents}
                isClearable
                isMulti
                value={currentStores}
                isLoading={loadingStore}
                onChange={(values) => {
                  const stores =
                    values?.length > 0
                      ? _.map(values, 'value')?.join(',')
                      : undefined;

                  history.push(
                    `/marketing/sale-list?${queryString.stringify(
                      { ...params, page: 1, stores: stores }
                    )}`.replaceAll('%2C', ',')
                  );
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return (
                    <div>
                      {!!option.logo && (
                        <img
                          src={option.logo}
                          style={{
                            width: 15,
                            height: 15,
                            marginRight: 4,
                          }}
                        />
                      )}
                      {option.label}
                    </div>
                  );
                }}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <div
                className="input-icon pl-0"
                style={{ marginTop: 'auto' }}
              >
                <input
                  type="text"
                  className="form-control"
                  placeholder={formatMessage({ defaultMessage: 'Tìm chương trình' })}
                  style={{ height: 37, borderRadius: 0, paddingLeft: '50px' }}
                  onBlur={(e) =>
                    history.push(
                      `/marketing/sale-list?${queryString.stringify({
                        ...params,
                        page: 1,
                        q: e.target.value,
                      })}`
                    )
                  }
                  value={search || ''}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.keyCode == 13) {
                      history.push(
                        `/marketing/sale-list?${queryString.stringify({
                          ...params,
                          page: 1,
                          q: e.target.value,
                        })}`
                      );
                    }
                  }}
                />
                <span>
                  <i className="flaticon2-search-1 icon-md ml-6"></i>
                </span>
              </div>
            </div>
            <div className='col-3'>
              <Select
                options={filterType}
                className="select-report-custom w-100"
                placeholder={formatMessage({ defaultMessage: 'Chọn loại chương trình' })}
                components={animatedComponents}
                isClearable
                isMulti
                value={currentTypes}
                isLoading={loadingStore}
                onChange={(values) => {
                  const types = values?.length > 0
                    ? flatMap(values, 'value')?.join(',')
                    : undefined;

                  history.push(
                    `/marketing/sale-list?${queryString.stringify(
                      { ...params, page: 1, typesFilter: types }
                    )}`.replaceAll('%2C', ',')
                  );
                }}
                formatOptionLabel={(option, labelMeta) => {
                  return (
                    <div>
                      {option.label}
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>

        {params?.typeCampaign != 'template' && (
          <Fragment>
            <div className="d-flex w-100 mt-3" style={{
              zIndex: 1,
              position: 'sticky',
              top: 45,
              background: '#fff',
              gap: 20,
            }}>
              <div style={{
                flex: 1
              }}>

                <ul className="nav nav-tabs" id="myTab" role="tablist">
                  {STATUS_PACK_TAB.map((_tab, index) => {
                    const { title, status, sub } = _tab;
                    const isActive =
                      (!params.type && !status && sub.length == 0) ||
                      (params.type &&
                        (status === params?.type ||
                          sub?.some((_sub) => _sub?.status === params?.type)));
                    return (
                      <li
                        style={{ cursor: 'pointer' }}
                        key={`tab-order-${index}`}
                        className={`nav-item ${isActive ? 'active' : null} `}
                      >
                        <div
                          className={`nav-link font-weight-normal ${isActive ? 'active' : ''
                            }`}
                          style={{ fontSize: '13px', padding: '11px' }}
                          onClick={() => {
                            setCurrentStatus(title);

                            const findedIndexOrderDefault = _.findIndex(
                              sub,
                              (_sub) => !!_sub?.default
                            );

                            history.push(
                              `/marketing/sale-list?${queryString.stringify(
                                {
                                  ...params,
                                  page: 1,
                                  type:
                                    sub?.length > 0
                                      ? sub[findedIndexOrderDefault].status
                                      : status,
                                }
                              )}`
                            );
                          }}
                        >
                          {!status && sub.length == 0 ? (
                            <>{title}</>
                          ) : (
                            <>
                              <>
                                {title}
                                <span className="ml-1">
                                  (
                                  {
                                    <SaleCount
                                      whereCondition={_.omit(
                                        {
                                          ...whereCondition,
                                          list_status:
                                            status == 'pending' ? [1] : [2],
                                          list_sub_status: []
                                        }
                                      )}
                                    />
                                  }
                                  )
                                </span>
                              </>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  <div className='d-flex align-items-center' style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    {params?.typeCampaign != 'template' && <button
                      className="btn btn-primary btn-elevate mr-2"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalTrackingCampaign(true)
                      }}
                    >
                      {formatMessage({ defaultMessage: "TẢI CHƯƠNG TRÌNH" })}
                    </button>}
                    <AuthorizationWrapper keys={['marketing_list_update']}>
                      <button
                        className="btn btn-primary btn-elevate"
                        onClick={(e) => {
                          e.preventDefault();
                          if (params?.typeCampaign != 'template') {
                            history.push(`/marketing/campaign-create?${queryString.stringify({ channel: 'shopee' })}`);
                          } else {
                            history.push(`/marketing/campaign-template-create?${queryString.stringify({ channel: 'shopee' })}`);
                          }
                        }}
                      >
                        {formatMessage({ defaultMessage: "TẠO CHƯƠNG TRÌNH " })}
                      </button>
                    </AuthorizationWrapper>
                  </div>
                </ul>
              </div>

            </div>

            {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.length > 0 && (
              <div
                className="d-flex flex-wrap py-2"
                style={{
                  zIndex: 1,
                  position: 'sticky',
                  top: 85,
                  background: '#fff',
                  gap: 20,
                  marginBottom: '5px',
                }}
              >
                {_.find(STATUS_PACK_TAB, { title: currentStatus })?.sub?.map(
                  (sub_status, index) => {
                    return (
                      <span
                        key={`sub-status-order-${index}`}
                        className="py-2 px-6 d-flex justify-content-between align-items-center"
                        style={{
                          borderRadius: 20,
                          background:
                            sub_status?.status === params?.type
                              ? '#ff6d49'
                              : '#828282',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          history.push(
                            `/marketing/sale-list?${queryString.stringify({
                              ...params,
                              page: 1,
                              type: sub_status?.status,
                            })}`
                          );
                        }}
                      >
                        {sub_status?.name} (
                        {
                          <SaleCount
                            params={params}                            
                            whereCondition={{
                              ...whereCondition,
                              list_status: [2],
                              list_sub_status: [sub_status?.status],
                            }}
                          />
                        }
                        )
                      </span>
                    )
                  }
                )}
              </div>
            )}
          </Fragment>
        )}

        {params?.typeCampaign == 'template' && (
          <div className="d-flex w-100 mt-3" style={{
            zIndex: 1,
            position: 'sticky',
            top: 45,
            background: '#fff',
            gap: 20,
          }}>
            <div style={{
              flex: 1
            }}>

              <ul className="nav nav-tabs" id="myTab" role="tablist">
                {STATUS_TEMPLATE.map((_tab, index) => {
                  const { title, status, } = _tab;
                  const isActive = (!params.type && !status) || (params.type && status === params?.type);
                  return (
                    <li
                      style={{ cursor: 'pointer' }}
                      key={`tab-order-${index}`}
                      className={`nav-item ${isActive ? 'active' : null} `}
                    >
                      <div
                        className={`nav-link font-weight-normal ${isActive ? 'active' : ''
                          }`}
                        style={{ fontSize: '13px', padding: '11px' }}
                        onClick={() => {
                          setCurrentStatus(title);

                          history.push(
                            `/marketing/sale-list?${queryString.stringify(
                              {
                                ...params,
                                page: 1,
                                type: status,
                              }
                            )}`
                          );
                        }}
                      >
                        {!status ? (
                          <>{title}</>
                        ) : (
                          <>
                            <>
                              {title}
                              <span className="ml-1">
                                ({
                                  <CampaignTemplateCount
                                    whereCondition={_.omit(
                                      {
                                        ...whereCondition,
                                        list_status: status == 'pending' ? [1] : [2],
                                      }, ['list_sub_status']
                                    )}
                                  />
                                })
                              </span>
                            </>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
                <div className='d-flex align-items-center' style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <AuthorizationWrapper keys={['marketing_list_update']}>
                    <button
                      className="btn btn-primary btn-elevate"
                      onClick={(e) => {
                        e.preventDefault();
                        if (params?.typeCampaign != 'template') {
                          history.push(`/marketing/campaign-create?${queryString.stringify({ channel: 'shopee' })}`);
                        } else {
                          history.push(`/marketing/campaign-template-create?${queryString.stringify({ channel: 'shopee' })}`);
                        }
                      }}
                    >
                      {formatMessage({ defaultMessage: "TẠO CHƯƠNG TRÌNH " })}
                    </button>
                  </AuthorizationWrapper>
                </div>
              </ul>
            </div>

          </div>
        )}
      </Fragment>
    );
  }
);

export default Filter;
