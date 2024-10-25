import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import Details from './components/Details';
import Platform from './components/Platform';
import Overview from './components/Overview';
import { useMutation, useQuery } from '@apollo/client';
import query_sc_stores_basic from '../../../../graphql/query_sc_stores_basic'
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import ProcessDialog from './dialogs/ProcessDialog';
import mutate_reloadSettlement from '../../../../graphql/mutate_reloadSettlement';
import mutate_cfConfirmSettlementProcessed from '../../../../graphql/mutate_cfConfirmSettlementProcessed';
import query_summarySettlementOrder from '../../../../graphql/query_summarySettlementOrder';
import { useToasts } from 'react-toast-notifications'
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import FinalizationDialog from './dialogs/FinalizationDialog';
import dayjs from 'dayjs';
import ResultFinalizationDialog from './dialogs/ResultFinalizationDialog';


const PaymentReconciliation = () => {
  const { setBreadcrumbs } = useSubheader();
  const { addToast } = useToasts()
  const {formatMessage} = useIntl()
  const location = useLocation();
  const history = useHistory()
  const params =  queryString.parse(location.search.slice(1, 100000))

  const [ids, setIds] = useState([])
  const [dialogFinaliztion, setDialogFinaliztion] = useState(false)

  const [dialogProcess, setDialogProcess] = useState(false)
  const [reslutDialogFinaliztion, setReslutDialogFinaliztion] = useState()


  
  const { data: dataStore, loading: loadingStore } = useQuery(
    query_sc_stores_basic,
    {
      fetchPolicy: "cache-and-network",
      variables: {
        context: 'order'
     },
    }
  );

  const channel = useMemo(() => {
    const defaultCode =  params?.platform == 'manual'
              ? dataStore?.op_connector_channels?.filter(cn => (cn?.payment_system & 2) != 0)[0]?.code
              : dataStore?.op_connector_channels?.filter(cn => (cn?.payment_system & 1) != 0)[0]?.code
    return params?.channel || defaultCode
  }, [params?.channel, params?.platform, dataStore])

  const { data: dataSummary, loading } = useQuery(query_summarySettlementOrder, {
    variables: {
      payment_system: params?.platform == 'manual' ? 'upbase' : 'platform',
      ...(params?.store ? {store_id: +params?.store} : {} ),
      connector_channel_code: channel,
      ...(params?.is_old_order ? {
        is_old_order: 1
      } : {})
    },
    fetchPolicy: "cache-and-network",
    skip: !channel
  }
);

const {count_pending, count_processed} = dataSummary?.summarySettlementOrder ?? {}


  const [mutate, { loading: reloadOrderLoading }] = useMutation(mutate_cfConfirmSettlementProcessed, {
    awaitRefetchQueries: true,
    refetchQueries: ['getListSettlementOrder'],
  })

  const [reloadSettlement, { loading: reloadSettlementLoading }] = useMutation(mutate_reloadSettlement, {
    awaitRefetchQueries: true,
    refetchQueries: ['getListSettlementOrder'],
    onCompleted: (data) => {
        setIds([])
    }
  })

  const coReloadOrder = async () => {
    let variables = {
      list_settlement_id: ids.map(item => +item.id),
    }

    let { data } = await reloadSettlement({
        variables: variables
    })
    if (data?.reloadSettlement?.success) {
        addToast(formatMessage({defaultMessage: 'Đơn hàng tải lại thành công'}), { appearance: 'success' });
    } else {
        addToast(formatMessage({defaultMessage: 'Đơn hàng tải lại thất bại'}), { appearance: 'error' });
    }
}

  const handleFinalization = async (time) => {
    let variables = {
      list_id: ids.map(item => +item.id),
      payout_time: dayjs(time).unix()
    }

    let { data } = await mutate({
        variables: variables
    })

    if (data?.cfConfirmSettlementProcessed?.success) {
        addToast(formatMessage({defaultMessage: 'Thành công'}), { appearance: 'success' });
        setReslutDialogFinaliztion({
          total: ids?.length,
          total_success: data?.cfConfirmSettlementProcessed?.total_success,
          total_fail: (ids?.length - data?.cfConfirmSettlementProcessed?.total_success) || 0
        })
        setDialogFinaliztion(false)
    } else {
        addToast(formatMessage({defaultMessage: 'Thất bại'}), { appearance: 'error' });
        setDialogFinaliztion(false)
    }
}

  const sc_stores = useMemo(() => 
    dataStore?.sc_stores?.map(store => {
    
      const platforms = dataStore?.op_connector_channels?.map(plf => ({
        url: plf.logo_asset_url,
        code: plf.code
      }))

      if(store.connector_channel_code == channel) return ({
        ...store,
        url: platforms.find(plf => plf.code == store.connector_channel_code)?.url || ''
      })
    
    })?.filter(Boolean),[dataStore, channel])

  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: "Đối soát" }),
      },
    ]);
  }, []);
  return (
    <>
        <Helmet titleTemplate={formatMessage({ defaultMessage: `Đối soát {key}` },{ key: " - UpBase" })} defaultTitle={formatMessage(
          { defaultMessage: `Đối soát {key}` },
          { key: " - UpBase" }
        )}>
        <meta name="description"
          content={formatMessage(
            { defaultMessage: `Đối soát {key}` },
            { key: " - UpBase" }
          )}/>
      </Helmet>

      {dialogProcess && <ProcessDialog show={dialogProcess}
       onHide={() => setDialogProcess(false)} ids={ids} setIds={setIds}/>}

      <LoadingDialog show={reloadOrderLoading || reloadSettlementLoading} />
      <ResultFinalizationDialog show={!!reslutDialogFinaliztion} onHide={() => setReslutDialogFinaliztion()} result={reslutDialogFinaliztion} />

      {dialogFinaliztion && <FinalizationDialog handleFinalization={async (time) => await handleFinalization(time)} show={dialogFinaliztion} onHide={() => {
        setDialogFinaliztion(false)
        setIds([])
      }}/>}

      <Platform setIds={setIds}
        pushToUrl={{history, params, location}}
        channelOnUrl={channel}
        stores={sc_stores}
        channels={dataStore?.op_connector_channels || []}/>

      {!params?.is_old_order && <Overview loading={loading} dataSummary={dataSummary} channel={channel}/>}

      <Details
          coReloadOrder={coReloadOrder}
          countTab={{count_pending, count_processed}}
          setDialogFinaliztion={setDialogFinaliztion}
          setIds={setIds}
          ids={ids}
          channel={channel}
          setDialogProcess={setDialogProcess}
          stores={sc_stores}
          pushToUrl={{history, params, location}}/>

        <div
          id="kt_scrolltop1"
          className="scrolltop"
          style={{ bottom: 80 }}
          onClick={() => {
            window.scrollTo({
              letf: 0,
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
          }}>
        <span className="svg-icon">
          <SVG
            src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")}
            title={" "}
          ></SVG>
        </span>{" "}
      </div>
    </>
  )
}

export default PaymentReconciliation

export const actionKeys = {
  "finance_settlement_order_view": {
      router: '/finance/payment-reconciliation',
      actions: [
        "sc_stores", 
        "op_connector_channels", 
        "summarySettlementOrder", 
        "getListSettlementOrder", 
        "reloadSettlement"
      ],
      name: 'Danh sách đối soát',
      group_code: 'finance_settlement',
      group_name: 'Đối soát',
      cate_code: 'finance_service',
      cate_name: 'Tài chính'
  },
  "finance_settlement_order_export": {
    router: '/finance/trading-report',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "cfExportSettlementAggregate",
      "cfExportOrderSettlement",
      "cfGetJobTrackingExport"
    ],
    name: 'Xuất file',
    group_code: 'finance_settlement',
    group_name: 'Đối soát',
    cate_code: 'finance_service',
    cate_name: 'Tài chính'
  },
  "finance_settlement_order_import": {
    router: '',
    actions: [
      "cfImportDataSettlement", "getListSettlementOrder"
    ],
    name: 'Nhập file đối soát',
    group_code: 'finance_settlement',
    group_name: 'Đối soát',
    cate_code: 'finance_service',
    cate_name: 'Tài chính'
  },
  "finance_settlement_order_confirm": {
    router: '/finance/payment-reconciliation',
    actions: ["cfConfirmSettlementProcessed", "getListSettlementOrder"],
    name: 'Quyết toán đối soát đơn thủ công',
    group_code: 'finance_settlement',
    group_name: 'Đối soát',
    cate_code: 'finance_service',
    cate_name: 'Tài chính'
  },
  "finance_dialog_process": {
    router: '',
    actions: ["processSettlement"],
    name: 'Xử lý đối soát bất thường',
    group_code: 'finance_settlement',
    group_name: 'Đối soát',
    cate_code: 'finance_service',
    cate_name: 'Tài chính'
  }
};
