import React, { useMemo } from 'react'
import { Card, CardBody } from '../../../../../../_metronic/_partials/controls'
import { useIntl } from 'react-intl'
import queryString from 'querystring';
import { omit, pick } from 'lodash'
import { PLATFORM_RECONCILIATION } from '../../common/Constants';
const Platform = ({ stores, setIds, channels, pushToUrl, channelOnUrl }) => {
  const { formatMessage } = useIntl()
  const { history, params, location } = pushToUrl

  const store_type = useMemo(() => {
    return +params?.store || ''
  }, [params?.store])
  return (
    <Card>
      <CardBody>
        <div className="d-flex align-items-center py-2 px-4 my-2" style={{ backgroundColor: '#CFF4FC', border: '1px solid #B6EFFB', borderRadius: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" style={{ color: '#055160' }} className="bi bi-lightbulb mr-2" viewBox="0 0 16 16">
            <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z" />
          </svg>
          <span className="fs-14" style={{ color: '#055160' }}>
            {formatMessage({ defaultMessage: 'Các đơn hàng có thời gian hơn 90 ngày sẽ được chuyển vào Lịch sử và không thể xử lý được nữa.' })}
          </span>
        </div>
        <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <ul className="nav nav-tabs">
              {[
                { key: 1, title: formatMessage({ defaultMessage: 'Trong vòng 90 ngày' }) },
                { key: 2, title: formatMessage({ defaultMessage: 'Lịch sử' }) },
              ].map((tab) => {
                const isTabActive = (tab.key == 1 && !params?.is_old_order) || (tab.key == 2 && !!params?.is_old_order);
                return (
                  <li
                    key={`tab-${tab.key}`}
                    onClick={() => {
                      history.push(
                        `${location.pathname}?${queryString.stringify({
                          page: 1,
                          ...(tab.key == 2 ? { is_old_order: 1 } : {}),
                        })}`
                      );
                    }}
                  >
                    <a style={{ fontSize: "16px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>
                      {tab.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className='d-flex align-items-center'>
          <div
            className="text-dark mb-2 text-right"
            style={{ fontSize: "14px", fontWeight: 700, width: '11%' }}
          >
            {formatMessage({ defaultMessage: "Nền tảng đối soát" })}
          </div>
          <div className={`d-flex w-100 align-items-center flex-wrap my-2 ml-4 row col-10`}>
            {PLATFORM_RECONCILIATION?.map((plf) => (
              <div
                onClick={() => {
                  setIds([])
                  const paramQuery = omit(params, ['channel', 'payment_system', 'store'])
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ...paramQuery,
                      page: 1,
                      platform: plf?.key,
                    })}`
                  );
                }}
                key={plf?.key}
                className="d-flex align-items-center py-1 px-4 justify-content-center col-6 mr-4"
                style={{
                  border:
                    plf?.key == (params?.platform || 'ecommerce')
                      ? "1px solid #FE5629"
                      : "1px solid #D9D9D9",
                  flex: 1,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: 'rgb(255, 0, 0)' }}>
                  {formatMessage(plf?.title)}
                </span>

              </div>
            ))}
          </div>
        </div>
        <div className='d-flex align-items-center'>
          <div
            className="text-dark mb-2 text-right"
            style={{ fontSize: "14px", fontWeight: 'bold', width: '11%' }}
          >
            {formatMessage({ defaultMessage: "Sàn" })}
          </div>
          <div className={`d-flex w-100 align-items-center flex-wrap my-2 ml-4 row col-10`}>
            {(params?.platform == 'manual'
              ? channels?.filter(cn => (cn?.payment_system & 2) != 0)
              : channels?.filter(cn => (cn?.payment_system & 1) != 0)
            )?.map((channel) => (
              <div
                onClick={() => {
                  setIds([])
                  const paramQuery = omit(params, ['store'])
                  history.push(
                    `${location.pathname}?${queryString.stringify({
                      ...paramQuery,
                      page: 1,
                      channel: channel?.code,
                      payment_system: channel?.payment_system,
                    })}`
                  );
                }}
                key={channel.id}
                className="d-flex align-items-center fs-14 py-1 px-4 mb-2 justify-content-center col-2 mr-4"
                style={{
                  border:
                    channel?.code == channelOnUrl
                      ? "1px solid #FE5629"
                      : "1px solid #D9D9D9",
                  cursor: "pointer",
                  fontSize: '13px'
                }}
              >
                <span>
                  <img
                    className='mr-2'
                    src={channel.logo_asset_url}
                    style={{ width: 16, height: 16, marginRight: 4 }}
                    alt=''
                  />
                  {channel.name}
                </span>

              </div>
            ))}
          </div>
        </div>

        <div className="d-flex align-items-center text-right">
          <div className="text-dark mb-2" style={{ fontSize: "14px", fontWeight: 'bold', width: '11%' }}>
            {formatMessage({ defaultMessage: "Gian hàng" })}
          </div>

          <div className={`d-flex w-100 align-items-center flex-wrap my-2 ml-4 row col-10`}>
            {((stores?.length > 0) ? [{ name: formatMessage({ defaultMessage: 'Tất cả' }), id: '', url: '/media/svg/cart.svg' }, ...stores] : [{ name: 'Tất cả', id: '', url: '/media/svg/cart.svg' }])?.map((store, index) => {
              return (
                <div
                  onClick={() => {
                    history.push(`${location.pathname}?${queryString.stringify({
                      ...params,
                      page: 1,
                      store: store.id,
                    }
                    )}`
                    );
                  }}
                  style={{
                    cursor: "pointer",
                    border: store.id == store_type
                      ? "1px solid #FE5629"
                      : "1px solid #D9D9D9",
                      fontSize: '12px'
                  }}
                  className="text-center py-1 px-4 mr-2 fs-14"
                >
                  <img src={store.url} style={{ width: 16, height: 16, marginRight: 4 }} alt=''/>
                  {store.name}
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default Platform