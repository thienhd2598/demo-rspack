/*
 * Created by duydatpham@gmail.com on 23/01/2022
 * Copyright (c) 2022 duydatpham@gmail.com
 */
import { useQuery } from "@apollo/client";
import React, { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import query_sme_catalog_photo_frames from "../../../../graphql/query_sme_catalog_photo_frames";
import Pagination from '../../../../components/PaginationModal';
import _ from 'lodash';
import PopupColorPicker from "./PopupColorPicker";
import { useToasts } from "react-toast-notifications";
import { useIntl } from 'react-intl';

export default memo(({ onApply, showFrameImage, productImageOrigin, onCloseFrameImg }) => {
    const { formatMessage } = useIntl();
    const { source } = productImageOrigin || {};
    const { addToast } = useToasts();
    const [currentStep, setCurrentStep] = useState('frame-image');
    const [isApplyCover, setIsApplyCover] = useState(2);
    const [isApplyBgUrl, setIsApplyBgUrl] = useState(0);
    const [currentFrameUrl, setCurrentFrameUrl] = useState('');
    const [currentFrame, setCurrentFrame] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [page, setPage] = useState(1);
    let limit = 25;

    const optionApplyCover = [
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh gốc' }), value: 2 },
        { title: formatMessage({ defaultMessage: 'Chỉ áp dụng cho ảnh bìa' }), value: 1 },
        { title: formatMessage({ defaultMessage: 'Áp dụng cho tất cả hình ảnh' }), value: 0 },
    ];

    const optionApplyBgUrl = [
        { title: formatMessage({ defaultMessage: 'Khung đè lên ảnh' }), value: 0 },
        { title: formatMessage({ defaultMessage: 'Ảnh đè lên khung' }), value: 1 },
    ];

    const { data, loading, refetch } = useQuery(query_sme_catalog_photo_frames, {
        variables: {
            // limit,
            where: {
                sme_id: {_neq : 0},
                _or: [{ name: { _iregex: searchText.trim().replace(/%/g, '') } }],
            },
            // offset: (page - 1) * limit,
        },
        fetchPolicy: 'cache-and-network'
    });

    const totalRecord = data?.sme_catalog_photo_frames_aggregate?.aggregate?.count || 0;
    let totalPage = Math.ceil(totalRecord / limit)

    useEffect(() => {
        setIsApplyCover(2);
        setIsApplyBgUrl(0);

        return () => {
            setCurrentStep('frame-image');
            setCurrentFrameUrl('');
            setCurrentFrame(null);
        }
    }, [showFrameImage]);

    return (
        <div>
            <div className="frame-img-top mt-4">
                <div className="input-icon">
                    <input
                        type="text"
                        style={{ paddingLeft: 'calc(1.5em + 1.3rem + 8px)', borderRadius: 20 }}
                        className="form-control"
                        placeholder="Nhập tên khung ảnh mẫu"
                        onChange={e => {
                            setSearchText(e.target.value)
                        }}
                    />
                    <span><i className="flaticon2-search-1 icon-md ml-6"></i></span>
                </div>
                <div className='row p-2 d-flex align-items-center'>
                    <div className="col-5">
                        <select
                            className="form-control mr-8"
                            onChange={e => {
                                setCurrentFrameUrl('');
                                setCurrentFrame(null);
                                setIsApplyCover(e.target.value);
                            }}
                            value={isApplyCover}
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
                    <div className="col-4">
                        <select
                            className="form-control"
                            onChange={e => {
                                setIsApplyBgUrl(e.target.value);
                            }}
                            value={isApplyBgUrl}
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
                {loading ? <div className='pt-20 text-center' style={{ height: 250 }}>
                    <span className="spinner spinner-primary mb-8"></span>
                </div> : (
                    <>
                        {data?.sme_catalog_photo_frames?.length > 0 ? (
                            <div className="mt-4 d-flex flex-img-frame">
                                {data?.sme_catalog_photo_frames?.map((_frame, _index) => {
                                    return <div
                                        className="d-flex mr-6 mb-6"
                                        key={`sdfsf$-${_index}`}
                                        style={{ flexDirection: 'column', maxWidth: 80 }}
                                    >
                                        <a
                                            key={`_index--${_index}`}
                                            onClick={e => {
                                                e.preventDefault()
                                                setCurrentFrameUrl(_frame.asset_url);
                                                setCurrentFrame(_frame);
                                                return;
                                            }}
                                        >
                                            <img
                                                className="mb-1"
                                                style={{
                                                    width: 80, height: 80,
                                                    border: currentFrame?.id == _frame?.id ? '2px solid #ff5629' : 'unset',
                                                    borderRadius: 4
                                                }}
                                                src={_frame.asset_url}
                                            />
                                        </a>
                                        <p className="frame-image-name">{_frame.name || ''}</p>
                                    </div>
                                })}
                            </div>
                        ) : (
                            <div
                                className='text-center pt-16'
                                style={{ height: 250 }}
                            >
                                {formatMessage({ defaultMessage: 'Chưa có khung ảnh mẫu nào' })}
                            </div>
                        )}
                    </>
                )
                }
            </div>
            {/* <div className="ml-2">
                        <Pagination
                            page={page}
                            totalPage={totalPage}
                            loading={loading}
                            limit={limit}
                            totalRecord={totalRecord}
                            count={data?.sme_catalog_photo_frames?.length}
                            onPanigate={(page) => setPage(page)}
                            emptyTitle='Chưa có khung ảnh nào'
                        />
                    </div> */}
            {/* <div
                        className="text-primary p-4"
                        style={{ display: isApplyCover == 2 && currentFrameUrl ? 'block' : 'none', borderBottom: '1px solid #ebecf3', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        onClick={e => {
                            e.preventDefault();                            
                            setCurrentStep('color-picker');
                        }}
                    >
                        Đổi màu nền ảnh gốc
                    </div> */}
            {/* <div className="frame-img-bottom mb-2 mt-2">
                        <Link to={'/frame-image/new'} target="_blank">
                            <span className="text-primary">+&ensp;Thêm mẫu</span>
                        </Link>
                    </div> */}
            <div className='my-8 text-center'>
                <div className="form-group mb-0">
                    <button
                        className="btn btn-light btn-elevate mr-3"
                        style={{ width: 200 }}
                        onClick={onCloseFrameImg}
                    >
                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'ĐÓNG' })}</span>
                    </button>
                    <button
                        className={`btn btn-primary font-weight-bold`}
                        style={{ width: 200 }}
                        disabled={currentFrameUrl == ''}
                        onClick={e => {
                            e.preventDefault();
                            !!onApply && onApply(currentFrameUrl, isApplyCover, isApplyBgUrl, currentFrame)
                        }}
                    >
                        <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'ÁP DỤNG' })}</span>
                    </button>
                </div>
            </div>
        </div>
    )
})