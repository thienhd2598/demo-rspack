/*
 * Created by duydatpham@gmail.com on 15/03/2023
 * Copyright (c) 2023 duydatpham@gmail.com
 */
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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

import { Redirect, useParams } from "react-router-dom";
import query_sme_inventory_checklists from "../../../../graphql/query_sme_inventory_checklists";
import CreatableSelect from 'react-select/creatable';
import query_sme_inventory_checklist_tag_mapping from "../../../../graphql/query_sme_inventory_checklist_tag_mapping";
import mutate_delete_sme_inventory_checklist_tag_mapping_by_pk from "../../../../graphql/mutate_delete_sme_inventory_checklist_tag_mapping_by_pk";
import mutate_inventoryChecklistAddTag from "../../../../graphql/mutate_inventoryChecklistAddTag";
import ProductTable from './ProductTable';
import mutate_inventoryChecklistUpdateStatus from "../../../../graphql/mutate_inventoryChecklistUpdateStatus";
import queryString from 'querystring';
import { RouterPrompt } from "../../../../components/RouterPrompt";
import { useIntl } from "react-intl";


export default memo(({
    history,
}) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts();
    const params = useParams();
    const { setBreadcrumbs } = useSubheader()
    const user = useSelector((state) => state.auth.user, shallowEqual);

    const { data, loading, error, refetch } = useQuery(query_sme_inventory_checklists, {
        variables: {
            where: {
                id: { _eq: Number(params.id) }
            }
        },
        fetchPolicy: 'cache-and-network'
    });

    useEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Kiểm kho' }),
            },
            {
                title: data?.sme_inventory_checklists[0]?.code,
            }
        ])
    }, [data])


    const [inventoryChecklistCreate] = useMutation(mutate_inventoryChecklistCreate, {
    })

    const [inventoryChecklistAddTag] = useMutation(mutate_inventoryChecklistAddTag, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_tag_mapping']
    })

    const [delete_sme_inventory_checklist_tag_mapping_by_pk] = useMutation(mutate_delete_sme_inventory_checklist_tag_mapping_by_pk, {
        awaitRefetchQueries: true,
        refetchQueries: ['sme_inventory_checklist_tag_mapping']
    })


    const { data: dataWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    })
    const { data: dataSmeInventoriesTags } = useQuery(query_sme_inventory_checklist_tags, {
        fetchPolicy: 'cache-and-network'
    });

    const { data: getTagsInInventories } = useQuery(query_sme_inventory_checklist_tag_mapping, {
        variables: {
            where: {
                sme_inventory_checklist_id: { _eq: params.id }
            }
        },
        fetchPolicy: 'cache-and-network'
    });
    console.log('data', data)
    const generateVerificationCode = useCallback(
        (values, setFieldValue) => {
            let verificationCode = ''
            const now = new Date();
            const unixTimestamp = Math.floor(now.getTime() / 1000);
            const smeIdLast3Digits = user?.sme_id.toString().slice(-3)
            if (values?.warehouseId?.value) {
                const warehouseIdLast2Digits = values.warehouseId.value.toString().slice(-2)
                verificationCode = smeIdLast3Digits + '-' + warehouseIdLast2Digits + '-' + unixTimestamp
            } else {
                verificationCode = smeIdLast3Digits + '-' + unixTimestamp

            }
            if (setFieldValue) {
                setFieldValue('code', verificationCode)
            }
            return verificationCode
        }, []
    );

    const warehouseId = () => {
        let sme_warehouses = dataWarehouse?.sme_warehouses || []
        const sme_inventory_checklists = data?.sme_inventory_checklists?.map(elm => elm?.sme_warehouse_id)
        console.log('sme_inventory_checklists', sme_inventory_checklists)

        let warehouse = {}
        if (sme_warehouses.length > 0) {
            warehouse = sme_warehouses.find((element) => sme_inventory_checklists?.includes(element?.id))
            console.log('warehouse', warehouse)
            return ({
                label: warehouse?.name,
                value: warehouse?.id
            })
        }
        return null
    }

    let getTags = useMemo(() => {
        return getTagsInInventories?.sme_inventory_checklist_tag_mapping?.map(
            e => ({ 'label': e.tag.title, 'value': e.tag.id })
        )
    }, [getTagsInInventories])

    const addTag = async (tag) => {
        await inventoryChecklistAddTag({
            variables: {
                tag: tag,
                checkListId: Number(params.id)
            }
        })
    }

    const deleteTag = async (label) => {
        let tag_delete = getTagsInInventories?.sme_inventory_checklist_tag_mapping?.find(
            e => e.tag.title == label
        )
        await delete_sme_inventory_checklist_tag_mapping_by_pk({
            variables: {
                id: tag_delete.id,
            }
        })
    }
    const [inventoryChecklistUpdateStatus] = useMutation(mutate_inventoryChecklistUpdateStatus, {
    })


    const validationSchema = Yup.object().shape({});

    const updateChecklistStatus = async (status) => {
        let { data } = await inventoryChecklistUpdateStatus({
            variables: {
                checkListId: Number(params.id) || null,
                status: status
            }
        })
        if (data?.inventoryChecklistUpdateStatus?.success == 1) {
            addToast(formatMessage({ defaultMessage: 'Chuyển trạng thái phiếu kiểm kho thành công' }), { appearance: 'success' });
            history.push(`/products/inventory/list?${queryString.stringify({
                ...params,
                page: 1,
                status: status
            })}`)
        } else {
            addToast(data?.inventoryChecklistUpdateStatus?.message || formatMessage({ defaultMessage: "Chuyển trạng thái phiếu kiểm kho không thành công" }), { appearance: 'error' });
        }
    }

    console.log(user)

    return <>
        <Helmet
            titleTemplate={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists[0]?.code} - UpBase`}
            defaultTitle={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists[0]?.code} - UpBase`}
        >
            <meta name="description" content={`${formatMessage({ defaultMessage: 'Thông tin phiếu' })} - ${data?.sme_inventory_checklists[0]?.code} - UpBase`} />
        </Helmet>
        {data?.sme_inventory_checklists && data?.sme_inventory_checklists && dataSmeInventoriesTags && getTagsInInventories && <Formik
            initialValues={{
                warehouseId: warehouseId(),
                typeChecklist: data?.sme_inventory_checklists[0]?.type,
                code: data?.sme_inventory_checklists[0]?.code,
                tags: getTags
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
                // console.log()
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
                if (data?.inventoryChecklistCreate?.success == 1) {
                    addToast(formatMessage({ defaultMessage: 'Tạo phiếu kiểm kho thành công' }), { appearance: 'success' });
                    history.push('/products/inventory/list')
                } else {
                    addToast(data?.inventoryChecklistCreate?.message || formatMessage({ defaultMessage: "Tạo phiếu kiểm kho không thành công" }), { appearance: 'error' });
                }
            }}
        >
            {({
                values,
                handleSubmit,
                validateForm,
                setFieldValue
            }) => {
                return (
                    <>
                        <Card>
                            <CardHeader title={<span>{formatMessage({ defaultMessage: 'THÔNG TIN PHIẾU' })}&ensp;&ensp;<span style={{ color: '#888484', fontWeight: 'bold', fontSize: 10 }} >{formatMessage({ defaultMessage: 'Chờ kiểm kho' })}</span></span>}>
                                <CardHeaderToolbar>
                                </CardHeaderToolbar>
                            </CardHeader>
                            <CardBody className='px-15 py-5'>
                                <div className='row d-flex justify-content-between'>
                                    <div className={`col-md-5`} >
                                        <Field
                                            name="warehouseId"
                                            component={ReSelectVertical}
                                            placeholder=""
                                            label={formatMessage({ defaultMessage: "Kho thực hiện kiểm kho" })}
                                            customFeedbackLabel={' '}
                                            options={dataWarehouse?.sme_warehouses?.map(__ => {
                                                return {
                                                    label: __.name,
                                                    value: __.id
                                                }
                                            })}
                                            isClearable={false}
                                            isDisabled={true}
                                        />
                                    </div>
                                    <div className={`col-md-5`} >
                                        <Field
                                            name="code"
                                            component={InputVertical}
                                            placeholder=""
                                            maxLength={50}
                                            disabled={true}
                                            label={<span>{formatMessage({ defaultMessage: 'Mã kiểm kho' })}</span>}
                                            customFeedbackLabel={' '}
                                        />
                                    </div>
                                </div>
                                <div className='row d-flex justify-content-between'>
                                    {/* <div className={`col-md-5`} >
                                        <Field
                                            name="typeChecklist"
                                            component={RadioGroup}
                                            curr
                                            value="sku"
                                            label={formatMessage({ defaultMessage: 'Loại kiểm kho' })}
                                            customFeedbackLabel={' '}
                                            disabled={true}
                                            options={[
                                                {
                                                    value: 'sku',
                                                    label: formatMessage({ defaultMessage: 'Theo SKU Hàng hóa' })
                                                },
                                                {
                                                    value: "all",
                                                    label: formatMessage({ defaultMessage: 'Toàn bộ kho' })
                                                },
                                            ]}
                                        >

                                        </Field>
                                    </div> */}
                                    <div className={`col-md-5`} >
                                        <label className="col-form-label">Tag</label>
                                        <CreatableSelect
                                            name="tags"
                                            value={getTags || []}
                                            component={ReSelectVertical}
                                            placeholder={formatMessage({ defaultMessage: "Nhập tags" })}
                                            label={"Tag"}
                                            isDisabled={user?.is_subuser && !['product_inventory_action']?.some(key => user?.permissions?.includes(key))}
                                            onChange={(value, { action, removedValue }) => {
                                                console.log(action)
                                                switch (action) {
                                                    case "select-option":
                                                        addTag(
                                                            {
                                                                id: [...value].pop()['value']
                                                                , title: [...value].pop()['label']
                                                            })

                                                        break;
                                                    case "create-option":

                                                        if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 16)) {
                                                            addToast(formatMessage({ defaultMessage: 'Tag phiếu tối đa chỉ được 16 ký tự' }), { appearance: 'error' });
                                                            return;
                                                        }
                                                        addTag({
                                                            title: [...value].pop()['label']
                                                        })
                                                        break;

                                                    case "remove-value":
                                                        console.log(removedValue, 2)
                                                        deleteTag(removedValue.label)
                                                        break;
                                                }
                                                setFieldValue(`tags`, value)

                                            }}
                                            options={dataSmeInventoriesTags?.sme_inventory_checklist_tags?.map(__ => {
                                                return {
                                                    label: __.title,
                                                    value: __.id
                                                }
                                            })}
                                            customFeedbackLabel={' '}
                                            isCreatable={true}
                                            isMulti={true}
                                            formatCreateLabel={(inputValue) => `${formatMessage({ defaultMessage: 'Tạo mới' })}: "${inputValue}"`}
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardHeader title={formatMessage({ defaultMessage: "Sản phẩm kiểm kho" })}>
                                <CardHeaderToolbar>
                                </CardHeaderToolbar>
                            </CardHeader>
                            <CardBody className='px-15 py-5'>
                                <ProductTable warehouseId={warehouseId()} />
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
