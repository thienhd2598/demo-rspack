/*
 * Created by duydatpham@gmail.com on 10/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { useFormikContext } from 'formik'
import React, { memo, useRef } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { useToasts } from 'react-toast-notifications'
import ImageUpload from '../../../../components/ImageUpload'
import { randomString, validateImageFile } from '../../../../utils'
import { CardBody } from '../../../../_metronic/_partials/controls'
import { useProductsUIContext } from '../ProductsUIContext'
export default memo(({ attribute, validateFile, onOpenCrop, setNameFileError }) => {
    const { productAttributeFiles, setProductAttributeFiles } = useProductsUIContext();
    const { addToast } = useToasts();
    const { setFieldValue } = useFormikContext()
    const { formatMessage } = useIntl()
    return (
        <CardBody className='mb-0 pb-0'>
            <div className="form-group mb-4">
                <h6 className='mb-0' >{formatMessage({defaultMessage:'Hình ảnh theo phân loại'})} {attribute.name}</h6>
            </div>
            {
                (attribute.values || []).map(_value => {
                    let filesCode = (productAttributeFiles[_value.code] || {
                        files: [], attribute_value: _value.v, attribute_id: attribute.id,
                        attribute_name: attribute.display_name, isCustom: false
                    })
                    return [
                        <h6 key={`attribute--${attribute.id}-${_value.code}`} className='mb-0 text-primary  font-weight-bold' style={{ textTransform: 'uppercase' }} >{_value.v}</h6>,
                        <div key={`attribute-2--${attribute.id}-${_value.code}`} className='form-group w-100 d-flex flex-wrap' >
                            {
                                filesCode.files.map((_file, index) => {
                                    return <ImageUpload data={_file} key={`file-att${index}-${_value.code}-pro-${_file.id}`} accept={".png, .jpg, .jpeg"} allowRemove
                                        onRemove={() => {
                                            setFieldValue('__changed__', true)
                                            setProductAttributeFiles(prev => {
                                                let _current = prev[_value.code] || {}
                                                let files = [...(_current.files || [])]
                                                files.splice(index, 1)
                                                return {
                                                    ...prev,
                                                    [_value.code]: {
                                                        ..._current,
                                                        files
                                                    }
                                                }
                                            })
                                        }}
                                        onUploadSuccess={(dataAsset, id) => {
                                            setFieldValue('__changed__', true)

                                            setProductAttributeFiles(prev => {
                                                let _current = prev[_value.code] || {}
                                                let files = (_current.files || []).map(_ff => {
                                                    if (_ff.id == id) {
                                                        return dataAsset
                                                    }
                                                    return _ff
                                                })
                                                return {
                                                    ...prev,
                                                    [_value.code]: {
                                                        ..._current,
                                                        files
                                                    }
                                                }
                                            })
                                        }}
                                        validateFile={({ width, height, size }) => {
                                            let hasError = validateImageFile({ width, height, size })

                                            setProductAttributeFiles(prev => {
                                                let _current = prev[_value.code] || {}
                                                let files = (_current.files || []).map((_ff, _index) => {
                                                    if (index == _index) {
                                                        return {
                                                            ..._ff,
                                                            hasError: !!hasError
                                                        }
                                                    }
                                                    return _ff
                                                })
                                                return {
                                                    ...prev,
                                                    [_value.code]: {
                                                        ..._current,
                                                        files
                                                    }
                                                }
                                            })

                                            return hasError;
                                        }}
                                        onOpenCrop={onOpenCrop}
                                    />
                                })
                            }
                            {
                                filesCode.files.length < 8 && <ImageUpload
                                    accept={".png, .jpg, .jpeg"}
                                    multiple={true}
                                    onChooseFile={files => {
                                        let errors = files.filter(_file => _file.size > 2 * 1024 * 1024).map(_file => _file.name)
                                        let errorDuplicate = [];
                                        let filesAccept = files.filter(_file => _file.size <= 2 * 1024 * 1024)
                                        if (errors.length > 0) {
                                            setNameFileError(errors.join(', '))
                                        }
                                        setProductAttributeFiles(prev => {
                                            let _current = prev[_value.code] || {}
                                            let files = (_current.files || []).concat(filesAccept.filter(_file => {
                                                if ((_current.files || []).some(___file => !!___file.refFile && ___file.refFile.name == _file.name && ___file.refFile.size == _file.size)) {
                                                    errorDuplicate.push(_file.name)
                                                    return false
                                                }
                                                return true
                                            }).map(_file => ({
                                                id: randomString(12),
                                                file: _file,
                                                refFile: _file,
                                            }))).slice(0, 8)
                                            return {
                                                ...prev,
                                                [_value.code]: {
                                                    ..._current,
                                                    files
                                                }
                                            }
                                        })
                                        if (errorDuplicate.length > 0) {
                                            addToast(formatMessage({defaultMessage:'Vui lòng không chọn hình ảnh trùng nhau'}), { appearance: 'error' });
                                        }
                                    }}
                                    onOpenCrop={onOpenCrop}
                                />
                            }
                        </div>
                    ]
                })
            }

        </CardBody>
    )
})