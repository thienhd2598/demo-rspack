/*
 * Created by duydatpham@gmail.com on 24/06/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo, useMemo } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import queryString from 'querystring'
import { useIntl } from 'react-intl'
export default memo(({
    page, totalPage, loading,
    limit, totalRecord, count,
    quickAdd = false,
    isAddReserve = false,
    basePath, emptyTitle = useIntl().formatMessage({ defaultMessage: 'Danh sách trống.' }),
    onPanigate,
    onSizePage
}) => {
    const history = useHistory()
    const { formatMessage } = useIntl()
    const params = queryString.parse(useLocation().search.slice(1, 100000))
    const optionsPagination = useMemo(
        () => {
            if (!quickAdd) return [
                { label: 25, value: 25 },
                { label: 50, value: 50 },
                { label: 100, value: 100 },
            ]

            if (isAddReserve) return [
                { label: 20, value: 20 }
            ]

            return [
                { label: 24, value: 24 },
                { label: 48, value: 48 },
                { label: 72, value: 72 },
                { label: 96, value: 96 },
            ]
        }, [quickAdd, isAddReserve]
    );
    if (totalPage <= 0) {
        return <>
            {!loading && <div className='text-center my-8' ><span className="text-muted">{emptyTitle}</span></div>}
            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div className="d-flex align-items-center py-3 px-3">
                    {
                        loading && <div className="d-flex align-items-center">
                            <div className="mr-2 text-muted">{formatMessage({ defaultMessage: 'Đang tải' })}...</div>
                            <div className="spinner spinner-success mr-10"></div>
                        </div>
                    }
                    <span className="text-muted">{formatMessage({ defaultMessage: 'Hiển thị 0 - 0 của 0' })}</span>
                </div>
            </div>
        </>
    }
    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap row">
            <div className="d-flex align-items-center py-3 px-3 col-6">
                {
                    loading && <div className="d-flex align-items-center">
                        <div className="mr-2 text-muted">{formatMessage({ defaultMessage: 'Đang tải' })}...</div>
                        <div className="spinner spinner-success mr-10"></div>
                    </div>
                }

                {onSizePage && <select
                    className="form-control form-control-md text-primary font-weight-bold mr-4 border-0 bg-light-primary"
                    value={limit}
                    disabled={isAddReserve}
                    onChange={e => {
                        onSizePage(e.target.value)
                    }}
                >
                    {optionsPagination?.map(
                        _option => <option
                            key={`option-pagination-${_option.value}`}
                            value={_option.value}
                        >
                            {`${_option.value} ${formatMessage({ defaultMessage: 'bản ghi/trang' })}`}
                        </option>
                    )}
                </select>}

                <span className="text-muted col-8">{formatMessage({ defaultMessage: 'Hiển thị' })} {(page - 1) * limit + 1} - {(page - 1) * limit + count} {!!totalRecord ? `của ${totalRecord}` : ''}</span>
            </div>
            <div className="d-flex flex-wrp py-2 col-6 justify-content-end">
                {page > 1 && <a
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"
                    onClick={e => {
                        e.preventDefault();
                        onPanigate(1)
                    }}
                ><i className="ki ki-bold-double-arrow-back icon-xs"></i></a>}
                {page > 1 && <a
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"
                    onClick={e => {
                        e.preventDefault();
                        onPanigate(page - 1)
                    }}
                ><i className="ki ki-bold-arrow-back icon-xs"></i></a>}

                {page > 3 && <a href="#" className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1">...</a>}
                {
                    [page - 1, page, page + 1, page + 2].filter(_page => _page > 0 && _page <= totalPage).map(_page => {
                        if (_page == page) {
                            return <a
                                className="btn btn-icon btn-sm border-0 btn-hover-primary active mr-2 my-1"
                                onClick={e => {
                                    e.preventDefault();
                                    onPanigate(_page)
                                }}
                            >{_page}</a>
                        }
                        return <a
                            className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1"
                            onClick={e => {
                                e.preventDefault();
                                onPanigate(_page)
                            }}
                        >{_page}</a>
                    })
                }
                {page < totalPage - 4 && <a href="#" className="btn btn-icon btn-sm border-0 btn-hover-primary mr-2 my-1">...</a>}

                {page < totalPage && <a
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"
                    onClick={e => {
                        e.preventDefault();
                        onPanigate(page + 1)
                    }}
                ><i className="ki ki-bold-arrow-next icon-xs"></i></a>}
                {page < totalPage && <a
                    className="btn btn-icon btn-sm btn-light-primary mr-2 my-1"
                    onClick={e => {
                        e.preventDefault();
                        onPanigate(totalPage)
                    }}
                ><i className="ki ki-bold-double-arrow-next icon-xs"></i></a>}
            </div>
        </div>
    )
})