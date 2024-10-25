import React, { memo, useCallback, useMemo, useState } from "react";
import TableReconciliation from './Table'
import query_getListSettlementOrder from '../../../../../../graphql/query_getListSettlementOrder'
import { useQuery } from "@apollo/client";
import Pagination from '../../../../../../components/Pagination';
import Filter from "./Filter";
import { Card, CardBody } from "../../../../../../_metronic/_partials/controls";
import dayjs from "dayjs";

const Details = ({ channel, coReloadOrder, countTab, setDialogFinaliztion, setDialogProcess, setIds, ids, stores, pushToUrl }) => {
  const { params } = pushToUrl;
  const [valueRangeTime, setValueRangeTime] = useState(null);

  useMemo(() => {
    if (params?.tab == "PROCESSED") {
      if (!!params?.is_old_order) {
        setValueRangeTime([
          new Date(dayjs().subtract(96, "day").startOf("day")),
          new Date(dayjs().subtract(90, "day").startOf("day")),
        ]);
      } else {
        setValueRangeTime([
          new Date(dayjs().subtract(6, "day").startOf("day")),
          new Date(dayjs().startOf("day")),
        ]);
      }
    } else {
      if (!!params?.is_old_order) {
        setValueRangeTime([
          new Date(dayjs().subtract(96, "day").startOf("day")),
          new Date(dayjs().subtract(90, "day").startOf("day")),
        ]);
      } else {
        setValueRangeTime(null)
      }
    }
  }, [params?.tab, params?.is_old_order]);

  const settlement_timeout = useMemo(() => {
    return +params?.settlement_timeout || ''
  }, [params?.settlement_timeout])

  const tab_type = useMemo(() => {
    return params?.tab || 'PENDING'
  }, [params?.tab])

  const search_type_time = useMemo(() => {
    return +params?.search_type_time || (tab_type == "PROCESSED" ? 1 : 2)
  }, [params?.search_type_time, tab_type])

  const settlement_abnormal = useMemo(() => {
    return +params?.settlement_abnormal || ''
  }, [params?.settlement_abnormal])

  const settlement_abnormal_status = useMemo(() => {
    if (!params?.settlement_abnormal_status) {
      return (tab_type == 'PROCESSED' && settlement_abnormal) == 2 ? 1 : ''
    }
    return +params?.settlement_abnormal_status
  }, [params?.settlement_abnormal_status, tab_type, settlement_abnormal])

  const is_old_order = useMemo(() => {
    if (!params.is_old_order) return {};

    return { is_old_order: Number(params?.is_old_order) }
  }, [params.is_old_order]);

  const store_type = useMemo(() => {
    return +params?.store || ''
  }, [params?.store])

  const q = useMemo(() => {
    return params?.q || ''
  }, [params?.q])

  const page = useMemo(() => {
    return +params?.page || 1
  }, [params?.page])

  const perPage = useMemo(() => {
    return +params?.limit || 25
  }, [params?.limit])

  
  const platform = useMemo(() => {
    return (params?.platform || 'ecommerce')
  }, [params?.platform])


  const range_time = useMemo(() => {
    try {
      if (!params?.gt || !params?.lt) {
        if (valueRangeTime?.length > 0) {
          if (params?.tab == 'PROCESSED') {
            return [
              dayjs().subtract(!!params?.is_old_order ? 96 : 6, "day").startOf("day").unix(),
              dayjs().subtract(!!params?.is_old_order ? 90 : 0, "day").endOf("day").unix()
            ]
          }

          if (!!params?.is_old_order && params?.tab != 'PROCESSED') {
            return [
              dayjs().subtract(96, "day").startOf("day").unix(),
              dayjs().subtract(90, "day").endOf("day").unix()
            ]
          }
        } else {
          return {}
        }
      }
      return [+params?.gt, +params?.lt]
    } catch (error) {
      return {};
    }
  }, [params?.gt, params?.lt, valueRangeTime, params?.is_old_order, params?.tab]);

  const whereCondition = useMemo(() => {
    return {
      connector_channel_code: channel,
      page,
      per_page: perPage,
      payment_system: platform !== 'manual' ? 'platform' : 'upbase',
      ref_order_id: q,
      range_time,
      settlement_abnormal,
      settlement_abnormal_status,
      settlement_timeout,
      status: tab_type == 'PENDING' ? ['PENDING', 'SHIPPED'] : 'PROCESSED',
      store_id: +store_type,
      type_time: search_type_time,
      ...is_old_order
    }
  }, [range_time, store_type,platform, channel, page, perPage, q, tab_type, settlement_abnormal,
    settlement_abnormal_status, settlement_timeout, search_type_time, is_old_order])

  const filterPropertyNull = useMemo(() => Object.entries(whereCondition).filter((elm) => {
    if (elm.at(1)) {
      return elm
    }
  }), [whereCondition])


  const { data, loading, refetch, error } = useQuery(
    query_getListSettlementOrder,
    {
      variables: Object.fromEntries(filterPropertyNull),
      fetchPolicy: "cache-and-network",
      skip: !channel
    }
  );
  const countOrder = useCallback(
    (status, sub = false) => {
      const { count_abnormal_pending, count_abnormal_processed,
        count_abnormal,
        total_for_status, count_balance, total_for_paging } = data?.getListSettlementOrder.summary_data ?? {};

      const STATUS_COUNT_ABNORMAL = 2;
      const STATUS_COUNT_BALANCE = 1;
      const STATUS_COUNT_ABNORMAL_PENDING = 1;
      const STATUS_COUNT_ABNORMAL_PROCESSED = 2;

      const countOrdeAbnormal = {
        [STATUS_COUNT_ABNORMAL_PENDING]: count_abnormal_pending,
        [STATUS_COUNT_ABNORMAL_PROCESSED]: count_abnormal_processed,
      }
      const countStatusOrder = {
        [STATUS_COUNT_ABNORMAL]: count_abnormal,
        [STATUS_COUNT_BALANCE]: count_balance,
      }
      const totalOrder = sub ? countOrdeAbnormal[status] : countStatusOrder[status] ?? total_for_status
      let totalRecord = totalOrder || 0;
      let totalPage = Math.ceil(total_for_paging / perPage);
      return {
        count: totalOrder,
        dataPagination: {
          totalRecord,
          totalPage
        }
      }
    }, [data]);

  const positionValue = useMemo(() => {
    if (tab_type == 'PROCESSED' && !settlement_abnormal_status) {
      return 43
    }
    if (tab_type == 'PROCESSED' && !!settlement_abnormal_status) {
      return 92
    }
    return 0
  }, [tab_type, settlement_abnormal_status])
  return (
    <Card>
      <CardBody>

        <Filter
          platform={platform}
          coReloadOrder={coReloadOrder}
          setDialogFinaliztion={setDialogFinaliztion}
          countOrder={countOrder} settlement_abnormal={settlement_abnormal}
          settlement_timeout={settlement_timeout}
          refetch={refetch}
          countTab={countTab}
          channel={channel}
          search_type_time={search_type_time}
          valueRangeTime={valueRangeTime}
          setValueRangeTime={setValueRangeTime}
          tab_type={tab_type}
          pushToUrl={pushToUrl}
          ids={ids}
          setDialogProcess={setDialogProcess}
          setIds={setIds}
          settlement_abnormal_status={settlement_abnormal_status}
        />

        <TableReconciliation refetch={refetch}
          platform={platform}
          stores={stores}
          loading={loading}
          error={error}
          settlement_abnormal_status={settlement_abnormal_status}
          tab_type={tab_type}
          setIds={setIds}
          ids={ids}
          dataTable={data?.getListSettlementOrder?.list_order || []}
          summaryData={data?.getListSettlementOrder?.summary_data?.total_settlement_values || {}}
          positionValue={positionValue}
        />

        {!error && (
          <Pagination
            page={page}
            totalPage={countOrder(settlement_abnormal_status || settlement_abnormal, !!settlement_abnormal_status).dataPagination.totalPage}
            loading={loading}
            limit={perPage}
            totalRecord={countOrder(settlement_abnormal_status || settlement_abnormal, !!settlement_abnormal_status).dataPagination.totalRecord}
            count={data?.getListSettlementOrder?.list_order?.length || 0}
            basePath={"/finance/payment-reconciliation"}
            emptyTitle=""
          />
        )}
      </CardBody>
    </Card>
  );
};

export default memo(Details);
