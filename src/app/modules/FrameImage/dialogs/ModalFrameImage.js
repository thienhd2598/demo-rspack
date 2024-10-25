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


const ModalFrameImage = memo(({
    show,
    onHide,
    onSelect,
    currentFrame
}) => {
    const { formatMessage } = useIntl();
    const history = useHistory();
    const { addToast } = useToasts();
    const [searchText, setSearchText] = useState('');
    const [currentFrameUrl, setCurrentFrameUrl] = useState(null);

    useMemo(() => {
        if (!!show && !!currentFrame) {
            setCurrentFrameUrl(currentFrame)
        }
    }, [show, currentFrame]);

    const { data, loading: loadingPhotoFrame, refetch } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            where: {
                _or: [{ name: { _iregex: searchText.trim().replace(/%/g, '') } }],
            },
        },
        fetchPolicy: 'cache-and-network'
    });

    const onCloseModal = () => {
        onHide();
        setCurrentFrameUrl(null);
        setSearchText('');
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
                <div className="mt-6 mb-4 text-center font-weight-bold px-9" style={{ fontSize: 16 }} >{formatMessage({ defaultMessage: 'Chọn khung ảnh mẫu' })}</div>
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
                                                        style={{ position: 'relative', border: currentFrameUrl?.id == item?.id ? '1px solid #ff5629' : '', borderRadius: 4 }}
                                                        onClick={() => {
                                                            setCurrentFrameUrl({
                                                                url: item?.asset_url,
                                                                id: item?.id
                                                            })
                                                        }}
                                                    >
                                                        <HoverImage
                                                            styles={{ borderRadius: 4, objectFit: 'contain', cursor: 'pointer', marginRight: 10 }}
                                                            size={{ width: 320, height: 320 }}
                                                            defaultSize={{ width: 75, height: 75 }}
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
                            disabled={!currentFrameUrl}
                            onClick={async e => {
                                e.preventDefault();

                                onSelect(currentFrameUrl);
                                onCloseModal();
                            }}
                        >
                            <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Chọn' })}</span>
                        </button>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    )
}
);

export default ModalFrameImage;