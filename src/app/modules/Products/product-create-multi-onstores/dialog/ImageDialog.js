/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid,jsx-a11y/role-supports-aria-props */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CardHeaderToolbar,
  InputVertical,
} from "../../../../../_metronic/_partials/controls";
import { FormattedMessage, injectIntl } from "react-intl";
import { Link } from "react-router-dom";
import { useProductsUIContext } from "../../../ProductsStore/ProductsUIContext";
import ImageUpload from "../../../../../components/ImageUpload";
import { getVideoDuration, loadSizeImage, randomString, validateImageFile, validateImageOrigin, validateImageSizeChart } from "../../../../../utils";
import VideoUpload from "../../../../../components/VideoUpload";
import ProductImageEditDialog from "../../product-image-edit-dialog";
import { Field, Form, Formik, useFormikContext } from "formik";
import { useToasts } from "react-toast-notifications";
import ImageView from "../../../../../components/ImageView";
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { useCreateMultiContext } from "../CreateMultiContext";
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from "react-intl";
import _ from "lodash";
import axios from "axios";
import * as Yup from "yup";
import { getImageOriginSanValidate } from "../../../../../constants";
import VideoLazadaUpload from "../../../../../components/VideoLazadaUpload";
import { useSelector } from "react-redux";

const SortableItem = SortableElement(({ value, setDataCrop, idx, indexProduct, setProductFiles, channel, isFormattingImage, _disabled }) => {
  const { setFieldValue } = useFormikContext()  

  return (
    <div className="itemsort" style={{ position: 'relative' }}>
      <ImageUpload data={value} accept={".png, .jpg, .jpeg"} allowRemove
        onRemove={() => {
          setFieldValue('__changed__', true)
          setProductFiles(prev => {
            let productFiles = [...prev]
            productFiles.splice(idx, 1)
            return productFiles
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
          let hasError = validateImageFile({ width, height, size, channel })
          setProductFiles(prev => prev.map((_ff, _idxx) => {
            if (_idxx == idx) {
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
          setDataCrop({ url, onCrop })
        }}
        disabled={_disabled}
      />
      {_disabled && !value.isFormatting && !isFormattingImage && <div className='image-input' style={{
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
        /></div>}
      {_disabled && value.isFormatting && <div className='image-input' style={{
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

const SortableList = SortableContainer(({ items, setDataCrop, setImageInvalid, indexProduct, setProductFiles, channel, imgValidateConfig, isFormattingImage, disabled }) => {
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()  

  return (
    <div className='form-group w-100 d-flex flex-wrap' >
      {
        items.map((_file, _index) => {
          return <SortableItem key={`item-${_index}`} index={_index} idx={_index} value={_file} setDataCrop={setDataCrop} _disabled={disabled}
            indexProduct={indexProduct} setProductFiles={setProductFiles} channel={channel} isFormattingImage={isFormattingImage} />
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
                mess.push(`${formatMessage({ defaultMessage: 'Không thể được tải lên. Kích thước tập tin vượt quá' })} ${imgValidateConfig.maxSize} MB.`)
              }
              if (!!validateImageFile({ ...resFetchSize[_index], size: 0, config: imgValidateConfig, channel })) {
                mess.push(` ${formatMessage({ defaultMessage: 'Vui lòng chọn ảnh kích thước tối thiểu' })} ${imgValidateConfig.minWidth}x${imgValidateConfig.minHeight}, ${formatMessage({ defaultMessage: 'tối đa' })} ${imgValidateConfig.maxWidth}x${imgValidateConfig.maxWidth}`)
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

function ProductImages({ index, onHide, setFieldValue }) {
  const user = useSelector((state) => state.auth.user);
  const { products, setProducts } = useCreateMultiContext();
  const { values: valuesForm } = useFormikContext();
  const [dataCrop, setDataCrop] = useState()
  const [errorMessage, setErrorMessage] = useState()
  const [productFiles, setProductFiles] = useState([])
  const [productVideFiles, setProductVideFiles] = useState([])
  const [formattingImage, setformattingImage] = useState(false);
  const [isFormattingImage, setIsformattingImage] = useState(false);
  const [imageInvalid, setImageInvalid] = useState([])
  const [productSizeChart, setProductSizeChart] = useState()
  const [productImageOrigin, setProductImageOrigin] = useState()
  const _onSortEnd = useCallback(({ oldIndex, newIndex }) => {
    setProductFiles(prev => arrayMoveImmutable(prev, oldIndex, newIndex))
  });
  const { addToast } = useToasts();
  const { formatMessage } = useIntl()
  useEffect(() => {
    if (index >= 0 && index < products.length) {
      setProductFiles(products[index].productFiles)
      setProductVideFiles(products[index].productVideFiles)
      setProductSizeChart(products[index].productSizeChart)
      setProductImageOrigin(products[index].productImageOrigin)
    }
  }, [index, products])

  const [category, channel, imgValidateConfig] = useMemo(() => {
    if (!products[index] || !products[index].category || products[index].category.length == 0) {
      return [null, null, getImageOriginSanValidate('lazada')]
    }
    return [products[index].category[products[index].category.length - 1], products[index].channel, getImageOriginSanValidate(products[index].channel.connector_channel_code)]
  }, [products, index])

  return (
    <Card style={{ boxShadow: 'none' }}>
      <CardHeader title={formatMessage({ defaultMessage: 'HÌNH ẢNH/VIDEO' })}>
      </CardHeader>
      <CardBody className='mb-0  pb-0' >
        <div className="form-group mb-1">
          <h6 className='mb-0'>{formatMessage({ defaultMessage: 'Hình ảnh' })}<span className="text-primary pl-1">*</span></h6>
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
            </div>
          }
        </div>
        <SortableList axis="x" lockAxis="x" helperClass="itemsort"
          items={productFiles} setImageInvalid={setImageInvalid}
          setDataCrop={setDataCrop} onSortEnd={_onSortEnd}
          indexProduct={index}
          channel={channel}
          disabled={formattingImage}
          setProductFiles={setProductFiles}
          isFormattingImage={isFormattingImage}
          imgValidateConfig={imgValidateConfig}
        />
      </CardBody>

      <CardBody className='mb-0  pb-0' >
        <div className="form-group mb-1">
          <h6 className='mb-0'>{formatMessage({ defaultMessage: 'ẢNH SẢN PHẨM GỐC' })}<OverlayTrigger
            overlay={
              <Tooltip>
                {formatMessage({ defaultMessage: 'Ảnh sản phẩm gốc là ảnh sản phẩm trên nền trắng. Tỉ lệ ảnh 1:1. Ảnh sản phẩm gốc được dùng để ghép với các khung ảnh mẫu làm ảnh cover chạy chiến dịch' })}.
              </Tooltip>
            }
          >

            <i className="far fa-question-circle ml-2"></i>
          </OverlayTrigger></h6>
          <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }} >* {formatMessage({ defaultMessage: 'Định dạng hỗ trợ: JPG JPEG, PNG. Kích thước: Tối thiểu 500x500. Dung lượng tối đa: 2Mb. Ảnh sản phẩm nền trắng dùng để sử dụng áp với khung ảnh làm ảnh cover chạy chiến dịch' })}.</em></span>
        </div>
        <div className='form-group w-100 d-flex flex-wrap' >
          <ImageUpload
            accept={".png, .jpg, .jpeg"}
            data={productImageOrigin}
            multiple={false}
            allowRemove
            isSingle
            onRemove={() => {
              setProductImageOrigin(null)
            }}
            onUploadSuccess={(dataAsset, id) => {
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
              let hasError = validateImageOrigin({ width, height, size, channel: channel?.connector_channel_code })
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
                if (_file.size > imgValidateConfig.maxSize * 1024 * 1024) {
                  mess.push(`${formatMessage({ defaultMessage: 'Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa' })} ${imgValidateConfig.maxSize} MB.`)
                }
                let hasError = validateImageOrigin({ ...resFetchSize[_index], size: 0, channel: channel?.connector_channel_code })
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
              setDataCrop({ url, onCrop, maxSize: 1024 })
            }}
          />
        </div>
      </CardBody>
      {
        index >= 0 && <Formik
          initialValues={{
            video_url: products[index].form.video_url
          }}
          validationSchema={Yup.object().shape({
            video_url: Yup.string()
              .notRequired()
              .test(
                'youtube-format',
                formatMessage({ defaultMessage: 'Đường dẫn không hợp lệ. Vui lòng chỉ sử dụng link Youtube.' }),
                (value, context) => {
                  if ((value || '').length == 0) {
                    return true
                  }
                  if (!!value) {
                    return (value || '').toLowerCase().trim().startsWith('https://www.youtube.com') || (value || '').toLowerCase().trim().startsWith('https://youtube.com');
                  }
                  return false;
                },
              )
          })}
        >
          {({
            handleSubmit,
            values,
            validateForm,
            ...rest
          }) => {
            return (
              <Form>
                {channel?.connector_channel_code == 'lazada' ? (
                  <VideoLazadaUpload
                    type={valuesForm[`type_video_${index}`]}
                    productVideFiles={productVideFiles}
                    setErrorVideo={mess => {
                      setErrorMessage(mess)
                      setProductVideFiles(prev => prev.map(_ff => {
                        return {
                          ..._ff,
                          hasError: true
                        }
                      }))
                    }}
                    onUpdateType={(value) => setFieldValue(`type_video_${index}`, value)}
                    onChooseFile={async files => {
                      setProductVideFiles(prev => prev.concat(files.map(_file => ({
                        id: randomString(12),
                        file: _file
                      }))).slice(0, 8))
                    }}
                    setProductVideFiles={setProductVideFiles}
                  />
                ) : (
                  <CardBody className='mb-0 ' >
                    <div className="form-group mb-1">
                      <h6 className='mb-0'>Video</h6>
                      <span className='font-size-xs text-info' ><em style={{ color: '#00000073' }} >
                        {
                          channel?.connector_channel_code == 'tiktok'
                            ? <FormattedMessage defaultMessage="* Định dạng hỗ trợ MP4, dung lượng tối đa 20MB. Tỷ lệ khung hình của video phải từ 9:16 đến 16:9. Độ dài không quá 60s." />
                            : <FormattedMessage defaultMessage="* Đinh dạng hỗ trợ: MP4, độ phân giải không vượt quá 1280x1280px. Độ dài 10 - 60s." />
                        }
                      </em></span>
                    </div>
                    <div className='form-group w-100 d-flex flex-wrap' >
                      {
                        productVideFiles.map((_file, index) => {
                          return <VideoUpload
                            channel={channel?.connector_channel_code}
                            isSingle={false}
                            setErrorVideo={mess => {
                              setErrorMessage(mess)
                              setProductVideFiles(prev => prev.map(_ff => {
                                return {
                                  ..._ff,
                                  hasError: true
                                }
                              }))
                            }}
                            data={_file} key={`file-pro-${_file.id}`} accept={".mp4"} allowRemove
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
                            onRemove={() => {
                              setProductVideFiles(prev => prev.filter(_ff => _ff.id != _file.id))
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
                        productVideFiles.length < 1 && <VideoUpload setErrorVideo={setErrorMessage} accept={".mp4"}
                          onChooseFile={async files => {
                            // console.log('files', await getVideoDuration(files[0]))
                            setProductVideFiles(prev => prev.concat(files.map(_file => ({
                              id: randomString(12),
                              file: _file
                            }))).slice(0, 8))
                          }}
                          channel={channel?.connector_channel_code}
                        />
                      }
                    </div>
                  </CardBody>
                )}
                {
                  channel?.connector_channel_code != 'lazada' && channel?.connector_channel_code != 'shopee'
                    && (!!category?.support_size_chart || (channel?.connector_channel_code == 'tiktok' && category?.size_chart_required))
                    ? <CardBody className='mb-0  pb-0' >
                      <div className="form-group mb-1">
                        <h6 className='mb-0'>
                          {formatMessage({ defaultMessage: 'Bảng quy đổi kích cỡ' })}
                          {channel?.connector_channel_code == 'tiktok' && category?.size_chart_required && (
                            <span className="ml-1" style={{ color: 'red', fontSize: 14 }}>*</span>
                          )}
                        </h6>
                      </div>
                      <div className='form-group w-100 d-flex flex-wrap' >
                        <ImageUpload
                          accept={".png, .jpg, .jpeg"}
                          data={productSizeChart}
                          isValidate={!!category?.size_chart_required && !productSizeChart}
                          multiple={false}
                          allowRemove
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
                            let hasError = validateImageSizeChart({ width, height, size, channel: channel?.connector_channel_code })
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
                              if (_file.size > imgValidateConfig.maxSize * 1024 * 1024) {
                                mess.push(`${formatMessage({ defaultMessage: 'Dung lượng ảnh chưa đạt yêu cầu. Dung lượng ảnh tối đa' })} ${imgValidateConfig.maxSize} MB.`)
                              }
                              let hasError = validateImageSizeChart({ ...resFetchSize[_index], size: 0, channel: channel?.connector_channel_code })
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
                    </CardBody> : null
                }
                <div className="text-center" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-light btn-elevate mr-3"
                    style={{ width: 150 }}
                    onClick={onHide}
                  >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Huỷ' })}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary ml-3"
                    style={{ width: 150 }}
                    disabled={productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading}
                    onClick={async e => {
                      e.preventDefault();

                      if (productFiles.length == 0) {
                        setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh sản phẩm yêu cầu tối thiểu 1 ảnh' }));
                        return
                      }
                      if (productFiles.some(__ => __.hasError) || productVideFiles.some(__ => __.hasError) || productVideFiles.some(__ => __.isUploadError) || (channel?.connector_channel_code != 'lazada' && !!category?.support_size_chart && productSizeChart?.hasError) || productImageOrigin?.hasError) {
                        setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video tải lên không thỏa mãn. Xin vui lòng tải lại hình ảnh/video.' }));
                        return
                      }
                      if (productFiles.some(__ => !!__.isUploading) || productVideFiles.some(__ => !!__.isUploading) || !!productSizeChart?.isUploading || !!productImageOrigin?.isUploading) {
                        setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh đang tải lên. Xin vui lòng thử lại sau.' }));
                        return
                      }

                      let error = await validateForm(values)

                      if (Object.values(error).length == 0) {
                        setProducts(prev => prev.map((_prod, _index) => {
                          if (_index == index) {
                            return {
                              ..._prod,
                              productFiles: [...productFiles],
                              productSizeChart: !!productSizeChart ? { ...productSizeChart } : null,
                              productImageOrigin: !!productImageOrigin ? { ...productImageOrigin } : null,
                              productVideFiles: [...productVideFiles],
                              form: {
                                ..._prod.form,
                                video_url: values.video_url
                              }
                            }
                          }
                          return _prod
                        }))
                        onHide()
                      } else {
                        setErrorMessage(formatMessage({ defaultMessage: 'Hình ảnh/Video tải lên không thỏa mãn. Xin vui lòng tải lại hình ảnh/video.' }));
                        handleSubmit()
                      }
                    }}
                  >
                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
                  </button>
                </div>
              </Form>
            )
          }}
        </Formik>
      }
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
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
            </button>
          </div>
        </Modal.Body>
      </Modal >

      <Modal
        show={!!errorMessage}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setErrorMessage(null)}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{errorMessage || ''}</div>
          <div className="form-group mb-0">
            <button
              className="btn btn-light btn-elevate"
              style={{ width: 160 }}
              onClick={() => setErrorMessage(null)}
            >
              <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'ĐÓNG' })}</span>
            </button>
          </div>
        </Modal.Body>
      </Modal >

      <ProductImageEditDialog
        show={!!dataCrop}
        dataCrop={dataCrop}
        onHide={() => {
          setDataCrop(null)
        }}
      />
    </Card>
  );
}

export default memo(ProductImages);