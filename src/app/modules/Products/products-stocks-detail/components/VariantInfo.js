/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import { Field, useFormikContext } from "formik";
import _ from "lodash";
import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ImageUpload from "../../../../../components/ImageUpload";
import { loadSizeImage, randomString, validateImageOrigin } from "../../../../../utils";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import { Card, CardBody, CardHeader, CardHeaderToolbar, InputVertical } from "../../../../../_metronic/_partials/controls";
import ProductImageEditDialog from "../../product-image-edit-dialog";
import { useIntl } from "react-intl";
import ModalProductConnectVariant from "../../products-list/dialog/ModalProductConnectVariant";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
export default memo(({ variant, isSyncVietful }) => {
    const [dataCrop, setDataCrop] = useState()
    const { formatMessage } = useIntl()
    const { values, setFieldValue } = useFormikContext()
    const [currentProductVariantLinked, setCurrentProductVariantLinked] = useState(null);
    const syncedVariants = variant?.product?.sme_catalog_product_variants?.filter(variant => variant?.provider_links?.length > 0 &&  variant.provider_links?.some(provider => provider?.provider_code == 'vietful' && !provider?.sync_error_msg))
    console.log(syncedVariants)
    const imgAssets = useMemo(() => {
        return _.minBy(variant?.product?.sme_catalog_product_assets?.map(_asset => ({
            ..._asset,
            position_show: _asset.position_show || 0
        })), 'position_show')
    }, [variant?.product?.sme_catalog_product_assets])

    const colSize = useMemo(() => {
        if (variant?.variant?.attributes && variant?.variant?.attributes.length > 0) {
            return 12 / variant?.variant?.attributes.length
        }
        return 0
    }, [variant?.variant?.attributes])

    return <Card>
        <ModalProductConnectVariant
            variantId={currentProductVariantLinked}
            onHide={() => setCurrentProductVariantLinked(null)}
        />
        <div className="d-flex align-items-center mt-4">
            <div style={{
                fontWeight: 500,
                fontSize: "1.275rem",
                color: '#000000',
                marginRight: '3px',
                paddingLeft: '12px'
            }}>
                {formatMessage({ defaultMessage: "THÔNG TIN SẢN PHẨM PHÂN LOẠI" })}
            </div>
            <span
                className={`${variant?.variant?.sc_variant_linked?.length ? 'text-primary cursor-pointer' : "text-secondary-custom"} ` + 'fs-12 ml-2'}
                onClick={() => {
                    if (variant?.variant?.sc_variant_linked?.length === 0) return;
                    setCurrentProductVariantLinked(variant?.variant?.id)
                }}>
                {variant?.variant?.sc_variant_linked?.length || 0} {formatMessage({ defaultMessage: 'liên kết' })}
            </span>
        </div>

        <CardBody>
            <div style={{ width: '100%', display: 'flex', paddingRight: 16 }} >

                <div style={{ flex: 1 }} >
                    <div className="row">
                        <div className="col-12">
                            <Field
                                name="variant_full_name"
                                component={InputVertical}
                                placeholder=""
                                label={"Tên sản phẩm phân loại"}
                                disabled={isSyncVietful || syncedVariants?.map(item => item?.id)?.includes(variant?.variant?.variant_unit?.main_variant_id)}
                                customFeedbackLabel={''}
                                countChar
                                maxChar={"255"}
                            />
                        </div>
                    </div>
                    {
                        colSize > 0 && <div className='row'>
                            {
                                variant?.variant?.attributes.map(__ => {
                                    return <div key={`aattribute-${__.id}`} className={`col-md-${colSize}`} >
                                        <Field
                                            name={`attribute-${__.id}`}
                                            component={InputVertical}
                                            placeholder=""
                                            label={__.sme_catalog_product_attribute_value?.sme_catalog_product_custom_attribute?.display_name}
                                            customFeedbackLabel={' '}
                                            disabled
                                        />
                                    </div>
                                })
                            }

                        </div>
                    }

                    <div className='row'>
                        <div className={`col-md-6`} >
                            <Field
                                name="sku"
                                component={InputVertical}
                                placeholder=""
                                label={"SKU"}
                                disabled={isSyncVietful || syncedVariants?.map(item => item?.id)?.includes(variant?.variant?.variant_unit?.main_variant_id)}
                                required
                                customFeedbackLabel={' '}
                            />
                        </div>
                        <div className={`col-md-6`} >
                            <Field
                                name="gtin"
                                component={InputVertical}
                                placeholder=""
                                disabled={isSyncVietful || syncedVariants?.map(item => item?.id)?.includes(variant?.variant?.variant_unit?.main_variant_id)}
                                label={"GTIN"}
                                customFeedbackLabel={' '}
                            />
                        </div>
                    </div>
                    <div className="row mt-2">                        
                        <div className="col-3">
                            <Field
                                name="price"
                                component={InputVertical}
                                type='number'
                                placeholder=""
                                label={formatMessage({ defaultMessage: 'Giá bán' })}
                                tooltip={formatMessage({ defaultMessage: 'Giá bán dùng để set giá của sản phẩm được hiển thị trên sàn.' })}
                                required={false}
                                customFeedbackLabel={' '}
                                addOnRight="đ"
                                absolute
                            />
                        </div>
                        <div className="col-3">
                            <Field
                                name="priceMinimum"
                                component={InputVertical}
                                type='number'
                                placeholder=""
                                label={formatMessage({ defaultMessage: 'Giá bán tối thiểu' })}
                                tooltip={formatMessage({ defaultMessage: 'Giá bán tối thiểu dùng làm căn cứ để set giá ở chương trình khuyến mại. Giá ở chương trình khuyến mại không được nhỏ hơn giá bán tối thiểu.' })}
                                required={false}
                                customFeedbackLabel={' '}
                                addOnRight="đ"
                                absolute
                            />
                        </div>                        
                    </div>
                </div>
                <ImageUpload
                    accept={".png, .jpg, .jpeg"}
                    data={values.image}
                    multiple={false}
                    allowRemove
                    allowDowload
                    isSingle
                    onRemove={() => {
                        setFieldValue('image', null)
                    }}

                    onUploading={(isUploading) => {
                        setFieldValue("image_uploading", isUploading)
                    }}
                    onUploadSuccess={(dataAsset, id) => {
                        setFieldValue('image', dataAsset)
                        setFieldValue("image_uploading", false)
                    }}
                    validateFile={({ width, height, size }) => {
                        let hasError = validateImageOrigin({
                            width, height, size, channel: '', config: {
                                maxSize: 3,
                                maxWidth: 5000,
                                maxHeight: 5000,
                                minWidth: 500,
                                minHeight: 500,
                            }
                        })
                        setFieldValue('image', {
                            ...values.image,
                            hasError: !!hasError
                        })
                        return hasError;
                    }}
                    onChooseFile={async files => {
                        // let __error = false;
                        // let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                        // setImageInvalid(files.map((_file, _index) => {
                        //     let mess = [
                        //     ]
                        //     let hasError = validateImageOrigin({
                        //         ...resFetchSize[_index], size: 0, channel: '', config: {
                        //             maxSize: 3,
                        //             maxWidth: 5000,
                        //             maxHeight: 5000,
                        //             minWidth: 500,
                        //             minHeight: 500,
                        //         }
                        //     })
                        //     if (!!hasError) {
                        //         mess.push(hasError)
                        //         __error = true;
                        //     }
                        //     if (mess.length > 0)
                        //         return {
                        //             file: _file,
                        //             message: mess.join('. ')
                        //         }
                        //     return null
                        // }).filter(_error => !!_error))
                        setFieldValue('image', {
                            id: randomString(12),
                            file: files[0],
                            refFile: files[0],
                        })
                    }}
                    onOpenCrop={(url, onCrop) => {
                        // console.log('url', url)
                        setDataCrop({ url, onCrop, maxSize: 5000 })
                    }}
                />
            </div>
        </CardBody>

        <ProductImageEditDialog
            show={!!dataCrop}
            dataCrop={dataCrop}
            onHide={() => {
                setDataCrop(null)
            }}
        />
    </Card>
})