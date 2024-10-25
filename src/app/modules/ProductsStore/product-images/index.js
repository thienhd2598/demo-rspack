/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
  Checkbox,
  InputVertical,
} from "../../../../_metronic/_partials/controls";
import { FormattedMessage, useIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../ProductsUIContext";
import ImageUpload from "../../../../components/ImageUpload";
import { getVideoDuration, loadSizeImage, randomString, validateImageFile, validateImageOrigin, validateImageSizeChart } from "../../../../utils";
import UploadImageAttribute from "./UploadImageAttribute";
import VideoUpload from "../../../../components/VideoUpload";
import ProductImageEditDialog from "../product-image-edit-dialog";
import { Field, useFormikContext } from "formik";
import { useToasts } from "react-toast-notifications";
import ImageView from "../../../../components/ImageView";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { Divider } from "@material-ui/core";
import PopupFramePhoto from "./PopupFramePhoto";
import { Modal, OverlayTrigger, Tooltip, Accordion, useAccordionToggle } from 'react-bootstrap';
import _ from "lodash";
import axios from "axios";
import { getImageOriginSanValidate } from "../../../../constants";
import dayjs from "dayjs";
import VideoLazadaUpload from "../../../../components/VideoLazadaUpload";
import { useSelector } from "react-redux";
import client from "../../../../apollo";
import query_sme_catalog_photo_frames_by_pk from "../../../../graphql/query_sme_catalog_photo_frames_by_pk";


const SortableItem = SortableElement(({ value, setDataCrop, idx, _disabled, isFormattingImage }) => {
  const { setFieldValue } = useFormikContext()
  const { setProductFiles, currentChannel, productSizeChart } = useProductsUIContext();
  const imgValidateConfig = getImageOriginSanValidate(currentChannel?.connector_channel_code);


  return (
    <div className="itemsort" style={{ position: 'relative' }} >
      <ImageUpload data={value} accept={".png, .jpg, .jpeg"} allowRemove
        allowDowload
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
        onMergeFrameSuccess={(url, id) => {
          setFieldValue('__changed__', true)
          setProductFiles(prev => prev.map(_ff => {
            if (_ff.id == id) {
              return {
                ..._ff,
                merged_image_url: url
              }
            }
            return _ff
          }))
        }}
        validateFile={({ width, height, size }) => {
          let hasError = validateImageFile({ width, height, size, channel: currentChannel?.connector_channel_code, config: imgValidateConfig })
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
          setDataCrop({ url, onCrop, maxWidth: imgValidateConfig.maxWidth, maxHeight: imgValidateConfig.maxHeight })
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

const SortableList = SortableContainer(({ items, setDataCrop, setImageInvalid, imageOriginFrame,
  imageOriginFrameError, disabled, isFormattingImage }) => {
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const { setProductFiles, currentChannel } = useProductsUIContext();
  const imgValidateConfig = getImageOriginSanValidate(currentChannel?.connector_channel_code);
  return (
    <div className='form-group w-100 d-flex flex-wrap' >
      {
        !!imageOriginFrame && <div className="image-input m-4 overlay" id="kt_image_4" style={{
          width: 122, height: 122,
          // backgroundColor: '#F7F7FA',
          border: !!imageOriginFrameError ? '1px solid #f14336' : '1px dashed #D9D9D9'

        }}
        ><div className="image-input-wrapper" style={{
          backgroundImage: `url("${imageOriginFrame}")`,
        }}>
          </div>
        </div>
      }
      {
        items.map((_file, index) => {
          return <SortableItem key={`item-${index}`} index={index} idx={index} value={_file} setDataCrop={setDataCrop} disabled={disabled} _disabled={disabled}
            isFormattingImage={isFormattingImage}
          />
        })
      }
      {
        items.length < 8 && !disabled && <ImageUpload
          accept={".png, .jpg, .jpeg"}
          multiple={true}
          onChooseFile={async files => {
            let errorDuplicate = [];
            let filesAccept = files.filter(_file => _file.size <= imgValidateConfig.maxSize * 1024 * 1024)
            let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
            setImageInvalid(files.map((_file, _index) => {
              let mess = [
              ]
              if (_file.size > imgValidateConfig.maxSize * 1024 * 1024) {
                mess.push(formatMessage({ defaultMessage: `Không thể được tải lên. Kích thước tập tin vượt quá {max} MB.` }, { max: imgValidateConfig.maxSize }))
              }
              if (!!validateImageFile({ ...resFetchSize[_index], size: 0, config: imgValidateConfig, channel: currentChannel?.connector_channel_code })) {
                mess.push(formatMessage({ defaultMessage: ` Vui lòng chọn ảnh kích thước tối thiểu {min}, tối đa {max}` }, { min: `${imgValidateConfig.minWidth}x${imgValidateConfig.minHeight}`, max: `${imgValidateConfig.maxWidth}x${imgValidateConfig.maxWidth}` }))
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
              addToast(formatMessage({ defaultMessage: 'Vui lòng không chọn hình ảnh trùng nhau' }), { appearance: 'error' });
            }
          }}
          onOpenCrop={(url, onCrop) => {
            setDataCrop({ url, onCrop, maxWidth: imgValidateConfig.maxWidth, maxHeight: imgValidateConfig.maxHeight })
          }}
        />
      }
    </div>
  );
});

function CustomToggle({ children, eventKey }) {
  const { formatMessage } = useIntl();
  const { openBlockImage, setOpenBlockImage, btnRefCollapseImage } = useProductsUIContext();
  const decoratedOnClick = useAccordionToggle(eventKey, () => {
    setOpenBlockImage(!openBlockImage)
  });

  return (
    <CardHeader title={formatMessage({ defaultMessage: 'HÌNH ẢNH/VIDEO' })} className="cursor-pointer" ref={btnRefCollapseImage} onClick={decoratedOnClick}>
      <div className="d-flex justify-content-between align-items-center" >
        {children}
        <span>
          <i className={`${(openBlockImage ? 'fas fa-angle-up ml-2' : 'fas fa-angle-down')} cursor-pointer`} style={{ fontSize: 30 }} />
        </span>
      </div>
    </CardHeader>
  );
}

function ProductImages(props) {
  const { formatMessage } = useIntl();
  const { productFiles, setProductFiles, currentChannel,
    productVideFiles, setProductVideFiles, setProductSizeChart,
    productSizeChart, categorySelected, currentFrameProduct,
    productImageOrigin, setProductImageOrigin, setCurrentFrameProduct
  } = useProductsUIContext();
  const user = useSelector((state) => state.auth.user);
  const { addToast } = useToasts();
  const [dataCrop, setDataCrop] = useState()
  const [showFrameImage, setShowFrameImage] = useState(false);
  const { setFieldValue, values } = useFormikContext()
  const [imageInvalid, setImageInvalid] = useState([]);
  const [formattingImage, setformattingImage] = useState(false);
  const [isFormattingImage, setIsformattingImage] = useState(false);
  const [errorVideo, setErrorVideo] = useState('');
  const _onSortEnd = useCallback(({ oldIndex, newIndex }) => {
    setProductFiles(prev => arrayMoveImmutable(prev, oldIndex, newIndex))
  });

  const refFrameImg = useRef();

  useEffect(() => {
    const checkIfClickedOutside = (e) => {
      if (showFrameImage && refFrameImg.current && !refFrameImg.current.contains(e.target)) {
        setShowFrameImage(false);
      }
    };

    document.addEventListener("mousedown", checkIfClickedOutside)

    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside)
    }
  }, [showFrameImage]);

  const _applyFrame = useCallback((frameUrl, isCover, isApplyBgUrl, currentFrame) => {          
    setCurrentFrameProduct(currentFrame);
    if (isCover == 2) {
      if (productImageOrigin) {
        setProductFiles(prev => {
          return prev.map((_item, _index) => {
            return {
              ..._item,
              isMergeOption: 0,
              template_image_url: null,
              merged_image_url: null
            }
          })
        })
        setProductImageOrigin(prev => {
          return {
            ...prev,
            isMergeOption: isApplyBgUrl || 0,
            template_image_url: frameUrl
            // ...(isApplyBgUrl == 1 ? {
            //   isMergeOption: 0,
            //   source_draft: prev?.source,
            //   template_image_url: frameUrl
            // } : {
            //   isMergeOption: 1,
            //   source_draft: frameUrl,
            //   template_image_url: prev?.source,
            // }),
          }
        })
      } else {
        addToast(formatMessage({ defaultMessage: 'Vui lòng nhập ảnh gốc trước khi áp dụng khung' }), { appearance: 'error' });
      }
    } else {
      setProductImageOrigin(prev => {
        return {
          ...prev,
          isMergeOption: 0,
          template_image_url: null,
          merged_image_url: null
        }
      })
      setProductFiles(prev => {
        return prev.map((_item, _index) => {
          if (
            (_index == 0 && isCover == 1)
            || isCover == 0
          ) {
            return {
              ..._item,
              isMergeOption: isApplyBgUrl || 0,
              template_image_url: frameUrl
              // ...(isApplyBgUrl == 1 ? {
              //   isMergeOption: 0,
              //   source_draft: _item?.source,
              //   template_image_url: frameUrl
              // } : {
              //   isMergeOption: 1,
              //   source_draft: frameUrl,
              //   template_image_url: _item?.source,
              // }),
            }
          } else {
            return {
              ..._item,
              isMergeOption: 0,
              template_image_url: null,
              merged_image_url: null
            }
          }
        })
      })
    }
    setShowFrameImage(false);
  }, [productImageOrigin])

  const imgOriginValidateConfig = getImageOriginSanValidate(currentChannel?.connector_channel_code);

  const hasFrameApplyed = useMemo(() => {
    return productFiles.some(_fff => !!_fff.template_image_url) || !!productImageOrigin?.template_image_url
  }, [productFiles, productImageOrigin]);

  return (
    <Accordion>
      <Card style={{ overflow: 'unset' }}>
        <CustomToggle eventKey="0" />
        <Accordion.Collapse eventKey="0">
          <>
            <CardBody className='mb-0  pb-0 d-flex' >
              <div className="w-100" >
                <div className="form-group mb-1">
                  <div style={{
                    width: '100%', display: 'flex', position: 'relative',
                  }}>
                    <h6 className='mb-0'>{formatMessage({ defaultMessage: 'Hình ảnh' })}*</h6>
                    {
                      formattingImage ? <div style={{ flex: 1, textAlign: 'end', marginBottom: 8 }}>
                        <span>{formatMessage({ defaultMessage: 'Số ảnh đã chọn' })}: {_.sumBy(productFiles, o => o.isSelected ? 1 : 0)}</span>&ensp;
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
                          {formatMessage({ defaultMessage: 'Chuẩn hoá' })}
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
                              {formatMessage({ defaultMessage: 'Huỷ chuẩn hoá' })}
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
                          {formatMessage({ defaultMessage: 'Chuẩn hoá ảnh' })}
                        </a>
                        &ensp;|&ensp;
                        <a
                          className="text-primary"
                          onClick={e => {
                            e.preventDefault();

                            setShowFrameImage(true)
                          }}
                        >
                          {formatMessage({ defaultMessage: 'Thêm khung ảnh' })}
                        </a>
                        {
                          hasFrameApplyed && <>
                            &ensp;|&ensp;
                            <a
                              className="text-primary"
                              onClick={e => {
                                e.preventDefault();
                                setCurrentFrameProduct(null);
                                setProductFiles(prev => {
                                  return prev.map((_item, _index) => {
                                    return {
                                      ..._item,
                                      template_image_url: null,
                                      merged_image_url: null
                                    }
                                  })
                                })
                                setProductImageOrigin(prev => {
                                  return {
                                    ...prev,
                                    template_image_url: null,
                                    merged_image_url: null
                                  }
                                })
                              }}
                            >
                              {formatMessage({ defaultMessage: 'Xóa khung ảnh' })}
                            </a>
                          </>
                        }
                      </div>
                    }
                    {showFrameImage && <div
                      ref={refFrameImg}
                      className="frame-img-wrapper"
                      style={{ display: showFrameImage ? 'block' : 'none', zIndex: 99 }}
                    >
                      <PopupFramePhoto
                        onApply={_applyFrame}
                        onCloseFrameImg={() => setShowFrameImage(false)}
                        productImageOrigin={productImageOrigin}
                        showFrameImage={showFrameImage}
                      />
                    </div>}
                    {/* <Divider orientation='vertical' className="mr-4 ml-4" style={{ height: 20 }} /> */}
                  </div>
                  <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }} >
                    {currentChannel?.connector_channel_code == 'shopee' && <FormattedMessage defaultMessage="* Đinh dạng hỗ trợ: JPG JPEG, PNG. Dung lượng tối đa: 10Mb. Số lượng tối đa: 8 hình ảnh." />}
                    {currentChannel?.connector_channel_code == 'tiktok' && <FormattedMessage defaultMessage="* Đinh dạng hỗ trợ: JPG JPEG, PNG. Kích thước: Tối thiểu 500x500, tối đa 5000x5000, nền trắng. Dung lượng tối đa: 5Mb. Số lượng tối đa: 8 hình ảnh." />}
                    {currentChannel?.connector_channel_code == 'lazada' && <FormattedMessage defaultMessage="* Đinh dạng hỗ trợ: JPG JPEG, PNG. Kích thước: Tối thiểu 500x500, tối đa 5000x5000, nền trắng. Dung lượng tối đa: 3Mb. Số lượng tối đa: 8 hình ảnh." />}
                    </em></span>
                </div>
                <SortableList axis="x" lockAxis="x" helperClass="itemsort" items={productFiles} setImageInvalid={setImageInvalid} setDataCrop={setDataCrop} onSortEnd={_onSortEnd} imageOriginFrame={!!productImageOrigin?.template_image_url ? productImageOrigin?.merged_image_url : null} imageOriginFrameError={productImageOrigin?.hasError}
                  disabled={formattingImage}
                  isFormattingImage={isFormattingImage}
                />
              </div>
            </CardBody>

            <div className="row">
              <div className='col-6 mb-0' >
                <CardBody className='mb-0  pb-0' >
                  <div className="form-group mb-1">
                    <h6 className='mb-0'>{formatMessage({ defaultMessage: 'Ảnh sản phẩm gốc' })}<OverlayTrigger
                      overlay={
                        <Tooltip>
                          {formatMessage({ defaultMessage: 'Ảnh sản phẩm gốc là ảnh sản phẩm với nền transparent. Ảnh sản phẩm gốc được dùng để ghép với các khung ảnh mẫu làm ảnh cover chạy chiến dịch.' })}
                        </Tooltip>
                      }
                    >

                      <i className="far fa-question-circle ml-2"></i>
                    </OverlayTrigger></h6>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className='form-group d-flex flex-wrap' >
                      <ImageUpload
                        accept={".png, .jpg, .jpeg"}
                        data={productImageOrigin}
                        multiple={false}
                        allowDowload
                        allowRemove
                        isSingle
                        currentFrame={currentFrameProduct}
                        allowEdit={!!productImageOrigin?.template_image_url ? false : true}
                        allowDelete={!!productImageOrigin?.template_image_url ? false : true}
                        onRemove={() => {
                          setFieldValue('__changed__', true)
                          setProductImageOrigin(null)
                        }}
                        onUploadSuccess={(dataAsset, id) => {
                          setFieldValue('__changed__', true)
                          setProductImageOrigin(dataAsset)
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
                        validateFile={({ width, height, size }) => {
                          let hasError = validateImageOrigin({ width, height, size, channel: currentChannel?.connector_channel_code, config: imgOriginValidateConfig })
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
                            if (_file.size > imgOriginValidateConfig.maxSize * 1024 * 1024) {
                              mess.push(`Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa ${imgOriginValidateConfig.maxSize}MB.`)
                              __error = true;
                            }
                            let hasError = validateImageOrigin({ ...resFetchSize[_index], size: 0, config: imgOriginValidateConfig, channel: currentChannel?.connector_channel_code })
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

                        onMergeFrameSuccess={(url, id) => {
                          setProductImageOrigin(prev => {
                            return {
                              ...prev,
                              merged_image_url: url
                            }
                          })
                        }}
                        onOpenCrop={(url, onCrop) => {
                          setDataCrop({ url, onCrop, maxWidth: imgOriginValidateConfig.maxWidth, maxHeight: imgOriginValidateConfig.maxHeight })
                        }}
                      />
                    </div>
                    <ul className="text-info" style={{ fontStyle: 'italic', fontSize: 10, paddingLeft: 6 }}>
                      <li>{formatMessage({ defaultMessage: 'Định dạng hỗ trợ: JPG JPEG, PNG.' })}</li>
                      <li>{formatMessage({ defaultMessage: 'Kích thước: Tối thiểu 500x500.' })}</li>
                      <li>{formatMessage({ defaultMessage: 'Dung lượng tối đa: {max}Mb.' }, { max: imgOriginValidateConfig.maxSize })}</li>
                      <li>{formatMessage({ defaultMessage: 'Ảnh sản phẩm nền trắng dùng để sử dụng áp với khung ảnh làm ảnh cover chạy chiến dịch.' })}</li>
                    </ul>
                  </div>
                </CardBody>
              </div>

              <div className='col-6 mb-0' >
                {currentChannel?.connector_channel_code == 'lazada' ? (
                  <VideoLazadaUpload
                    type={values.type_video}
                    isEdit={values.isEdit}
                    productVideFiles={productVideFiles}
                    setErrorVideo={setErrorVideo}
                    onUpdateType={(value) => setFieldValue('type_video', value)}
                    onChooseFile={async files => {
                      setProductVideFiles(prev => prev.concat(files.map(_file => ({
                        id: randomString(12),
                        file: _file
                      }))).slice(0, 8))
                    }}
                    setProductVideFiles={setProductVideFiles}
                  />
                ) : (
                  <CardBody className='mb-0 '>
                    <div className="form-group mb-1">
                      <h6 className='mb-0'>{formatMessage({ defaultMessage: 'Video' })}</h6>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className='form-group d-flex flex-wrap'>
                        {
                          productVideFiles.map((_file, index) => {
                            return <VideoUpload setErrorVideo={setErrorVideo} data={_file} key={`file-pro-${_file.id}`} accept={".mp4"} allowRemove
                              onRemove={() => {
                                setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
                              }}
                              channel={currentChannel?.connector_channel_code}
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
                            channel={currentChannel?.connector_channel_code}
                          />
                        }
                      </div>
                      <ul className="text-info" style={{ fontStyle: 'italic', fontSize: 10, paddingLeft: 6 }}>
                        {currentChannel?.connector_channel_code == 'tiktok' ? <>
                          <li>{formatMessage({ defaultMessage: "Định dạng MP4" })}</li>
                          <li>{formatMessage({ defaultMessage: "Tối đa 20Mb" })}</li>
                          <li>{formatMessage({ defaultMessage: "Tỷ lệ khung hình của video phải từ 9:16 đến 16:9" })}</li>
                          {/* <li>{formatMessage({ defaultMessage: "Độ dài max 60s." })}</li> */}
                        </> : <>
                          <li>{formatMessage({ defaultMessage: "Định dạng hỗ trợ: MP4" })}</li>
                          {/* <li>{formatMessage({ defaultMessage: "Độ phân giải không vượt quá 1280x1280px." })}</li>
                          <li>{formatMessage({ defaultMessage: "Độ dài 10 - 60s." })}</li> */}
                          <li>{formatMessage({ defaultMessage: "Tối đa 30MB." })}</li>
                        </>}
                      </ul>
                    </div>
                  </CardBody>
                )}
              </div>
            </div>


            {
              //ẩn với sàn shopee theo issue https://upbasevn.atlassian.net/browse/UPBASE-3169
              currentChannel?.connector_channel_code != 'lazada' && currentChannel?.connector_channel_code != 'shopee' && (!!categorySelected?.support_size_chart || (currentChannel?.connector_channel_code === 'tiktok' && categorySelected?.size_chart_required))
                ? <CardBody className='mb-0  pb-0' >
                  <div className="form-group mb-1">
                    <h6 className='mb-0'>
                      {formatMessage({ defaultMessage: 'Bảng quy đổi kích cỡ' })}
                      {currentChannel?.connector_channel_code === 'tiktok' && !!categorySelected?.size_chart_required && (
                        <span className="ml-1" style={{ color: 'red', fontSize: 14 }}>*</span>
                      )}
                    </h6>
                  </div>
                  <div className='form-group w-100 d-flex flex-wrap' >
                    <ImageUpload
                      accept={".png, .jpg, .jpeg"}
                      data={productSizeChart}
                      multiple={false}
                      allowDowload
                      allowRemove
                      isSingle
                      isValidate={!!categorySelected?.size_chart_required && !productSizeChart}
                      onRemove={() => {
                        setFieldValue('__changed__', true)
                        setFieldValue('size-chart-required', false)
                        setProductSizeChart(null)
                      }}
                      onUploadSuccess={(dataAsset, id) => {
                        setFieldValue('__changed__', true)
                        setFieldValue('size-chart-required', false)
                        setProductSizeChart(dataAsset)
                      }}
                      onUploading={(isUploading) => {
                        setFieldValue('size-chart-required', false)
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
                        let hasError = validateImageSizeChart({ width, height, size, channel: currentChannel?.connector_channel_code })
                        setProductSizeChart(prev => {
                          return {
                            ...prev,
                            hasError: !!hasError
                          }
                        })
                        return hasError;
                      }}
                      onChooseFile={async files => {
                        setFieldValue('size-chart-required', false)
                        let __error = false;
                        let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                        setImageInvalid(files.map((_file, _index) => {
                          let mess = [
                          ]
                          if (_file.size > imgOriginValidateConfig.maxSize * 1024 * 1024) {
                            mess.push(formatMessage({ defaultMessage: `Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa {max}MB.` }, { max: imgOriginValidateConfig.maxSize }))
                            __error = true;
                          }
                          let hasError = validateImageSizeChart({ ...resFetchSize[_index], size: 0, channel: currentChannel?.connector_channel_code })
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
                        // if (!__error) {
                        setProductSizeChart({
                          id: randomString(12),
                          file: files[0],
                          refFile: files[0],
                        })
                        // }
                      }}

                      onOpenCrop={(url, onCrop) => {
                        setDataCrop({ url, onCrop, maxWidth: imgOriginValidateConfig.maxWidth, maxHeight: imgOriginValidateConfig.maxHeight })
                      }}
                    />
                  </div>
                </CardBody> : null
            }
          </>
        </Accordion.Collapse>
        <ProductImageEditDialog
          show={!!dataCrop}
          dataCrop={dataCrop}
          onHide={() => {
            setDataCrop(null)
          }}
        />
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
              {formatMessage({ defaultMessage: 'Đóng' })}
            </button>
          </Modal.Body>
        </Modal>

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
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận'})}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >
      </Card >
    </Accordion>
  );
}

export default ProductImages;