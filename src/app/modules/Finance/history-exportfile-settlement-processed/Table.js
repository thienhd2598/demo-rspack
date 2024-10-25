import React, { useMemo, useState } from 'react'
import { useIntl } from 'react-intl';
import RowTable from './RowTable';
import query_cfGetJobTrackingExport from '../../../../graphql/query_cfGetJobTrackingExport';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic';
import { useQuery } from '@apollo/client';
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import Pagination from '../../../../components/Pagination';

const Table = () => {
  const { formatMessage } = useIntl()
  const [timePoll, setTimePoll] = useState(1000)
  const params = queryString.parse(useLocation().search.slice(1, 100000));

  const page = useMemo(() => {
    try {
      let _page = Number(params.page);
      if (!Number.isNaN(_page)) {
        return Math.max(1, _page);
      } else {
        return 1;
      }
    } catch (error) {
      return 1;
    }
  }, [params.page]);

  const limit = useMemo(() => {
    try {
      let _value = Number(params.limit);
      if (!Number.isNaN(_value)) {
        return Math.max(25, _value);
      } else {
        return 25;
      }
    } catch (error) {
      return 25;
    }
  }, [params.limit]);

  const { data, error, loading, refetch } = useQuery(query_cfGetJobTrackingExport, {
    variables: {
      page,
      per_page: limit,
      type: 2
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: timePoll
  });

  useMemo(() => {
    const WAITING_STATUS = 0
    const status = data?.cfGetJobTrackingExport?.job_tracking_export?.map(item => item.status) || []
    status?.includes(WAITING_STATUS) ? setTimePoll(1000) : setTimePoll(0)
  }, [data])

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, { fetchPolicy: "cache-and-network" });
  const channels = dataStore?.op_connector_channels || []
  let totalRecord = data?.cfGetJobTrackingExport?.total || 0;
  let totalPage = Math.ceil(totalRecord / limit);


  return (
    <>
      <table className="table table-borderless product-list table-vertical-center">
        <thead
          style={{
            position: "sticky",
            top: 41,
            zIndex: 31,
            background: "#F3F6F9",
            fontWeight: "bold",
            fontSize: "14px",
            borderRight: "1px solid #d9d9d9",
            borderBottom: "1px solid #d9d9d9",
            borderLeft: "1px solid #d9d9d9",
            borderTop: "1px solid #d9d9d9",
          }}
        >
          <tr className="font-size-lg">
            <th className='text-center' style={{ fontSize: "14px" }} width="200px">
              {formatMessage({ defaultMessage: "Gian hàng" })}
            </th>
            <th className='text-left' style={{ fontSize: "14px" }} width="170px">
              {formatMessage({ defaultMessage: "Thời gian quyết toán" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="140px">
              {formatMessage({ defaultMessage: "Chênh lệch" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="150px">
              {formatMessage({ defaultMessage: "Số lượng phiếu" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="140px">
              {formatMessage({ defaultMessage: "Thời gian yêu cầu" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="150px">
              {formatMessage({ defaultMessage: "Trạng thái xuất file" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="150px">
              {formatMessage({ defaultMessage: "Thao tác" })}
            </th>

          </tr>
        </thead>
        <tbody
          style={{
            borderLeft: "1px solid #d9d9d9",
            borderRight: "1px solid #d9d9d9",
          }}
        >
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
                <p className="mb-6">{formatMessage({ defaultMessage: "Xảy ra lỗi trong quá trình tải dữ liệu" })}</p>
                <button
                  className="btn btn-primary btn-elevate"
                  style={{ width: 100 }}
                  onClick={(e) => {
                    e.preventDefault();
                    refetch();
                  }}
                >
                  {formatMessage({ defaultMessage: "Tải lại" })}
                </button>
              </div>
            </div>
          )}

          {(data?.cfGetJobTrackingExport?.job_tracking_export || [])?.map((item, index) => (
            <RowTable channels={channels} item={item} key={index} />
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
          count={data?.cfGetJobTrackingExport?.job_tracking_export?.length}
          basePath={"/finance/exportfile-settlement-processed"}
          emptyTitle={formatMessage({ defaultMessage: "Không có dữ liệu" })}
        />
      )}
    </>
  )
}

export default Table