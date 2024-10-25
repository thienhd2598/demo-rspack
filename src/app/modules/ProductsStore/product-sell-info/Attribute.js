/*
 * Created by duydatpham@gmail.com on 08/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import React, { memo, useMemo, useState } from 'react'
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
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { getImageOriginSanValidate } from '../../../../constants';


const SortableItem = SortableElement(({ value, onOpenCrop, _index, code, disableActions, allowDelete, channel }) => {
    const { setFieldValue } = useFormikContext()
    const { setProductAttributeFiles } = useProductsUIContext();

    return (
        <div className="itemsort" >
            {disableActions && (
                <div className="image-input m-4 overlay" id="kt_image_4" style={{
                    width: 60, height: 60,
                    backgroundColor: '#F7F7FA',
                    border: '1px dashed #D9D9D9'

                }}
                >
                    <img className="image-input-wrapper" style={{ width: 58, height: 58 }} src={value?.source || ''} />
                </div>
            )}
            {!disableActions && (
                <ImageUpload
                    key={`file-att-${_index}-${code}-pro-${value.id}`}
                    accept={".png, .jpg, .jpeg"}
                    required={false}
                    allowDelete={allowDelete}
                    allowRemove
                    isSmall={true}
                    data={value}
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
                        let hasError = validateImageFile({ width, height, size, channel })

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
            )}
        </div>
    )
});

const SortableList = SortableContainer(({ items, onOpenCrop, setImageInvalid, code, isValidate, disableActions, currentChannel }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const { setProductAttributeFiles, productAttributeFiles } = useProductsUIContext();
    const imgValidateConfig = getImageOriginSanValidate(currentChannel?.connector_channel_code);
    const { values } = useFormikContext();

    console.log({ imgValidateConfig })

    return (
        <div className='form-group w-100 d-flex flex-wrap' style={{ margin: 0 }} >
            {
                items.map((_file, index) => {
                    return <SortableItem
                        // disableActions={disableActions}
                        allowDelete={!!values[`disable-edit-attribute`] && currentChannel?.connector_channel_code === 'lazada' && items?.length - 1 === index ? false : true}
                        key={`item-${index}`}
                        code={code}
                        index={index}
                        _index={index}
                        value={_file}
                        channel={currentChannel?.connector_channel_code}
                        onOpenCrop={onOpenCrop}
                    />
                })
            }
            {
                items.length < (currentChannel?.connector_channel_code != 'lazada' ? 1 : 8) && <ImageUpload
                    required={false}
                    accept={".png, .jpg, .jpeg"}
                    isSmall={true}
                    isValidate={isValidate && items?.length === 0}
                    multiple={currentChannel?.connector_channel_code != 'lazada' ? false : true}
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
                            if (!!validateImageFile({ ...resFetchSize[_index], size: 0, channel: currentChannel?.connector_channel_code })) {
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
                />
            }
        </div>
    );
});

export default memo(({ attribute, hasProductChannel, title, onEdit, has_asset, onOpenCrop, isCreating, disableActions }) => {
    const { formatMessage } = useIntl();
    const {
        variants,
        addValueToAttributeSelected,
        setAttributesSelected,
        setCustomAttributes,
        attributesSelected,
        productAttributeFiles, setProductAttributeFiles,
        currentChannel, productEditing
    } = useProductsUIContext();
    const { setFieldTouched, setFieldValue, values: valuesForm } = useFormikContext()
    const [imageInvalid, setImageInvalid] = useState([])
    const { addToast } = useToasts();

    console.log({ attribute })

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

    const [disabledAssets, maxValues] = useMemo(() => {
        let att = attributesSelected.find(_att => _att.has_asset)
        let attOther = attributesSelected.filter(_att => _att.id != attribute.id) || [];
        let _length = attOther.reduce((result, val) => {
            if (result == 0) {
                result += val.values.length;
            } else {
                result *= val.values.length;
            }
            return result
        }, 0);

        // let attOther = attributesSelected.find(_att => _att.id != attribute.id) || {}
        // let _length = (attOther.values || []).length;
        return [!!att && att.id != attribute.id, Math.min(_length == 0 ? 20 : Math.floor((currentChannel?.connector_channel_code === 'tiktok' ? 100 : 50) / _length), 20)]
    }, [attributesSelected, attribute, currentChannel]);

    const onSelectGroupAttribute = useCallback((group) => {
        setAttributesSelected(prev => prev.map(attr => {
            if (attr?.id == attribute?.id) {
                return {
                    ...attribute,
                    currentGroupSelect: group
                }
            }

            return attr;
        }))
    }, [attribute]);

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
        <div className="mb-4" style={{ borderBottom: '1px solid #F0F0F0' }} >
            <div className='d-flex flex-row ' style={{ alignItems: 'center' }} >
                <span>{title}</span>&ensp;&ensp;
                <h6 className='mb-0'>{attribute.display_name}</h6>
                {
                    // (!valuesForm[`disable-edit-attribute`] || !valuesForm[`disable-att-value-${attribute.id}`]) && 
                    (!valuesForm[`disable-edit-attribute`] || currentChannel?.connector_channel_code == 'shopee' || (currentChannel?.connector_channel_code == 'tiktok' && !valuesForm[`disable-delete-att-${attribute.id}`]) || productEditing?.status == 2)
                    && <a href="#"
                        onClick={e => {
                            e.preventDefault()
                            !!onEdit && onEdit(attribute.id, attribute.display_name)
                        }}
                    >&ensp;&ensp;({formatMessage({ defaultMessage: 'Chỉnh sửa' })})&ensp;&ensp;</a>
                }
                {
                    (!valuesForm[`disable-edit-attribute`] || !valuesForm[`disable-delete-att-${attribute.id}`] || productEditing?.status == 2) &&
                    <div className='d-flex justify-content-end' style={{ flex: 1 }}>
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault()
                                setAttributesSelected(prev => {
                                    return prev.filter(_att => _att.id != attribute.id)
                                })
                                // setCustomAttributes(prev => {
                                //     return prev.filter(_att => _att.id != attribute.id)
                                // })
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Xóa nhóm phân loại' })}
                        </a>
                    </div>
                }
            </div>
            {attribute?.groups?.length > 0 && <div
                className='radio-inline mt-4 d-flex'
                style={{ gap: 20 }}
                onChange={(e) => {
                    const currentValue = e.target.value;
                    const groupSelected = attribute?.groups?.find(group => group?.id == currentValue);

                    onSelectGroupAttribute(groupSelected);
                }}
            >
                {attribute?.groups?.map(_op => {
                    return (
                        <label
                            key={`op-${_op?.id}`}
                            className="radio"
                        >
                            <input
                                type="radio"
                                value={_op?.id}
                                checked={attribute?.currentGroupSelect?.id == _op?.id}
                            />
                            <span></span>
                            {_op?.ref_group_name}
                        </label>
                    )
                })}
            </div>}
            <div className="form-group mt-4" >
                {values.map((_value, index) => {
                    let filesCode = (productAttributeFiles[_value.code] || {
                        files: [], attribute_value: _value.v, attribute_id: attribute.id,
                        attribute_name: attribute.display_name, isCustom: false
                    })

                    let valuesFileCode = values?.map(
                        _value => ({
                            ..._value,
                            filesCode: (productAttributeFiles[_value.code] || {
                                files: [], attribute_value: _value.v, attribute_id: attribute.id,
                                attribute_name: attribute.display_name, isCustom: false
                            })
                        })
                    );

                    const optionsGroupChild = attribute?.currentGroupSelect?.options
                        ?.map(op => ({
                            ...op,
                            value: op?.id,
                            label: op?.name
                        }))

                    let isValidate = valuesFileCode?.some(_attr => _attr?.filesCode?.files?.length > 0)
                        && valuesFileCode?.some(_attr => _attr?.filesCode?.files?.length === 0)

                    return (
                        <div key={`-att-value-${index}-${attribute.id}`} className='row' style={{ alignItems: 'center', paddingBottom: '0px', marginBottom: '5px' }} >
                            <div className='col-md-4' style={{ padding: '0px' }}>
                                {currentChannel?.connector_channel_code === 'shopee' && <AttributeSingleSelect
                                    attribute_id={attribute.id}
                                    value={_value}
                                    index={index}
                                    options={optionsGroupChild}
                                    hasProductChannel={hasProductChannel}
                                    first={index == 0}
                                    last={index == values.length - 1}
                                    isCreating={isCreating}
                                />}
                                {currentChannel?.connector_channel_code != 'shopee' && <AttributeText
                                    attribute_id={attribute.id}
                                    value={_value}
                                    index={index}
                                    hasProductChannel={hasProductChannel}
                                    first={index == 0}
                                    last={index == values.length - 1}
                                    isCreating={isCreating}
                                />}
                            </div>
                            <div className='col-md-8' >
                                {has_asset && <SortableList currentChannel={currentChannel} disableActions={disableActions} axis="x" lockAxis="x" helperClass="itemsort" code={_value.code} isValidate={isValidate} items={filesCode.files} setImageInvalid={setImageInvalid} onOpenCrop={onOpenCrop} onSortEnd={vvv => _onSortEnd({ ...vvv, code: _value.code })} />}
                            </div>
                        </div>
                    )
                })}
                {
                    // !disableActions && !valuesForm[`disable-edit-attribute`] && !valuesForm[`disable-att-value-${attribute.id}`] && 
                    values.length < maxValues && <button href="#" className="btn btn-link-info font-weight-bold"
                        onClick={e => {
                            e.preventDefault()
                            addValueToAttributeSelected(attribute.id, "")
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