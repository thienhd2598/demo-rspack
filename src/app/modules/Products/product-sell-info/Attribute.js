/*
 * Created by duydatpham@gmail.com on 08/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { memo, useCallback, useMemo, useState } from 'react'
import { useProductsUIContext } from '../ProductsUIContext';
import { ATTRIBUTE_VALUE_TYPE } from '../ProductsUIHelpers';
import AttributeNumeric from './items/AttributeNumeric';
import AttributeSingleSelect from './items/AttributeSingleSelect';
import AttributeText from './items/AttributeText';
import AttributeMultiSelect from './items/AttributeMultiSelect';
import AttributeDate from './items/AttributeDate';
import { useFormikContext } from 'formik';
import { Checkbox } from '../../../../_metronic/_partials/controls';
import ImageUpload from '../../../../components/ImageUpload';
import { loadSizeImage, randomString, validateImageFile } from '../../../../utils';
import { useToasts } from 'react-toast-notifications';
import { Modal } from 'react-bootstrap';
import ImageView from '../../../../components/ImageView';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable } from 'array-move';
import { useIntl } from 'react-intl';


const SortableItem = SortableElement(({ value, onOpenCrop, _index, code }) => {
    const { values, setFieldValue } = useFormikContext()
    const { setProductAttributeFiles } = useProductsUIContext();
    return (
        <div className="itemsort">
            <ImageUpload isSmall={true} data={value} key={`file-att-${_index}-${code}-pro-${value.id}`} accept={".png, .jpg, .jpeg"} allowRemove
                allowDowload
                onRemove={() => {
                    setFieldValue('__changed__', true)
                    setProductAttributeFiles(prev => {
                        let _current = prev[code] || {}
                        let files = [...(_current.files || [])]
                        files.splice(_index, 1)
                        return {
                            ...prev,
                            [code]: {
                                ..._current,
                                files
                            }
                        }
                    })
                }}
                onUploadSuccess={(dataAsset, id) => {
                    setFieldValue('__changed__', true)

                    setProductAttributeFiles(prev => {
                        let _current = prev[code] || {}
                        let files = (_current.files || []).map(_ff => {
                            if (_ff.id == id) {
                                return dataAsset
                            }
                            return _ff
                        })
                        return {
                            ...prev,
                            [code]: {
                                ..._current,
                                files
                            }
                        }
                    })
                }}
                validateFile={({ width, height, size }) => {
                    let hasError = validateImageFile({ width, height, size })

                    setProductAttributeFiles(prev => {
                        let _current = prev[code] || {}
                        let files = (_current.files || []).map((_ff, ___index) => {
                            if (_index == ___index) {
                                return {
                                    ..._ff,
                                    hasError: !!hasError
                                }
                            }
                            return _ff
                        })
                        return {
                            ...prev,
                            [code]: {
                                ..._current,
                                files
                            }
                        }
                    })

                    return hasError;
                }}
                onOpenCrop={onOpenCrop}
            />
        </div>
    )
});

const SortableList = SortableContainer(({ items, onOpenCrop, setImageInvalid, code }) => {
    const { addToast } = useToasts();
    const { setProductAttributeFiles } = useProductsUIContext();
    const { formatMessage } = useIntl();
    return (
        <div className='form-group w-100 d-flex flex-wrap' >
            {
                items.map((_file, index) => {
                    return <SortableItem key={`item-${index}`} code={code} index={index} _index={index} value={_file} onOpenCrop={onOpenCrop} />
                })
            }
            {
                items.length < 8 && <div><ImageUpload
                    required={false}
                    accept={".png, .jpg, .jpeg"}
                    isSmall={true}
                    multiple={true}
                    onChooseFile={async files => {
                        let errorDuplicate = [];
                        let filesAccept = files.filter(_file => _file.size <= 3 * 1024 * 1024)
                        let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                        setImageInvalid(files.map((_file, _index) => {
                            let mess = [
                            ]
                            if (_file.size > 3 * 1024 * 1024) {
                                mess.push(formatMessage({ defaultMessage: `Không thể tải ảnh lên. Dung lượng ảnh tối đa 3.0 MB.` }))
                            }
                            if (!!validateImageFile({ ...resFetchSize[_index], size: 0 })) {
                                mess.push(formatMessage({ defaultMessage: 'Kích thước ảnh chưa đạt yêu cầu. Vui lòng chọn ảnh kích thước tối thiểu 500x500, tối đa 5000x5000' }))
                            }
                            if (mess.length > 0)
                                return {
                                    file: _file,
                                    message: mess.join('. ')
                                }
                            return null
                        }).filter(_error => !!_error))
                        setProductAttributeFiles(prev => {
                            let _current = prev[code] || {}
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
                                [code]: {
                                    ..._current,
                                    files
                                }
                            }
                        })
                        if (errorDuplicate.length > 0) {
                            addToast(formatMessage({ defaultMessage: 'Vui lòng không chọn hình ảnh trùng nhau' }), { appearance: 'error' });
                        }
                    }}
                    onOpenCrop={onOpenCrop}
                /></div>
            }
        </div>
    );
});



export default memo(({ attribute, hasProductChannel, title, onEdit, has_asset, onOpenCrop, isCreating, isSyncVietful, syncedVariants }) => {

    const {
        addValueToAttributeSelected,
        setAttributesSelected,
        setCustomAttributes,
        attributesSelected,
        productAttributeFiles,
        setVariantsUnit,
        setProductAttributeFiles,
        setIsUnit
    } = useProductsUIContext();
    const { setFieldTouched, setFieldValue, values: valuesForm } = useFormikContext()
    const [imageInvalid, setImageInvalid] = useState([])
    const { addToast } = useToasts();
    let values = useMemo(() => {
        let _values = attribute.values || [];
        let touched = {};
        _values.forEach(element => {
            touched[`att-${attribute.id}-${element.code}`] = true
        });
        requestAnimationFrame(() => {
            Object.keys(_values).forEach(key => setFieldTouched(key, true, true))
        })
        return _values;
    }, [attribute.values])
    const { formatMessage } = useIntl();
    const [maxValues] = useMemo(() => {
        let attOther = attributesSelected.find(_att => _att.id != attribute.id) || {}
        let _length = (attOther.values || []).length;
        return [Math.min(_length == 0 ? 20 : Math.floor(50 / _length), 20)]
    }, [attributesSelected, attribute])

    const _onSortEnd = useCallback(({ oldIndex, newIndex, code }) => {
        // setProductFiles(prev => arrayMoveImmutable(prev, oldIndex, newIndex))
        setProductAttributeFiles(prev => {
            return {
                ...prev,
                [code]: {
                    ...prev[code],
                    files: arrayMoveImmutable(prev[code].files || [], oldIndex, newIndex)
                }
            }
        })
    })
    return (
        <div className='mb-4' style={{ borderBottom: '1px solid #F0F0F0' }} >
            <div className='d-flex flex-row ' style={{ alignItems: 'center' }} >
                <span>{title}</span>&ensp;&ensp;
                <h6 className='mb-0'>{attribute.display_name}</h6><a href="#"
                    onClick={e => {
                        e.preventDefault()
                        !!onEdit && onEdit(attribute.id, attribute.display_name)
                    }}
                >&ensp;&ensp;<i class="far fa-edit"></i>&ensp;&ensp;</a>
                {
                    (isCreating || !valuesForm[`disable-delete-att-${attribute.id}`]) &&
                    <div className='d-flex justify-content-end' style={{ flex: 1 }}>
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault()
                                setFieldValue('switch-unit', false)
                                setFieldValue('edit-switch-unit', false)
                                setVariantsUnit([])
                                setIsUnit(false)
                                setAttributesSelected(prev => {
                                    return prev.filter(_att => _att.id != attribute.id)
                                })
                                setCustomAttributes(prev => {
                                    return prev.filter(_att => _att.id != attribute.id)
                                })
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Xóa nhóm phân loại' })}
                        </a>
                    </div>
                }
            </div>
            <div className="form-group mt-4" >
                {/* {
                    (isCreating || valuesForm['no-attribute-assets']) && <div className="checkbox-inline mb-4">
                        <label className="checkbox checkbox-outline checkbox-primary mb-0">
                            <input type="checkbox" name="check-upbase"
                                checked={attribute.has_asset || false}
                                onChange={(e) => {
                                    setAttributesSelected(prev => {
                                        return prev.map(_att => {
                                            if (_att.id == attribute.id) {
                                                return {
                                                    ..._att,
                                                    has_asset: !attribute.has_asset
                                                }
                                            }
                                            return {
                                                ..._att,
                                                has_asset: false
                                            }
                                        })
                                    })
                                }}
                            // disabled={disabledAssets}
                            />
                            <span></span>
                            Thêm hình ảnh theo giá trị phân loại
                        </label>
                    </div>
                } */}
                {/* <Checkbox
                    inputProps={{
                        'aria-label': 'checkbox',
                    }}
                    isSelected={true}
                    onChange={(value) => console.log({ value })}
                    title={'Thêm hình ảnh theo giá trị phân loại'}
                /> */}
                {
                    values.map((_value, index) => {
                        let filesCode = (productAttributeFiles[_value.code] || {
                            files: [], attribute_value: _value.v, attribute_id: attribute.id,
                            attribute_name: attribute.display_name, isCustom: false
                        })
                        const isSyncedVar = syncedVariants?.filter(variant => {
                            return variant?.attributes?.map(item => item?.product_attribute_value_ref_index)?.includes(_value?.code)
                        })
                        return (
                            <div key={`-att-value-${index}-${attribute.id}`} className='row' style={{ alignItems: 'center' }} >
                                <div className='col-md-4'>
                                    <AttributeText attribute_id={attribute.id} value={_value} index={index}
                                        hasProductChannel={hasProductChannel}
                                        first={index == 0}
                                        last={index == values.length - 1}
                                        isCreating={isCreating}
                                        isSyncVietful={isSyncVietful && !!isSyncedVar?.length}
                                    />
                                </div>
                                <div className='col-md-8' >
                                    {has_asset && <SortableList axis="x" lockAxis="x" helperClass="itemsort" code={_value.code} items={filesCode.files} setImageInvalid={setImageInvalid} onOpenCrop={onOpenCrop} onSortEnd={vvv => _onSortEnd({ ...vvv, code: _value.code })}/>}
                                </div>
                            </div>
                        )
                    })
                }
                {
                    values.length < maxValues && <button href="#" className="btn btn-link-info font-weight-bold"
                        onClick={e => {
                            e.preventDefault()
                            addValueToAttributeSelected(attribute.id, "", true)

                        }}
                    >+ {formatMessage({ defaultMessage: 'Thêm' })} ({values.length}/{maxValues})</button>
                }
            </div>
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
        </div >
    )
})