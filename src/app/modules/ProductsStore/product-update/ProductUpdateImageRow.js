import { arrayMoveImmutable } from 'array-move';
import axios from "axios";
import { Field, useFormikContext } from 'formik';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { useToasts } from 'react-toast-notifications';
import { InputEditVertical } from '../../../../_metronic/_partials/controls/forms/InputEditVertical';
import ImageUpload from '../../../../components/ImageUploadMultiple';
import { getImageOriginSanValidate } from '../../../../constants';
import { loadSizeImage, randomString, validateImageFile } from '../../../../utils';
import InfoProduct from '../../../../components/InfoProduct';

const ProductUpdateImageRow = ({ product, key, onRemoveProduct, disabledAction = false, setProducts, setDataCrop, setImageInvalid, errorMessage }) => {
    const user = useSelector((state) => state.auth.user);
    const { formatMessage } = useIntl();
    const [formattingImage, setformattingImage] = useState(false);
    const [isFormattingImage, setIsformattingImage] = useState(false);

    const { setFieldValue } = useFormikContext();

    const _onSortEnd = useCallback(({ oldIndex, newIndex }) => {
        setProducts(prev => prev.map(
            _product => {
                if (_product?.id === product?.id) {
                    return {
                        ..._product,
                        productFiles: arrayMoveImmutable(_product?.productFiles, oldIndex, newIndex)
                    }
                }

                return _product
            }
        ))
    });

    const assetImage = useMemo(
        () => {
            try {
                let imgOrigin = (product?.productAssets || []).find(_asset => _asset.type == 4)
                return !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (product?.productAssets || []).filter(_asset => _asset.type == 1)[0];
            } catch (error) {
                return null;
            }
        }, [product]
    );

    return (
        <>
            <tr
                key={key}
                style={{ borderBottom: '1px solid #D9D9D9' }}
            >
                <td style={{ verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                backgroundColor: '#F7F7FA',
                                width: 60, height: 60,
                                borderRadius: 8,
                                overflow: 'hidden',
                                minWidth: 60
                            }}
                            className='mr-6 cursor-pointer'
                            onClick={e => {
                                e.preventDefault();
                                window.open(`/product-stores/edit/${product.id}`, '_blank')
                            }}
                        >
                            {
                                !!assetImage && <img src={assetImage?.sme_url}
                                    style={{ width: 60, height: 60, objectFit: 'contain' }} />
                            }
                        </div>
                        <div className="d-flex flex-column w-100">
                            <Field
                                name={`product-${product?.id}-name`}
                                component={InputEditVertical}
                                placeholder={formatMessage({ defaultMessage: "Tên sản phẩm" })}
                                label={""}
                                nameTxt={formatMessage({ defaultMessage: "Tên sản phẩm" })}
                                required                                
                                customFeedbackLabel={' '}
                                addOnRight={''}
                            />
                            <InfoProduct
                                name={""}
                                sku={product?.sku}
                                url={`/product-stores/edit/${product.id}`}
                            />
                        </div>
                    </div>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                    <span className="d-flex align-items-center" >
                        <img
                            style={{ width: 20, height: 20 }}
                            src={product?.store?.logo}
                            className="mr-2"
                        />
                        <span >{product?.store?.label}</span>
                    </span>
                </td>
                <td>
                    <div className='d-flex justify-content-center align-items-center'>
                        <SortableList
                            axis="x"
                            lockAxis="x"
                            helperClass="itemsort"
                            items={product?.productFiles}
                            setImageInvalid={setImageInvalid}
                            setDataCrop={setDataCrop}
                            onSortEnd={_onSortEnd}
                            productId={product?.id}
                            setProducts={setProducts}
                            disabled={formattingImage}
                            imageOriginFrame={!!product?.productImageOrigin?.template_image_url ? product?.productImageOrigin?.merged_image_url : null}
                            channelCode={product?.connector_channel_code}
                            isFormattingImage={isFormattingImage}
                        />
                        <span
                            role='button'
                            className='text-danger ml-8'
                            style={{ minWidth: 100, marginTop: -12 }}
                            onClick={async e => {
                                e.preventDefault();

                                setProducts(prev => prev.map(
                                    _product => {
                                        if (_product?.id === product?.id) {
                                            return {
                                                ..._product,
                                                productFiles: [..._product?.productFiles]?.map(_ff => {
                                                    return {
                                                        ..._ff,
                                                        isFormatting: true
                                                    }
                                                })
                                            }
                                        }

                                        return _product
                                    }
                                ));
                                setIsformattingImage(true);
                                try {
                                    let blobs = await Promise.all(product?.productFiles.map(__ => {
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
                                    setProducts(prev => prev.map(
                                        _product => {
                                            if (_product?.id === product?.id) {
                                                return {
                                                    ..._product,
                                                    productFiles: [..._product?.productFiles]?.map((_ff, _idx) => {
                                                        if (!!resFormat[_idx] && resFormat[_idx].data?.success) {
                                                            return resFormat[_idx].data.data
                                                        }
                                                        return _ff
                                                    })
                                                }
                                            }

                                            return _product
                                        }
                                    ));
                                } catch (error) {
                                    console.log('error', error)
                                } finally {
                                    setformattingImage(false)
                                    setIsformattingImage(false)
                                }
                            }}
                        >
                            {formatMessage({ defaultMessage: 'Chuẩn hóa ảnh' })}
                        </span>
                    </div>
                </td>
                <td className="text-center" style={{ verticalAlign: 'top' }}>
                    <i
                        class="fas fa-trash-alt"
                        style={{ color: 'red', cursor: disabledAction ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                            if (disabledAction) return;

                            setFieldValue('__changed__', true);
                            onRemoveProduct(product?.id);
                        }}
                    />
                </td>
            </tr>
            {/* {!!product?.productImageOrigin && (
                <tr style={{ background: 'rgba(254, 86, 41, 0.31)' }}>
                    <td colSpan={3}>
                        <div className='d-flex'>
                            <SVG src={toAbsoluteUrl("/media/svg/ic-warning.svg")} /> <span style={{ color: '#F80D0D', wordBreak: 'break-word' }} className='ml-4'>
                                Lỗi: Sản phẩm đang apply khung nên không cập nhật được, xin vui lòng gỡ khung apply khung và thao tác lại
                            </span>
                        </div>

                    </td>
                </tr>
            )} */}
        </>
    )
};

const SortableList = SortableContainer(({ items, setDataCrop, setImageInvalid, disabled, isFormattingImage, channelCode, setProducts, productId, imageOriginFrame }) => {
    const { addToast } = useToasts();
    const imgValidateConfig = getImageOriginSanValidate(channelCode);
    const { formatMessage } = useIntl();

    return (
        <div className='w-100 d-flex flex-wrap' style={{ marginTop: -12 }}>
            {
                items.map((_file, index) => {
                    return <SortableItem
                        key={`item-${index}`}
                        index={index}
                        productId={productId}
                        setProducts={setProducts}
                        channelCode={channelCode}
                        idx={index}
                        value={_file}
                        setDataCrop={setDataCrop}
                        disabled={disabled}
                        _disabled={disabled}
                        isFormattingImage={isFormattingImage}
                    />
                })
            }
            {
                items.length < 8 && !disabled && <ImageUpload
                    isMedium
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
                            if (!!validateImageFile({ ...resFetchSize[_index], size: 0, config: imgValidateConfig, channel: channelCode })) {
                                mess.push(formatMessage({ defaultMessage: `Vui lòng chọn ảnh kích thước tối thiểu {min}, tối đa {max}` }, { min: `${imgValidateConfig.minWidth}x${imgValidateConfig.minHeight}`, max: `${imgValidateConfig.maxWidth}x${imgValidateConfig.maxWidth}` }))
                            }
                            if (mess.length > 0)
                                return {
                                    file: _file,
                                    message: mess.join('. ')
                                }
                            return null
                        }).filter(_error => !!_error))

                        setProducts(prev => prev.map(
                            _product => {
                                if (_product?.id === productId) {
                                    return {
                                        ..._product,
                                        productFiles: [..._product?.productFiles]?.concat(filesAccept.filter(_file => {
                                            if ([..._product?.productFiles].some(___file => !!___file.refFile && ___file.refFile.name == _file.name && ___file.refFile.size == _file.size)) {
                                                errorDuplicate.push(_file.name)
                                                return false
                                            }
                                            return true
                                        }).map(_file => ({
                                            id: randomString(12),
                                            file: _file,
                                            refFile: _file,
                                        }))).slice(0, 8)
                                    }
                                }

                                return _product
                            }
                        ))
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
    )
});

const SortableItem = SortableElement(({ value, setDataCrop, idx, _disabled, isFormattingImage, productId, setProducts, channelCode }) => {
    const imgValidateConfig = getImageOriginSanValidate(channelCode);
    const { formatMessage } = useIntl();
    const { setFieldValue } = useFormikContext();

    return <div className="itemsort d-flex flex-column align-items-center" style={{ position: 'relative' }} >
        <ImageUpload
            isMedium
            data={value}
            accept={".png, .jpg, .jpeg"}
            allowRemove
            allowDowload
            onRemove={() => {
                setFieldValue('__changed__', true)
                setProducts(prev => prev.map(
                    _product => {
                        if (_product?.id === productId) {
                            const newFiles = [..._product?.productFiles];
                            newFiles.splice(idx, 1);

                            return {
                                ..._product,
                                productFiles: newFiles
                            }
                        }

                        return _product
                    }
                ))
            }}
            onUploadSuccess={(dataAsset, id) => {
                setFieldValue('__changed__', true)
                setProducts(prev => prev.map(
                    _product => {
                        if (_product?.id === productId) {
                            return {
                                ..._product,
                                productFiles: [..._product?.productFiles].map(_ff => {
                                    if (_ff.id == id) {
                                        return dataAsset
                                    }
                                    return _ff
                                })
                            }
                        }

                        return _product
                    }
                ));
            }}
            validateFile={({ width, height, size }) => {
                let hasError = validateImageFile({ width, height, size, channel: channelCode, config: imgValidateConfig })
                setProducts(prev => prev.map(
                    _product => {
                        if (_product?.id === productId) {
                            return {
                                ..._product,
                                productFiles: [..._product?.productFiles].map((_ff, _index) => {
                                    if (idx == _index) {
                                        return {
                                            ..._ff,
                                            hasError: !!hasError
                                        }
                                    }
                                    return _ff
                                })
                            }
                        }

                        return _product
                    }
                ));
                return hasError;
            }}
            onOpenCrop={(url, onCrop) => {
                setDataCrop({ url, onCrop, maxWidth: imgValidateConfig.maxWidth, maxHeight: imgValidateConfig.maxHeight })
            }}
            disabled={_disabled}
        />
        {!!value?.template_image_url && (
            <span className='text-secondary-custom fs-12 mr-4'>{formatMessage({ defaultMessage: 'Đã áp khung' })}</span>
        )}

        {
            value.isFormatting && <div className='image-input' style={{
                position: 'absolute',
                height: 80, width: 80, top: 12, left: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} >
                <span className="mr-6 spinner spinner-white"  ></span>
            </div>
        }
    </div>
})

export default memo(ProductUpdateImageRow);