import React, { useEffect, useMemo, useState } from "react";
import { Formik, Field } from "formik";
import { Modal } from "react-bootstrap";
import { useIntl } from "react-intl";

import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import { preallocateStatus, typesAction } from "../constants";
import client from "../../../../../apollo";
import query_sme_warehouses_aggregate from "../../../../../graphql/query_sme_warehouses_aggregate";
import { useRef } from "react";
// import Select from 'react-select';
import query_prvListProvider from "../../../../../graphql/query_prvListProvider";
import { useQuery } from "@apollo/client";
import query_userGetListWarehouseFullfillment from "../../../../../graphql/query_userGetListWarehouseFullfillment";
import query_crmGetProvince from '../../../../../graphql/query_crmGetProvince';
import query_crmGetDistrict from '../../../../../graphql/query_crmGetDistrict';
import { groupBy } from "lodash";
import WarehouseListField from "../components/WarehouseListField";
import AuthorizationWrapper from "../../../../../components/AuthorizationWrapper";

const WarehouseDialog = ({ mutate, dialogWh, refetch, onHide, setDialogWh }) => {
  const { formatMessage } = useIntl();
  const { addToast } = useToasts();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({})
  const [provider, setProvider] = useState({
    value: dialogWh?.infoWh?.fulfillment_provider_connected_id
  });
  const [schemaValidate, setSchemaValidate] = useState({});
  const [fulFillmentBy, setFulfillmentBy] = useState(1);
  const [providerWmsCode, setProviderWmsCode] = useState({
    value: dialogWh?.infoWh?.fulfillment_provider_wms_code,
  });
  const MAX_NAME_WAREHOUSE = 120;
  const MIN_NAME_WAREHOUSE = 10;
  const MIN_ADDRESS = 10;
  const MAX_ADDRESS = 255;
  const CATEGORY_FULLFILMENT = 1;

  const { data: providerList } = useQuery(query_prvListProvider, {
    fetchPolicy: "cache-and-network",
    variables: {
      connected: 1,
      list_category: [CATEGORY_FULLFILMENT]
    }
  });

  const { data: dataWarehouse, refetch: refetchProvider } = useQuery(query_userGetListWarehouseFullfillment, {
    fetchPolicy: "cache-and-network",
    variables: {
      connectedProviderId: provider?.value
    },
    skip: !provider?.value && dialogWh?.typeAction == "CREATE_WAREHOUSE",
  });

  const { data: dataCrmGetProvince } = useQuery(query_crmGetProvince, {
    fetchPolicy: "cache-and-network",
  });

  const { data: dataCrmGetDistrict } = useQuery(query_crmGetDistrict, {
    fetchPolicy: "cache-and-network",
  });

  const optionsProvince = useMemo(() => {
    return dataCrmGetProvince?.crmGetProvince?.map(province => ({
      value: province?.code,
      label: province?.name
    }));
  }, [dataCrmGetProvince]);

  const optionsDistrict = useMemo(() => {
    const opsParse = dataCrmGetDistrict?.crmGetDistrict?.map(district => ({
      value: district?.code,
      label: district?.full_name,
      province_code: district?.province_code,
    }));

    return groupBy(opsParse, 'province_code')
  }, [dataCrmGetDistrict]);

  const optionsWarehouseProvider = useMemo(() => {
    return dataWarehouse?.userGetListWarehouseFullfillment?.data?.map(wh => ({ value: wh?.code, label: wh?.name, ...wh }))
  }, [dataWarehouse])

  const warehouseProvider = useMemo(() => {
    return optionsWarehouseProvider?.find(wh => wh?.code == (providerWmsCode?.value || dialogWh?.infoWh?.code))
  }, [optionsWarehouseProvider, providerWmsCode, dialogWh?.infoWh?.code])


  const provides = useMemo(() => {
    return providerList?.prvListProvider?.data?.map(provider => ({
      id: provider?.id,
      label: provider?.name,
      value: provider?.providerConnected[0]?.id
    }))
  }, [providerList])

  const checkExisWarehouse = async (nameWarehouse) => {
    let { data } = await client.query({
      query: query_sme_warehouses_aggregate,
      fetchPolicy: "network-only",
      variables: {
        where: {
          name: { _eq: nameWarehouse },
          status: {_eq: 10}
        },
      },
    });
    return !!data?.sme_warehouses_aggregate?.aggregate?.count;
  };

  useMemo(() => {
    let schema = []

    schema['nameWarehouse'] = Yup.string()
      .required("Vui lòng nhập tên kho.")
      .max(MAX_NAME_WAREHOUSE, formatMessage({ defaultMessage: "Tên kho tối đa 120 ký tự." }))
      .min(MIN_NAME_WAREHOUSE, formatMessage({ defaultMessage: "Tên kho tối thiểu 10 ký tự." }))
      .test("chua-ky-tu-space-o-dau-cuoi", formatMessage({ defaultMessage: "Tên kho không được chứa dấu cách ở đầu và cuối", }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        }).test("chua-ky-tu-2space", formatMessage({ defaultMessage: "Tên kho không được chứa 2 dấu cách liên tiếp", }),
          (value, context) => {
            if (!!value) {
              return !/\s\s+/g.test(value);
            }
            return false;
          }
        )
      .when(`isNameExist`, {
        is: values => {
          return !!values && values !== dialogWh?.infoWh?.name
        },
        then: Yup.string().oneOf([`nameExist`], formatMessage({ defaultMessage: 'Tên kho đã tồn tại' }))
      })

    schema['staff_name'] = Yup.string()
      .nullable()
      .required("Vui lòng nhập tên nhân viên phụ trách")
      .max(100, formatMessage({ defaultMessage: "Tên nhân viên phụ trách tối đa 100 ký tự." }))
      .min(5, formatMessage({ defaultMessage: "Tên nhân viên phụ trách tối thiểu 5 ký tự." }))
      .test("chua-ky-tu-space-o-dau-cuoi", formatMessage({ defaultMessage: "Tên nhân viên không được chứa dấu cách ở đầu và cuối", }),
        (value, context) => {
          if (!!value) {
            return value.length == value.trim().length;
          }
          return false;
        }).test("chua-ky-tu-2space", formatMessage({ defaultMessage: "Tên nhân viên phụ trách không được chứa 2 dấu cách liên tiếp", }),
          (value, context) => {
            if (!!value) {
              return !/\s\s+/g.test(value);
            }
            return false;
          }
        )

    schema['province'] = Yup.string()
      .required('Vui lòng chọn Tỉnh/Thành phố')

    schema['district'] = Yup.string()
      .required('Vui lòng chọn Quận/Huyện')

    schema['ward'] = Yup.string()
      .required('Vui lòng chọn Xã Phường')

    schema['phone_num'] = Yup.string()
      .nullable()
      .required('Vui lòng nhập số điện thoại')
      .length(10, formatMessage({ defaultMessage: "Độ dài số điện thoại phải {number} số" }, { number: 10 }))
      .test(
        'sai-dinh-dang-phone',
        'Số điện thoại không hợp lệ',
        (value, context) => {
          if (!!value) {
            return (/^0[0-9]\d{8}$/g.test(value))
          }
          return true;
        },
      )
    schema['codeWarehouse'] = Yup.string()
      .required("Vui lòng nhập mã kho.")
      .max(MAX_NAME_WAREHOUSE, formatMessage({ defaultMessage: "Mã kho tối đa 120 ký tự." }))

    schema['address'] = Yup.string()
      .required("Vui lòng nhập địa chỉ.")
      .max(MAX_ADDRESS, formatMessage({ defaultMessage: "Địa chỉ tối đa 255 ký tự." }))
      .min(MIN_ADDRESS, formatMessage({ defaultMessage: "Địa chỉ tối thiểu 10 ký tự." }))

    schema['inboundPrefix'] = Yup.string()
      .notRequired()
      .max(5, formatMessage({ defaultMessage: "Tiền tố phiếu nhập tối đa 5 ký tự." }))

    schema['outboundPrefix'] = Yup.string()
      .notRequired()
      .max(5, formatMessage({ defaultMessage: "Tiền tố phiếu xuất tối đa 5 ký tự." }))

    if (fulFillmentBy == 2) {
      schema['fulfillment_provider'] = Yup.string().required("Vui lòng chọn nhà cung cấp.").nullable()
      schema['fulfillment_provider_wms_code'] = Yup.string().required("Vui lòng chọn kho.").nullable()
    }

    if (fulFillmentBy == 1) {
      schema[`max_mio`] = Yup.number().nullable()
        .min(2, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
        .max(200, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
      schema[`max_sio`] = Yup.number().nullable()
        .min(2, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
        .max(200, formatMessage({ defaultMessage: 'Số đơn tối đa trong một danh sách xử lý phải lớn hơn 1 và nhỏ hơn hoặc bằng 200' }, { min: 2, max: 200 }))
    }

    setSchemaValidate(schema)
  }, [fulFillmentBy, dialogWh?.infoWh?.name, dialogWh?.typeAction])

  const detailWarehouse = useMemo(() => {
    const update = dialogWh.typeAction !== typesAction["CREATE_WAREHOUSE"]
    const create = dialogWh.typeAction == typesAction["CREATE_WAREHOUSE"]
    if (create || (update && providerWmsCode?.value !== dialogWh?.infoWh?.fulfillment_provider_wms_code)) {
      return {
        nameWarehouse: warehouseProvider?.name,
        address: warehouseProvider?.fullAddress,
        codeWarehouse: warehouseProvider?.code,
      }
    }
    if (update) {
      return {
        nameWarehouse: dialogWh?.infoWh?.name || '',
        address: dialogWh?.infoWh?.address || '',
        codeWarehouse: dialogWh?.infoWh?.code || '',
      }
    }
  }, [dialogWh, providerWmsCode, warehouseProvider]);

  useMemo(() => {
    setInitialValues({
      ...initialValues,
      scan_warehouse: dialogWh?.infoWh?.fulfillment_scan_export_mode || 2,
      fulfillment_by: dialogWh?.infoWh?.fulfillment_by || fulFillmentBy,
      fulfillment_scan_pack_mode: dialogWh?.infoWh?.fulfillment_scan_pack_mode || 1,
      fulfillment_provider: provides?.find(prv => prv?.value == provider?.value) || null,
      fulfillment_provider_wms_code: warehouseProvider || null,
      ...detailWarehouse,
      isPreallocate: false,
      warehouseExist: false,
      max_mio: dialogWh?.infoWh?.max_mio || null,
      max_sio: dialogWh?.infoWh?.max_sio || null,
      inboundPrefix: dialogWh?.infoWh?.inbound_prefix || "",
      outboundPrefix: dialogWh?.infoWh?.outbound_prefix || "",
      staff_name: dialogWh?.infoWh?.contact_name,
      phone_num: dialogWh?.infoWh?.contact_phone,
      district: optionsDistrict[dialogWh?.infoWh?.province_code]?.find(item => item?.value == dialogWh?.infoWh?.district_code),
      province: optionsProvince?.find(item => item?.value == dialogWh?.infoWh?.province_code),
    })
  }, [dialogWh, provides, warehouseProvider, detailWarehouse, optionsDistrict, optionsProvince])
  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={async (values) => {
        const variablesFulfieldment = {
          fulfillment_by: +values['fulfillment_by'],
          fulfillment_provider_connected_id: values['fulfillment_provider']?.value,
          fulfillment_provider_wms_code: values['fulfillment_provider_wms_code']?.value.toString(),
        }
        const userCreateWarehouseInput = {
          address: values["address"],
          allow_preallocate: values["isPreallocate"] ? preallocateStatus["ALLOW_PREALLOCATE"] : preallocateStatus["NOT_ALLOW_PREALLOCATE"],
          code: values["codeWarehouse"],
          name: values["nameWarehouse"],
          inbound_prefix: values["inboundPrefix"],
          outbound_prefix: values["outboundPrefix"],
          contact_name: values['staff_name'],
          contact_phone: values['phone_num'],
          district_code: values['district']?.value,
          province_code: values['province']?.value,
          ward_code: values['ward']?.value,
          ...(values['fulfillment_by'] == 1 ? { fulfillment_scan_export_mode: values['scan_warehouse'] } : {}),
          ...(values['fulfillment_by'] == 1 ? { fulfillment_scan_pack_mode: values['fulfillment_scan_pack_mode'] } : {}),
          ...(values['fulfillment_by'] == 2 ? variablesFulfieldment : {}),
          ...(values['fulfillment_by'] == 1 ? {
            max_mio: values?.max_mio || 0,
            max_sio: values?.max_sio || 0,
          } : {}),
        };

        const userUpdateWarehouseInput = {
          id: dialogWh?.infoWh?.id,
          address: values["address"],
          code: values["codeWarehouse"],
          name: values["nameWarehouse"],
          inbound_prefix: values["inboundPrefix"],
          outbound_prefix: values["outboundPrefix"],
          contact_name: values['staff_name'],
          contact_phone: values['phone_num'],
          district_code: values['district']?.value,
          province_code: values['province']?.value,
          ward_code: values['ward']?.value,
          ...(values['fulfillment_by'] == 1 ? { fulfillment_scan_export_mode: values['scan_warehouse'] } : {}),
          ...(values['fulfillment_by'] == 1 ? { fulfillment_scan_pack_mode: values['fulfillment_scan_pack_mode'] } : {}),
          ...(values['fulfillment_by'] == 2 ? variablesFulfieldment : {}),
          ...(values['fulfillment_by'] == 1 ? {
            max_mio: values?.max_mio || 0,
            max_sio: values?.max_sio || 0,
          } : {}),
        };

        let { data } = await mutate({
          variables: dialogWh.typeAction == typesAction["CREATE_WAREHOUSE"] ? { userCreateWarehouseInput } : { userUpdateWarehouseInput: userUpdateWarehouseInput },
        });
        if (data?.userUpdateWarehouse) {
          if (data?.userUpdateWarehouse?.success) {
            addToast(data?.userUpdateWarehouse?.message || "Cập nhật kho thành công", { appearance: "success" });
            refetch();
            onHide();
            return;
          } else {
            addToast(data?.userUpdateWarehouse?.message || "Cập nhật kho không thành công", { appearance: "error" });
            return;
          }
        }

        if (data?.userCreateWarehouse?.success) {
          addToast(data?.userCreateWarehouse?.message || "Thêm kho thành công", { appearance: "success" });
          refetch();
          onHide();
          return;
        } else {
          addToast(data?.userCreateWarehouse?.message || "Thêm kho thất bại", { appearance: "error" });
          onHide();
        }
      }}
      validationSchema={Yup.object().shape(schemaValidate)}
    >
      {({ values, handleSubmit, isSubmitting, setFieldValue, errors }) => {
        setFulfillmentBy(values['fulfillment_by'])
        return (
          <>
            <Modal
              size="lg"
              show={dialogWh.isOpen}
              aria-labelledby="example-modal-sizes-title-sm"
              dialogClassName="modal-show-connect-product"
              centered
              onHide={onHide}
              backdrop={true}
            >
              <Modal.Header closeButton={true}>
                <Modal.Title>{dialogWh.title}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <WarehouseListField
                  dialogWh={dialogWh}
                  provides={provides}
                  optionsDistrict={optionsDistrict}
                  optionsProvince={optionsProvince}
                  loading={loading}
                  optionsWarehouseProvider={optionsWarehouseProvider}
                  checkExisWarehouse={checkExisWarehouse}
                  refetchProvider={refetchProvider}
                  setProviderWmsCode={setProviderWmsCode}
                  setProvider={setProvider}
                  setDialogWh={setDialogWh}
                />
              </Modal.Body>
              <Modal.Footer
                className="form"
                style={{
                  borderTop: "1px solid #dbdbdb",
                  justifyContent: "end",
                  addingTop: 10,
                  paddingBottom: 10,
                }}
              >
                <div className="form-group">
                  <button
                    onClick={onHide}
                    type="button"
                    className="btn mr-3"
                    style={{ width: 100, background: "gray", color: "#fff" }}
                  >
                    Hủy
                  </button>
                  <AuthorizationWrapper keys={['warehouse_action']}>
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      onClick={handleSubmit}
                      className="btn btn-primary btn-elevate mr-3"
                      style={{ width: 100 }}
                    >
                      {dialogWh.typeAction == typesAction["CREATE_WAREHOUSE"]
                        ? formatMessage({ defaultMessage: "Thêm" })
                        : formatMessage({ defaultMessage: "Cập nhật" })}
                    </button>
                  </AuthorizationWrapper>
                </div>
              </Modal.Footer>
            </Modal>
          </>
        );
      }}
    </Formik>
  );
};

export default WarehouseDialog;
