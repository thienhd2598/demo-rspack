/*
 * Created by duydatpham@gmail.com on 09/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import React, { memo } from 'react'
import { useIntl } from 'react-intl'
export default memo(() => {
    const {formatMessage} = useIntl()
    return <div className="tab-pane fade show active" role="tabpanel" aria-labelledby="kt_tab_pane_2">
        <div className="react-bootstrap-table">
            <table className="table product-list table-bordered table table-vertical-center overflow-hidden">
                <thead>
                    <tr className="header-member">
                        <th style={{fontSize: '14px'}} tabIndex="0" width='30%'>{formatMessage({defaultMessage:"TÊN NHÓM"})}</th>
                        <th style={{fontSize: '14px'}} tabIndex="0">{formatMessage({defaultMessage:"MÔ TẢ"})}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vũ Hoàng Anh</td>
                        <td >{formatMessage({defaultMessage:"Nhóm kinh doanh"})}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
})