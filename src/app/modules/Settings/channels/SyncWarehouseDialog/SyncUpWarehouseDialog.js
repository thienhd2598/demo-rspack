import React, { useMemo, useCallback, useState, memo, Fragment } from 'react';
import { Formik, Field } from 'formik';
import { useToasts } from "react-toast-notifications";
import { } from 'lodash';
import { useIntl } from 'react-intl';
import { Button, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { ReSelectVertical } from '../../../../../_metronic/_partials/controls/forms/ReSelectVertical';
import makeAnimated from 'react-select/animated';
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import query_scGetWarehouseMapping from '../../../../../graphql/query_scGetWarehouseMapping';
import { useQuery, useMutation } from '@apollo/client';
import Table from 'rc-table';
import 'rc-table/assets/index.css';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_sme_catalog_stores from '../../../../../graphql/query_sme_catalog_stores';
import mutate_scUpdateInventoryPush from '../../../../../graphql/mutate_scUpdateInventoryPush';



const SyncUpWarehouseDialog = ({ onHide, show, storeId }) => {
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
    });

    const [scUpdateInventoryPush, { loading: loadingScUpdateInventoryPush }] = useMutation(mutate_scUpdateInventoryPush, {
        awaitRefetchQueries: true,
        refetchQueries: ['scGetWarehouseMapping']
    });

    const optionsSmeWarehouse = useMemo(() => {
        if (!dataSmeWarehouse?.sme_warehouses || dataSmeWarehouse?.sme_warehouses?.length == 0) return [];

        const options = dataSmeWarehouse?.sme_warehouses?.map(wh => ({
            value: wh?.id,
            label: wh?.name,
            address: wh?.address
        }))

        return options
    }, [dataSmeWarehouse]);

    const initialValues = useMemo(
        () => {
            if (!dataScWarehouseMapping || dataScWarehouseMapping?.scGetWarehouseMapping?.length == 0) return {
                isMutil: false
            };

            const percentSynInventories = dataScWarehouseMapping?.scGetWarehouseMapping?.reduce(
                (result, warehouseMapping) => {
                    result[`percent_sync_${warehouseMapping?.id}`] = warehouseMapping?.inventory_push_percent || 0

                    return result;
                }, {}
            );

            return {
                isMutil: dataScWarehouseMapping?.scGetWarehouseMapping?.length > 1,
                ...percentSynInventories
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
                setFieldError,
                touched,
                setFieldTouched,
                ...rest
            }) => {
                return (
                    <Fragment>
                        <LoadingDialog show={loadingScUpdateInventoryPush} />
                        <Modal
                            show={show}
                            enforceFocus={false}
                            aria-labelledby="example-modal-sizes-title-md"
                            centered
                            size="lg"
                            backdrop={true}
                            onHide={() => { }}
                        >
                            <Modal.Header closeButton={true}>
                                <Modal.Title>
                                    {formatMessage({ defaultMessage: 'Quy tắc đẩy tồn' })}
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
                                            <div className='d-flex align-items-center mb-2'>
                                                <div className='d-flex align-items-center'>
                                                    <img
                                                        className='mr-2'
                                                        src={toAbsoluteUrl(`/media/logo_${dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.connector_channel_code}.png`)}
                                                        style={{ width: 14, height: 14, objectFit: "contain" }}
                                                    />
                                                    <span>
                                                        {dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <Table
                                            className="upbase-table"
                                            columns={[
                                                {
                                                    title: values?.isMutil ? formatMessage({ defaultMessage: 'Kho kênh bán' }) : formatMessage({ defaultMessage: 'Gian hàng' }),
                                                    dataIndex: 'id',
                                                    key: 'id',
                                                    align: 'left',
                                                    width: '33%',
                                                    render: (item, record) => {
                                                        return (
                                                            <div className='d-flex flex-column'>
                                                                {values?.isMutil ? (
                                                                    <div className='d-flex align-items-center'>
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
                                                            </div>
                                                        )
                                                    }
                                                },
                                                {
                                                    title: formatMessage({ defaultMessage: 'Tỷ lệ đẩy' }),
                                                    dataIndex: 'id',
                                                    key: 'id',
                                                    align: 'left',
                                                    width: '33%',
                                                    onCell: (record) => {
                                                        if (!record?.sme_warehouse_id) {
                                                            return { colSpan: 2 };
                                                        }
                                                        return {};
                                                    },
                                                    render: (item, record) => {
                                                        return (
                                                            <Fragment>
                                                                {!!record?.sme_warehouse_id && (
                                                                    <div className='d-flex justify-content-between align-items-center'>
                                                                        <span>{record?.inventory_push_percent}%</span>
                                                                        <OverlayTrigger
                                                                            rootClose
                                                                            trigger="click"
                                                                            placement="bottom"
                                                                            overlay={<Popover>
                                                                                <Popover.Title className="p-3" as="h6">
                                                                                    {formatMessage({ defaultMessage: "Tỷ lệ đẩy tồn" })}
                                                                                </Popover.Title>
                                                                                <Popover.Content>
                                                                                    <div className="d-flex justify-content-between" style={{ height: '30px' }}>
                                                                                        <input
                                                                                            type="text"
                                                                                            pattern="[0-9]*"
                                                                                            style={{ height: '30px', zIndex: 9999 }}
                                                                                            onFocus={e => e.stopPropagation()}
                                                                                            onKeyDown={e => e.stopPropagation()}
                                                                                            onChange={(event) => {
                                                                                                const newValue = event.target.value;

                                                                                                if (newValue === "" || newValue === null) {
                                                                                                    setFieldValue(`percent_sync_${record?.id}`, newValue)
                                                                                                }

                                                                                                if (/^\d+$/.test(newValue) && newValue >= 0 && newValue <= 100) {
                                                                                                    setFieldValue(`percent_sync_${record?.id}`, newValue)
                                                                                                }
                                                                                            }}
                                                                                            value={values[`percent_sync_${record?.id}`]}
                                                                                            className={`form-control mr-2 ${!!errors[`percent_sync_${record?.id}`] ? 'border border-danger' : ''}`}
                                                                                        />
                                                                                        <Button
                                                                                            className="mr-2 d-flex justify-content-center align-items-center"
                                                                                            variant="primary"
                                                                                            size="sm"
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    if (!values[`percent_sync_${record?.id}`]) {
                                                                                                        setFieldError(`percent_sync_${record?.id}`, true);
                                                                                                        addToast(formatMessage({ defaultMessage: "Vui lòng nhập tỷ lệ đẩy" }), { appearance: 'error' });
                                                                                                        return;
                                                                                                    }

                                                                                                    const bodyRequest = {
                                                                                                        store_id: dataScWarehouseMapping?.scGetWarehouseMapping?.[0]?.scWarehouse?.storeChannel?.id,
                                                                                                        inventory_push_rules: dataScWarehouseMapping?.scGetWarehouseMapping?.map(warehouseMapping => ({
                                                                                                            maping_id: warehouseMapping?.id,
                                                                                                            push_percent: Number(values[`percent_sync_${warehouseMapping?.id}`]) || 0
                                                                                                        }))
                                                                                                    };

                                                                                                    const { data } = await scUpdateInventoryPush({
                                                                                                        variables: bodyRequest
                                                                                                    });

                                                                                                    if (!!data?.scUpdateInventoryPush?.success) {
                                                                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật tỷ lệ đẩy tồn thành công' }), { appearance: "success" });
                                                                                                    } else {
                                                                                                        addToast(formatMessage({ defaultMessage: 'Cập nhật tỷ lệ đẩy tồn thất bại' }), { appearance: "error" });
                                                                                                    }
                                                                                                    document.body.click()
                                                                                                } catch (err) {
                                                                                                    addToast(formatMessage({ defaultMessage: 'Đã có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" });
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <i className="fas fa-check p-0 icon-nm" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="secondary"
                                                                                            onClick={() => document.body.click()}
                                                                                            size="sm"
                                                                                            className="d-flex justify-content-center align-items-center"
                                                                                        >
                                                                                            <i className="fas fa-times p-0 icon-nm" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </Popover.Content>
                                                                            </Popover>}
                                                                        >
                                                                            <i
                                                                                className="text-dark far fa-edit"
                                                                                onClick={() => {
                                                                                    setFieldError(`percent_sync_${record?.id}`, false);
                                                                                }}
                                                                                role="button"
                                                                            />
                                                                        </OverlayTrigger>
                                                                    </div>
                                                                )}
                                                                {!record?.sme_warehouse_id && (
                                                                    <span className='text-danger'>
                                                                        {formatMessage({ defaultMessage: 'Không có liên kết nên không thể đẩy tồn được' })}
                                                                    </span>
                                                                )}
                                                            </Fragment>
                                                        )
                                                    }
                                                },
                                                {
                                                    title: formatMessage({ defaultMessage: 'Kho vật lý' }),
                                                    dataIndex: 'id',
                                                    key: 'id',
                                                    align: 'left',
                                                    width: '33%',
                                                    onCell: (record) => {
                                                        if (!record?.sme_warehouse_id) {
                                                            return { colSpan: 0 };
                                                        }
                                                        return {};
                                                    },
                                                    render: (item, record) => {
                                                        const smeWarehouse = optionsSmeWarehouse?.find(wh => wh?.value == record?.sme_warehouse_id);

                                                        return (
                                                            <div className='d-flex align-items-center'>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-house-door" viewBox="0 0 16 16">
                                                                    <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146ZM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5Z" />
                                                                </svg>
                                                                <span>{smeWarehouse?.label || '--'}</span>
                                                            </div>
                                                        )
                                                    }
                                                },
                                            ]}
                                            data={dataScWarehouseMapping?.scGetWarehouseMapping || []}
                                            emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                                <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}</span>
                                            </div>}
                                            tableLayout="auto"
                                            sticky={{ offsetHeader: 45 }}
                                        />
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
                                        {formatMessage({ defaultMessage: 'Đóng' })}
                                    </button>
                                </div>
                            </Modal.Footer>
                        </Modal>
                    </Fragment>
                )
            }}
        </Formik>
    )
}

export default memo(SyncUpWarehouseDialog);