import React, { memo, useState, useMemo, useCallback, Fragment, useLayoutEffect } from "react";
import { useQuery, useMutation, useLazyQuery } from "@apollo/client";
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
import { useProductsUIContext } from '../ProductsUIContext';
import CreatableSelect from 'react-select/creatable';
import _ from 'lodash';
import ImageUpload from "../../../../components/ImageUpload";
import { Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import mutate_productUpdateOriginImageTags from "../../../../graphql/mutate_productUpdateOriginImageTags";
import LoadingDialog from "../product-edit/LoadingDialog";
import { useToasts } from "react-toast-notifications";
import { loadSizeImage, randomString, validateImageOrigin } from "../../../../utils";
import ImageView from "../../../../components/ImageView";
import ProductImageEditDialog from "../product-image-edit-dialog";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import query_sc_product_connected from "../../../../graphql/query_sc_product_connected";
import { createApolloClientSSR } from '../../../../apollo';
import InfoProduct from "../../../../components/InfoProduct";
import { useIntl } from "react-intl";
const ProductUpdateTagImage = () => {
    let client = createApolloClientSSR()
    const suhbeader = useSubheader();
    const {formatMessage} = useIntl()
    suhbeader.setTitle(formatMessage({defaultMessage:'Danh sách sản phẩm kho'}));
    const history = useHistory();
    const { addToast, removeAllToasts } = useToasts();
    const { optionsProductTag } = useProductsUIContext();
    const [products, setProducts] = useState([]);
    const [dataCrop, setDataCrop] = useState();
    const [change, setChange] = useState(true);
    const [imageInvalid, setImageInvalid] = useState([]);
    const [errorMessage, setErrorMessage] = useState([]);
    const [showModalConfirm, setShowModalConfirm] = useState(false);
        const [dataTagsSetAll, setDataTagsSetAll] = useState([]);
    const [productsConnected, setProductsConnected] = useState([]);
    const [loadingPopupConnected, setLoadingPopupConnected] = useState(false);
    console.log('dataTagsSetAll', dataTagsSetAll)
    console.log('products', products)
    const [updateOriginImageTags, { loading }] = useMutation(mutate_productUpdateOriginImageTags);
    const { data: dataStore } = useQuery(query_sc_stores_basic, {
        fetchPolicy: 'cache-and-network'
    });

    useLayoutEffect(
        () => {
            suhbeader.appendBreadcrumbs({
                title: formatMessage({defaultMessage:'Sửa ảnh gốc & tag'}),
                pathname: ``
            })
        }, []
    );

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
                    console.log({ _product });
                    let { id, name, sku, tags, sme_catalog_product_assets, scProduct, scProductMapping } = _product || {};
                    const imgAssets = _.minBy(sme_catalog_product_assets?.filter(_asset => !_asset.is_video).map(__vv => ({ ...__vv, position: __vv.position_show || 0 })), 'position');

                    const imageOrigin = (sme_catalog_product_assets || []).filter(_asset => _asset.is_video == 3).map(_asset => {
                        return {
                            id: _asset.asset_id,
                            source: _asset.asset_url,
                            source_draft: _asset.asset_url,
                            sme_id: _asset.id
                        }
                    })?.[0] || {}

                    return {
                        id,
                        name,
                        sku,
                        tags: tags?.map(_tag => ({
                            value: _tag?.tag_id,
                            label: _tag?.tag?.title
                        })),
                        imgAssets,
                        imageOrigin,
                        scProductMapping,
                        scProduct
                    }
                });

            setProducts(_products);
        }, [history?.location?.state]
    );

    const onShowProductMapping = useCallback(
        async (productMapping) => {
            setLoadingPopupConnected(true);
            const scProductMapping = await Promise.all(productMapping?.map(_product => {
                return new Promise((resolve) => {
                    client.query({
                        query: query_sc_product_connected,
                        fetchPolicy: 'network-only',
                        variables: {
                            id: _product.sc_product_id
                        }
                    }).then(values => resolve(values?.data?.sc_product))
                        .catch(_err => resolve([]))
                })
            }));
            setLoadingPopupConnected(false);

            setProductsConnected(scProductMapping);
        }
    );

    const onUpdate = useCallback(
        async (isSyncUp) => {
            let errors = [];
            setChange(false);
            let productBodyUpdate = products?.map(
                (_product, index) => {
                    if (_product?.imageOrigin?.isUploading) {
                        if (!errors?.some(_error => _error.key === index)) {
                            setChange(true);
                            errors = errors.concat([{
                                key: index,
                                title: formatMessage({defaultMessage:'Ảnh gốc đang tải lên. Xin vui lòng thử lại sau.'})
                            }])
                        }
                    };

                    if (_product?.imageOrigin?.hasError) {
                        if (!errors?.some(_error => _error.key === index)) {
                            setChange(true);
                            errors = errors.concat([{
                                key: index,
                                title: formatMessage({defaultMessage:'Ảnh gốc tải lên không hợp lệ. Xin vui lòng thử lại sau.'})
                            }])
                        }
                    };

                    let tags = _product?.tags?.map(
                        _tag => {
                            let { value, label } = _tag;
                            if (_tag?.__isNew__) {
                                return {
                                    title: label
                                }
                            }
                            return {
                                id: value,
                                title: label
                            }
                        }
                    ) || [];
                    let imageOrigin = !!_product.imageOrigin && !!_product.imageOrigin.id
                        ? { asset_id: _product.imageOrigin.id, url: _product.imageOrigin.source, positionShow: 0 }
                        : null;

                    return {
                        product_id: _product.id,
                        product_image_origin: imageOrigin,
                        tags
                    }
                }
            );

            if (errors.length > 0) {
                setShowModalConfirm(false)
                setErrorMessage(errors);
                return;
            }

            let res = await updateOriginImageTags({
                variables: {
                    isSyncUp,
                    updateInput: productBodyUpdate
                }
            })
            if (res?.data?.productUpdateOriginImageTags?.success) {
                history.push('/products/list');
                addToast(formatMessage({defaultMessage:'Cập nhật ảnh gốc và tag sản phẩm thành công'}), { appearance: 'success' })
            } else {
                setChange(true);
                addToast(res?.data?.productUpdateOriginImageTags?.message || formatMessage({defaultMessage:'Cập nhật ảnh gốc và tag sản phẩm không thành công'}), { appearance: 'error' })
            }
        }, [products]
    );

    return (
        <Fragment>
            <RouterPrompt
                when={change}
                title={formatMessage({defaultMessage:"Mọi thông tin bạn nhập trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?"})}
                cancelText={formatMessage({defaultMessage:"KHÔNG"})}
                okText={formatMessage({defaultMessage:"CÓ, THOÁT"})}
                onOK={() => true}
                onCancel={() => false}
            />
            <ProductImageEditDialog
                show={!!dataCrop}
                dataCrop={dataCrop}
                onHide={() => {
                    setDataCrop(null)
                }}
            />

            <LoadingDialog show={loadingPopupConnected} title={'Đang tải'} />

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

            <Modal
                show={showModalConfirm}
                aria-labelledby="example-modal-sizes-title-lg"
                dialogClassName={loading ? 'width-fit-content' : ''}
                backdrop={loading ? 'static' : true}
                centered
                onHide={() => setShowModalConfirm(false)}
            >
                <Modal.Body className="overlay overlay-block cursor-default text-center" style={{ position: 'relative' }}>
                    {
                        loading && <>
                            <div className="mb-4" >{formatMessage({defaultMessage:'Đang thực hiện'})}</div>
                            <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                        </>
                    }
                    {!loading && <>
                        <i
                            className="far fa-times-circle"
                            onClick={() => setShowModalConfirm(false)}
                            style={{ position: 'absolute', top: -12, right: -10, fontSize: 30, color: 'red', cursor: 'pointer', borderRadius: '50%', background: '#fff' }}
                        />
                        <div className="mb-6" >{formatMessage({defaultMessage:'Đồng bộ những thông tin vừa sửa cho sản phẩm trên sàn'})}</div>
                        <div className="form-group mb-0" style={{ marginTop: 20 }}>
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-elevate mr-3"
                                style={{ width: 150 }}
                                onClick={() => {
                                    onUpdate(0);
                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Để sau'})}</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ width: 150 }}
                                onClick={e => {
                                    e.preventDefault();
                                    onUpdate(1);
                                }}
                            >
                                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Đồng bộ'})}</span>
                            </button>
                        </div>
                    </>}
                </Modal.Body>
            </Modal>

            <Modal
                show={productsConnected?.length > 0}
                aria-labelledby="example-modal-sizes-title-sm"
                centered
                onHide={() => setProductsConnected([])}
                backdrop={true}
                dialogClassName={'body-dialog-connect'}
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                    {formatMessage({defaultMessage:'Sản phẩm liên kết'})}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                    <div style={{ maxHeight: 450, overflowY: 'auto' }}>
                        {productsConnected?.map(
                            (_product, index) => {
                                console.log({ _product })

                                let _store = optionsStore?.find(store => store.value == _product?.store_id) || {};
                                let imgOrigin = (_product?.productAssets || [])?.filter(_asset => _asset.type == 4)?.map(
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

                                const imgAvatar = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (_product?.productAssets || [])?.filter(_asset => _asset.type == 1)[0]

                                return (
                                    <div
                                        style={productsConnected?.length - 1 == index ? { padding: '0rem 1rem 0rem 1rem' } : { padding: '0rem 1rem 1rem 1rem' }}
                                        key={`choose-connect-${index}`}
                                    >
                                        <div className='row' style={{ borderBottom: '1px solid #dbdbdb', padding: '6px 1rem 0px', alignItems: 'center' }}>
                                            <div className='col-10'>
                                                <div style={{ verticalAlign: 'top', display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                                                    <div style={{
                                                        backgroundColor: '#F7F7FA',
                                                        width: 60, height: 60,
                                                        borderRadius: 2,
                                                        overflow: 'hidden',
                                                        border: 'none',
                                                        minWidth: 60
                                                    }} className='mr-6' >
                                                        <img
                                                            src={imgAvatar?.merged_image_url || imgAvatar?.sme_url}
                                                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <InfoProduct
                                                            name={_product?.name}
                                                            sku={_product?.sku}
                                                            url={`/products/edit/${_product?.id}`}
                                                        />
                                                        <p className="mt-1 d-flex align-items-center" >
                                                            <img
                                                                style={{ width: 10, height: 10 }}
                                                                src={_store?.logo}
                                                                className="mr-2"
                                                            />
                                                            <span >{_store?.label}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                    <div className="form-group">
                        <button
                            type="button"
                            onClick={() => setProductsConnected([])}
                            className="btn btn-primary btn-elevate mr-3 mt-6"
                            style={{ width: 100 }}
                        >
                            OK
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>

            <Card>
                <CardBody>
                    <div className="mb-2 fv-plugins-message-container">
                        <div className="fv-help-block " ><i className="fv-help-block  flaticon2-warning font-weight-boldest" />&ensp;
                        {formatMessage({defaultMessage:'Lưu ý: Những sản phẩm sàn đang liên kết kho mà có ảnh gốc đã áp khung thì sẽ không được cập nhật dữ liệu từ sản phẩm kho sang'})}
                        </div>
                    </div>
                    <div className="row d-flex justify-content-end align-items-end mb-8">
                                            <div className="col-2">
                                                <button
                                                    className="btn btn-primary"
                                                    type="submit"
                                                    style={{ width: '100%', height: 36 }}
                                                    onClick={async (e) => {
                                                        setProducts(prev => {
                                                            return prev?.map(_pro => {
                                                                const selectTags = dataTagsSetAll?.flatMap(tag => {
                                                                    if(!_pro.tags?.map(tg => tg?.value)?.includes(tag?.value)) {
                                                                        return tag
                                                                    }
                                                                    return []
                                                                })
        
                                                                return {
                                                                    ..._pro,
                                                                    tags: dataTagsSetAll?.length ? [...(_pro.tags || []), ...selectTags] : []
                                                                }
                                                            })
                                                        })

                                                    }}
                                                >
                                                    {formatMessage({ defaultMessage: 'Áp dụng cho tất cả' })}
                                                </button>
                                            </div>
                                            <div className="col-2 d-flex flex-column" style={{zIndex: 96}}>
                                                <span className="mb-1">{formatMessage({ defaultMessage: 'Tag' })}</span>
                                                <CreatableSelect
                                                    placeholder={formatMessage({ defaultMessage: "Nhập tag tương ứng" })}
                                                    isMulti
                                                    isClearable
                                                    value={dataTagsSetAll}
                                                    onChange={value => {
                                                        if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                                                            removeAllToasts();
                                                            addToast(formatMessage({ defaultMessage: 'Tag sản phẩm tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                                                            return;
                                                        }
                                                        setDataTagsSetAll(value)
                                                    }}
                                                    options={optionsProductTag}
                                                    formatCreateLabel={(inputValue) => formatMessage({ defaultMessage: "Tạo mới: {value}" }, { value: inputValue })}
                                                />
                                            </div>
    
                                </div>
                    <div
                        style={{
                            boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                            // height: "calc(100vh - 340px)",
                            borderRadius: 6,
                            marginTop: 10,
                            width: '100%',
                            // overflowY: 'scroll'
                        }}
                    >
                        <table className="table table-borderless  table-vertical-center fixed" style={{ tableLayout: 'fixed', borderCollapse: 'collapse', position: 'relative' }}>
                            <thead style={{ background: '#f3f8fa' }}>
                                <tr>
                                    <th style={{
                                        border: '1px solid #D9D9D9', borderRight: 'none',
                                        width: "50%", padding: 16,
                                        fontSize: '14px'

                                    }}>
                                        {formatMessage({defaultMessage:'Tên sản phẩm'})}
                                    </th>
                                    <th style={{
                                        border: '1px solid #D9D9D9', borderLeft: 'none', borderRight: 'none',
                                        padding: 16, width: '25%',
                                        fontSize: '14px'
                                    }}>
                                        Tag
                                    </th>
                                    <th style={{
                                        border: '1px solid #D9D9D9', borderLeft: 'none',
                                        padding: 16, width: '25%',
                                        fontSize: '14px'
                                    }}>
                                        {formatMessage({defaultMessage:'Ảnh gốc'})}
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip>
                                                    {formatMessage({defaultMessage:'Ảnh sản phẩm gốc là ảnh sản phẩm trên nền trắng. Tỉ lệ ảnh 1:1. Ảnh sản phẩm gốc được dùng để ghép với các khung ảnh mẫu làm ảnh cover chạy chiến dịch.'})}
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
                                                            window.open(`/products/edit/${_product.id}`, '_blank')
                                                        }}
                                                        className='mr-6'
                                                    >
                                                        <img
                                                            src={_product?.imgAssets?.asset_url || ""}
                                                            style={{ width: 80, height: 80, objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                    <div className="w-100">
                                                        <InfoProduct
                                                            name={_product?.name}
                                                            sku={_product?.sku}
                                                            url={`/products/edit/${_product?.id}`}
                                                        />

                                                        <a
                                                            style={{ color: '#ff5629' }}
                                                            onClick={() => onShowProductMapping(_product?.scProductMapping)}
                                                        >
                                                            {_product?.scProductMapping?.length || 0} {formatMessage({defaultMessage:'liên kết'})}
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='pt-6 pb-1'>
                                                <CreatableSelect
                                                    placeholder={formatMessage({defaultMessage:"Nhập tag sản phẩm"})}
                                                    isMulti
                                                    isClearable
                                                    value={_product?.tags || []}
                                                    onChange={value => {
                                                        if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                                                            removeAllToasts();
                                                            addToast(formatMessage({defaultMessage:'Tag sản phẩm tối đa chỉ được 255 ký tự'}), { appearance: 'error' });
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
                                                    formatCreateLabel={(inputValue) => `${formatMessage({defaultMessage:'Tạo mới'})}: "${inputValue}"`}
                                                />
                                            </td>
                                            <td className='pt-6 pb-1'>
                                                <ImageUpload
                                                    accept={".png, .jpg, .jpeg"}
                                                    data={_product.imageOrigin}
                                                    multiple={false}
                                                    allowRemove
                                                    allowDowload
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
                                                    onOpenCrop={(url, onCrop) => {
                                                        setDataCrop({ url, onCrop, maxSize: 5000 })
                                                    }}
                                                    validateFile={({ width, height, size }) => {
                                                        let hasError = validateImageOrigin({ width, height, size, channel: 'lazada' })
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
                                history.push('/products/list');
                            }}
                        >
                            {formatMessage({defaultMessage:'Hủy bỏ'})}
                        </button>
                        <button
                            className="btn btn-primary"
                            // type="submit"
                            style={{ minWidth: 150 }}
                            onClick={() => {
                                let errors = [];

                                let productBodyUpdate = products?.map(
                                    (_product, index) => {
                                        if (_product?.imageOrigin?.isUploading) {
                                            if (!errors?.some(_error => _error.key === index)) {
                                                errors = errors.concat([{
                                                    key: index,
                                                    title: formatMessage({defaultMessage:'Ảnh gốc đang tải lên. Xin vui lòng thử lại sau.'})
                                                }])
                                            }
                                        };

                                        if (_product?.imageOrigin?.hasError) {
                                            if (!errors?.some(_error => _error.key === index)) {
                                                errors = errors.concat([{
                                                    key: index,
                                                    title: formatMessage({defaultMessage:'Ảnh gốc tải lên không hợp lệ. Xin vui lòng thử lại sau.'})
                                                }])
                                            }
                                        };

                                        let tags = _product?.tags?.map(
                                            _tag => {
                                                let { value, label } = _tag;
                                                if (_tag?.__isNew__) {
                                                    return {
                                                        title: label
                                                    }
                                                }
                                                return {
                                                    id: value,
                                                    title: label
                                                }
                                            }
                                        ) || [];
                                        let imageOrigin = !!_product.imageOrigin && !!_product.imageOrigin.id
                                            ? { asset_id: _product.imageOrigin.id, url: _product.imageOrigin.source, positionShow: 0 }
                                            : null;

                                        return {
                                            product_id: _product.id,
                                            product_image_origin: imageOrigin,
                                            tags
                                        }
                                    }
                                );

                                if (errors.length > 0) {
                                    setShowModalConfirm(false)
                                    setErrorMessage(errors);
                                    return;
                                } else {
                                    setErrorMessage([]);
                                    setShowModalConfirm(true)
                                }

                            }}
                        >
                            {formatMessage({defaultMessage:'Lưu lại'})}
                        </button>
                    </div>
                </CardBody>
            </Card>
        </Fragment>
    )
};

export default memo(ProductUpdateTagImage);