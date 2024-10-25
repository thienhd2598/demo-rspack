import React, { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { useHistory } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { Link } from "react-router-dom";
import _ from 'lodash';
import { useIntl } from 'react-intl';
import query_sme_catalog_photo_frames from '../../../../graphql/query_sme_catalog_photo_frames';
import HoverImage from '../../../../components/HoverImage';
import query_sme_catalog_photo_library_category from '../../../../graphql/query_sme_catalog_photo_library_category';

const ModalFrames = ({
    show,
    onHide,
    onSelect,
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const [searchText, setSearchText] = useState('');
    const [currentFrameUrl, setCurrentFrameUrl] = useState(null);
    const [currentTab, setCurrentTab] = useState({
        label: 'Tất cả',
        value: 0
    })

    const { data: dataPhotoLibCategory, loading } = useQuery(query_sme_catalog_photo_library_category, {
        variables: {
            where: {
                type: {_eq: 1},
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    const tabOptions = useMemo(() => {
        const cateList = dataPhotoLibCategory?.sme_catalog_photo_library_category?.filter(item => !item?.parent_id)?.map(item => {
            return {
                value: item?.id,
                label: item?.name
            }
        })
        return [{label: 'Tất cả', value: 0}].concat(cateList)
    }, [dataPhotoLibCategory])

    console.log(tabOptions)

    const { data, loading: loadingPhotoFrame, refetch } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            where: {
                sme_id: {_eq: 0},
                _and: { name: { _iregex: searchText.trim().replace(/%/g, '') } },
                ...(currentTab?.value ? {category_id: {_eq: currentTab?.value}} : {})
            },
        },
        fetchPolicy: 'cache-and-network'
    });

    const onCloseModal = () => {
        onHide();
        setCurrentFrameUrl(null);
        setSearchText('');
        setCurrentTab({
            value: 0, label: 'Tất cả'
        })
    };

    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onCloseModal}
            backdrop={true}
            dialogClassName={''}
        >
            <Modal.Body className="overlay overlay-block cursor-default" style={{ padding: 0 }}>
                <div className="mt-6 mb-4 text-center font-weight-bold px-9" style={{ fontSize: 16 }} >{formatMessage({ defaultMessage: 'Thêm khung ảnh' })}</div>
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
                <div className="d-flex flex-wrap py-2 ml-4"
                    style={{
                        background: "#fff",
                        zIndex: 1,
                        gap: 20,
                        marginBottom: "5px",
                }}>
                    {!loading && tabOptions?.map(item => {
                        return (<span
                            key={`sub-status-order-${item?.value}`}
                            className="py-2 px-6 d-flex justify-content-between align-items-center"
                            style={{
                            borderRadius: 20,
                            background:
                                currentTab?.value === item?.value
                                ? "#ff6d49"
                                : "#828282",
                            color: "#fff",
                            cursor: "pointer",
                            }}
                            onClick={() => {
                                setCurrentTab(item)
                                setCurrentFrameUrl(null)
                            }}
                        >
                            {item?.label}
                        </span>)
                })}
                </div>
                {data?.sme_catalog_photo_frames?.length > 0 && <div className="m-4 mb-8 d-flex justify-content-between align-items-center">
                    <div className='d-flex align-items-center'>
                        <span className="mr-2">{formatMessage({ defaultMessage: 'Chọn khung ảnh' })}</span>
                        {/* <i
                            className="fas fa-sync ml-6 mt-1"
                            style={{ cursor: "pointer", fontSize: 14 }}
                            onClick={e => {
                                e.preventDefault();
                                refetch();
                            }}
                        /> */}
                    </div>
                </div>}
                {
                    loadingPhotoFrame || loading ? <div className='mt-10 text-center' style={{ height: 250 }}>
                        <span className="spinner spinner-primary mb-8"></span>
                    </div> : (
                        <>
                                <div
                                    className="pl-4 pr-2 d-flex flex-wrap mt-10"
                                    style={{ height: 250, overflowY: 'auto' }}
                                >
                                    {currentTab?.value == 0 && <div
                                        className="d-flex p-2 mb-5 flex-column cursor-pointer"
                                        style={{width: '20%', height: '115px'}}
                                        onClick={() => {
                                            history.push('/frame-image/create-editor');
                                        }}
                                    >
                                        <div
                                        style={{
                                            // position: 'absolute',
                                            // top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: 4,
                                            border: currentFrameUrl?.id === 0 ? '1px solid #ff5629' : '1px solid #e4e6ef'
                                        }}
                                    >
                                        <i className='flaticon2-add-1' style={{ fontSize: 28 }} ></i>
                                        {/* <span style={{ marginTop: 4 }} >{formatMessage({ defaultMessage: 'Tải ảnh lên' })}</span> */}
                                    </div>
                                    <p className='text-center'>Khung mới</p>
                                    </div>}
                                    {
                                        data?.sme_catalog_photo_frames?.length == 0  && currentTab?.value != 0 ? 
                                        <div
                                            className='text-center'
                                            style={{ width: '100%'}}
                                        >
                                            {formatMessage({ defaultMessage: 'Chưa có khung ảnh mẫu trong thư mục' })}
                                        </div>
                                        : (data?.sme_catalog_photo_frames?.map(
                                            (item, index) => (
                                                <div
                                                    key={`indexindex-${index}`}
                                                    className="d-flex p-2 mb-5"
                                                    style={{ flexDirection: 'column', width: '20%'}}
                                                >
                                                    <div
                                                        key={`catalog-frame-img-${index}`}
                                                        className="mb-1"
                                                        style={{ position: 'relative', border: currentFrameUrl?.id == item?.id ? '1px solid #ff5629' : '', borderRadius: 4 }}
                                                        onClick={() => {
                                                            setCurrentFrameUrl(item)
                                                        }}
                                                    >
                                                        <HoverImage
                                                            styles={{ borderRadius: 4, objectFit: 'contain', cursor: 'pointer', marginRight: 10 }}
                                                            size={{ width: 320, height: 320 }}
                                                            defaultSize={{ width: '100%',
                                                            height: '100%', }}
                                                            url={item?.asset_url || ''}
                                                        />
                                                        {currentFrameUrl?.id == item?.id && (
                                                            <i
                                                                className='fas fa-check-circle text-primary'
                                                                style={{ fontSize: 18, marginBottom: 8, position: 'absolute', top: 8, right: 6 }}
                                                            ></i>
                                                        )}
                                                    </div>
                                                    <p className="frame-image-name" title={item?.name || ''}>{item.name || ''}</p>
                                                </div>
                                            )
                                        ))}
                                    
                                </div>
                        </>
                    )
                }
                <div className="form-group mb-8 text-right mr-4" style={{ marginTop: 20 }}>
                    <button
                        type="button"
                        className="btn btn-light btn-elevate mr-3"
                        style={{ width: 150 }}
                        onClick={onCloseModal}
                    >
                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đóng' })}</span>
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary ml-3"
                        style={{ width: 150 }}
                        disabled={!currentFrameUrl}
                        onClick={async e => {
                            e.preventDefault();

                            onSelect(currentFrameUrl);
                            onCloseModal();
                        }}
                    >
                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Tạo khung' })}</span>
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
;

export default ModalFrames;