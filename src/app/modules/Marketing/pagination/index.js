/*
 * Created by duydatpham@gmail.com on 24/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import queryString from 'querystring';
import {useIntl} from 'react-intl'

const optionsPagination = [
    { label: 25, value: 25 },
    { label: 50, value: 50 },
    { label: 100, value: 100 },
];

export default memo(({
    page, totalPage, loading,
    limit, totalRecord, count, showOptions = true,
    basePath, emptyTitle = 'Danh sách trống.', isShowEmpty = true, options = []
}) => {
    const {formatMessage} = useIntl()
    const history = useHistory()
    const params = queryString.parse(useLocation().search.slice(1, 100000))
    if (totalPage <= 0) {
        return <>
            {!loading && isShowEmpty && <div className='text-center my-8' ><span className="text-muted">{emptyTitle}</span></div>}
            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div className="d-flex align-items-center py-3 px-3">
                    {
                        loading && <div className="d-flex align-items-center">
                            <div className="mr-2 text-muted">{formatMessage({defaultMessage: 'Đang tải'})}...</div>
                            <div className="spinner spinner-success mr-10"></div>
                        </div>
                    }
                    <span className="text-muted">{formatMessage({defaultMessage: 'Hiển thị'})} 0 - 0 {formatMessage({defaultMessage: 'của'})} 0</span>
                </div>
            </div>
        </>
    };

    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center py-3 px-3">
                {
                    loading && <div className="d-flex align-items-center">
                        <div className="mr-2 text-muted">{formatMessage({defaultMessage: 'Đang tải'})}...</div>
                        <div className="spinner spinner-success mr-10"></div>
                    </div>
                }

                <select
                    className="form-control form-control-md text-primary font-weight-bold mr-4 border-0 bg-light-primary"
                    value={limit}
                    disabled={!showOptions}
                    onChange={e => {                        
                        history.push(`${basePath}?${queryString.stringify({
                            ...params,
                            page: 1,
                            limit: e.target.value
                        })}`)
                    }}
                >
                    {(options?.length > 0 ? options : optionsPagination)?.map(
                        _option => <option
                            key={`option-pagination-${_option.value}`}
                            value={_option.value}
                        >
                            {`${_option.value} ${formatMessage({defaultMessage: 'bản ghi/trang'})}`}
                        </option>
                    )}
                </select>
                <span className="text-muted" style={{ minWidth: 150 }}>{formatMessage({defaultMessage: 'Hiển thị'})} {(page - 1) * limit + 1} - {(page - 1) * limit + count} {!!totalRecord ? `${formatMessage({defaultMessage: 'của'})} ${totalRecord}` : ''}</span>
            </div>
            <div className="d-flex flex-wrp py-2 mr-3">
                {page > 1 && <Link to={`${basePath}?${queryString.stringify({
                    ...params,
                    page: 1,
                    limit
                })}`} className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"><i className="ki ki-bold-double-arrow-back icon-xs"></i></Link>}
                {page > 1 && <Link to={`${basePath}?${queryString.stringify({
                    ...params,
                    page: page - 1,
                    limit
                })}`} className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"><i className="ki ki-bold-arrow-back icon-xs"></i></Link>}

                {page > 3 && <a href="#" className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1">...</a>}
                {
                    [page - 1, page, page + 1, page + 2].filter(_page => _page > 0 && _page <= totalPage).map(_page => {
                        if (_page == page) {
                            return <Link key={`page--${_page}`} to={`${basePath}?${queryString.stringify({
                                ...params,
                                page: _page,
                                limit
                            })}`} className="btn btn-icon btn-sm border-0 btn-hover-primary active mr-2 my-1">{_page}</Link>
                        }
                        return <Link key={`page--${_page}`} to={`${basePath}?${queryString.stringify({
                            ...params,
                            page: _page,
                            limit
                        })}`} className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1">{_page}</Link>
                    })
                }
                {page < totalPage - 4 && <a href="#" className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1">...</a>}

                {page < totalPage && <Link to={`${basePath}?${queryString.stringify({
                    ...params,
                    page: page + 1,
                    limit
                })}`} className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"><i className="ki ki-bold-arrow-next icon-xs"></i></Link>}
                {page < totalPage && <Link to={`${basePath}?${queryString.stringify({
                    ...params,
                    page: totalPage,
                    limit
                })}`} className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"><i className="ki ki-bold-double-arrow-next icon-xs"></i></Link>}
            </div>
        </div>
    )
})