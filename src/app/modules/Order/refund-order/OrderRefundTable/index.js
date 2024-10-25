import React, { memo, useState } from 'react'
import { STATUS_ORDER } from '../utils/contants';
import InformationLine from './components/InformationLine';
import HeadTable from './components/HeadTable'

import RowTable from './components/RowTable';
import FilterStatus from './components/FilterStatus';
import { useIntl } from "react-intl";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import { useMemo } from 'react';
import _ from 'lodash';
import Pagination from '../../../../../components/Pagination';

const OrderReturnTable = memo(({
  data,
  loading,
  error,
  refetch,
  setOpenModal,
  openModal,
  page,
  dataStore,
  limit,
  totalPage,
  totalRecord,
  ids,
  setIds,
  setIdOrder,
  whereCondition
}) => {
  //! check switch tab
  const location = useLocation();
  const params = queryString.parse(location.search.slice(1, 100000));
  const [currentTitle, setCurrentTitle] = useState(
    STATUS_ORDER[0]?.title || ""
  );

  useMemo(
    () => {
      if (!params.status) {
        setCurrentTitle(STATUS_ORDER[0]?.title)
      }

      let findedStatus =
        _.find(STATUS_ORDER, { value: params?.status })
        || _.find(STATUS_ORDER, _status => _status?.sub?.some(_sub => _sub?.value === params?.status));

      setCurrentTitle(findedStatus?.title)
    }, [params?.status])
  const { formatMessage } = useIntl()
  //! checked all checkbox
  const isSelectAll =
    ids.length > 0 &&
    ids.filter((x) => {
      return data?.some((returnOrder) => returnOrder.id === x.id);
    })?.length == data?.length;

  const pxSticky = useMemo(
    () => {
      if (['PROCESS_WH_NONE', 'PROCESS_WH_PART', 'PROCESS_WH_FULL'].includes(params.status)) {
        return 50
      }
      return 0

    }, [params.status]
  );

  return (
    <div style={{
      boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
      borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopRightRadius: 6,
      minHeight: 300
    }}>
      <div
        style={{ position: "sticky", top: 108, background: "#fff", zIndex: 1 }}
      >

        <FilterStatus
          onResetSelect={() => setIds([])}
          whereCondition={whereCondition}
        />
      </div>

      <table className="table table-borderless table-vertical-center fixed">
        <HeadTable params={params} isSelectAll={isSelectAll} setIds={setIds} data={data} ids={ids} pxSticky={pxSticky} />
        <tbody style={{ borderLeft: '1px solid #d9d9d9', borderRight: '1px solid #d9d9d9' }}>
          {loading && (
            <div
              className="text-center w-100 mt-4"
              style={{ position: "absolute" }}
            >
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          )}
          {!!error && !loading && (
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
                  onClick={(e) => {
                    e.preventDefault();
                    refetch();
                  }}
                >
                  {formatMessage({ defaultMessage: 'Tải lại' })}
                </button>
              </div>
            </div>
          )}

          {!error && data?.map((returnOrder, index) => (
            <React.Fragment key={index}>
              {/* //description other */}
              <InformationLine
                params={params}
                openModal={openModal}
                setOpenModal={setOpenModal}
                returnOrder={returnOrder}
                dataStore={dataStore}
                setIds={setIds}
                isSelected={ids.some((_id) => _id.id == returnOrder.id)}
                setIdOrder={setIdOrder}
              />
              {/* // row product */}
              <RowTable
                params={params}
                openModal={openModal}
                setIdOrder={setIdOrder}
                setOpenModal={setOpenModal}
                key={index}
                returnOrder={returnOrder}
              />
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {!error && (
        <Pagination
          page={page}
          totalPage={totalPage}
          loading={loading}
          limit={limit}
          totalRecord={totalRecord}
          count={data?.length}
          basePath={"/orders/refund-order"}
          emptyTitle="Chưa có đơn hoàn"
        />
      )}
    </div>
  )
})

export default OrderReturnTable