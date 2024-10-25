import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client';
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import { useIntl } from 'react-intl';
import RowTable from './RowTable';
import query_crmGetJobTrackingExport from '../../../../../graphql/query_crmGetJobTrackingExport';
import query_sc_stores_basic from '../../../../../graphql/query_sc_stores_basic';
import Pagination from '../../../../../components/Pagination';
import query_crmGetTag from '../../../../../graphql/query_crmGetTag';
import query_crmGetChannelCode from '../../../../../graphql/query_crmGetChannelCode';

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


  const { data, error, loading, refetch } = useQuery(query_crmGetJobTrackingExport, {
    variables: {
      page,
      first: limit,
      type: 1
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: timePoll
  });

  useMemo(() => {
    const WAITING_STATUS = 0
    const status = data?.crmGetJobTrackingExport?.data?.map(item => item.status) || []
    status?.includes(WAITING_STATUS) ? setTimePoll(1000) : setTimePoll(0)
  }, [data])

  const { data: dataCrmGetTag } = useQuery(query_crmGetTag, {
    fetchPolicy: "cache-and-network",
  });

  const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, { fetchPolicy: "cache-and-network" });

  const { data: dataCrmGetChannelCode } = useQuery(query_crmGetChannelCode, {
    fetchPolicy: "cache-and-network",
  });

  const optionsChannelCode = useMemo(() => {
    return dataCrmGetChannelCode?.crmGetChannelCode?.map(channel => ({
        value: channel?.key,
        label: channel?.name,
        logo: channel?.url_logo
    }));
}, [dataCrmGetChannelCode]);

  const optionsTags = useMemo(() => {
    return dataCrmGetTag?.crmGetTag?.map(tag => ({
      value: tag?.id,
      label: tag?.title,
    }));
  }, [dataCrmGetTag]);

  let totalRecord = data?.crmGetJobTrackingExport?.paginatorInfo?.total || 0;

  let totalPage = Math.ceil(totalRecord / limit);

  return (
    <div>
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
              {formatMessage({ defaultMessage: "Kênh bán" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="200px">
              {formatMessage({ defaultMessage: "Tag khách hàng" })}
            </th>
            <th className='text-left' style={{ fontSize: "14px" }} width="200px">
              {formatMessage({ defaultMessage: "Thời gian cập nhật" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="150px">
              {formatMessage({ defaultMessage: "Số lượng khách hàng" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="150px">
              {formatMessage({ defaultMessage: "Trạng thái xuất file" })}
            </th>
            <th className='text-center' style={{ fontSize: "14px" }} width="100px">
              {formatMessage({ defaultMessage: "Thao tác" })}
            </th>

          </tr>
        </thead>
        <tbody style={{ borderLeft: "1px solid #d9d9d9", borderRight: "1px solid #d9d9d9" }}>
          {loading && (
            <div className="text-center w-100 mt-4" style={{ position: "absolute" }}>
              <span className="ml-3 spinner spinner-primary"></span>
            </div>
          )}
          {!!error && !loading && (
            <div className="w-100 text-center mt-8" style={{ position: "absolute" }}>
              <div className="d-flex flex-column justify-content-center align-items-center">
                <i className="far fa-times-circle text-danger" style={{ fontSize: 48, marginBottom: 8 }}></i>
                <p className="mb-6">{formatMessage({ defaultMessage: "Xảy ra lỗi trong quá trình tải dữ liệu" })}</p>
                <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
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

          {(data?.crmGetJobTrackingExport?.data || [])?.map((item, index) => (
            <RowTable optionsChannelCode={optionsChannelCode} channels={dataStore?.op_connector_channels || []} stores={dataStore?.sc_stores || []} item={item} key={index} optionsTags={optionsTags} />
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
          count={data?.crmGetJobTrackingExport?.data?.length}
          basePath={`/customer-service/export-histories`}
          emptyTitle={formatMessage({ defaultMessage: "Không có dữ liệu" })}
        />
      )}
    </div>
  )
}

export default Table