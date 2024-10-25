import React, { useMemo } from 'react'
import query_scGetBadReview from '../graphql/query_scGetBadReview'
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from "../_metronic/_helpers";
import { useState } from 'react';
import { useHistory, useLocation } from "react-router-dom";

const BadReviewAlert = () => {
    const [isBadReview, setIsBadRivew] = useState([])
    const BAD_RATING = [1, 2]
    const location = useLocation()
    const history = useHistory();
    const pathShowBadReview = ['/product-stores/list', '/customer-service/manage-rating']

    useQuery(query_scGetBadReview, {
        fetchPolicy: "cache-and-network",
        onCompleted: (data) => {
            setIsBadRivew(data?.scGetBadReview?.flatMap(review => BAD_RATING.includes(review?.rating_star) ? review?.rating_star : []))
        },
        skip: !pathShowBadReview.includes(location.pathname)
    });

    return (

        <div className='mb-2'>
            {pathShowBadReview.includes(location.pathname) && isBadReview?.length ? (
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
                            Có phản hồi đánh giá xấu {`(${isBadReview?.map(rv => `${rv} sao`).join(', ')})`}. Vui lòng đến <b style={{ cursor: 'pointer' }} onClick={() => history.push(`/customer-service/manage-rating?page=1&status=not_reply&star=${isBadReview?.includes(1) ? 1 : 2}`)}>đánh giá</b> để xử lý kịp thời!
                        </p>
                    </div>
                    <div onClick={() => setIsBadRivew(false)} style={{ cursor: 'pointer' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#595959" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </div>
                </div>
            ) : null}

        </div>
    )
}

export default BadReviewAlert