import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import axios from "axios";
import { ChromePicker, SwatchesPicker, TwitterPicker } from 'react-color';

export default memo(({ setCurrentStep, setCurrentBackground }) => {    
    const [currentColorQuick, setCurrentColorQuick] = useState('#FFFFFF');
    const [currentColorPicker, setCurrentColorPicker] = useState('#FFFFFF');
    const [uploading,] = useState(false);

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
                <div className='col-6' style={{ cursor: uploading ? 'not-allowed' : 'unset' }}>
                    <ChromePicker
                        color={currentColorPicker}
                        width={240}
                        onChangeComplete={value => {
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
                            style={{ background: _item, width: 52, height: 52, cursor: uploading ? 'not-allowed' : 'pointer', border: currentColorQuick === _item ? `2px solid #ff5629` : 'unset', boxShadow: currentColorQuick === _item ? 'rgb(0 0 0 / 25%) 0px 1px 4px' : 'unset' }}
                            onClick={e => {
                                e.preventDefault();                                
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
                            setCurrentBackground(currentColorPicker);
                            setCurrentStep('frame-image');
                        }}
                    >
                        <span className="font-weight-boldest">XÁC NHẬN</span>
                    </button>
                </div>
            </div>
        </div>
    )
});