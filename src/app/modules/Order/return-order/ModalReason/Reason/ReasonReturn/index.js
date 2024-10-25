import React, { useState } from "react";
import { memo } from "react";
import { Modal } from "react-bootstrap";
import '../../../utils/index.scss'
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Lightbox } from "react-modal-image";
import { ControlBar, Player, VolumeMenuButton, FullscreenToggle } from 'video-react';
import { useMemo } from "react";
import { useIntl } from "react-intl";
//! Nguyên nhân hoàn trả
const ImageAndVideoContainer = ({ children, type }) => {
  const { formatMessage } = useIntl()
  return (
    <div className="imgs_reason mb-2" style={{
      display: 'grid',
      gridTemplateColumns: '20% auto',
      gap: '5px 5px',
    }}>
      <span
        style={{
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "150%",
          textAlign: "right",
          color: "#212529",
        }}
      >
        {type == "images" ? formatMessage({ defaultMessage: "Hình ảnh: " }) : "Videos: "}
      </span>
      {children}
    </div>
  )
}
const Resonreturn = memo(({ idOrder, openModal, setOpenModal }) => {
  const [openLightBoxUrl, setOpenLightBoxUrl] = useState('')
  const { formatMessage } = useIntl()
  const imagesReturnOrderItem = useMemo(() => {
    try {
      return JSON.parse(idOrder?.images)
    } catch (error) {
      return null
    }
  }, [idOrder?.images])
  const videosReturnOrderItem = useMemo(() => {
    try {
      return JSON.parse(idOrder?.buyer_videos)
    } catch (error) {
      return null
    }
  }, [idOrder?.buyer_videos])

  return (
    <div className="scrollbar"
      style={{
        height: 'max-content',
        maxHeight: '300px',
        overflow: 'auto',
        display: 'block'
      }}>
      {openLightBoxUrl ? (
        <Lightbox
          medium={openLightBoxUrl}
          large={openLightBoxUrl}
          showRotate={true}
          alt=""
          onClose={() => setOpenLightBoxUrl('')}
        />
      ) : null}
      <div
        style={{
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "150%",
          color: "#212529",
          display: 'grid',
          gridTemplateColumns: '20% auto',
          gap: '5px 5px'
        }}
        className="mb-4"
      >
        <span style={{ textAlign: "right" }}>{formatMessage({ defaultMessage: 'Nguyên nhân' })}: </span>
        <span>{idOrder.return_reason}</span>
      </div>
      <div
        style={{
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "150%",
          color: "#212529",
          display: 'grid',
          gridTemplateColumns: '20% auto',
          gap: '5px 5px',
        }}
        className="mb-4"
      >
        <span style={{ textAlign: "right" }}>{formatMessage({ defaultMessage: 'Chi tiết' })}: </span>
        <span>{idOrder.return_reason_text}</span>
      </div>

      <ImageAndVideoContainer type="images">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {imagesReturnOrderItem ?
            imagesReturnOrderItem?.map((imgUrl, index) => (
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
                  onClick={() => setOpenLightBoxUrl(imgUrl)}
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
                  src={imgUrl}
                  alt="..." loading="lazy"
                />
              </OverlayTrigger>
            )) : '--'}
        </div>
      </ImageAndVideoContainer>

      <ImageAndVideoContainer type="videos">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {videosReturnOrderItem ?
            videosReturnOrderItem?.map((videoUrl, index) => (
              <Player className="rounded" fluid={false} width={200} height={100} key={index}>
                <source src={videoUrl} type="video/mp4" />
                <ControlBar>
                  <VolumeMenuButton disabled />
                  <FullscreenToggle />
                </ControlBar>
              </Player>
            )) : '--'}
        </div>
      </ImageAndVideoContainer>
      <Modal.Footer
        className="form"
        style={{
          borderTop: "1px solid #dbdbdb",
          justifyContent: "end",
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <div className="form-group">
          {" "}
          <button
            type="button"
            className="btn btn-primary btn-elevate mr-3"
            style={{ width: 100 }}
            onClick={() =>
              setOpenModal({
                ...openModal,
                openReasonReturn: false,
              })
            }
          >
            {formatMessage({ defaultMessage: 'Đóng' })}
          </button>{" "}
        </div>
      </Modal.Footer>
    </div>
  );
});

export default Resonreturn;