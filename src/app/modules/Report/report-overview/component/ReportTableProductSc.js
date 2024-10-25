import React, { useState } from 'react'
import { useIntl } from 'react-intl';
import ReportProductRowSc from './ReportProductRowSc';
import { Tabs, STATUS_TAB } from '../constants';
import { TooltipWrapper } from '../../../Finance/payment-reconciliation/common/TooltipWrapper'
import { orderBy, sortBy } from 'lodash';

const ReportTableProductSc = ({ setSubTabTypeSc, status_tab, dataTable }) => {
  const { formatMessage } = useIntl()
  return (
    <div className='mt-6'>
      <div className="d-flex w-100 mb-4" style={{ zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <ul className="nav nav-tabs">
            {Tabs.map((tab) => {
              return (
                <li
                  key={`tab-${tab.value}`}
                  onClick={() => {
                    setSubTabTypeSc(tab.value)
                  }}
                >
                  <a
                    style={{ fontSize: "14px" }}
                    className={`nav-link ${status_tab == tab.value ? 'active' : ''}`}
                  >
                    {formatMessage(tab.title)}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <table className="table table-borderless product-list table-vertical-center fixed">
        <thead
          style={{ zIndex: 1, background: '#F3F6F9', fontWeight: 'bold', fontSize: '13px', borderBottom: '1px solid gray', borderLeft: '1px solid #d9d9d9', borderRight: '1px solid #d9d9d9' }}
        >
          <tr>
            <th className='text-center' style={{ width: '10%' }}>STT</th>
            <th style={{ width: '45%' }}>{formatMessage({ defaultMessage: 'Sản phẩm' })}</th>
            <th className='text-center' style={{ width: '27%' }}>{formatMessage({ defaultMessage: 'Gian hàng' })}</th>
            <th className='text-center' style={{ width: '18%' }}>{STATUS_TAB['GMV'] == status_tab ? formatMessage({ defaultMessage: 'Doanh số hiệu quả' }) :
              <>
                {formatMessage({ defaultMessage: 'Số lượng đã bán' })}
                <TooltipWrapper note={formatMessage({ defaultMessage: "Số lượng bán hiệu quả = Tổng số lượng bán - Số lượng sản phẩm trong đơn hoàn - Số lượng sản phẩm trong đơn huỷ" })}>
                  <i className="fas fa-info-circle fs-14 ml-2"></i>
                </TooltipWrapper>
              </>}
            </th>
          </tr>
        </thead>
        <tbody>
          {(dataTable?.loading) && (
            <div
              className="text-center w-100 mt-4"
              style={{ position: "absolute" }}
            >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          )}
          {!!dataTable?.data?.error && !dataTable?.loading && (
            <div
              className="w-100 text-center mt-8"
              style={{ position: "absolute" }}
            >
              <div className="d-flex flex-column justify-content-center align-items-center">
                <i
                  className="far fa-times-circle text-danger"
                  style={{ fontSize: 48, marginBottom: 8 }}
                ></i>
                <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                <button
                  className="btn btn-primary btn-elevate"
                  style={{ width: 100 }}
                  onClick={() => dataTable?.data?.refetch()}>
                  {formatMessage({ defaultMessage: 'Tải lại' })}
                </button>
              </div>
            </div>
          )}
          {!dataTable?.loading && dataTable?.data?.products?.length && orderBy(dataTable?.data?.products, ['value'], ['desc'])?.map((item, index) => (
            <ReportProductRowSc status_tab={status_tab} item={item} key_row={index} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReportTableProductSc