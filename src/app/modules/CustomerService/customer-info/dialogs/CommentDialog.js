import React, { Fragment, memo, useMemo, useState } from 'react';
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { Lightbox } from 'react-modal-image';
import { ControlBar, Player, VolumeMenuButton, FullscreenToggle } from 'video-react';
import 'video-react/dist/video-react.css';

const CommentDialog = ({ show, onHide, data }) => {
    const { formatMessage } = useIntl();
    const [openLightBoxUrl, setOpenLightBoxUrl] = useState('');

    return (
        <Fragment>
            {openLightBoxUrl && <Lightbox
                medium={openLightBoxUrl}
                large={openLightBoxUrl}
                showRotate={true}
                alt=""
                onClose={() => setOpenLightBoxUrl('')}
            />}
            <Modal
                show={show}
                size="md"
                aria-labelledby="example-modal-sizes-title-sm"
                dialogClassName={"body-dialog-connect"}
                centered
                onHide={() => { }}
                backdrop={true}
            >
                <Modal.Header>
                    <Modal.Title>
                        {formatMessage({ defaultMessage: 'Thông tin chi tiết đánh giá' })}
                    </Modal.Title>
                    <span>
                        <i
                            className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"
                            onClick={onHide}
                        ></i>
                    </span>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default">
                    <div className='row mb-4'>
                        <div className='col-2 text-right'>
                            <span>{formatMessage({ defaultMessage: 'Đánh giá' })}:</span>
                        </div>
                        <div className='col-10'>
                            {data?.comment || '--'}
                        </div>
                    </div>
                    <div className='row mb-4'>
                        <div className='col-2 text-right'>
                            <span>{formatMessage({ defaultMessage: 'Hình ảnh' })}:</span>
                        </div>
                        <div className='col-10'>
                            <div className='d-flex align-items-center flex-wrap' style={{ gap: 10 }}>
                                {data?.comment_images?.length > 0 ? data?.comment_images?.map((img, index) => (
                                    <OverlayTrigger
                                        overlay={
                                            <Tooltip
                                                title="#1234443241434"
                                                style={{ color: "red" }}
                                            >
                                                <span>{formatMessage({ defaultMessage: 'Bấm để phóng to ảnh' })}</span>
                                            </Tooltip>
                                        }
                                    >
                                        <img
                                            onClick={() => setOpenLightBoxUrl(img)}
                                            className="rounded"
                                            key={index}
                                            style={{
                                                width: "86px",
                                                objectFit: "cover",
                                                marginRight: "8px",
                                                height: '92px',
                                                border: '1px solid #d9d9d9',
                                                cursor: 'pointer'
                                            }}
                                            src={img}
                                            alt="..." loading="lazy"
                                        />
                                    </OverlayTrigger>
                                )) : '--'}
                            </div>
                        </div>
                    </div>
                    <div className='row mb-4'>
                        <div className='col-2 text-right'>
                            <span>{formatMessage({ defaultMessage: 'Video' })}:</span>
                        </div>
                        <div className='col-10'>
                            <div className='d-flex align-items-center flex-wrap' style={{ gap: 10 }}>
                                {data?.comment_videos?.length > 0 ? data?.comment_videos?.map((video, index) => {                                    
                                    return (
                                        <Player className="rounded" fluid={false} width={200} height={100} key={index}>
                                            <source src={video} type="video/mp4" />
                                            <ControlBar>
                                                <VolumeMenuButton disabled />
                                                <FullscreenToggle />
                                            </ControlBar>
                                        </Player>
                                    )
                                }) : '--'}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </Fragment>
    )
};

export default memo(CommentDialog);