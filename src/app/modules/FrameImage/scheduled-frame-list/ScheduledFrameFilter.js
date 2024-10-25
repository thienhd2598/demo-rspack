import React, { useState, useCallback, useMemo, Fragment, memo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import Select from "react-select";
import makeAnimated from 'react-select/animated';
import { map } from 'lodash';
import { Dropdown } from 'react-bootstrap';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const animatedComponents = makeAnimated();

const ScheduledFrameFilter = ({ loadingStores, optionsStore, ids, onFinishScheduledFrame, onDeleteScheduledFrame, onRetryScheduledFrame }) => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));

    const currentStore = useMemo(() => {
        let _current = !!params?.store_id
            ? optionsStore?.filter(
                _store => !!_store?.value && params?.store_id?.split(',').some(_param => Number(_param) == _store.value)
            )
            : undefined;

        return _current
    }, [params?.store_id, optionsStore]);

    return (
        <Fragment>
            <div className='row'>
                <div className='col-5'>
                    <div className='d-flex align-items-center'>
                        <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                            {formatMessage({ defaultMessage: 'Gian hàng' })}
                        </span>
                        <Select
                            options={optionsStore}
                            className='w-100 select-report-custom'
                            placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                            components={animatedComponents}
                            isClearable
                            isMulti
                            value={currentStore}
                            isLoading={loadingStores}
                            onChange={values => {
                                const storesPush = values?.length > 0
                                    ? map(values, 'value')?.join(',')
                                    : undefined;

                                history.push(`/frame-image/scheduled-frame?${queryString.stringify({
                                    ...params,
                                    store_id: storesPush,
                                    page: 1
                                })}`.replaceAll('%2C', '\,'))
                            }}
                            formatOptionLabel={(option, labelMeta) => {
                                return <div className='d-flex align-items-center'>
                                    {!!option.logo && <img src={option.logo} style={{ width: 15, height: 15, marginRight: 8 }} />}
                                    <span>{option.label}</span>
                                </div>
                            }}
                        />
                    </div>
                </div>
                <div className='col-7'>
                    <div className='ml-10 row d-flex align-items-center'>
                        <div className='col-2 text-right'>
                            <span className="mr-4" style={{ minWidth: 'fit-content' }}>
                                {formatMessage({ defaultMessage: 'Tên lịch' })}
                            </span>
                        </div>
                        <div className="col-10 pl-0">
                            <div className='input-icon' style={{ height: 'fit-content' }}>
                                <input
                                    type="text"
                                    className="form-control pl-4"
                                    placeholder={formatMessage({ defaultMessage: "Tìm kiếm" })}
                                    style={{ height: 38 }}
                                    onBlur={(e) => {
                                        history.push(`/frame-image/scheduled-frame?${queryString.stringify({
                                            ...params,
                                            q: e.target.value,
                                            page: 1
                                        })}`.replaceAll('%2C', '\,'))
                                    }}
                                    defaultValue={params?.q || ''}
                                    onKeyDown={e => {
                                        if (e.keyCode == 13) {
                                            history.push(`/frame-image/scheduled-frame?${queryString.stringify({
                                                ...params,
                                                q: e.target.value,
                                                page: 1
                                            })}`.replaceAll('%2C', '\,'))
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`mt-4 d-flex align-items-center ${!!params?.status ? 'justify-content-between' : 'justify-content-end'}`}>
                <div className="d-flex align-items-center py-4">
                    {!!params?.status && (
                        <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                            {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                        </div>
                    )}
                    {params?.status == 2 && (
                        <button
                            type="button"
                            className="btn btn-elevate btn-primary ml-4"
                            disabled={ids?.length == 0}
                            style={{
                                color: "white",
                                width: 'max-content',
                                minWidth: 120,
                                background: ids?.length == 0 ? "#6c757d" : "",
                                border: ids?.length == 0 ? "#6c757d" : "",
                            }}
                            onClick={() => onFinishScheduledFrame(params?.status)}
                        >
                            {formatMessage({ defaultMessage: "Kết thúc" })}
                        </button>
                    )}
                    {params?.status == 3 && (
                        <button
                            type="button"
                            className="btn btn-elevate btn-primary ml-4"
                            disabled={ids?.length == 0}
                            style={{
                                color: "white",
                                width: 'max-content',
                                minWidth: 120,
                                background: ids?.length == 0 ? "#6c757d" : "",
                                border: ids?.length == 0 ? "#6c757d" : "",
                            }}
                            onClick={() => onDeleteScheduledFrame(params?.status)}
                        >
                            {formatMessage({ defaultMessage: "Xóa lịch" })}
                        </button>
                    )}
                    {params?.status == 4 && (
                        <button
                            type="button"
                            className="btn btn-elevate btn-primary ml-4"
                            disabled={ids?.length == 0}
                            style={{
                                color: "white",
                                width: 'max-content',
                                minWidth: 120,
                                background: ids?.length == 0 ? "#6c757d" : "",
                                border: ids?.length == 0 ? "#6c757d" : "",
                            }}
                            onClick={onRetryScheduledFrame}
                        >
                            {formatMessage({ defaultMessage: "Thử lại" })}
                        </button>
                    )}
                    {params?.status == 1 && (
                        <Dropdown drop='down'>
                            <Dropdown.Toggle disabled={ids?.length == 0} className={` btn ${ids.length ? 'btn-primary' : 'btn-darkk'}`}>
                                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onFinishScheduledFrame(params?.status)} className="mb-1 d-flex">
                                    {formatMessage({ defaultMessage: "Kết thúc" })}
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => onDeleteScheduledFrame(params?.status)} className="d-flex" >
                                    {formatMessage({ defaultMessage: "Xóa lịch" })}
                                </Dropdown.Item>
                            </Dropdown.Menu>

                        </Dropdown>
                    )}
                </div>

                <AuthorizationWrapper keys={['frame_schedule_action']}>
                    <button
                        className="btn btn-primary d-flex align-items-center"
                        onClick={(e) => {
                            e.preventDefault();
                            history.push('/frame-image/scheduled-frame-create')
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        <span>{formatMessage({ defaultMessage: "Lập lịch" })}</span>
                    </button>
                </AuthorizationWrapper>
            </div>
        </Fragment>
    )
};

export default memo(ScheduledFrameFilter);