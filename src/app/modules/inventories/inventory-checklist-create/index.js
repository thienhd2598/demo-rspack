/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useSubheader } from "../../../../_metronic/layout";
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { useQuery, useMutation } from "@apollo/client";
import { Field, Formik, useFormikContext } from "formik";
import * as Yup from "yup";
import { useToasts } from "react-toast-notifications";
import { Card, CardBody, CardHeader, CardHeaderToolbar, InputVertical } from "../../../../_metronic/_partials/controls";
import { ReSelectVertical } from '../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import { RadioGroup } from "../../../../_metronic/_partials/controls/forms/RadioGroup";
import query_sme_catalog_stores from "../../../../graphql/query_sme_catalog_stores";
import query_sme_inventory_checklist_tags from "../../../../graphql/query_sme_inventory_checklist_tags";
import mutate_inventoryChecklistCreate from "../../../../graphql/mutate_inventoryChecklistCreate";
import { useSelector, shallowEqual, connect, useDispatch } from "react-redux";
import { Redirect } from "react-router-dom";
import CreatableSelect from 'react-select/creatable';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { useIntl } from "react-intl";

export default memo(({
    history,
}) => {
    const { addToast } = useToasts();
    const [warehouseDefault, setWarehouseDefault] = useState(null);
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const {formatMessage} = useIntl()
    const [inventoryChecklistCreate] = useMutation(mutate_inventoryChecklistCreate, {
    })
    const { setBreadcrumbs } = useSubheader()
    const user = useSelector((state) => state.auth.user, shallowEqual);
    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({defaultMessage:'Kiểm kho'}),
            },
            {
                title: formatMessage({defaultMessage:'Tạo phiếu kiểm kho'}),
            }
        ])
    }, [])
    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network',
        variables: {
            where: {
                fulfillment_by: {
                    _eq: 1
                },
                status: {_eq: 10}
            }
        }
    })
    const { data: dataSmeInventoriesTags } = useQuery(query_sme_inventory_checklist_tags, {
        fetchPolicy: 'cache-and-network'
    });

    const generateVerificationCode = useCallback(
        (values, setFieldValue) => {
            let verificationCode = 'UB'
            const now = new Date();
            const unixTimestamp = Math.floor(now.getTime() / 1000);
            const smeIdLast3Digits = user?.sme_id.toString().slice(-3)
            if (values?.warehouseId?.value) {
                const warehouseIdLast2Digits = values.warehouseId.value.toString().slice(-2)
                verificationCode += smeIdLast3Digits + '-' + warehouseIdLast2Digits + '-' + unixTimestamp
            } else {
                verificationCode += smeIdLast3Digits + '-' + unixTimestamp

            }
            if (setFieldValue) {
                setFieldValue('code', verificationCode)
            }
            return verificationCode
        }, []
    );

    // useEffect(() => {
    //     warehouseIdDefault()
    // }, [dataWarehouse]);

    const warehouseIdDefault = () => {
        let sme_warehouses = dataWarehouse?.sme_warehouses || []
        let warehouse = {}
        if (sme_warehouses.length > 0) {
            warehouse = sme_warehouses.find((element) => element.is_default == 1)

            return ({
                label: warehouse?.name,
                value: warehouse?.id
            })
        }
        return null
    }

    const validationSchema = Yup.object().shape({
        code: Yup.string()
            .max(50, formatMessage({defaultMessage:'Mã kiểm kho tối đa 50 ký tự'}))
        //   .required("Vui lòng nhập tên nhóm phân loại")
        //   .notOneOf(attributes.concat(customAttributes).filter(_att => _att.id != attributeRename).map(_attribute => _attribute.display_name), "Tên các nhóm phân loại không được trùng nhau")
        //   .test(
        //     'chua-ky-tu-space-o-dau-cuoi',
        //     'Tên nhóm phân loại không được chứa dấu cách ở đầu và cuối',
        //     (value, context) => {
        //       if (!!value) {
        //         return value.length == value.trim().length;
        //       }
        //       return false;
        //     },
        //   )
        //   .test(
        //     'chua-ky-tu-2space',
        //     'Tên nhóm phân loại không được chứa 2 dấu cách liên tiếp',
        //     (value, context) => {
        //       if (!!value) {
        //         return !(/\s\s+/g.test(value))
        //       }
        //       return false;
        //     },
        //   ),
    });

    return <>
        <Helmet
            titleTemplate={formatMessage({defaultMessage:"Tạo phiếu kiểm kho"}) + "- UpBase"}
            defaultTitle={formatMessage({defaultMessage:"Tạo phiếu kiểm kho"}) + "- UpBase"}
        >
            <meta name="description" content={formatMessage({defaultMessage:"Tạo phiếu kiểm kho"}) + "- UpBase"} />
        </Helmet>
        {dataWarehouse && <Formik
            initialValues={{
                warehouseId: warehouseIdDefault(),
                typeChecklist: 'all',
                tags: [],
                __changed__: false
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
                setLoadingSubmit(true)
                const tags = values?.tags?.map(option => {
                    let id = null;
                    if (!option.__isNew__) {
                        id = option.value
                    }
                    return {
                        id: id,
                        title: option.label,
                    };
                });
                let code = !values?.code?.length ? generateVerificationCode(values) : values.code;
                let { data } = await inventoryChecklistCreate({
                    variables: {
                        inventoryChecklistCreateInput: {
                            code: code || null,
                            tags: tags || [],
                            typeChecklist: values.typeChecklist || null,
                            warehouseId: values.warehouseId.value || null,
                        }
                    }
                })
                setLoadingSubmit(false)
                if (data?.inventoryChecklistCreate?.success == 1) {
                    addToast(formatMessage({defaultMessage:'Tạo phiếu kiểm kho thành công'}), { appearance: 'success' });
                    history.push(`/products/inventory/update/${data?.inventoryChecklistCreate?.id}`)
                } else {
                    addToast(data?.inventoryChecklistCreate?.message || formatMessage({defaultMessage:"Tạo phiếu kiểm kho không thành công"}), { appearance: 'error' });
                }
            }}
        >
            {({
                values,
                handleSubmit,
                validateForm,
                setFieldValue
            }) => {
                const changed = values['__changed__']
                return (
                    <>
                        {
                            <LoadingDialog show={loadingSubmit} />
                        }
                        <RouterPrompt
                            when={changed}
                            title={formatMessage({defaultMessage:"Lưu ý mọi thông tin bạn nhập trước đó sẽ không được lưu lại?"})}
                            cancelText={formatMessage({defaultMessage:"Quay lại"})}
                            okText={formatMessage({defaultMessage:"Tiếp tục"})}
                            onOK={() => true}
                            onCancel={() => false}
                        />
                        <Card>
                            <CardHeader title={formatMessage({defaultMessage:"THÔNG TIN PHIẾU"})}>
                                <CardHeaderToolbar>
                                </CardHeaderToolbar>
                            </CardHeader>
                            <CardBody className='px-15 py-5"'>
                                <div className='row d-flex justify-content-between'>
                                    <div className={`col-md-5`} >
                                        <Field
                                            name="warehouseId"
                                            component={ReSelectVertical}
                                            onChange={() =>{
                                                setFieldValue('__changed__', true)
                                            }}
                                            placeholder=""
                                            label={formatMessage({defaultMessage:"Kho thực hiện kiểm kho"})}
                                            customFeedbackLabel={' '}
                                            options={dataWarehouse?.sme_warehouses?.map(__ => {
                                                return {
                                                    label: __.name,
                                                    value: __.id
                                                }
                                            })}
                                            isClearable={false}
                                        />
                                    </div>
                                    <div className={`col-md-5`} >
                                        <label className="col-form-label">Tag</label>
                                        <CreatableSelect
                                            name="tags"
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({defaultMessage:"Nhập tags"})}
                                            label={"Tag"}
                                            value={values.tags}
                                            onChange={value => {
                                                setFieldValue('__changed__', true)
                                                if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 16)) {
                                                    addToast(formatMessage({defaultMessage:'Tag phiếu tối đa chỉ được 16 ký tự'}), { appearance: 'error' });
                                                    return;
                                                } else {
                                                    setFieldValue(`tags`, value)
                                                }
                                            }}
                                            options={dataSmeInventoriesTags?.sme_inventory_checklist_tags?.map(__ => {
                                                return {
                                                    label: __.title,
                                                    value: __.id
                                                }
                                            })}
                                            isDisabled={user?.is_subuser && !['product_inventory_action']?.some(key => user?.permissions?.includes(key))}
                                            customFeedbackLabel={' '}
                                            isCreatable={true}
                                            isMulti={true}
                                            formatCreateLabel={(inputValue) => `${formatMessage({defaultMessage: 'Tạo mới'})}: "${inputValue}"`}
                                        />
                                    </div>
                                    {/* <div className={`col-md-5`} >
                                        <Field
                                            name="code"
                                            component={InputVertical}
                                            placeholder=""
                                            onChange={() =>{
                                                setFieldValue('__changed__', true)
                                            }}
                                            label={<span>Mã kiểm kho (<a href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    setFieldValue('__changed__', true)
                                                    generateVerificationCode(values, setFieldValue)
                                                }}
                                                style={{ color: '#FF5629', fontWeight: 'bold' }} >Tự động tạo</a>)</span>}
                                            customFeedbackLabel={' '}
                                        />
                                    </div> */}
                                </div>
                                <div className='row d-flex justify-content-between'>
                                    <div className={`col-md-5`} >
                                        <Field
                                            name="typeChecklist"
                                            component={RadioGroup}
                                            curr
                                            label={formatMessage({defaultMessage:'Loại kiểm kho'})}
                                            customFeedbackLabel={' '}
                                            options={[
                                                {
                                                    value: 'sku',
                                                    label: formatMessage({defaultMessage:'Theo SKU Hàng hóa'})
                                                },
                                                {
                                                    value: "all",
                                                    label: formatMessage({defaultMessage:'Toàn bộ kho'})
                                                },
                                            ]}
                                        />
                                    </div>
                                  
                                </div>
                                <div className='d-flex justify-content-end mt-20' >
                                    <button className="btn btn-secondary mr-2" style={{ width: 150 }} onClick={e => {
                                        e.preventDefault()
                                        history.push('/products/inventory/list')
                                    }} >{formatMessage({defaultMessage:'Hủy bỏ'})}</button>
                                    <button className="btn btn-primary" style={{ width: 150 }} type="submit"
                                        // disabled={values.image_uploading}
                                        onClick={async () => {
                                            setFieldValue('__changed__', false)
                                            let res = await validateForm()
                                            console.log('res', res)
                                            if (Object.keys(res).length > 0) {
                                                addToast(formatMessage({defaultMessage:"Mã kiểm kho tối đa 50 ký tự"}), { appearance: 'error' })
                                                return
                                            }
                                            handleSubmit()
                                        }} >{formatMessage({defaultMessage:'Tạo phiếu'})}</button>
                                </div>
                            </CardBody>
                        </Card>

                    </>
                )
            }
            }
        </Formik>
        }
        <div
            id="kt_scrolltop1"
            className="scrolltop"
            style={{ bottom: 80 }}
            onClick={() => {
                window.scrollTo({
                    letf: 0,
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }}
        >
            <span className="svg-icon">
                <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
            </span>{" "}
        </div>
    </>
})
