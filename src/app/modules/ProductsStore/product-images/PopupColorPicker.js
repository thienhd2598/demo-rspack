import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import axios from "axios";
import { ChromePicker, SwatchesPicker, TwitterPicker } from 'react-color';

const CancelToken = axios.CancelToken;
const MAX_SIZE_QUICK_PICKER = 14;

export default memo(({ setCurrentStep, source, current, frameUrl, onApply }) => {
    const [uploading, setUploading] = useState(false);
    const [currentColorQuick, setCurrentColorQuick] = useState('#FFFFFF');
    const [currentColorPicker, setCurrentColorPicker] = useState('#FFFFFF');
    const [previewImg, setPreviewImg] = useState('');
    const [error, setError] = useState();
    const refCancelMerged = useRef();    

    const _mergeFrame = async (_source, _frame, _color = '#FFFFFF') => {
        setUploading(true)
        try {
            let res = await axios.post(process.env.REACT_APP_URL_MERGE_FRAME_PHOTO, {
                "originUrl": _source,
                "frameUrl": _frame,
                "background": _color
            }, {
                cancelToken: new CancelToken(function executor(c) {
                    refCancelMerged.current = c;
                }),
            })
            if (res.data.success) {
                setError(null)
                requestAnimationFrame(() => {
                    setPreviewImg(res.data.data.source);                    
                })
            } else {
                setError('Gặp lỗi trong quá trình thêm khung ảnh')
            }

            setUploading(false)
        } catch (error) {
            console.log('error', error)
            setError('Gặp lỗi trong quá trình thêm khung ảnh')
        } finally {
            setUploading(false)
        }
    };

    // useEffect(
    //     () => {
    //         if (!frameUrl || !source) return;
    //         _mergeFrame(source, frameUrl);
    //     }, [frameUrl, source]
    // );

    const dataQuickColor = useMemo(
        () => {
            let dataFake = [];
            let arrQuickColor = [];
            if (dataFake?.length >= MAX_SIZE_QUICK_PICKER) {
                arrQuickColor = [
                    ...dataFake.slice(0, MAX_SIZE_QUICK_PICKER - 1)
                ];
            } else {
                arrQuickColor = [
                    ...dataFake,
                    ...Array.from({ length: MAX_SIZE_QUICK_PICKER - dataFake?.length }).fill('')
                ];
            }

            return arrQuickColor || []
        }, []
    );    

    return (
        <div className='upbase-color-picker p-6'>
            <div className='upbase-color-picker--header'>
                <i
                    className="upbase-color-picker--header-icon fas fa-angle-left"
                    onClick={e => {
                        e.preventDefault();
                        setCurrentStep('frame-image');
                    }}
                />
                Chọn màu nền cho ảnh gốc
            </div>
            <div className='mt-8 row d-flex justify-content-center'>
                {/* <div className='col-6' style={{ position: 'relative' }}>
                    <div
                        className='upbase-color-picker--preview-img'
                        style={{ backgroundImage: `url(${previewImg})` }}
                    />
                    {uploading && (
                        <div className='image-input' style={{
                            position: 'absolute',
                            top: 0, left: "10px", right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }} >
                            <span className="mr-6 spinner spinner-white"></span>
                        </div>
                    )}
                </div> */}
                <div className='col-6' style={{ cursor: uploading ? 'not-allowed' : 'unset' }}>
                    <ChromePicker
                        color={currentColorPicker}
                        width={240}
                        onChangeComplete={value => {
                            // if (uploading) return;
                            // _mergeFrame(source, frameUrl, value?.hex);
                            setCurrentColorPicker(value?.hex || '');
                            setCurrentColorQuick('');
                        }}
                    />
                </div>
            </div>
            <div className='mt-6 p-5 my-4 d-flex align-items-center' style={{ gap: '10px 20px', flexWrap: 'wrap', background: '#f0f2f5', borderRadius: 2 }}>
                {['#D0021B', '#F5A623', '#F8E71C', '#8B572A', '#7ED321', '#417505', '#BD10E0', '#9013FE', '#4A90E2', '#50E3C2', '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF']?.map(
                    _item => (
                        <div
                            style={{ background: _item, width: 50, height: 50, cursor: uploading ? 'not-allowed' : 'pointer', border: currentColorQuick === _item ? `2px solid #ff5629` : 'unset', boxShadow: currentColorQuick === _item ? 'rgb(0 0 0 / 25%) 0px 1px 4px' : 'unset' }}
                            onClick={e => {
                                e.preventDefault();
                                // if (uploading) return;
                                // _mergeFrame(source, frameUrl, _item);
                                setCurrentColorPicker(_item);
                                setCurrentColorQuick(_item);
                            }}
                        />
                    )
                )}                
            </div>
            <div className='mt-8 text-center'>
                <div className="form-group mb-0">
                    <button
                        className="btn btn-light btn-elevate mr-3"
                        style={{ width: 200 }}
                        onClick={e => {
                            e.preventDefault();
                            setCurrentStep('frame-image');
                        }}
                    >
                        <span className="font-weight-boldest">HUỶ</span>
                    </button>
                    <button
                        className={`btn btn-primary font-weight-bold`}
                        style={{ width: 200 }}
                        onClick={e => {
                            e.preventDefault();
                            !!onApply && onApply(frameUrl, 2, currentColorPicker);
                        }}
                    >
                        <span className="font-weight-boldest">XÁC NHẬN</span>
                    </button>
                </div>
            </div>
        </div>
    )
});