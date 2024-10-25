import React, { useState } from "react";
import sme_inventory_export_histories from "../../../../graphql/query_inventory_export_histories";
import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import queryString from "querystring";
import Pagination from "../../../../components/Pagination";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import { useIntl } from "react-intl";
import RowTableInventory from "./RowTableInventory";
const TableInventory = () => {
  const params = queryString.parse(useLocation().search.slice(1, 100000));
  const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
    fetchPolicy: "cache-and-network",
  });
  const {formatMessage} = useIntl()
  const [timePoll, setTimePoll] = useState(1000)
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
  const { data, error, loading, refetch } = useQuery(
    sme_inventory_export_histories,
    {
      variables: {
        limit,
        offset: (page - 1) * limit,
      },
      fetchPolicy: 'cache-and-network', 
      pollInterval: 1000
    }
  );
  useMemo(() => {
    const WAITING_STATUS = 'processing'
    const status = data?.sme_inventory_export_histories?.map(item => item.status) || []
    status?.includes(WAITING_STATUS) ? setTimePoll(1000) : setTimePoll(0)
  }, [data])

  let totalRecord = data?.sme_inventory_export_histories.length || 0;
  let totalPage = Math.ceil(totalRecord / limit);

  return (
    <>
      <table className="table table-borderless table-vertical-center fixed">
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
            {/* column1 */}
            <th style={{ fontSize: "14px" }} width="200px">
              <div className="d-flex">
                <span className="mx-4">{formatMessage({defaultMessage:"Kho hàng"})}</span>
              </div>
            </th>
            {/* column2 */}
            <th style={{ fontSize: "14px" }} width="140px">
            {formatMessage({defaultMessage:"Trạng thái"})}
            </th>
            {/* column3 */}
            <th style={{ fontSize: "14px" }} width="150px">
            {formatMessage({defaultMessage:"Số lượng hàng hóa"})}
            </th>
            {/* column4 */}
            <th style={{ fontSize: "14px" }} width="200px">
            {formatMessage({defaultMessage:"Thời gian yêu cầu"})}
            </th>
            {/* column5 */}
            <th style={{ fontSize: "14px" }} width="150px">
            {formatMessage({defaultMessage:"Tình trạng xử lý"})}
            </th>
            {/* column5 */}
            <th style={{ fontSize: "14px" }} width="150px">
            {formatMessage({defaultMessage:"Thao tác"})}
            </th>
            {/* column5 */}
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
                <p className="mb-6">{formatMessage({defaultMessage:"Xảy ra lỗi trong quá trình tải dữ liệu"})}</p>
                <button
                  className="btn btn-primary btn-elevate"
                  style={{ width: 100 }}
                  onClick={(e) => {
                    e.preventDefault();
                    refetch();
                  }}
                >
                  {formatMessage({defaultMessage:"Tải lại"})}
                </button>
              </div>
            </div>
          )}
          <RowTableInventory
            refetch={refetch}
            dataWarehouse={dataWarehouse}
            data={data?.sme_inventory_export_histories || []}
          />
        </tbody>
      </table>
      {!error && (
        <Pagination
          page={page}
          totalPage={totalPage}
          loading={loading}
          limit={limit}
          totalRecord={totalRecord}
          count={data?.sme_inventory_export_histories?.length}
          basePath={"/products/inventory-export-history"}
          emptyTitle={formatMessage({defaultMessage:"Không tìm thấy đơn hàng phù hợp"})}
        />
      )}
    </>
  );
};

export default TableInventory;
