import React, { Fragment, memo, useState } from 'react';
import { toAbsoluteUrl } from '../_metronic/_helpers';
import { useQuery } from '@apollo/client';
import query_getSummaryScheduledFrame from '../graphql/query_getSummaryScheduledFrame';
import { useHistory, useLocation } from "react-router-dom";

const ScheduledFrameErrorAlert = () => {
    const location = useLocation()    
    const [isShowAlert, setShowAlert] = useState(false);
    const pathShowError = ['/product-stores/list', '/dashboard', '/frame-image/list', '/frame-image/scheduled-frame']

    const { data: dataSummaryScheduledFrame } = useQuery(query_getSummaryScheduledFrame, {
        fetchPolicy: 'cache-and-network',
        variables: {},
        skip: !pathShowError.includes(location.pathname),
        onCompleted: (data) => {
            if (data?.getSummaryScheduledFrame?.error > 0) {
                setShowAlert(true)
            } else {
                setShowAlert(false)
            }
        }
    });    

    return (
        <Fragment>
            {dataSummaryScheduledFrame?.getSummaryScheduledFrame?.error > 0 && isShowAlert && (
                <div
                    className='mb-2 d-flex justify-content-between align-items-center px-4 py-2'
                    style={{ background: '#f5c6cb', color: '#721c24', borderRadius: 4 }}
                >
                    <div className='d-flex align-items-center'>
                        <img src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                        <span className='ml-2'>Hệ thống đang có {dataSummaryScheduledFrame?.getSummaryScheduledFrame?.error} lịch đang xử lý lỗi. Vui lòng đến màn <a href='/frame-image/scheduled-frame?page=1&status=4'>Áp và Gỡ khung bị lỗi</a> để thử lại</span>
                    </div>
                    <div onClick={() => setShowAlert(false)} className='cursor-pointer'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#595959" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </div>
                </div>
            )}
        </Fragment>
    )
}

export default memo(ScheduledFrameErrorAlert)