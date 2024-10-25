import React, { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useSubheader } from '../../../../_metronic/layout';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import ToastAlert from '../../../../components/ToastAlert'
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'querystring';
import SVG from 'react-inlinesvg';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications';
import { Card, CardBody } from '../../../../_metronic/_partials/controls';
import { useQuery, useMutation } from '@apollo/client';
import { shallowEqual, useSelector } from 'react-redux';
import Table from 'rc-table';
import query_global_product_status from '../../../../graphql/query_global_product_status';
import query_sme_product_status from '../../../../graphql/query_sme_product_status';
import mutate_userUpdateProductStatus from '../../../../graphql/mutate_userUpdateProductStatus';

const SettingProductStatus = () => {
  const { setBreadcrumbs } = useSubheader();
  const { addToast } = useToasts();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const defaultData = [{
    title: 'Mới',
    status: 1
  }]

  const { data: statusData, loading: loadingStatusData} = useQuery(query_global_product_status, {
    fetchPolicy: "no-cache",
  })

  const { data: smeProductStatus, loading: loadingSmeProductStatus} = useQuery(query_sme_product_status, {
    fetchPolicy: "no-cache",
  })

  const [updateUserProductStatus, { loading: loadingUpdateUserProductStatus }] = useMutation(mutate_userUpdateProductStatus, {
    awaitRefetchQueries: true,
    refetchQueries: ['sme_product_status', 'global_product_status']
  })

  const toast = (status, msgSuccess, msgError) => {
    addToast(!!status ? msgSuccess : msgError, {appearance: !!status ? 'success' : 'error'})
  }

  const updateProductStatus = async (productStatusId, isEnable) => {
    try {
      const { data } = await updateUserProductStatus({
        variables: {
          productStatusId,
          isEnable
        }
      })
      toast(data?.userUpdateProductStatus?.success, formatMessage({defaultMessage: 'Cập nhật trạng thái thành công'}), `${data?.userUpdateProductStatus?.message}`)
      } catch (err) {
        setMessage("Không thể cập nhật cấu hình trạng thái hàng hóa! Vui lòng thử lại")
        setIsActive(true)
      }
  }
  
  useEffect(() => {
    if (!smeProductStatus?.sme_product_status?.length) {
      let newStatusData = statusData?.global_product_status?.map((status) => {
        return {
          id: status?.id,
          title: status?.name,
          status: 0,
          type: status?.type
        }
      })
      if(newStatusData?.length) {
        setData([...defaultData, ...newStatusData])
      }
    } else {
      let newStatusData = statusData?.global_product_status?.map(item => {
        const foundItem = smeProductStatus?.sme_product_status?.find(status => status?.global_status_id == item.id)
        if(foundItem) {
          return {
            id: item?.id,
            title: item?.name,
            status: foundItem.status,
            type: item?.type
          }
        }
        return {
          id: item?.id,
          title: item?.name,
          status: 0
        }
      })
      if(newStatusData?.length) {
        setData([...defaultData, ...newStatusData])
      }
    }
  }, [statusData, smeProductStatus])

  useLayoutEffect(() => {
    setBreadcrumbs([
      { title: formatMessage({ defaultMessage: 'Cài đặt' }) },
      {
        title: formatMessage({
          defaultMessage: 'Cấu hình trạng thái hàng hóa',
        }),
      },
    ]);
  }, []);

  const columns = [
    {
      title: formatMessage({ defaultMessage: 'Trạng thái hàng hóa' }),
      dataIndex: 'store_id',
      key: 'store_id',
      width: '80%',
      align: 'center',
      render: (item, record) => {
        return (
          <div className="d-flex align-items-center justify-content-center">
            <p>{record?.title}</p>
          </div>
        );
      },
    },
    {
      title: formatMessage({ defaultMessage: 'Hiện trạng' }),
      dataIndex: 'store_id',
      key: 'store_id',
      width: '20%',
      align: 'center',
      render: (item, record) => {
        console.log(record)
        return (
          <div className="d-flex justify-content-center">
            <span
              className="switch d-flex justify-content-center"
              style={{ transform: 'scale(0.8)' }}
            >
              <label>
                <input
                  type={'checkbox'}
                  style={{ background: '#F7F7FA', border: 'none' }}
                  disabled={record?.title == "Mới" || record?.type == 'system' || (user?.is_subuser && !['setting_product_status_action']?.some(key => user?.permissions?.includes(key)))}
                  onChange={() =>{
                    updateProductStatus(record?.id, record?.status == 1 ? 0 : 1)
                  }}
                  checked={record.status}yyyyyy
                />
                <span></span>
              </label>
            </span>
          </div>
        );
      },
    },
  ];



  return (
    <Fragment>
      <ToastAlert message={message} isActive={isActive} />
      <Helmet
        titleTemplate={formatMessage(
          { defaultMessage: `Cấu hình trạng thái HH` },
          { key: ' - UpBase' }
        )}
        defaultTitle={formatMessage(
          { defaultMessage: `Cấu hình trạng thái HH` },
          { key: ' - UpBase' }
        )}
      >
        <meta
          name="description"
          content={formatMessage(
            { defaultMessage: `Cấu hình trạng thái HH` },
            { key: ' - UpBase' }
          )}
        />
      </Helmet>
      <LoadingDialog show={loadingUpdateUserProductStatus} />
      <Card>
        <CardBody>
          <div className="d-flex align-items-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="ml-2 bi bi-info-circle text-info mr-2"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
            </svg>
            <span className="text-info fs-14">
              {formatMessage({
                defaultMessage:
                  'Trạng thái hàng hoá chỉ được tắt khi tất cả sản phẩm phát sinh trạng thái đó có tồn bằng 0',
              })}
            </span>
          </div>
          <div
            className="row w-100"
            style={{ display: 'flex', flexDirection: 'column', margin: 'auto' }}
          >
            <Table
              className="upbase-table"
              loading={loadingStatusData || loadingSmeProductStatus}
              columns={columns}
              data={data}
              emptyText={
                <div className="d-flex flex-column align-items-center justify-content-center my-10">
                  <img
                    src={toAbsoluteUrl('/media/empty.png')}
                    alt="image"
                    width={80}
                  />
                  <span className="mt-4">
                    {formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                  </span>
                </div>
              }
              tableLayout="auto"
              sticky={{ offsetHeader: 45 }}
            />
          </div>
        </CardBody>
      </Card>

      <div
        id="kt_scrolltop1"
        className="scrolltop"
        style={{ bottom: 80 }}
        onClick={() => {
          window.scrollTo({
            letf: 0,
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
        }}
      >
        <span className="svg-icon">
          <SVG
            src={toAbsoluteUrl('/media/svg/icons/Navigation/Down-2.svg')}
            title={' '}
          ></SVG>
        </span>
      </div>
    </Fragment>
  );
};

export default SettingProductStatus;

export const actionKeys = {
  "setting_product_status_view": {
    router: '/setting/setting-product-status',
    actions: [
      "global_product_status",
      "sme_product_status"
    ],
    name: 'Cấu hình trạng thái hàng hóa',
    group_code: 'setting_product_status',
    group_name: 'Cấu hình trạng thái HH',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  },
  "setting_product_status_action": {
    router: '/setting/setting-product-status',
    actions: [
      "userUpdateProductStatus"
    ],
    name: 'Cập nhật cấu hình trạng thái hàng hóa',
    group_code: 'setting_product_status',
    group_name: 'Cấu hình trạng thái HH',
    cate_code: 'setting_service',
    cate_name: 'Cài đặt',
  }
};
