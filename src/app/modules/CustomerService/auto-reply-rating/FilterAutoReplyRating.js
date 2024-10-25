import React from 'react'
import { TABS } from './constants'
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import { useIntl } from 'react-intl';
const FilterAutoReplyRating = ({ channels }) => {
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))
    const history = useHistory();
    const { formatMessage } = useIntl();
    return (
        <div>
            <div
                className="d-flex align-items-center flex-wrap py-2" style={{ background: "#fff", zIndex: 1, marginBottom: "5px", }}>
                <i style={{ color: '#00DB6D' }} className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                <span className="fs-14" style={{ color: '#00DB6D' }}>
                    {formatMessage({ defaultMessage: 'Hiện tại hệ thống đang chỉ hỗ trợ tải và trả lời đánh giá từ kênh Shopee, Lazada.' })}
                </span>
            </div>
            <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                        {TABS.map((tab) => {
                            const { title, key } = tab;
                            const isActive = key == (params?.tab || "autoRating");
                            return (
                                <li key={`tab-${tab.key}`} onClick={() => { history.push(`${location.pathname}?${queryString.stringify({ page: 1, tab: tab?.key, })}`) }}>
                                    <a style={{ fontSize: "16px" }} className={`nav-link ${isActive ? "active" : ""}`}>
                                        {formatMessage(title)}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            {params?.tab !== 'exampleReply' ? (
                <div className="my-4 d-flex align-items-center">
                    <div>
                        {formatMessage({ defaultMessage: "Sàn" })}:
                    </div>
                    <div className="col-10">
                        <div className={`d-flex w-100 align-items-center flex-wrap my-4 ml-2`}>
                            {[{ name: 'Tất cả', code: '' }, ...channels?.filter(cn => cn?.code !== 'tiktok')]?.map((channel) => (
                                <div onClick={() => { history.push(`${location.pathname}?${queryString.stringify({ ...params, page: 1, channel: channel?.code })}`); }}
                                    key={channel.id}
                                    className="d-flex align-items-center justify-content-center col-2 mr-4"
                                    style={{ border: channel?.code == (params?.channel || '') ? "1px solid #FE5629" : "1px solid #D9D9D9", borderRadius: 4, padding: 6, flex: 1, cursor: "pointer", fontSize: "13x", height: '30px' }}>
                                    <span>
                                        {channel.logo_asset_url ? <img className='mr-2' src={channel.logo_asset_url} style={{ width: 20, height: 20 }} alt='' /> : null}
                                        {channel.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    )
}

export default FilterAutoReplyRating