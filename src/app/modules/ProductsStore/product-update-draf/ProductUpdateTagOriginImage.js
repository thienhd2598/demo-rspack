import React, { memo, useState, useMemo, useCallback, Fragment, useLayoutEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import * as Yup from "yup";
import { Field, Form, Formik } from "formik";
import {
    Card,
    CardBody
} from "../../../../_metronic/_partials/controls";
import { useSubheader } from "../../../../_metronic/layout";
import { RouterPrompt } from '../../../../components/RouterPrompt';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import op_connector_channels from "../../../../graphql/op_connector_channels";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useProductsUIContext } from "../ProductsUIContext";
import CreatableSelect from 'react-select/creatable';
import ImageUpload from "../../../../components/ImageUpload";
import { loadSizeImage, randomString, validateImageOrigin } from "../../../../utils";
import mutate_scUpdateMultiProductOriginImageTag from "../../../../graphql/mutate_scUpdateMultiProductOriginImageTag";
import LoadingDialog from "../product-edit/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import ImageView from "../../../../components/ImageView";
import { getImageOriginSanValidate } from "../../../../constants";
import { Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import ProductImageEditDialog from "../product-image-edit-dialog";
import _ from 'lodash';
import { useIntl } from "react-intl";

const ProductUpdateTagImageDraf = () => {
    const { setTitle, appendBreadcrumbs } = useSubheader();
    const { formatMessage } = useIntl();
    setTitle(formatMessage({ defaultMessage: 'Danh sách sản phẩm lưu nháp' }));
    const history = useHistory();
    const { addToast, removeAllToasts } = useToasts();
    const { optionsProductTag } = useProductsUIContext();
    const [imageInvalid, setImageInvalid] = useState([]);
    const [imgOriginValidateConfig, setImgOriginValidateConfig] = useState({});

    const [products, setProducts] = useState([]);
    const [dataCrop, setDataCrop] = useState();
    const [errorMessage, setErrorMessage] = useState([]);
    const [change, setChange] = useState(true);

    const { data: dataChannel, loading: loadingChannel } = useQuery(op_connector_channels);
    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    const [updateOriginImageTags, { loading: loadingUpdate }] = useMutation(mutate_scUpdateMultiProductOriginImageTag);

    useLayoutEffect(
        () => {
            appendBreadcrumbs({
                title: formatMessage({ defaultMessage: 'Sửa ảnh gốc & tag' }),
                pathname: ``
            })
        }, []
    )

    const [optionsStore] = useMemo(
        () => {
            let _options = dataStore?.sc_stores?.map(_store => {
                let _channel = dataStore?.op_connector_channels?.find(_ccc => _ccc.code == _store.connector_channel_code)
                return { label: _store.name, value: _store.id, logo: _channel?.logo_asset_url }
            }) || [];

            return [_options];
        }, [dataStore]
    );

    useMemo(
        () => {
            let _products = history?.location?.state?.list_product?.map(
                _product => {
                    let { id, name, sku, store_id, scProductTag, productAssets } = _product || {};
                    let _store = optionsStore?.find(store => store.value == store_id) || {};
                    let imgOrigin = (productAssets || []).filter(_asset => _asset.type == 4)?.map(
                        _asset => {
                            return {
                                id: _asset.sme_asset_id,
                                source: _asset.origin_image_url || _asset.sme_url,
                                scId: _asset.id,
                                source_draft: _asset.origin_image_url || _asset.sme_url,
                                merged_image_url: _asset.sme_url,
                                template_image_url: _asset.template_image_url,
                            }
                        }
                    )[0];

                    return {
                        id,
                        name,
                        sku,
                        connector_channel_code: _product?.connector_channel_code,
                        store: _store,
                        current_product_tags: scProductTag?.map(_tag => _tag?.id) || [],
                        tags: scProductTag?.map(_tag => ({
                            value: _tag?.id,
                            label: _tag?.tag_name
                        })) || [],
                        imgOriginAvatar: !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (productAssets || []).filter(_asset => _asset.type == 1)[0],
                        imageOrigin: imgOrigin || {},
                        currentImageOrigin: imgOrigin || {},
                    }
                }
            )

            setImgOriginValidateConfig(
                getImageOriginSanValidate(history?.location?.state?.list_product?.[0]?.connector_channel_code)
            );
            setProducts(_products);
        }, [history?.location?.state, optionsStore]
    );

    const onUpdate = useCallback(
        async (e) => {
            e.preventDefault();
            let errors = [];

            let productBodyUpdate = products?.map(
                (_product, index) => {
                    if (_product?.imageOrigin?.isUploading) {
                        if (!errors?.some(_error => _error.key === index)) {
                            errors = errors.concat([{
                                key: index,
                                title: formatMessage({ defaultMessage: 'Ảnh gốc đang tải lên. Xin vui lòng thử lại sau.' })
                            }])
                        }
                    };

                    if (_product?.imageOrigin?.hasError) {
                        if (!errors?.some(_error => _error.key === index)) {
                            errors = errors.concat([{
                                key: index,
                                title: formatMessage({ defaultMessage: 'Ảnh gốc tải lên không hợp lệ. Xin vui lòng thử lại sau.' })
                            }])
                        }
                    };

                    let tags = _product?.tags?.map(
                        _tag => {
                            let { value, label } = _tag;
                            if (_tag?.__isNew__) {
                                return {
                                    tag_name: label
                                }
                            }
                            return {
                                id: value,
                                tag_name: label
                            }
                        }
                    ) || [];
                    let imageOrigin = !!_product.imageOrigin && !!_product.imageOrigin.id
                        ? {
                            asset_id: _product.imageOrigin.id,
                            url: _product.imageOrigin.merged_image_url || _product.imageOrigin.source,
                            template_image_url: _product.imageOrigin.template_image_url,
                            type: 4,
                            position: 0
                        }
                        : null;

                    return {
                        product_id: _product.id,
                        origin_image: imageOrigin,
                        ...(!!_product?.currentImageOrigin ? {
                            origin_image_delete: _product?.currentImageOrigin?.scId
                        } : {}),
                        tags_add: tags,
                        tags_delete: _product.current_product_tags
                    }
                }
            );

            if (errors.length > 0) {
                setErrorMessage(errors);
                return;
            }
            setChange(false);

            let res = await updateOriginImageTags({
                variables: {
                    products: productBodyUpdate
                }
            })
            if (res?.data?.scUpdateMultiProductOriginImageTag?.success) {
                history.push(`/product-stores/draf?channel=${products?.[0]?.connector_channel_code}`);
                addToast(formatMessage({ defaultMessage: 'Cập nhật ảnh gốc và tag sản phẩm thành công' }), { appearance: 'success' })
            } else {
                setChange(true);
                addToast(res?.data?.scUpdateMultiProductOriginImageTag?.message || formatMessage({ defaultMessage: 'Cập nhật ảnh gốc và tag sản phẩm không thành công' }), { appearance: 'error' })
            }
        }, [products]
    );

    return (
        <Formik
            initialValues={{}}
            validationSchema={{}}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                ...rest
            }) => {
                return (
                    <Fragment>
                        <RouterPrompt
                            when={change}
                            // when={false}
                            title={formatMessage({ defaultMessage: "Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?" })}
                            cancelText={formatMessage({ defaultMessage: "KHÔNG" })}
                            okText={formatMessage({ defaultMessage: "CÓ, THOÁT" })}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <LoadingDialog show={loadingUpdate} />
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
                                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Xác nhận' })}</span>
                                    </button>
                                </div>
                            </Modal.Body>
                        </Modal >
                        <Form>
                            <Card>
                                <CardBody>
                                    <div
                                        style={{
                                            boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                                            // height: "calc(100vh - 340px)",
                                            borderRadius: 6,
                                            marginTop: 20,
                                            width: '100%',
                                            // overflowY: 'scroll'
                                        }}
                                    >
                                        <table className="table product-list table-borderless  fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', position: 'relative' }}>
                                            <thead style={{ background: '#f3f8fa' }}>
                                                <tr>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderRight: 'none',
                                                        width: "50%", padding: 16,
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Tên sản phẩm' })}
                                                    </th>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none',
                                                        padding: 16, width: '25%',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Tag' })}
                                                    </th>
                                                    <th style={{
                                                        border: '1px solid #D9D9D9', borderLeft: 'none',
                                                        padding: 16, width: '25%',
                                                        fontSize: '14px'
                                                    }}>
                                                        {formatMessage({ defaultMessage: 'Ảnh gốc' })}
                                                        <OverlayTrigger
                                                            overlay={
                                                                <Tooltip>
                                                                    {formatMessage({ defaultMessage: 'Ảnh sản phẩm gốc là ảnh sản phẩm trên nền trắng. Tỉ lệ ảnh 1:1. Ảnh sản phẩm gốc được dùng để ghép với các khung ảnh mẫu làm ảnh cover chạy chiến dịch.' })}
                                                                </Tooltip>
                                                            }
                                                        >

                                                            <i className="far fa-question-circle ml-2"></i>
                                                        </OverlayTrigger>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {products.map((_product, index) => (
                                                    <>
                                                        {errorMessage?.some(__error => __error?.key == index) && (
                                                            <tr>
                                                                <td colSpan={3}>
                                                                    <div className='bg-danger text-white py-4 px-4  rounded-sm' >
                                                                        <span>
                                                                            {`[${_product?.name}]: ${_.capitalize(errorMessage?.find(_err => _err?.key == index)?.title)}`}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr style={{ borderBottom: index === products.length - 1 ? 'none' : '1px solid #F0F0F0' }}>
                                                            <td className='pt-6 pb-1' style={{ verticalAlign: 'top' }}>
                                                                <div className="d-flex flex-row">
                                                                    <div
                                                                        style={{
                                                                            backgroundColor: '#F7F7FA',
                                                                            width: 80, height: 80,
                                                                            borderRadius: 8,
                                                                            overflow: 'hidden',
                                                                            minWidth: 80,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        onClick={e => {
                                                                            e.preventDefault();
                                                                            window.open(`/product-stores/edit/${_product?.id}`, '_blank')
                                                                        }}
                                                                        className='mr-6'
                                                                    >
                                                                        <img
                                                                            src={_product?.imgOriginAvatar?.merged_image_url || _product?.imgOriginAvatar?.sme_url}
                                                                            style={{ width: 80, height: 80, objectFit: 'contain' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p
                                                                            className='font-weight-normal mb-2'
                                                                            style={{ cursor: 'pointer' }}
                                                                            onClick={e => {
                                                                                e.preventDefault();
                                                                                window.open(`/product-stores/edit/${_product?.id}`, '_blank')
                                                                            }}
                                                                        >
                                                                            {_product?.name}
                                                                        </p>
                                                                        <div style={{ display: 'flex', alignItems: 'center' }} >
                                                                            <p className="d-flex align-items-center">
                                                                                <img src={toAbsoluteUrl('/media/ic_sku.svg')} />
                                                                                <span className='text-truncate-sku ml-2'>
                                                                                    {_product?.sku}
                                                                                </span>
                                                                            </p>
                                                                            <p className="ml-6 d-flex align-items-center" >
                                                                                <img
                                                                                    style={{ width: 20, height: 20 }}
                                                                                    src={_product?.store?.logo}
                                                                                    className="mr-2"
                                                                                />
                                                                                <span >{_product?.store?.label}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className='pt-6 pb-1'>
                                                                <CreatableSelect
                                                                    placeholder={formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
                                                                    isMulti
                                                                    isClearable
                                                                    value={_product?.tags || []}
                                                                    onChange={value => {
                                                                        if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                                                                            removeAllToasts();
                                                                            addToast(formatMessage({ defaultMessage: 'Tag sản phẩm tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                                                                            return;
                                                                        }
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        tags: value
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                    }}
                                                                    options={optionsProductTag}
                                                                    formatCreateLabel={(inputValue) => formatMessage({ defaultMessage: "Tạo mới: {value}" }, { value: inputValue })}
                                                                />
                                                            </td>
                                                            <td className='pt-6 pb-1'>
                                                                <ImageUpload
                                                                    accept={".png, .jpg, .jpeg"}
                                                                    data={_product.imageOrigin}
                                                                    multiple={false}
                                                                    allowDowload
                                                                    allowRemove
                                                                    isSingle
                                                                    onRemove={() => {
                                                                        // setFieldValue('__changed__', true)
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        imageOrigin: null
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                    }}
                                                                    onUploadSuccess={(dataAsset, id) => {
                                                                        // setFieldValue('__changed__', true)
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        imageOrigin: dataAsset
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                    }}

                                                                    onUploading={(isUploading) => {
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        imageOrigin: {
                                                                                            ..._pro.imageOrigin,
                                                                                            isUploading
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                    }}
                                                                    validateFile={({ width, height, size }) => {
                                                                        let hasError = validateImageOrigin({ width, height, size, config: imgOriginValidateConfig.maxSize })
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        imageOrigin: {
                                                                                            ..._pro.imageOrigin,
                                                                                            hasError: !!hasError
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                        return hasError;
                                                                    }}
                                                                    onChooseFile={async files => {
                                                                        console.log({ files });
                                                                        let __error = false;
                                                                        let resFetchSize = await Promise.all(files.map(_file => loadSizeImage(_file)))
                                                                        setImageInvalid(files.map((_file, _index) => {
                                                                            let mess = [
                                                                            ]
                                                                            if (_file.size > imgOriginValidateConfig.maxSize * 1024 * 1024) {
                                                                                mess.push(formatMessage({ defaultMessage: `Kích thước ảnh chưa đạt yêu cầu. Kích thước ảnh phải < {max}MB.` }, { max: imgOriginValidateConfig.maxSize }))
                                                                                __error = true;
                                                                            }
                                                                            let hasError = validateImageOrigin({ ...resFetchSize[_index], size: 0, config: imgOriginValidateConfig.maxSize })
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
                                                                        setProducts(prev => {
                                                                            return prev.map(_pro => {
                                                                                if (_product.id === _pro.id) {
                                                                                    return {
                                                                                        ..._pro,
                                                                                        imageOrigin: {
                                                                                            id: randomString(12),
                                                                                            file: files[0],
                                                                                            refFile: files[0],
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    return _pro
                                                                                }
                                                                            })
                                                                        })
                                                                    }}
                                                                    onOpenCrop={(url, onCrop) => {
                                                                        setDataCrop({ url, onCrop, maxSize: 1024 })
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    </>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className='d-flex justify-content-end mt-8' >
                                        <button
                                            className="btn btn-secondary mr-2"
                                            style={{ width: 150 }}
                                            onClick={e => {
                                                e.preventDefault()
                                                history.push(`/product-stores/draf?channel=${products?.[0]?.connector_channel_code}`);
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ minWidth: 150 }}
                                            onClick={onUpdate}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>
                                    </div>
                                </CardBody>
                            </Card>
                        </Form>
                    </Fragment>
                )
            }}
        </Formik>
    )
};

export default memo(ProductUpdateTagImageDraf);