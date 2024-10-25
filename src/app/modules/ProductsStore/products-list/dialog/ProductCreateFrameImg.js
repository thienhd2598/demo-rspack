import React, { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { useHistory } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import query_sme_catalog_photo_frames from '../../../../../graphql/query_sme_catalog_photo_frames';
import mutate_scProductFrameImages from '../../../../../graphql/mutate_scProductFrameImages';
import query_sc_composite_image_sync from '../../../../../graphql/query_sc_composite_image_sync';
import Pagination from '../../../../../components/PaginationModal';
import { useProductsUIContext } from '../../ProductsUIContext';
import { Link } from "react-router-dom";
import _ from 'lodash';
import ProductPickColor from './ProductPickColor';
import { OPTIONS_CONNECTED } from '../../ProductsUIHelpers';
import { useIntl } from 'react-intl';


const ProductCreateFrameImg = memo(({
    show,
    ids,
    onHide,
    setSyncImg
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { setIds } = useProductsUIContext();
    const { addToast } = useToasts();
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [selectedApplyCover, setSelectedApplyCover] = useState(4);
    const [selectedApplyBgUrl, setSelectedApplyBgUrl] = useState(0);
    const [currentFrameUrl, setCurrentFrameUrl] = useState('');
    const [currentFrame, setCurrentFrame] = useState(null);
    const [currentBackground, setCurrentBackground] = useState('');
    const [idJobSync, setIdJobSync] = useState(null);
    const [page, setPage] = useState(1);
    const optionApplyCover = [
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh gốc' }), value: 4 },
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh bìa' }), value: 1 },
        { title: formatMessage({ defaultMessage: 'Áp dụng cho tất cả hình ảnh' }), value: 2 },
    ];

    const optionApplyBgUrl = [
        { title: formatMessage({ defaultMessage: 'Khung đè lên ảnh' }), value: 0 },
        { title: formatMessage({ defaultMessage: 'Ảnh đè lên khung' }), value: 1 },
    ];
    let limit = 25;

    const { data, loading: loadingPhotoFrame, refetch } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            // limit,
            // offset: (page - 1) * limit,
            where: {
                _or: [{ name: { _iregex: searchText.trim().replace(/%/g, '') } }],
            },
        },
        fetchPolicy: 'cache-and-network'
    });    

    const { data: dataSync, loading: loadingSync } = useQuery(query_sc_composite_image_sync, {
        variables: {
            id: idJobSync            
        },        
        skip: !idJobSync,
        fetchPolicy: 'cache-and-network',
        pollInterval: !idJobSync ? 0 : 500
    });

    const [createFrameImage, { loading: loadingCreateFrameImage }] = useMutation(mutate_scProductFrameImages, {
        refetchQueries: ['ScGetSmeProducts', 'sc_composite_image_sync'],
        awaitRefetchQueries: true,
    });

    const totalRecord = data?.sme_catalog_photo_frames_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit)

    useEffect(
        () => {
            if ((dataSync?.sc_composite_image_sync?.total_fail + dataSync?.sc_composite_image_sync?.total_success) == dataSync?.sc_composite_image_sync?.total_product) {
                setTimeout(
                    () => {
                        setIdJobSync(null);
                        setIds([]);
                        // addToast(formatMessage({ defaultMessage: "Đã cập nhật khung ảnh cho sản phẩm" }), { appearance: 'success' })
                    }, 200
                )
            }
        }, [dataSync, setIdJobSync]
    );

    useMemo(
        () => {
            if (!dataSync?.sc_composite_image_sync) {
                // setSyncImg(null);
                return;
            }

            setSyncImg({
                dataSync,
                current: dataSync?.sc_composite_image_sync?.total_fail + dataSync?.sc_composite_image_sync?.total_success,
                total: dataSync?.sc_composite_image_sync?.total_product
            })
        }, [dataSync?.sc_composite_image_sync]
    );

    const onCloseModal = () => {
        setSelectedApplyCover(4);
        setSelectedApplyBgUrl(0);
        onHide();
        setCurrentFrameUrl('');
        setCurrentFrame(null);
        setCurrentBackground('');
        setSearchText('');
    };    

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onCloseModal}
            backdrop={loadingCreateFrameImage ? 'static' : true}
            dialogClassName={loadingCreateFrameImage ? 'width-fit-content' : ''}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={loadingCreateFrameImage || !!error ? {} : { padding: 0 }}>
                {loadingCreateFrameImage && <div className='text-center'>
                    <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
                    <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
                </div>}
                {!loadingCreateFrameImage && !error && (
                    <>
                        <div className="mt-6 mb-4 text-center font-weight-bold px-9" style={{ fontSize: 16 }} >{formatMessage({ defaultMessage: 'Thêm khung ảnh hàng loạt' })}</div>
                        <div className="input-icon m-4">
                            <input
                                type="text"
                                style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)', borderRadius: 20 }}
                                className="form-control"
                                placeholder={formatMessage({ defaultMessage: "Nhập tên khung ảnh mẫu" })}
                                onChange={e => {
                                    setSearchText(e.target.value)
                                }}
                            />
                            <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                        </div>
                        <div className='row py-2 px-4 d-flex align-items-center'>
                            <div className="col-5">
                                <select
                                    className="form-control"
                                    onChange={e => {
                                        setCurrentFrameUrl('');
                                        setCurrentFrame('');
                                        setSelectedApplyCover(e.target.value);
                                    }}
                                >
                                    {optionApplyCover?.map(
                                        (_option, index) => <option
                                            key={`option-${index}`}
                                            value={_option.value}
                                        >
                                            {_option?.title}
                                        </option>
                                    )}
                                </select>
                            </div>
                            <div className="col-5">
                                <select
                                    className="form-control"
                                    onChange={e => {
                                        setSelectedApplyBgUrl(e.target.value);
                                    }}
                                >
                                    {optionApplyBgUrl?.map(
                                        (_option, index) => <option
                                            key={`option-${index}`}
                                            value={_option.value}
                                        >
                                            {_option?.title}
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="m-4 mb-8 d-flex justify-content-between align-items-center">
                            <div className='d-flex align-items-center'>
                                <span className="mr-2">{formatMessage({ defaultMessage: 'Chọn khung ảnh' })}</span>
                                <i
                                    className="fas fa-sync ml-6 mt-1"
                                    style={{ cursor: "pointer", fontSize: 14 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        refetch();
                                    }}
                                />
                            </div>
                            <Link to={'/frame-image/new'} target="_blank">
                                <span
                                    className='text-primary'
                                >
                                    +&ensp;{formatMessage({ defaultMessage: 'Thêm mẫu' })}
                                </span>
                            </Link>
                        </div>
                        {
                            loadingPhotoFrame ? <div className='mt-10 text-center' style={{ height: 250 }}>
                                <span className="spinner spinner-primary mb-8"></span>
                            </div> : (
                                <>
                                    {data?.sme_catalog_photo_frames?.length > 0 ? (
                                        <div
                                            className="pl-4 pr-4 d-flex flex-wrap"
                                            style={{ height: 250, overflowY: 'auto' }}
                                        >
                                            {
                                                data?.sme_catalog_photo_frames?.map(
                                                    (item, index) => (
                                                        <div
                                                            key={`indexindex-${index}`}
                                                            className="d-flex mr-5 mb-5"
                                                            style={{ flexDirection: 'column', maxWidth: 75 }}
                                                        >
                                                            <div
                                                                key={`catalog-frame-img-${index}`}
                                                                className="mb-1"
                                                                style={{ position: 'relative', border: currentFrame?.id == item?.id ? '1px solid #ff5629' : '', borderRadius: 4 }}
                                                                onClick={() => {
                                                                    setCurrentFrameUrl(item?.asset_url)
                                                                    setCurrentFrame(item)
                                                                }}
                                                            >
                                                                <img
                                                                    style={{ width: 75, height: 75, objectFit: 'contain', borderRadius: 4, cursor: 'pointer' }}
                                                                    src={item?.asset_url}
                                                                />
                                                                {currentFrame?.id == item?.id && (
                                                                    <i
                                                                        className='fas fa-check-circle text-primary'
                                                                        style={{ fontSize: 18, marginBottom: 8, position: 'absolute', top: 8, right: 6 }}
                                                                    ></i>
                                                                )}
                                                            </div>
                                                            <p className="frame-image-name">{item.name || ''}</p>
                                                        </div>
                                                    )
                                                )
                                            }
                                        </div>
                                    ) : (
                                        <div
                                            className='text-center py-16'
                                            style={{ height: 250 }}
                                        >
                                            {formatMessage({ defaultMessage: 'Chưa có khung ảnh mẫu nào' })}
                                        </div>
                                    )}
                                </>
                            )
                        }
                        {/* <div>
                            <Pagination
                                page={page}
                                totalPage={totalPage}
                                loading={loadingPhotoFrame}
                                limit={limit}
                                totalRecord={totalRecord}
                                count={data?.sme_catalog_photo_frames?.length}
                                onPanigate={(page) => setPage(page)}
                                emptyTitle='Chưa có khung ảnh nào'
                            />
                        </div> */}
                        <div className="form-group mb-8 text-center" style={{ marginTop: 20 }}>
                            <button
                                type="button"
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 150 }}
                                onClick={onCloseModal}
                            >
                                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đóng' })}</span>
                            </button>
                            {data?.sme_catalog_photo_frames?.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-primary ml-3"
                                    style={{ width: 150 }}
                                    disabled={currentFrameUrl == ''}
                                    onClick={async e => {
                                        e.preventDefault();

                                        let { data } = await createFrameImage({
                                            variables: {
                                                apply_type: Number(selectedApplyCover),
                                                products: ids,
                                                option: Number(selectedApplyBgUrl),
                                                frame_url: currentFrameUrl,
                                                frame_static: currentFrame?.is_static,
                                                frame_shape: currentFrame?.shape
                                            }
                                        })

                                        onCloseModal();
                                        if (!!data?.scProductFrameImages?.success) {
                                            setIdJobSync(data?.scProductFrameImages?.job_id);
                                        } else {
                                            addToast(data?.scProductFrameImages?.message || formatMessage({ defaultMessage: 'Thêm khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
                                        }
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Áp dụng' })}</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
                {
                    !loadingCreateFrameImage && !!error && (
                        <>
                            <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                            <div className="mb-4" ></div>
                            <div className="mb-4" >{formatMessage({ defaultMessage: 'Tạo khung ảnh không thành công' })}</div>
                            <p className='text-center'>{formatMessage({ defaultMessage: 'Bạn vui lòng thử lại hoặc liên hệ bộ phận CSKH của UpBase để được hỗ trợ' })}</p>
                            <div  >
                                <button
                                    type="button"
                                    onClick={onCloseModal}
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 150 }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Huỷ' })}</span>
                                </button>
                                <button
                                    id="kt_login_signin_submit"
                                    className={`btn btn-primary font-weight-bold px-9 `}
                                    style={{ width: 150 }}
                                    onClick={e => {
                                        setError(null)
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Thử lại' })}</span>
                                </button>
                            </div>
                        </>
                    )
                }
            </Modal.Body>
        </Modal>
    )
}
);

export default ProductCreateFrameImg;