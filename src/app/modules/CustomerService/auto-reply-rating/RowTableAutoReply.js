import React from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import dayjs from "dayjs";
import { useSelector } from 'react-redux';
const RowTableAutoReply = ({ handleUpdateStatusAutoReply, confirmUpdateStatus, item, chooseTemplate }) => {
    const user = useSelector((state) => state.auth.user);

    return (
        <tr>
            <td>
                <div>
                    <img src={item?.logo} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                    <span className='ml-1'>{item?.nameStore}</span>
                </div>
            </td>
            <td>
                {!!item?.autoReplyTemplate ? <div className='d-flex align-items-center justify-content-between'>
                    <span>{item?.autoReplyTemplate?.name}</span>
                    <span><i onClick={() => chooseTemplate({ isOpen: true, template: item })} className="far fa-edit cursor-pointer" style={{ cursor: 'pointer', color: 'black', fontSize: '14px' }}></i></span>
                </div> : <span onClick={() => chooseTemplate({ isOpen: true, template: item })} className='text-primary' style={{ cursor: 'pointer' }}>Chọn mẫu</span>}

            </td>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item?.autoReplyTemplate?.autoRatingFilters?.flatMap(it => !!it?.status ? it?.rating_star : [])?.sort()?.map(amountStar => <span>{Array(amountStar).fill(0).map(star => <img className="my-2" src={toAbsoluteUrl("/media/svg/star-fill.svg")} alt='' />)}</span>)}
                </div>
            </td>
            <td className='text-center'>{item?.repliedToday}</td>
            <td className='text-center'>
                <span className="switch" style={{ transform: 'scale(0.8)' }}>
                    <label>
                        <input type={'checkbox'}
                            disabled={!item?.autoReplyTemplate || (user?.is_subuser && !['customer_service_auto_reply_rating']?.some(key => user?.permissions?.includes(key)))}
                            onChange={async () => {
                                if (!!item?.status) {
                                    confirmUpdateStatus()
                                    return
                                }
                                await handleUpdateStatusAutoReply(item?.autoReplyTemplate?.id, !!item?.status ? 0 : 1, item?.id)
                            }}
                            style={{ background: '#F7F7FA', border: 'none' }}
                            checked={!!item?.status} />
                        <span></span>
                    </label>
                </span>
            </td>
            <td className='text-center'>
                {!!item?.updatedAt ? dayjs(item?.updatedAt).format("HH:mm DD/MM/YYYY") : '--'}
            </td>
        </tr>
    )
}

export default RowTableAutoReply