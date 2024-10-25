import React, { useMemo, useCallback, useState, memo, Fragment } from 'react';
import { Formik, Field } from 'formik';
import { useToasts } from "react-toast-notifications";
import { uniqBy } from 'lodash';
import { useIntl } from 'react-intl';
import { Modal } from 'react-bootstrap';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import makeAnimated from 'react-select/animated';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import { useMutation, useQuery } from '@apollo/client';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_scGetWarehouseMapping from '../../../../../graphql/query_scGetWarehouseMapping';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import { ReSelect } from '../../../../../_metronic/_partials/controls/forms/ReSelect';
import mutate_scUpdateWarehouseMapping from '../../../../../graphql/mutate_scUpdateWarehouseMapping';


const MappingWarehouseDialog = ({ onHide, show, storeId }) => {
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();

    const { data: dataScWarehouseMapping, loading: loadingScWarehouseMapping } = useQuery(query_scGetWarehouseMapping, {
        variables: {
            store_id: storeId
        },
        fetchPolicy: "cache-and-network",
    });

    const { data: dataSmeWarehouse } = useQuery(query_sme_catalog_stores, {
        fetchPolicy: 'cache-and-network'
    })

    const [scUpdateWarehouseMapping, { loading: loadingScUpdateWarehouseMapping }] = useMutation(mutate_scUpdateWarehouseMapping, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetWarehouseMapping']
    });    

    const optionsSmeWarehouse = useMemo(() => {
        if (!dataSmeWarehouse?.sme_warehouses || dataSmeWarehouse?.sme_warehouses?.length == 0) return [];

        const options = dataSmeWarehouse?.sme_warehouses?.map(wh => ({
            ...wh,
            value: wh?.id,
            label: wh?.name,
        }))

        return options
    }, [dataSmeWarehouse]);

    console.log({ optionsSmeWarehouse })

    const initialValues = useMemo(
        () => {
            if (!dataScWarehouseMapping || dataScWarehouseMapping?.scGetWarehouseMapping?.length == 0) return {
                isEdit: false,
                isMutil: false
            };

            const scWarehouseValues = dataScWarehouseMapping?.scGetWarehouseMapping?.reduce(
                (result, warehouseMapping) => {
                    result[`sme_warehouse_mapping_${warehouseMapping?.id}`] = !!warehouseMapping?.sme_warehouse_id
                        ? optionsSmeWarehouse?.find(wh => wh?.value == warehouseMapping?.sme_warehouse_id)
                        : undefined

                    return result;
                }, {}
            )

            return {
                ...scWarehouseValues,
                isEdit: false,
                isMutil: dataScWarehouseMapping?.scGetWarehouseMapping?.length > 1
            }
        }, [optionsSmeWarehouse, dataScWarehouseMapping]
    );
    
    return (
        <Formik
            initialValues={initialValues}
            validationSchema={null}
            enableReinitialize
        >
            {({
                handleSubmit,
                values,
                validateForm,
                setFieldValue,
                errors,
                touched,
                setFieldTouched,
                ...rest
            }) => {
                console.log({ values });

                return (
                    <Fragment>
                        <LoadingDialog show={loadingScUpdateWarehouseMapping} />
                        <Modal
                            show={show}
                            aria-labelledby="example-modal-sizes-title-xl"
                            centered
                            size="lg"
                            backdrop={true}
                            onHide={() => { }}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Thông tin liên kết kho' })}
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body className="overlay overlay-block cursor-default">
                                {loadingScWarehouseMapping && (
                                    <div className='d-flex align-items-center justify-content-center' style={{ minHeight: 150 }}>
                                        <span className="spinner spinner-primary" />
                                    </div>
                                )}
                                {!loadingScWarehouseMapping && (
                                    <Fragment>
                                        {values?.isMutil && (
                                            <div className='d-flex justify-content-between align-items-center mb-2'>
                                                <div className='d-flex align-items-center'>
                                                    <img
                                                        className="mr-2"
                                                        src={toAbsoluteUrl(`/media/logo_${dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.connector_channel_code}.png`)}
                                                        style={{ width: 14, height: 14, objectFit: "contain" }}
                                                    />
                                                    <span>
                                                        {dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.name}
                                                    </span>
                                                </div>
                                                {!values[`isEdit`] && <button
                                                    type="submit"
                                                    className="btn btn-primary ml-2"
                                                    // style={{ width: 120 }}
                                                    onClick={() => setFieldValue('isEdit', true)}
                                                >{formatMessage({defaultMessage: 'Thay đổi liên kết kho'})}</button>}
                                            </div>
                                        )}
                                        <Table
                                            className="upbase-table"
                                            columns={[
                                                {
                                                    title:formatMessage({ defaultMessage: 'STT' }),
                                                    dataIndex: 'idex',
                                                    key: 'idex',
                                                    align: 'center',
                                                    width: '10%',
                                                    render: (item, record, index) => {
                                                        return (
                                                            <div className='d-flex flex-column'>
                                                                <span>{index + 1}</span>
                                                            </div>
                                                        )
                                                    }
                                                },
                                                {
                                                    title: values?.isMutil ? formatMessage({ defaultMessage: 'Kho kênh bán' }) : formatMessage({ defaultMessage: 'Gian hàng' }),
                                                    dataIndex: 'id',
                                                    key: 'id',
                                                    align: 'left',
                                                    width: '50%',
                                                    render: (item, record) => {
                                                        return (
                                                            <div className='d-flex flex-column'>
                                                                {values?.isMutil ? (
                                                                    <div className='d-flex align-items-center mb-2'>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                                            <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z" />
                                                                        </svg>
                                                                        <span>{record?.scWarehouse?.warehouse_name}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className='d-flex align-items-center mb-2'>
                                                                        <img
                                                                            className="mr-2"
                                                                            src={toAbsoluteUrl(`/media/logo_${record?.scWarehouse?.storeChannel?.connector_channel_code}.png`)}
                                                                            style={{ width: 14, height: 14, objectFit: "contain" }}
                                                                        />
                                                                        <span>
                                                                            {record?.scWarehouse?.storeChannel?.name}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <span className='text-secondary-custom'>{values?.isMutil ? formatMessage({ defaultMessage: 'Địa chỉ kho hàng' }) : formatMessage({ defaultMessage: 'Địa chỉ giao hàng' })}:</span>
                                                                <span>{record?.scWarehouse?.address}</span>
                                                            </div>
                                                        )
                                                    }
                                                },
                                                {
                                                    title: formatMessage({ defaultMessage: ' Kho vật lý' }),
                                                    dataIndex: 'sme_warehouse_id',
                                                    key: 'sme_warehouse_id',
                                                    align: 'left',
                                                    width: '40%',
                                                    render: (item, record) => {
                                                        return (
                                                            <Fragment>
                                                                {!values[`isEdit`] && !values[`sme_warehouse_mapping_${record?.id}`] && <div className='d-flex justify-content-between align-items-center'>
                                                                    <span className='text-danger'>
                                                                        {formatMessage({ defaultMessage: 'Trong thời gian không liên kết, đơn hàng phát sinh không thể khóa/khấu trừ tồn kho và đồng bộ hàng tồn kho không thể thực hiện được.' })}
                                                                    </span>
                                                                    {!values?.isMutil && <i
                                                                        className="far fa-edit cursor-pointer ml-4"
                                                                        style={{ color: '#000000' }}
                                                                        onClick={() => setFieldValue('isEdit', true)}
                                                                    />}
                                                                </div>}
                                                                {!values[`isEdit`] && !!values[`sme_warehouse_mapping_${record?.id}`] && (
                                                                    <div className='d-flex justify-content-between align-items-center'>
                                                                        <div className='d-flex flex-column'>
                                                                            <div className='d-flex align-items-center mb-2'>
                                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                                                    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z" />
                                                                                </svg>
                                                                                <span>{values[`sme_warehouse_mapping_${record?.id}`]?.label}</span>
                                                                            </div>
                                                                            <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Địa chỉ kho hàng' })}:</span>
                                                                            <span>{values[`sme_warehouse_mapping_${record?.id}`]?.address}</span>
                                                                        </div>
                                                                        {!values?.isMutil && <i
                                                                            className="far fa-edit cursor-pointer ml-4"
                                                                            style={{ color: '#000000' }}
                                                                            onClick={() => setFieldValue('isEdit', true)}
                                                                        />}
                                                                    </div>
                                                                )}
                                                                {!!values[`isEdit`] && (
                                                                    <div className='d-flex flex-column'>
                                                                        <div className='mb-2'>
                                                                            <Field
                                                                                name={`sme_warehouse_mapping_${record?.id}`}
                                                                                component={ReSelect}
                                                                                hideBottom
                                                                                placeholder={formatMessage({ defaultMessage: 'Chọn kho vật lý' })}
                                                                                label={""}
                                                                                customFeedbackLabel={' '}
                                                                                options={optionsSmeWarehouse}
                                                                                isClearable={false}
                                                                            />
                                                                        </div>
                                                                        {!!values[`sme_warehouse_mapping_${record?.id}`] && (
                                                                            <div className='d-flex flex-column'>
                                                                                <span className='text-secondary-custom'>{formatMessage({ defaultMessage: 'Địa chỉ kho hàng' })}:</span>
                                                                                <span>{values[`sme_warehouse_mapping_${record?.id}`]?.address}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Fragment>
                                                        )
                                                    }
                                                }
                                            ]}
                                            data={dataScWarehouseMapping?.scGetWarehouseMapping || []}
                                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                                            </div>}
                                            tableLayout="auto"
                                            sticky={{ offsetHeader: 0 }}
                                        />
                                        {values[`isEdit`] && <div className='d-flex align-items-center mt-2'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-exclamation-triangle-fill mr-2 text-danger" viewBox="0 0 16 16">
                                                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                            </svg>
                                            <span className='text-danger'>
                                                {formatMessage({ defaultMessage: 'Lưu ý: Tồn kho và đơn hàng sẽ được xử lý và đồng bộ từ kho liên kết mới' })}
                                            </span>
                                        </div>}
                                    </Fragment>
                                )}
                            </Modal.Body>
                            <Modal.Footer
                                className="form p-4 d-flex justify-content-end"
                                style={{ borderTop: '1px solid #dbdbdb' }}
                            >
                                <div className="form-group">
                                    <button
                                        type="button"
                                        onClick={onHide}
                                        className="btn btn-secondary"
                                        style={{ width: 120 }}
                                    >
                                        {values[`isEdit`] ? formatMessage({ defaultMessage: 'Hủy' }) : formatMessage({ defaultMessage: 'Đóng' })}
                                    </button>
                                    {values[`isEdit`] && (
                                        <button
                                            type="submit"
                                            className="btn btn-primary ml-2"
                                            style={{ width: 120 }}
                                            onClick={async () => {
                                                try {
                                                    const bodyRequest = {
                                                        store_id: dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.id,
                                                        mappings: dataScWarehouseMapping?.scGetWarehouseMapping?.map(warehouseMapping => ({
                                                            maping_id: warehouseMapping?.id,
                                                            sme_warehouse_id: values[`sme_warehouse_mapping_${warehouseMapping?.id}`]?.value || null,
                                                            fulfillment_provider_type: values[`sme_warehouse_mapping_${warehouseMapping?.id}`]?.fulfillment_by,
                                                            fulfillment_provider_connected_id: values[`sme_warehouse_mapping_${warehouseMapping?.id}`]?.fulfillment_provider_connected_id,
                                                            provider_warehouse_code: values[`sme_warehouse_mapping_${warehouseMapping?.id}`]?.fulfillment_provider_wms_code || null
                                                        }))
                                                    };

                                                    const bodyExistSWI = bodyRequest?.mappings?.filter(item => !!item?.sme_warehouse_id);
                                                    const uniqBodyRequest = uniqBy(bodyExistSWI, 'sme_warehouse_id');

                                                    if (uniqBodyRequest?.length != bodyExistSWI?.length) {
                                                        addToast(formatMessage({ defaultMessage: 'Không được thiết lập nhiều kho kênh bán liên kết cùng một kho vật lý' }), { appearance: "error" });
                                                        return;
                                                    }

                                                    const { data } = await scUpdateWarehouseMapping({
                                                        variables: bodyRequest
                                                    });

                                                    if (!!data?.scUpdateWarehouseMapping?.success) {
                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật thông tin liên kết kho thành công' }), { appearance: "success" });
                                                    } else {
                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật thông tin liên kết kho thất bại' }), { appearance: "error" });
                                                    }
                                                    onHide();
                                                } catch {
                                                    addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
                                                }
                                            }}
                                        >
                                            {formatMessage({ defaultMessage: 'Cập nhật' })}
                                        </button>
                                    )}
                                </div>
                            </Modal.Footer>
                        </Modal>
                    </Fragment>
                )
            }}
        </Formik>
    )
}

export default memo(MappingWarehouseDialog);