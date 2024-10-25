import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { FormattedMessage, useIntl } from "react-intl";
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import NumberFormat from 'react-number-format';
import { loadSizeImageFromPath } from "../../../../utils";
import axios from "axios";
import { useSelector } from "react-redux";
const CancelToken = axios.CancelToken;

function ProductImageEditDialog({ show, onHide, dataCrop }) {
  // Products UI Context
  const { formatMessage } = useIntl();
  const cropper = useRef()
  const user = useSelector((state) => state.auth.user);
  const [detail, setDetail] = useState({ width: 0, height: 0 })
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [loading, setLoading] = useState()
  const [ratio, setRatio] = useState(-1)
  const refCancel = useRef()


  useEffect(() => {
    if (!show) {
      !!refCancel.current && refCancel.current('unmount')
      return;
    }
    const image = document.getElementById('image_crop');
    if (!image) {
      !!refCancel.current && refCancel.current('unmount')
      return;
    }
    cropper.current = new Cropper(image, {
      aspectRatio: null,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      rotatable: true,
      autoCropArea: 1,
      // checkCrossOrigin: false,
      // checkOrientation: false,
      crop(event) {
        setDetail(event.detail)
      },
    });

    setLoading(false)

  }, [show])

  useMemo(() => {
    if (!detail) {
      setWidth(0)
      setHeight(0)
    } else {
      setWidth(Math.ceil(detail.width))
      setHeight(Math.ceil(detail.height))
    }
  }, [detail])
  const enableAccept = !!detail && (width >= (dataCrop?.minWidth || 500) && width <= (dataCrop?.maxWidth || 1024) && height >= (dataCrop?.minHeight || 500) && height <= (dataCrop?.maxHeight || 1024))
  return (
    <Modal
      show={show}
      onHide={() => {
        setRatio(-1);
        onHide();
      }}
      aria-labelledby="example-modal-sizes-title-sm"
      centered
      size='xl'
    >
      <Modal.Header>
        <Modal.Title>
          {formatMessage({ defaultMessage: 'Chỉnh sửa ảnh' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }} >
        <div className='row' >
          <div className='col-8' style={{ height: '75vh', borderRight: '1px solid #c9c9c9' }} >
            <img style={{
              display: 'block',
              maxWidth: '100%'
            }} id="image_crop" src={dataCrop?.url || ''} alt="" />
          </div>
          <div className='col-4 my-4'>
            <p>{formatMessage({ defaultMessage: 'Tỷ lệ cắt' })}</p>
            <div className='row mb-4' >
              <div className='col-12' >
                <button className={`btn  mr-2  ${ratio == -1 ? 'btn-primary active' : 'btn-secondary'}`} style={{ width: 100 }}
                  onClick={e => {
                    setRatio(-1)
                    cropper.current.setAspectRatio(null)
                  }}
                >
                  {formatMessage({ defaultMessage: 'Cắt tự do' })}
                </button>
                <button className={`btn  mr-2  ${ratio == 1 ? 'btn-primary active' : 'btn-secondary'}`} style={{ width: 100 }}
                  onClick={e => {
                    setRatio(1)
                    cropper.current.setAspectRatio(1 / 1)
                  }}
                >
                  1:1
                </button>
                <button className={`btn  mr-2  ${ratio == 0.75 ? 'btn-primary active' : 'btn-secondary'}`} style={{ width: 100 }}
                  onClick={e => {
                    setRatio(0.75)
                    cropper.current.setAspectRatio(3 / 4)
                  }}
                >
                  3:4
                </button>
              </div>
            </div>
            <p>{formatMessage({ defaultMessage: 'Kích thước cắt' })}</p>
            <div className='row mb-4 mr-0' >
              <div className='col-6' >
                <label>{formatMessage({ defaultMessage: 'Chiều rộng' })}</label>
                <NumberFormat
                  className={"form-control"}
                  thousandSeparator={true}
                  max={dataCrop?.maxWidth || 1024}
                  min={0}
                  suffix=' px'
                  isAllowed={({ floatValue }) => !floatValue || floatValue <= (dataCrop?.maxWidth || 1024)}
                  allowNegative={false}
                  value={Math.round(width)}
                  onValueChange={value => {
                    let _w = Math.round(value.floatValue);
                    setWidth(_w)
                  }}
                  // fixedDecimalScale={1}
                  onBlur={() => {
                    if (width <= 0) {
                    } else {
                      cropper.current.setData({
                        width: width,
                      })
                    }
                  }}
                />
              </div>
              <div className='col-6' >
                <label>{formatMessage({ defaultMessage: 'Chiều dài' })}</label>
                <NumberFormat
                  className={"form-control"}
                  thousandSeparator={true}
                  max={dataCrop?.maxHeight || 1024}
                  suffix=' px'
                  isAllowed={({ floatValue }) => !floatValue || floatValue <= (dataCrop?.maxHeight || 1024)}
                  allowNegative={false}
                  value={Math.round(height)}
                  onValueChange={value => {
                    let _w = Math.round(value.floatValue);
                    setHeight(_w)
                  }}
                  fixedDecimalScale={1}
                  onBlur={() => {
                    if (height <= 0) {
                    } else {
                      cropper.current.setData({
                        height: height,
                      })
                    }
                  }}
                />
              </div>
            </div>

            <div className='row mb-4' >
              <div className='col-12' >
                <div className="btn-group mr-4" role="group" aria-label="First group">
                  <button type="button" className="btn btn-success btn-icon"
                    onClick={() => {
                      cropper.current.zoom(-0.1)
                    }}
                  >
                    <span className="svg-icon svg-icon-white" >
                      <SVG
                        style={{ width: 24, height: 24 }}
                        src={toAbsoluteUrl(
                          "/media/svg/icons/Design/ZoomMinus.svg"
                        )}></SVG>
                    </span>
                  </button>
                  <button type="button" className="btn btn-info btn-icon"
                    onClick={() => {
                      cropper.current.zoom(0.1)
                    }}>
                    <span className="svg-icon svg-icon-white" >
                      <SVG
                        style={{ width: 24, height: 24 }}
                        src={toAbsoluteUrl(
                          "/media/svg/icons/Design/ZoomPlus.svg"
                        )}></SVG>
                    </span>
                  </button>
                </div>
                <div className="btn-group" role="group" aria-label="First group">
                  <button type="button" className="btn btn-success btn-icon"
                    onClick={() => {
                      cropper.current.rotate(-15)
                    }}
                  ><i className="fa fa-undo-alt"></i></button>
                  <button type="button" className="btn btn-info btn-icon"
                    onClick={() => {
                      cropper.current.rotate(15)
                    }}><i className="fa fa-redo-alt"></i></button>
                </div>
              </div>
            </div>

            <div className='row mb-4' >
              <div className='col-12' >
                <button className={`btn  mr-2  btn-primary active`}
                  disabled={loading}
                  onClick={async e => {
                    setLoading(true)
                    try {
                      let blob = await fetch(dataCrop?.url)
                        .then(res => res.blob())
                      let formData = new FormData();
                      formData.append('type', 'file')
                      formData.append('size', dataCrop?.maxWidth || 1024)
                      formData.append('file', blob, Date.now() + 'file.' + blob.type.split('/')[1])
                      let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD.replace('/files/upload', '/files/crop-to-standard'), formData, {
                        isSubUser: user?.is_subuser,
                        cancelToken: new CancelToken(function executor(c) {
                          refCancel.current = c;
                        }),
                      })
                      console.log('res', res.data.data.source)
                      cropper.current.replace(res.data.data.source)
                      cropper.current.reset()
                    } catch (error) {
                      console.log('error', error)
                    } finally {
                      setLoading(false)
                    }
                  }}
                >{loading ? <span className="spinner "  ></span> : formatMessage({ defaultMessage: "Chuẩn hoá ảnh" })}</button>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="form form-group py-2">
        <div className='flex-grow-1' >
        </div>
        <span className='font-size-xs text-info' ><em>
          {formatMessage({ defaultMessage: '* Kích thước: Tối thiểu {min}, tối đa {max}' }, { min: `${dataCrop?.minWidth || 500}x${dataCrop?.minHeight || 500}`, max: `${dataCrop?.maxWidth || 1024}x${dataCrop?.maxHeight || 1024}` })}
        </em></span>
        <button
          type="button"
          onClick={() => {
            setRatio(-1);
            onHide();
          }}
          className="btn btn-light btn-elevate mr-3"
        >
          <FormattedMessage defaultMessage="ĐÓNG" />
        </button>
        <button
          type="button"
          className="btn btn-primary btn-elevate"
          disabled={!enableAccept || loading}
          onClick={async () => {
            setLoading(true)
            cropper.current.getCroppedCanvas().toBlob(async (blob) => {
              !!dataCrop && !!dataCrop.onCrop && dataCrop.onCrop(blob)
              onHide();
              setRatio(-1);
            })
          }}
        >
          <FormattedMessage defaultMessage="XÁC NHẬN" />
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default ProductImageEditDialog;