import React, { useMemo, useCallback, memo } from 'react';
import { useIntl } from "react-intl";
import { Modal, OverlayTrigger, ProgressBar, Tooltip } from 'react-bootstrap';
import Timeline from 'rsuite/Timeline';

const ModalLoadFrameImage = ({ syncImg, onHide, setIds }) => {
    const { formatMessage } = useIntl();    

    const [title, titleSub1, titleSub2, titleSub3] = useMemo(() => {
        let [text, text1, text2, text3] = [];
        if (!!syncImg?.typeSync?.frame && !!syncImg?.typeSync?.prefix_name) {
            text = formatMessage({ defaultMessage: 'Kết quả thêm tiền tố và áp dụng khung ảnh sản phẩm sàn' })
            text1 = formatMessage({ defaultMessage: 'Hệ thồng tiến hành thêm tiền tố và áp khung cho sản phẩm' })
            text2 = formatMessage({ defaultMessage: 'Hệ thống tiến hành đồng bộ sản phẩm được thêm tiền tố và áp khung lên kênh bán' })
            text3 = formatMessage({ defaultMessage: 'thêm tiền tố & áp khung' })
        } else {
            if (!!syncImg?.typeSync?.frame) {
                text = formatMessage({ defaultMessage: 'Kết quả áp dụng khung ảnh sản phẩm sàn' })
                text1 = formatMessage({ defaultMessage: 'Hệ thồng tiến hành áp khung cho sản phẩm' })
                text2 = formatMessage({ defaultMessage: 'Hệ thống tiến hành đồng bộ sản phẩm được áp khung lên kênh bán' })
                text3 = formatMessage({ defaultMessage: 'áp khung' })
            } else {
                text = formatMessage({ defaultMessage: 'Kết quả thêm tiền tố tên sản phẩm sàn' })
                text1 = formatMessage({ defaultMessage: 'Hệ thồng tiến hành thêm tiền tố cho sản phẩm' })
                text2 = formatMessage({ defaultMessage: 'Hệ thống tiến hành đồng bộ sản phẩm được thêm tiền tố lên kênh bán' })
                text3 = formatMessage({ defaultMessage: 'thêm tiền tố' })
            }
        }
        return [text, text1, text2, text3]
    }, [syncImg]);

    return (
        <Modal
            show={!!syncImg}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={'body-dialog-connect modal-pack-order'}
            centered
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <Timeline
                    className='time-line-frame-img'
                    align="left"
                    isItemActive={index => {
                        if (!syncImg?.typeSync?.frame && !!syncImg?.typeSync?.prefix_name) {
                            return true
                        }

                        if (syncImg?.current == syncImg?.total) {
                            return index == 0 || index == 1
                        } else {
                            return false
                        }
                    }}
                >
                    <Timeline.Item>
                        <div className='mb-3'>
                            <span className='font-weight-boldest'>{titleSub1}</span>
                        </div>
                        {!!syncImg?.typeSync?.frame && !!syncImg?.typeSync?.prefix_name && <div className='d-flex ml-2 flex-column'>
                            <div className='d-flex flex-column p-2 mb-2' style={{ background: '#D9D9D980' }}>
                                <span className='mb-2'>{formatMessage({ defaultMessage: 'Tổng số sản phẩm cần thêm tiền tố: {count}' }, { count: syncImg?.dataSync?.sc_composite_image_sync?.total_product ?? 0 })}</span>
                                <div className='d-flex'>
                                    <span className='mr-1'>{formatMessage({ defaultMessage: 'Số sản phẩm thêm tiền tố thành công trên hệ thống:' })}</span>
                                    <span className='text-success'>{syncImg?.total_prefix_success ?? 0}</span>
                                </div>
                            </div>
                            <div className='d-flex flex-column p-2 mb-2' style={{ background: '#D9D9D980' }}>
                                <span className='mb-2'>{formatMessage({ defaultMessage: 'Tổng số sản phẩm cần áp khung: {count}' }, { count: syncImg?.dataSync?.sc_composite_image_sync?.total_product ?? 0 })}</span>
                                <ProgressBar
                                    style={{ height: 15 }}
                                    className='fs-14 mb-2'
                                    now={((syncImg?.current / syncImg?.total) * 100).toFixed()}
                                    label={`${((syncImg?.current / syncImg?.total) * 100).toFixed()}%`}
                                />
                                <div className='d-flex'>
                                    <span className='mr-1'>{formatMessage({ defaultMessage: 'Số sản phẩm áp khung thành công trên hệ thống:' })}</span>
                                    <span className='text-success'>{syncImg?.dataSync?.sc_composite_image_sync?.total_success ?? 0}</span>
                                </div>
                            </div>
                        </div>}
                        {!!syncImg?.typeSync?.frame && !syncImg?.typeSync?.prefix_name && <div className='d-flex ml-2 flex-column'>
                            <span className='mb-2'>{formatMessage({ defaultMessage: 'Tổng số sản phẩm cần áp khung: {count}' }, { count: syncImg?.dataSync?.sc_composite_image_sync?.total_product ?? 0 })}</span>
                            <ProgressBar
                                style={{ height: 15 }}
                                className='fs-14 mb-2'
                                now={((syncImg?.current / syncImg?.total) * 100).toFixed()}
                                label={`${((syncImg?.current / syncImg?.total) * 100).toFixed()}%`}
                            />
                            <div className='d-flex'>
                                <span className='mr-1'>{formatMessage({ defaultMessage: 'Số sản phẩm áp khung thành công trên hệ thống:' })}</span>
                                <span className='text-success'>{syncImg?.dataSync?.sc_composite_image_sync?.total_success ?? 0}</span>
                            </div>
                        </div>}
                        {!syncImg?.typeSync?.frame && !!syncImg?.typeSync?.prefix_name && <div className='d-flex ml-2 flex-column'>
                            <span className='mb-2'>{formatMessage({ defaultMessage: 'Tổng số sản phẩm cần thêm tiền tố: {count}' }, { count: syncImg?.total ?? 0 })}</span>
                            <div className='d-flex'>
                                <span className='mr-1'>{formatMessage({ defaultMessage: 'Số sản phẩm thêm tiền tố thành công trên hệ thống:' })}</span>
                                <span className='text-success'>{syncImg?.total_prefix_success ?? 0}</span>
                            </div>
                        </div>}
                    </Timeline.Item>
                    <Timeline.Item style={!!syncImg?.typeSync?.frame && syncImg?.current != syncImg?.total ? { opacity: 0.4 } : {}}>
                        <div className='mb-3'>
                            <span className='font-weight-boldest d-flex align-items-center'>
                                <span>{titleSub2}</span>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({ defaultMessage: 'Sau khi hệ thống báo thêm tiền tố tên và khung ảnh thành công cho tất cả các sản phẩm được chọn, vui lòng chuyển đến màn Quản lý đồng bộ để xem trạng thái đồng bộ của sản phẩm đó lên kênh bán.' })}
                                        </Tooltip>
                                    }
                                >
                                    <span className="ml-2" style={{ position: 'relative', top: '-1px' }}>
                                        <svg xmlns="http://www.w3.org/1800/svg" width="14" height="14" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
                                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                                        </svg>
                                    </span>
                                </OverlayTrigger>
                            </span>
                        </div>
                        <div className='d-flex ml-2'>
                            {!!syncImg?.typeSync?.frame && syncImg?.current != syncImg?.total ? (
                                <span>Kiểm tra trạng thái đồng bộ lên kênh bán của sản phẩm vừa được {titleSub3} tại màn Quản lý đồng bộ hoặc nhấn xem tại đây</span>
                            ) : (
                                <span>Kiểm tra trạng thái đồng bộ lên kênh bán của sản phẩm vừa được {titleSub3} tại màn <span className='font-weight-boldest'>Quản lý đồng bộ</span> hoặc nhấn xem <span className='text-primary cursor-pointer' onClick={() => window.open('/product-stores/syncs')}>tại đây</span></span>
                            )}
                        </div>
                    </Timeline.Item>
                </Timeline>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={() => {
                            setIds([]);
                            onHide();
                        }}
                        disabled={syncImg?.current != syncImg?.total && !(!syncImg?.typeSync?.frame && !!syncImg?.typeSync?.prefix_name)}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    )
}

export default memo(ModalLoadFrameImage);