import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Field, useFormikContext } from "formik";
import { typesAction } from "../constants";
import { Input, InputVertical, TextArea } from "../../../../../_metronic/_partials/controls";
import { RadioGroup } from "../../../../../_metronic/_partials/controls/forms/RadioGroup";
import { Switch } from "../../../../../_metronic/_partials/controls/forms/Switch";
import { TooltipWrapper } from "../../../Finance/payment-reconciliation/common/TooltipWrapper";
import { ReSelect } from "../../../../../_metronic/_partials/controls/forms/ReSelect";
import { ReSelectVertical } from "../../../../../_metronic/_partials/controls/forms/ReSelectVertical";
import query_crmGetWards from '../../../../../graphql/query_crmGetWards';
import { useQuery } from "@apollo/client";
import { Modal } from "react-bootstrap";


const WarehouseListField = ({ dialogWh, setDialogWh, provides, loading, optionsDistrict, optionsProvince, optionsWarehouseProvider, checkExisWarehouse, setProvider, refetchProvider, setProviderWmsCode }) => {
  const { formatMessage } = useIntl();
  const { values, setFieldValue } = useFormikContext();
  const [showConfirmScan, setShowConfirmScan] = useState(null);

  const { data: dataWards } = useQuery(query_crmGetWards, {
    fetchPolicy: "cache-and-network",
    variables: {
      district_code: values?.district?.value
    },
    skip: !values?.district?.value,
    onCompleted: (data) => {
      if (dialogWh?.infoWh?.ward_code) {
        let foundWard = data?.crmGetWards?.find(item => item?.code == dialogWh?.infoWh?.ward_code)
        let selectedWard = {
          value: foundWard?.code,
          label: foundWard?.name
        }
        setFieldValue('ward', selectedWard)
        setDialogWh({
          ...dialogWh,
          infoWh: {
            ...dialogWh?.infoWh,
            ward_code: null
          }
        })
      }
    }
  });

  return (
    <Fragment>
      <Modal
        show={!!showConfirmScan}
        aria-labelledby="example-modal-sizes-title-sm"
        centered
        size="md"
        backdrop={true}
        onHide={() => setShowConfirmScan(false)}
      >
        <Modal.Body className="overlay overlay-block cursor-default">
          <div className='text-center'>
            <div className="mb-6" >
              <p>{showConfirmScan == 1 ? formatMessage({ defaultMessage: 'Sau khi Quét xác nhận đóng gói, bạn cần nhấn "Sẵn sàng giao" để đơn hàng chuyển trạng thái "Chờ lấy hàng". Bạn có muốn tắt tính năng này không?' }) : formatMessage({ defaultMessage: 'Sau khi Quét xác nhận đóng gói, hệ thống sẽ ghi nhận xuất kho thành công, đơn hàng chuyển trạng thái "Chờ lấy hàng". Bạn có muốn bật tính năng này không?' })}</p>
            </div>
            <div className="form-group mb-0">
              <button
                id="kt_login_signin_submit"
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 100 }}
                onClick={e => {
                  e.preventDefault();
                  setShowConfirmScan(null);
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'KHÔNG' })}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                onClick={async () => {
                  setFieldValue('scan_warehouse', showConfirmScan == 1 ? 2 : 1)
                  setShowConfirmScan(null);
                }}
              >
                <span className="font-weight-boldest">
                  {showConfirmScan == 1 ? formatMessage({ defaultMessage: 'CÓ, TẮT' }) : formatMessage({ defaultMessage: 'CÓ, KÍCH HOẠT' })}
                </span>
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <div>
        <div className={`mb-2 row`} style={{ position: "relative" }}>
          <div className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Loại kho" })}
            <span className="text-primary">*</span>
          </div>
          <div className="col-10">
            <Field
              name="fulfillment_by"
              disabled={dialogWh.typeAction !== typesAction["CREATE_WAREHOUSE"]}
              component={RadioGroup}
              required
              customFeedbackLabel={" "}
              options={[{ value: 1, label: formatMessage({ defaultMessage: "Kho riêng" }) }, { value: 2, label: formatMessage({ defaultMessage: "Kho dịch vụ" }) },]}
            />
          </div>
        </div>
        {values['fulfillment_by'] == 2 && (
          <>
            <div className="mb-2 row">
              <div className="col-2 p-0 text-right">{formatMessage({ defaultMessage: "Nhà cung cấp" })}<span className="text-primary">*</span></div>
              <div className="col-10">
                <Field
                  name='fulfillment_provider'
                  component={ReSelect}
                  isDisabled={dialogWh?.typeAction !== "CREATE_WAREHOUSE"}
                  placeholder={formatMessage({ defaultMessage: 'Chọn nhà cung cấp dịch vụ' })}
                  options={provides || []}
                  className="w-100 custom-select-order"
                  cols={['col-3', 'col-12']}
                  loading={loading}
                  isClear={false}
                  onChanged={(value) => {
                    if (value) {
                      setProvider(value);
                      refetchProvider()
                    }
                  }}
                />
              </div>
            </div>

            <div className="mb-2 row">
              <div className="col-2 p-0 text-right">{formatMessage({ defaultMessage: "Chọn kho" })}<span className="text-primary">*</span></div>
              <div className="col-10">
                <Field
                  name='fulfillment_provider_wms_code'
                  component={ReSelect}
                  placeholder={formatMessage({ defaultMessage: 'Chọn kho' })}
                  options={optionsWarehouseProvider || []}
                  className="w-100 custom-select-order"
                  cols={['col-3', 'col-12']}
                  loading={loading}
                  isClear={false}
                  onChanged={async (value) => {
                    if (!!value) {
                      setProviderWmsCode(value)
                      const checkExisWh = await checkExisWarehouse(value?.name);
                      if (checkExisWh) {
                        setFieldValue('isNameExist', value?.name)
                        setFieldValue('nameExist', value?.name)
                      } else {
                        setFieldValue('isNameExist', false)
                        setFieldValue('nameExist', '')
                      }

                    }
                  }}
                />

              </div>
            </div>
          </>
        )}


        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Tên kho" })}{" "}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10 mb-2">
            <Field
              name={`nameWarehouse`}
              component={Input}
              value={values["nameWarehouse"]}
              placeholder={formatMessage({
                defaultMessage: "Nhập tên kho",
              })}
              label={""}
              onBlurChange={async () => {
                const checkExisWh = await checkExisWarehouse(values["nameWarehouse"]);
                if (checkExisWh) {
                  setFieldValue('isNameExist', values['nameWarehouse'])
                  setFieldValue('nameExist', values['nameWarehouse'])
                } else {
                  setFieldValue('isNameExist', false)
                  setFieldValue('nameExist', '')
                }
              }}
              required={false}
              customFeedbackLabel={" "}
              cols={["col-0", "col-12"]}
              countChar
              rows={2}
              minChar={"10"}
              maxChar={"120"}
            />
          </div>
        </div>



        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Mã kho" })}{" "}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`codeWarehouse`}
              component={Input}
              value={values["codeWarehouse"]}
              placeholder={formatMessage({
                defaultMessage: "Nhập mã kho",
              })}
              label={""}
              required={false}
              customFeedbackLabel={" "}
              cols={["col-0", "col-12"]}
              countChar
              rows={2}
              minChar={"10"}
              maxChar={"120"}
            />
          </div>
        </div>
        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Tỉnh/Thành phố" })}{" "}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`province`}
              component={ReSelectVertical}
              placeholder={formatMessage({
                defaultMessage: "Chọn Tỉnh/ Thành phố",
              })}
              onChanged={(value) => {
                setFieldValue('district', "")
                setFieldValue('ward', "")
                // if (dialogWh?.typeAction != "CREATE_WAREHOUSE") {
                //   setDialogWh({
                //     ...dialogWh,
                //     infoWh: {
                //       ...dialogWh?.infoWh,
                //       province_code: value?.value,
                //       district_code: null,
                //       ward_code: null
                //     }
                //   })
                // }
              }}
              label={""}
              required
              customFeedbackLabel={" "}
              options={optionsProvince}
              formatOptionLabel={(option, labelMeta) => {
                return <div className="d-flex align-items-center">
                  <span>{option.label}</span>
                </div>
              }}
            />
          </div>
        </div>
        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Quận/huyện" })}{" "}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`district`}
              component={ReSelectVertical}
              placeholder={formatMessage({
                defaultMessage: "Chọn Quận/huyện",
              })}
              onChanged={(district) => {
                setFieldValue('ward', "")
                // if (dialogWh?.typeAction != "CREATE_WAREHOUSE") {
                //   setDialogWh({
                //     ...dialogWh,
                //     infoWh: {
                //       ...dialogWh?.infoWh,
                //       province_code: values?.province?.value,
                //       district_code: district?.value,
                //       ward_code: null
                //     }
                //   })
                // }
              }}
              label={""}
              required
              customFeedbackLabel={" "}
              options={optionsDistrict[values?.province?.value]}
              formatOptionLabel={(option, labelMeta) => {
                return <div className="d-flex align-items-center">
                  <span>{option.label}</span>
                </div>
              }}
            />
          </div>
        </div>
        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: "Xã/Phường" })}{" "}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`ward`}
              component={ReSelectVertical}
              placeholder={formatMessage({
                defaultMessage: "Chọn Xã/Phường",
              })}
              label={""}
              required
              customFeedbackLabel={" "}
              options={dataWards?.crmGetWards?.map(item => {
                return {
                  value: item?.code,
                  label: item?.name
                }
              })}
              formatOptionLabel={(option, labelMeta) => {
                return <div className="d-flex align-items-center">
                  <span>{option.label}</span>
                </div>
              }}
            />
          </div>
        </div>
        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: 'Địa chỉ' })} <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`address`}
              value={values["address"]}
              component={TextArea}
              placeholder={formatMessage({
                defaultMessage: "Nhập địa chỉ",
              })}
              label={""}
              required={false}
              customFeedbackLabel={" "}
              cols={["col-0", "col-12"]}
              countChar
              rows={4}
              minChar={"10"}
              maxChar={"255"}
            />
          </div>
        </div>

        {dialogWh.typeAction == typesAction["CREATE_WAREHOUSE"] && values['fulfillment_by'] == 1 && (
          <div className="mb-2 row">
            <span className="col-2 p-0 text-right mt-1">
              {formatMessage({ defaultMessage: "Tồn âm" })}
              <TooltipWrapper
                note={formatMessage({
                  defaultMessage:
                    "Khi hàng hoá tạm thời không còn trong kho, đơn hàng vẫn sẽ được tiếp tục xử lý.",
                })}
              >
                <i className="fas fa-info-circle fs-14 ml-2"></i>
              </TooltipWrapper>
            </span>
            <div className="col-10">
              <Field
                name={`isPreallocate`}
                value={values["isPreallocate"]}
                component={Switch}
              />
            </div>
          </div>
        )}
        {values['fulfillment_by'] == 1 && (
          <>
            <div className="mb-2 row mt-4 p-0">
              <span className="col-2 p-0 text-right">
                {formatMessage({ defaultMessage: 'Tiền tố phiếu nhập' })}
              </span>
              <div className="col-10">
                <Field
                  name={`inboundPrefix`}
                  value={values["inboundPrefix"]}
                  component={Input}
                  placeholder={formatMessage({
                    defaultMessage: "Nhập tiền tố phiếu nhập",
                  })}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["col-0", "col-12"]}
                  countChar
                  rows={2}
                  minChar={"0"}
                  maxChar={"5"}
                />
              </div>
            </div>

            <div className="mb-2 row">
              <span className="col-2 p-0 text-right">
                {formatMessage({ defaultMessage: 'Tiền tố phiếu xuất' })}
              </span>
              <div className="col-10">
                <Field
                  name={`outboundPrefix`}
                  value={values["outboundPrefix"]}
                  component={Input}
                  placeholder={formatMessage({
                    defaultMessage: "Nhập tiền tố phiếu xuất",
                  })}
                  label={""}
                  required={false}
                  customFeedbackLabel={" "}
                  cols={["col-0", "col-12"]}
                  countChar
                  rows={2}
                  minChar={"0"}
                  maxChar={"5"}
                />
              </div>
            </div>
          </>
        )}
        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: 'Tên NV phụ trách' })}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`staff_name`}
              value={values["staff_name"]}
              component={Input}
              placeholder={formatMessage({
                defaultMessage: "Nhập tên nhân viên phụ trách",
              })}
              label={""}
              required={false}
              customFeedbackLabel={" "}
              cols={["col-0", "col-12"]}
              countChar
              minChar={"0"}
              maxChar={"100"}
            />
          </div>
        </div>

        <div className="mb-2 row">
          <span className="col-2 p-0 text-right">
            {formatMessage({ defaultMessage: 'SĐT gửi hàng' })}
            <span className="text-primary">*</span>
          </span>
          <div className="col-10">
            <Field
              name={`phone_num`}
              value={values["phone_num"]}
              component={Input}
              placeholder={formatMessage({
                defaultMessage: "Nhập SĐT",
              })}
              label={""}
              required
              customFeedbackLabel={" "}
              cols={["col-0", "col-12"]}
            />
          </div>
        </div>
        {values['fulfillment_by'] == 1 && (
          <div className="mb-2 row d-flex align-items-center">
            <span className="col-2 p-0 text-right mt-1">
              {formatMessage({ defaultMessage: "Quét sp đóng gói" })}
              <TooltipWrapper
                note={""}
              >
                <i className="fas fa-info-circle fs-14 ml-2"></i>
              </TooltipWrapper>
            </span>
            <div className="col-10 d-flex">
              <span className="switch" style={{ transform: 'scale(0.8)' }}>
                <label>
                  <input
                    type={'checkbox'}
                    style={{ background: '#F7F7FA', border: 'none' }}
                    onChange={() => setFieldValue('fulfillment_scan_pack_mode', values[`fulfillment_scan_pack_mode`] == 1 ? 2 : 1)}
                    checked={values[`fulfillment_scan_pack_mode`] == 1}
                  />
                  <span></span>
                </label>
              </span>
            </div>
          </div>
        )}
        {values['fulfillment_by'] == 1 && (
          <div className="mb-2 row d-flex align-items-center">
            <span className="col-2 p-0 text-right mt-1">
              {formatMessage({ defaultMessage: "Quét xuất kho" })}
              <TooltipWrapper
                note={formatMessage({
                  defaultMessage:
                    `Sau khi Quét xác nhận đóng gói, hệ thống sẽ ghi nhận xuất kho thành công, đơn hàng chuyển trạng thái "Chờ lấy hàng".`
                })}
              >
                <i className="fas fa-info-circle fs-14 ml-2"></i>
              </TooltipWrapper>
            </span>
            <div className="col-10 d-flex">
              <span className="switch" style={{ transform: 'scale(0.8)' }}>
                <label>
                  <input
                    type={'checkbox'}
                    style={{ background: '#F7F7FA', border: 'none' }}
                    onChange={() => setShowConfirmScan(values[`scan_warehouse`])}
                    checked={values[`scan_warehouse`] == 1}
                  />
                  <span></span>
                </label>
              </span>
            </div>
          </div>
        )}
        {values['fulfillment_by'] == 1 && (
          <Fragment>
            <div className="mt-4 mb-2 row">
              <div className="col-12">
                <span>{formatMessage({ defaultMessage: 'Thiết lập số kiện hàng tối đa trong phiếu nhặt hàng' })}</span>
              </div>
            </div>
            <div className="mb-2 row d-flex align-items-center">
              <span className="col-2 p-0 text-right">
                {formatMessage({ defaultMessage: 'Một sản phẩm' })}
              </span>
              <div className="col-10">
                <div className="row d-flex align-items-center justify-content-between">
                  <div className="col-4">
                    <Field
                      name={'max_sio'}
                      component={InputVertical}
                      type="number"
                      placeholder={formatMessage({ defaultMessage: 'Nhập giá trị ' })}
                      addOnRight={''}
                      required
                      customFeedbackLabel={' '}
                    />
                  </div>
                  <div className="col-7">
                    <div className="row d-flex align-items-center">
                      <div className="text-right">
                        <span>{formatMessage({ defaultMessage: 'Nhiều sản phẩm' })}</span>
                      </div>
                      <div className="col-7">
                        <Field
                          name={'max_mio'}
                          component={InputVertical}
                          type="number"
                          placeholder={formatMessage({ defaultMessage: 'Nhập giá trị ' })}
                          addOnRight={''}
                          required
                          customFeedbackLabel={' '}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Fragment>
        )}
      </div>
    </Fragment>
  )
}

export default WarehouseListField;