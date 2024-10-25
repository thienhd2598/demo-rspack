/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Checkbox,
  InputVertical,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import ImageUpload from "../../../../components/ImageUpload";
import { getVideoDuration, loadSizeImage, randomString, validateImageFileKho, validateImageOrigin, validateImageSizeChart } from "../../../../utils";
import UploadImageAttribute from "./UploadImageAttribute";
import VideoUpload from "../../../../components/VideoUpload";
import ProductImageEditDialog from "../product-image-edit-dialog";
import { Field, useFormikContext } from "formik";
import { useToasts } from "react-toast-notifications";
import ImageView from "../../../../components/ImageView";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { Accordion, Modal, OverlayTrigger, Tooltip, useAccordionToggle } from 'react-bootstrap';
import { useIntl } from "react-intl";
import _ from "lodash";
import axios from "axios";
import { useSelector } from "react-redux";

const SortableItem = SortableElement(({ value, setDataCrop, idx, _disabled, isFormattingImage }) => {
  const { setFieldValue } = useFormikContext()
  const { setProductFiles, } = useProductsUIContext();
  
  return (
    <div className="itemsort" style={{ position: 'relative' }}  >
      <ImageUpload data={value} accept={".png, .jpg, .jpeg"} allowRemove allowDowload
        onRemove={() => {
          setFieldValue('__changed__', true)
          setProductFiles(prev => {
            let newss = [...prev]
            newss.splice(idx, 1)
            return newss;
          })
        }}

        onUploading={(isUploading) => {
          setProductFiles(prev => prev.map((_ff, _idxx) => {
            if (_idxx == idx) {
              return {
                ..._ff,
                isUploading
              }
            }
            return _ff
          }))
        }}
        onUploadSuccess={(dataAsset, id) => {
          setFieldValue('__changed__', true)
          setProductFiles(prev => prev.map(_ff => {
            if (_ff.id == id) {
              return dataAsset
            }
            return _ff
          }))
        }}
        validateFile={({ width, height, size }) => {
          let hasError = validateImageFileKho({ width, height, size })
          setProductFiles(prev => prev.map((_ff, _index) => {
            if (idx == _index) {
              return {
                ..._ff,
                hasError: !!hasError
              }
            }
            return _ff
          }))
          return hasError;
        }}
        onOpenCrop={(url, onCrop) => {
          setDataCrop({ url, onCrop, maxSize: 5000 })
        }}

        disabled={_disabled}
      />
      {
        _disabled && !value.isFormatting && !isFormattingImage && <div className='image-input' style={{
          position: 'absolute',
          top: 12, left: 12, right: 12, bottom: 12,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          paddingTop: 8
        }} >
          <Checkbox
            inputProps={{
              'aria-label': 'checkbox',
            }}
            isSelected={value.isSelected}
            onChange={(e) => {
              setProductFiles(prev => prev.map(_ff => {
                if (_ff.id == value.id) {
                  return {
                    ..._ff,
                    isSelected: !_ff.isSelected
                  }
                }
                return _ff
              }))
            }}
          />
        </div>
      }
      {
        _disabled && value.isFormatting && <div className='image-input' style={{
          position: 'absolute',
          top: 12, left: 12, right: 12, bottom: 12,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} >
          <span className="mr-6 spinner spinner-white"  ></span>
        </div>
      }
    </div>
  )
});

const SortableList = SortableContainer(({ items, setDataCrop, setImageInvalid, disabled, isFormattingImage }) => {  
  const { addToast } = useToasts();
  const { setProductFiles } = useProductsUIContext();
  const { formatMessage } = useIntl()
  return (
    <div className='form-group w-100 d-flex flex-wrap' >
      {
        items.map((_file, index) => {
          return <SortableItem key={`item-${index}`} index={index} idx={index} value={_file} setDataCrop={setDataCrop}
            disabled={disabled} _disabled={disabled}
            isFormattingImage={isFormattingImage}
          />
        })
      }
      {
        items.length < 8 && !disabled && <ImageUpload
          accept={".png, .jpg, .jpeg"}
          required={false}
          multiple={true}
          onChooseFile={async files => {
            let errorDuplicate = [];
            let filesAccept = files.filter(_file => _file.size <= 3 * 1024 * 1024)
            let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
            setImageInvalid(files.map((_file, _index) => {
              let mess = [
              ]
              if (_file.size > 3 * 1024 * 1024) {
                mess.push(formatMessage({defaultMessage: `Không thể tải ảnh lên. Dung lượng ảnh tối đa 3.0 MB.`}))
              }
              if (!!validateImageFileKho({ ...resFetchSize[_index], size: 0 })) {
                mess.push(formatMessage({defaultMessage:'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu 500x500, tối đa 5000x5000'}))
              }
              if (mess.length > 0)
                return {
                  file: _file,
                  message: mess.join('. ')
                }
              return null
            }).filter(_error => !!_error))
            setProductFiles(prev => prev.concat(filesAccept.filter(_file => {
              if (prev.some(___file => !!___file.refFile && ___file.refFile.name == _file.name && ___file.refFile.size == _file.size)) {
                errorDuplicate.push(_file.name)
                return false
              }
              return true
            }).map(_file => ({
              id: randomString(12),
              file: _file,
              refFile: _file,
            }))).slice(0, 8))
            if (errorDuplicate.length > 0) {
              addToast(formatMessage({defaultMessage:'Vui lòng không chọn hình ảnh trùng nhau'}), { appearance: 'error' });
            }
          }}
          onOpenCrop={(url, onCrop) => {
            setDataCrop({ url, onCrop, maxSize: 5000 })
          }}
        />
      }
    </div>
  );
});

function CustomToggle({ children, eventKey }) {
  const { openBlockImage, setOpenBlockImage, btnRefCollapseImage } = useProductsUIContext();
  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setOpenBlockImage(!openBlockImage)
  });
  const { formatMessage } = useIntl()
  return (
    <CardHeader title={formatMessage({defaultMessage:'HÌNH ẢNH/VIDEO'})} className="cursor-pointer"  ref={btnRefCollapseImage} onClick={decoratedOnClick}>
    <div className="d-flex justify-content-between align-items-center">
      {children}
      <span>
        <i className={`${(openBlockImage ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down')} cursor-pointer`} style={{ fontSize: 30 }} />
      </span>
    </div>
    </CardHeader>
  );
}

function ProductImages(props) {
  const { productFiles, setProductFiles,
    setProductSizeChart, productSizeChart,
    setProductImageOrigin, productImageOrigin,
    productVideFiles, setProductVideFiles } = useProductsUIContext();
  const [dataCrop, setDataCrop] = useState()
  const user = useSelector((state) => state.auth.user);
  const { setFieldValue } = useFormikContext()
  const [formattingImage, setformattingImage] = useState(false);
  const [isFormattingImage, setIsformattingImage] = useState(false);
  const [imageInvalid, setImageInvalid] = useState([])
  const [errorVideo, setErrorVideo] = useState('');
  const _onSortEnd = useCallback(({ oldIndex, newIndex }) => {
    setProductFiles(prev => arrayMoveImmutable(prev, oldIndex, newIndex))
  })

  const { formatMessage } = useIntl()
  return (
    <Accordion>
      <Card>
          <CustomToggle eventKey="0">
          </CustomToggle>
        <Accordion.Collapse eventKey="0">
          <>
            <CardBody className='mb-0  pb-0' >
              <div className="form-group mb-1">
                <div style={{
                  width: '100%', display: 'flex', position: 'relative',
                }}>
                  <h6 className='mb-0'>{formatMessage({defaultMessage:'HÌNH ẢNH'})} <span className='text-danger'>*</span></h6>
                  {
                    formattingImage ? <div style={{ flex: 1, textAlign: 'end', marginBottom: 8 }}>
                      <span>{formatMessage({defaultMessage:'Số ảnh đã chọn'})}: {_.sumBy(productFiles, o => o.isSelected ? 1 : 0)}</span>&ensp;
                      <a
                        className="text-primary"
                        onClick={async e => {
                          e.preventDefault();
                          setProductFiles(prev => prev.map(_ff => {
                            if (_ff.isSelected) {
                              return {
                                ..._ff,
                                isFormatting: true
                              }
                            }
                            return _ff
                          }))
                          setIsformattingImage(true)
                          try {
                            let blobs = await Promise.all(productFiles.map(__ => {
                              if (!__.isSelected) {
                                return null
                              }
                              if (!!__.file) {
                                return __.file
                              }
                              return fetch(__.source).then(res => res.blob())
                            }))
                            let resFormat = await Promise.all(blobs.map(__bb => {
                              if (!__bb) {
                                return Promise.resolve()
                              }
                              let formData = new FormData();
                              formData.append('type', 'file')
                              formData.append('file', __bb, Date.now() + 'file.' + (__bb.type.split('/')[1] || 'png'))
                              return axios.post(process.env.REACT_APP_URL_FILE_UPLOAD.replace('/files/upload', '/files/crop-to-standard'), formData, {
                                isSubUser: user?.is_subuser,
                              })
                            }))

                            // cropper.current.replace(res.data.data.source)
                            // cropper.current.reset()
                            setProductFiles(prev => prev.map((_ff, _idx) => {
                              if (!!resFormat[_idx] && resFormat[_idx].data?.success) {
                                return resFormat[_idx].data.data
                              }
                              return _ff
                            }))
                          } catch (error) {
                            console.log('error', error)
                          } finally {
                            setformattingImage(false)
                            setIsformattingImage(false)
                          }


                        }}
                      >
                        {formatMessage({defaultMessage:'Chuẩn hoá'})}
                      </a>
                      {
                        !productFiles.some(__ => __.isFormatting) && <>
                          &ensp;|&ensp;
                          <a
                            className="text-primary"
                            onClick={e => {
                              e.preventDefault();
                              setformattingImage(false)
                              setIsformattingImage(false)
                            }}
                          >
                            {formatMessage({defaultMessage:'Huỷ chuẩn hoá'})}
                          </a>
                        </>
                      }
                    </div> : <div style={{ flex: 1, textAlign: 'end' }}>
                      <a
                        className="text-primary"
                        onClick={e => {
                          e.preventDefault();
                          setformattingImage(true)
                        }}
                      >
                        {formatMessage({defaultMessage:'Chuẩn hoá ảnh'})}
                      </a>
                    </div>
                  }
                </div>
                <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }} ><FormattedMessage defaultMessage="* Đinh dạng hỗ trợ: JPG JPEG, PNG. Kích thước: Tối thiểu 500x500, tối đa 1024x1024, nền trắng. Dung lượng tối đa: 2Mb. Số lượng tối đa: 8 hình ảnh." /></em></span>
              </div>
              <SortableList axis="x" lockAxis="x" helperClass="itemsort" items={productFiles}
                setImageInvalid={setImageInvalid} setDataCrop={setDataCrop} onSortEnd={_onSortEnd}
                disabled={formattingImage}
                isFormattingImage={isFormattingImage}
              />
            </CardBody>

            <CardBody className='mb-2' >
              <div className="row">
                <div className='col-4 mb-0' >
                  <div className="form-group mb-1">
                    <h6 className='mb-0'>{formatMessage({defaultMessage:'ẢNH SẢN PHẨM GỐC'})}<OverlayTrigger
                      placement="bottom-start"
                      overlay={
                        <Tooltip className="custom-tooltip">
                          {formatMessage({defaultMessage:'Ảnh sản phẩm gốc là ảnh sản phẩm trên nền trắng. Tỉ lệ ảnh 1:1. Ảnh sản phẩm gốc được dùng để ghép với các khung ảnh mẫu làm ảnh cover chạy chiến dịch.'})}
                        </Tooltip>
                      }
                    >

                      <i className="far fa-question-circle ml-2"></i>
                    </OverlayTrigger></h6>
                  </div>
                  <div className="d-flex align-items-center">

                    <div className='form-group w-100 d-flex flex-wrap' >
                      <ImageUpload
                        required={false}
                        accept={".png, .jpg, .jpeg"}
                        data={productImageOrigin}
                        multiple={false}
                        allowRemove
                        allowDowload
                        isSingle
                        onRemove={() => {
                          setFieldValue('__changed__', true)
                          setProductImageOrigin(null)
                        }}

                        onUploading={(isUploading) => {
                          setProductImageOrigin(prev => {
                            if (!!prev) {
                              return {
                                ...prev,
                                isUploading
                              }
                            }
                            return prev
                          })
                        }}
                        onUploadSuccess={(dataAsset, id) => {
                          setFieldValue('__changed__', true)
                          setProductImageOrigin(dataAsset)
                        }}
                        validateFile={({ width, height, size }) => {
                          let hasError = validateImageOrigin({ width, height, size, channel: 'lazada' })
                          setProductImageOrigin(prev => {
                            return {
                              ...prev,
                              hasError: !!hasError
                            }
                          })
                          return hasError;
                        }}
                        onChooseFile={async files => {
                          let __error = false;
                          let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                          setImageInvalid(files.map((_file, _index) => {
                            let mess = [
                            ]
                            if (_file.size > 3 * 1024 * 1024) {
                              mess.push(formatMessage({defaultMessage:'Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa 3MB.'}))
                              __error = true;
                            }
                            let hasError = validateImageOrigin({ ...resFetchSize[_index], size: 0, channel: 'lazada' })
                            if (!!hasError) {
                              mess.push(hasError)
                              __error = true;
                            }
                            if (mess.length > 0)
                              return {
                                file: _file,
                                message: mess.join('. ')
                              }
                            return null
                          }).filter(_error => !!_error))
                          setProductImageOrigin({
                            id: randomString(12),
                            file: files[0],
                            refFile: files[0],
                          })
                        }}
                        onOpenCrop={(url, onCrop) => {
                          console.log('url', url)
                          setDataCrop({ url, onCrop, maxSize: 5000 })
                        }}
                      />
                    </div>
                    <ul className="text-info" style={{ fontStyle: 'italic', fontSize: 10, paddingLeft: 6 }}>
                      <li>{formatMessage({defaultMessage:'Định dạng hỗ trợ: JPG JPEG, PNG.'})}</li>
                      <li>{formatMessage({defaultMessage:'Kích thước: Tối thiểu 500x500.'})}</li>
                      <li>{formatMessage({defaultMessage:'Dung lượng tối đa: 3Mb.'})}</li>
                      <li>{formatMessage({defaultMessage:'Ảnh sản phẩm nền trắng dùng để sử dụng áp với khung ảnh làm ảnh cover chạy chiến dịch.'})}</li>
                    </ul>
                  </div>
                </div>

                <div className='col-4 mb-0' >
                  <div className="form-group mb-1">
                    <h6 className='mb-0'>{formatMessage({defaultMessage:'BẢNG QUY ĐỔI KÍCH CỠ'})}</h6>
                  </div>
                  <div className='form-group w-100 d-flex flex-wrap' >
                    <ImageUpload
                      required={false}
                      accept={".png, .jpg, .jpeg"}
                      data={productSizeChart}
                      multiple={false}
                      allowRemove
                      allowDowload
                      isSingle
                      onRemove={() => {
                        setFieldValue('__changed__', true)
                        setProductSizeChart(null)
                      }}
                      onUploadSuccess={(dataAsset, id) => {
                        setFieldValue('__changed__', true)
                        setProductSizeChart(dataAsset)
                      }}

                      onUploading={(isUploading) => {
                        setProductSizeChart(prev => {
                          if (!!prev) {
                            return {
                              ...prev,
                              isUploading
                            }
                          }
                          return prev
                        })
                      }}
                      validateFile={({ width, height, size }) => {
                        let hasError = validateImageSizeChart({ width, height, size })
                        setProductSizeChart(prev => {
                          return {
                            ...prev,
                            hasError: !!hasError
                          }
                        })
                        return hasError;
                      }}
                      onChooseFile={async files => {
                        let __error = false;
                        let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                        setImageInvalid(files.map((_file, _index) => {
                          let mess = [
                          ]
                          if (_file.size > 500 * 1024) {
                            mess.push(formatMessage({defaultMessage:'Kích thước ảnh chưa đạt yêu cầu. Kích thước ảnh phải < 500kB.'}))
                            __error = true;
                          }
                          let hasError = validateImageSizeChart({ ...resFetchSize[_index], size: 0 })
                          if (!!hasError) {
                            mess.push(hasError)
                            __error = true;
                          }
                          if (mess.length > 0)
                            return {
                              file: _file,
                              message: mess.join('. ')
                            }
                          return null
                        }).filter(_error => !!_error))
                        setProductSizeChart({
                          id: randomString(12),
                          file: files[0],
                          refFile: files[0],
                        })
                      }}

                      onOpenCrop={(url, onCrop) => {
                        setDataCrop({ url, onCrop, maxSize: 2048 })
                      }}
                    />
                  </div>
                </div>

                <div className='col-4 mb-0'>
                  <div className="form-group mb-1">
                    <h6 className='mb-0'>VIDEO</h6>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className='form-group w-100 d-flex flex-wrap' >
                      {
                        productVideFiles.map((_file, index) => {
                          return <VideoUpload setErrorVideo={setErrorVideo} data={_file} key={`file-pro-${_file.id}`} accept={".mp4"} allowRemove
                            onRemove={() => {
                              setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
                            }}
                            setFieldValue={setFieldValue}
                            onUploadError={(isUploadError) => {
                              setProductVideFiles(prev => prev.map(_ff => {
                                if (_ff.id != _file.id) {
                                  return _ff
                                }
                                return {
                                  ..._ff,
                                  isUploadError
                                }
                              }))
                            }}
                            onUploading={(isUploading) => {
                              setProductVideFiles(prev => prev.map(_ff => {
                                if (_ff.id != _file.id) {
                                  return _ff
                                }
                                return {
                                  ..._ff,
                                  isUploading
                                }
                              }))
                            }}
                            onUploadSuccess={(dataAsset) => {
                              setFieldValue('__changed__', true)
                              setProductVideFiles(prev => prev.map(_ff => {
                                if (_ff.id == _file.id) {
                                  return dataAsset
                                }
                                return _ff
                              }))
                            }}
                          />
                        })
                      }
                      {
                        productVideFiles.length < 1 && <VideoUpload setErrorVideo={setErrorVideo} accept={".mp4"}
                          onChooseFile={async files => {
                            // console.log('files', await getVideoDuration(files[0]))
                            setProductVideFiles(prev => prev.concat(files.map(_file => ({
                              id: randomString(12),
                              file: _file
                            }))).slice(0, 8))
                          }}
                        />
                      }
                    </div>
                    <ul className="text-info" style={{ fontStyle: 'italic', fontSize: 10, paddingLeft: 6 }}>
                      <li>{formatMessage({defaultMessage:'Định dạng hỗ trợ: MP4'})}</li>
                      <li>{formatMessage({defaultMessage:'Độ phân giải tối thiểu 480-480px, tối đa 1280x1280px.'})}</li>
                      <li>{formatMessage({defaultMessage:'Độ dài 10 - 60s.'})}</li>
                      {/* <li>Tỷ lệ khung hình của video phải từ 9:16 đến 16:9</li> */}
                      <li>{formatMessage({defaultMessage:'Tối đa 20Mb'})}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardBody>
          </>
        </Accordion.Collapse>

        <Modal
          show={errorVideo.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setErrorVideo('')}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-6" >
              {errorVideo}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: 80 }}
              onClick={() => setErrorVideo('')}
            >
              {formatMessage({defaultMessage:'Đóng'})}
            </button>
          </Modal.Body>
        </Modal>

        <ProductImageEditDialog
          show={!!dataCrop}
          dataCrop={dataCrop}
          onHide={() => {
            setDataCrop(null)
          }}
        />
        <Modal
          show={imageInvalid.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          size='lg'
          onHide={() => setImageInvalid([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4 row" >
              {
                imageInvalid.map((_img, _index) => {
                  return (
                    <div className='col-12' key={`_index-img-${_index}`} >
                      <div style={{
                        alignItems: 'center', display: 'flex',
                        flexDirection: 'row', marginBottom: 16
                      }}>
                        <div style={{
                          backgroundColor: '#F7F7FA',
                          width: 50, height: 50,
                          borderRadius: 8,
                          overflow: 'hidden',
                          minWidth: 50
                        }} className='mr-6' >
                          <ImageView file={_img.file} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                        </div>
                        <p className='font-weight-normal mb-1' style={{ textAlign: 'left' }} >{_img.message}</p>
                      </div>
                    </div>
                  )
                })
              }
            </div>

            <div className="form-group mb-0">
              <button
                type="button"
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 180 }}
                onClick={async () => {
                  setImageInvalid([])
                }}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Xác nhận'})}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >
      </Card>
    </Accordion>
  );
}

export default ProductImages;