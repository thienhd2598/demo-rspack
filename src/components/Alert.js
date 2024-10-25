import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import query_stores_expried from '../graphql/query_stores_expried';
import dayjs from 'dayjs';
import { toAbsoluteUrl } from "../_metronic/_helpers";

import {Link} from "react-router-dom";
import { useIntl } from 'react-intl';

const STATUS = {
  DISCONNECT: 0,
  CONNECTED: 1,
  LOST_CONNECTED: 2,
}

const Alert = () => {
  const [stores, setStores] = useState([])
  const {formatMessage} = useIntl()

  function timeStoreExpired(time) {
    return {
      days: Math.floor((dayjs(time).unix() - dayjs().unix()) / (60 * 60 * 24)),
      hours: Math.floor(((dayjs(time).unix() - dayjs().unix()) % (60 * 60 * 24)) / (60 * 60))
    }
  }

  function amountDay(time) {
    if(timeStoreExpired(time)?.days === 0) {
      return timeStoreExpired(time)?.hours < 10 ?
       formatMessage({defaultMessage:"0{time} giờ"},{time: timeStoreExpired(time)?.hours })
       : formatMessage({defaultMessage:"{time} giờ"},{time: timeStoreExpired(time)?.hours })
    }
    return formatMessage({defaultMessage:"{time} ngày"},{time: timeStoreExpired(time)?.days })
  }
  useQuery(query_stores_expried,{
      fetchPolicy: "cache-and-network",
      onCompleted: (data) => {
        const channels = data?.op_connector_channels?.map(channel => {
          return {
            logo: channel?.logo_asset_url,
            code: channel?.code
          }
        })
        const storesExpried = data?.sc_stores?.flatMap(store => {
          const channel = channels?.find(cn => cn?.code == store?.connector_channel_code)
          if(store?.status == STATUS['LOST_CONNECTED']) {
            return {
              ...store,
              logo: channel?.logo
            }
          }
          if(!!store?.authorization_expired_at &&
             timeStoreExpired(store?.authorization_expired_at)?.days < 8 &&
             timeStoreExpired(store?.authorization_expired_at)?.days >= 0) {
            return {
              ...store,
              logo:  channel?.logo,
              timeExpired: amountDay(store?.authorization_expired_at)
            }
          }
          return []
        })
      setStores(storesExpried)}
  });
  return (
   !!stores.length && (
    <div className='mb-2'>
    {stores?.map((store, index) => (
        <div style={{ 
          display: 'flex',
         justifyContent: 'space-between',
         background: '#f5c6cb',
         color: '#721c24',
         alignItems: 'center',
         padding: '7px 7px',
         marginBottom: '2px',
         borderRadius: '5px'
       }}>
           <div className='d-flex align-items-center'>
           <img src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
          
           <p className='ml-2 mb-0'>
            {store?.status == STATUS['LOST_CONNECTED'] ?
             <span>{formatMessage({defaultMessage:"Gian hàng"})}
                <strong style={{ margin: '0 5px'}}> <img style={{width: '15px', marginBottom: '3px'}} src={store?.logo} alt=''/> {store?.name} </strong> 
                {formatMessage({defaultMessage:"bị mất kết nối. Vui lòng đến "})}
                <Link to="/setting/channels"> {formatMessage({defaultMessage:"Kênh bán"})} </Link>
                {formatMessage({defaultMessage:"để kết nối lại"})}.
              </span>
                :
              <span>{formatMessage({defaultMessage:"Gian hàng"})}
                <strong style={{ margin: '0 5px'}}> <img style={{width: '15px', marginBottom: '3px'}} src={store?.logo} alt=''/> {store?.name} </strong> 
                {formatMessage({defaultMessage:"sẽ hết hạn uỷ quyền trong"})}
                  <strong> {store?.timeExpired} </strong>
                {formatMessage({defaultMessage:"nữa. Vui lòng đến"})}
                  <Link to="/setting/channels"> {formatMessage({defaultMessage:"Kênh bán"})} </Link>
                {formatMessage({defaultMessage:"để kết nối lại"})}.
              </span>}
            </p>
           </div>
           <div onClick={() => setStores((prev) => prev.slice(0, -1))} style={{ cursor: 'pointer'}}>
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#595959" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
           </div>
       </div>
      )
    )}
    </div>
   )
  )
}

export default Alert