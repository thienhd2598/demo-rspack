import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { Checkbox } from '../../../../_metronic/_partials/controls'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import InfoProduct from '../../../../components/InfoProduct'
import HoverImage from '../../../../components/HoverImage'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import ClampLines from 'react-clamp-lines';
import dayjs from 'dayjs';
import _ from 'lodash'
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { Lightbox } from "react-modal-image";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper'


const RowTableRating = ({ handleRetryReply, setFeedbackDialog, stores, key, comment, setIds, isSelected }) => {
    const { formatMessage } = useIntl()
    const [isCopied, setIsCopied] = useState(false)
    const [isPause, setIsPause] = useState(true)
    const [openLightBoxUrl, setOpenLightBoxUrl] = useState('')
    const location = useLocation();
    const vidref = useRef(null);
    const params = queryString.parse(location.search.slice(1, 100000));
    const selectStore = useMemo(() => stores?.find((store => store.value == comment?.store_id)), [stores, comment])

    const onCopyToClipBoard = async (text) => {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => { setIsCopied(false) }, 1500)
    };

    const toggleFullScreenMode = () => {
        if (!document.fullscreenElement) {
            setIsPause(false)
            vidref.current.requestFullscreen()
            vidref.current.play()
        } else {
            document.exitFullscreen()
            setIsPause(true)
        }
    }

    let assetUrl = useMemo(() => {
        if (!comment?.product?.productAssets) {
            return null;
        }
        try {

            let imgOrigin = (comment?.product?.productAssets || []).find(_asset => _asset.type == 4)

            if (!!imgOrigin && !!imgOrigin.template_image_url) {
                return imgOrigin.sme_url || imgOrigin.ref_url
            }

            let _asset = _.minBy(comment?.product?.productAssets?.filter(_asset => _asset.type == 1), 'position')
            if (!!_asset) {
                return _asset.sme_url || _asset.ref_url
            }
            return null
        } catch (error) {
            return null
        }
    }, [comment])

    const viewAction = useMemo(() => {
        if (!!comment?.can_reply) {
            return (
                <AuthorizationWrapper keys={['customer_service_rating_update']}>
                    <div onClick={() => setFeedbackDialog({ isOpen: true, replyComment: comment?.id })}
                        style={{ cursor: 'pointer', marginTop: '40%' }}
                        className='text-primary'
                    >
                        {formatMessage({ defaultMessage: 'Trả lời' })}
                    </div>
                </AuthorizationWrapper>
            )
        }

        if (comment?.can_reply == 0 && !!comment?.replyRating && !Boolean(comment?.replyRating?.is_sync)) {
            return (
                <div style={{ cursor: 'pointer', marginTop: '40%' }}
                    onClick={async () => await handleRetryReply([comment?.id], true)}
                    className='text-primary'
                >
                    {formatMessage({ defaultMessage: 'Thử lại' })}
                </div>
            )
        }
        return <></>

    }, [comment, params?.status])

    const viewReplyComment = useMemo(() => {
        if (comment?.can_reply == 0 && !comment?.replyRating && !Boolean(comment?.replyRating?.is_sync)) {
            return <div className='text-danger text-center d-flex align-items-center' style={{ marginTop: '9%' }}>
                <span>{formatMessage({ defaultMessage: 'Không thể phản hồi đánh giá này' })}</span>
                <TooltipWrapper note={formatMessage({ defaultMessage: "Theo quy định của sàn, bạn không thể phản hồi đánh giá này vì đánh giá không có nội dung" })}>
                    <i className="fas fa-info-circle fs-14 ml-2"></i>
                </TooltipWrapper>
            </div>
        }
        if (comment?.can_reply == 0 && !!comment?.replyRating) {
            return <div>
                <div className='mb-2'>
                    <div className="d-flex align-items-center">
                        {!!comment?.replyRating?.reply_sample_id ? (
                            <>
                                <span>{formatMessage({ defaultMessage: 'Trả lời bởi: Tự động' })}</span>
                                <img className="mx-2" src={toAbsoluteUrl("/media/svg/robot.svg")} alt='' />
                            </>
                        ) : (
                            <span>{formatMessage({ defaultMessage: 'Trả lời bởi' })}: {comment?.replyRating?.user_name || '--'}</span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '350px' }}>
                    <ClampLines
                        text={comment?.replyRating?.reply || ''}
                        id="really-unique-id"
                        lines={2}
                        ellipsis="..."
                        moreText={formatMessage({ defaultMessage: "Xem thêm" })}
                        lessText={formatMessage({ defaultMessage: "Thu gọn" })}
                        className="mb-2"
                        innerElement="div"
                    />
                </div>
                <div className="d-flex align-items-center">
                    <span style={{ color: 'gray' }}>{formatMessage({ defaultMessage: 'Lúc' })}: {!!comment?.replyRating?.create_time ? dayjs.unix(comment?.replyRating?.create_time).format("HH:mm DD/MM/YYYY") : '--'}</span>
                    {!!comment?.replyRating?.is_sync ?
                        <img className="mx-2" src={toAbsoluteUrl("/media/svg/tick-fill.svg")} alt='' /> :
                        <TooltipWrapper note={formatMessage({ defaultMessage: "Lỗi đồng bộ lên sàn" })}>
                            <img className='mx-2' src={toAbsoluteUrl("/media/warningsvg.svg")} alt=""></img>
                        </TooltipWrapper>
                    }
                </div>

            </div>
        }

        return null
    }, [comment, params])


    return (
        <>
            {openLightBoxUrl ? (<Lightbox medium={openLightBoxUrl} large={openLightBoxUrl} showRotate={true} alt="" onClose={() => setOpenLightBoxUrl('')} />) : null}
            <tr key={key}>
                <td colSpan='7' className='p-0'>
                    <div className='d-flex align-items-center justify-content-between' style={{ background: '#D9D9D9', padding: '8px' }}>

                        <div className='d-flex align-items-center'>
                            <Checkbox inputProps={{ 'aria-label': 'checkbox', }} size='checkbox-md' isSelected={isSelected}
                                onChange={(e) => {
                                    if (isSelected) {
                                        setIds(prev => prev.filter(_id => _id.id != comment.id))
                                    } else {
                                        setIds(prev => prev.concat([comment]))
                                    }
                                }}
                            />

                            <span className='mx-4'>
                                <img src={selectStore?.logo} style={{ width: 20, height: 20, objectFit: 'contain' }} alt="" />
                                <span className='ml-1'>{selectStore?.label}</span>
                            </span>

                            <span className='mx-4'>
                                Người mua: {comment?.buyer_username || '--'}
                                <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                    <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(comment?.buyer_username)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                                </OverlayTrigger>
                            </span>
                        </div>

                        <div className='mr-6'>
                            <span style={{ cursor: 'pointer', marginLeft: '40px' }} onClick={() => window.open(`/orders/${comment?.order_id}`, '_blank')}>
                                {`${formatMessage({ defaultMessage: 'Mã đơn hàng' })}: ${comment?.ref_order_id || '--'}`}
                            </span>

                            <OverlayTrigger overlay={<Tooltip title='#1234443241434' style={{ color: 'red' }}><span>{isCopied ? `Copied!` : `Copy to clipboard`}</span></Tooltip>}>
                                <span style={{ cursor: 'pointer' }} onClick={() => onCopyToClipBoard(comment?.ref_order_id)} className='ml-2'><i style={{ fontSize: 12 }} className="far fa-copy"></i></span>
                            </OverlayTrigger>
                        </div>

                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    <div className="col-11" style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row' }}>
                        <div style={{ backgroundColor: '#F7F7FA', width: 90, height: 90, borderRadius: 8, overflow: 'hidden', minWidth: 90, cursor: 'pointer' }}
                            onClick={e => window.open(`/product-stores/edit/${comment?.product.id}`, '_blank')}
                            className='mr-6'
                        >
                            {!!assetUrl && <HoverImage size={{ width: 320, height: 320 }} defaultSize={{ width: 90, height: 90 }} url={assetUrl} />}
                        </div>
                        <div className='w-100'>
                            <InfoProduct short={true} name={comment?.product?.name} sku={comment?.product?.sku} url={`/product-stores/edit/${comment?.product?.id}`} />

                            <div className='mt-2'>
                                {comment?.productVariant?.name || ''}
                            </div>

                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        <div className='mb-2'>{Array(comment?.rating_star || 0).fill(0).map(star => <img src={toAbsoluteUrl("/media/svg/star-fill.svg")} alt='' />)}</div>

                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '350px' }}>
                            <ClampLines
                                text={comment?.comment ? comment?.comment?.replaceAll("\n", " ") : ''}
                                id="really-unique-id"
                                lines={2}
                                ellipsis="..."
                                moreText={formatMessage({ defaultMessage: "Xem thêm" })}
                                lessText={formatMessage({ defaultMessage: "Thu gọn" })}
                                className="mb-2"
                                innerElement="div"
                            />
                        </div>
                        {!!comment?.review_images?.length && (
                            <div className='mb-2' style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {comment?.review_images?.map((img, index) => (
                                    <div className='mb-2 rounded' onClick={() => setOpenLightBoxUrl(img || '')}>
                                        <HoverImage styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer' }} size={{ width: 320, height: 320 }} defaultSize={{ width: 60, height: 60 }} url={img || ''} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!!comment?.review_videos?.length && (
                            <div className='mb-2' style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                {comment?.review_videos?.map((videoUrl, index) => (
                                    <div onClick={toggleFullScreenMode} style={{ position: 'relative', cursor: 'pointer' }}>
                                        {isPause && <img src={toAbsoluteUrl("/media/play-circle.svg")} alt='' style={{ zIndex: '66', width: '23px', position: 'absolute', left: '50%', top: '50%', transform: "translate(-50%, -50%)" }} />}
                                        <video autoplay={false} style={{ borderRadius: '4px', border: '1px solid #d9d9d9', height: '60px', width: '60px' }} ref={vidref}>
                                            <source src={videoUrl} type="video/mp4" />
                                        </video>
                                    </div>
                                ))}
                            </div>
                        )}
                        <span style={{ color: 'gray' }}>Lúc: {!!comment?.create_time ? dayjs.unix(comment?.create_time).format("HH:mm DD/MM/YYYY") : '--'}</span>
                    </div>
                </td>
                <td>
                    {viewReplyComment}
                </td>
                <td className='text-center'>
                    {viewAction}
                </td>
            </tr>
        </>
    )
}

export default RowTableRating