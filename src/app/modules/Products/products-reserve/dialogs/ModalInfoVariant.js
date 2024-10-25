import React, { useMemo, useCallback, memo } from 'react';
import { useIntl } from "react-intl";
import { Modal } from 'react-bootstrap';
import Table from 'rc-table';
import query_getScProductVariantLinked from '../../../../../graphql/query_getScProductVariantLinked';
import { useQuery } from '@apollo/client';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { formatNumberToCurrency } from '../../../../../utils';
import InfoProduct from '../../../../../components/InfoProduct';

const ModalInfoVariant = ({ onHide, smeVariantId, optionsStore }) => {
    const { formatMessage } = useIntl();

    const { data: dataVariantLinked, loading } = useQuery(query_getScProductVariantLinked, {
        fetchPolicy: 'network-only',
        variables: {
            list_sme_variant_id: [smeVariantId]
        },
    });

    const dataProductVariant = useMemo(() => {
        if (!dataVariantLinked?.scGetProductVariantLinked?.data || dataVariantLinked?.scGetProductVariantLinked?.data.length == 0)
            return [];

        return dataVariantLinked?.scGetProductVariantLinked?.data[0].sc_variants
    }, [dataVariantLinked]);

    console.log({ dataProductVariant, optionsStore })

    const columns = [
        {
            title: 'Tên hàng hóa',
            dataIndex: 'name',
            key: 'name',
            align: 'left',
            width: '40%',
            render: (_item, record) => {
                const storeVariant = optionsStore?.find(store => store?.value == record?.storeChannel?.id)

                return (
                    <div className='d-flex flex-column'>
                        <InfoProduct
                            name={record?.product?.name}
                            isSingle
                            productOrder={true}
                            url={() => window.open(`/product-stores/edit/${record?.product?.id}`, `_blank`)}
                        />
                        <div className='d-flex align-items-center'>
                            <img
                                style={{ width: 15, height: 15 }}
                                src={storeVariant?.logo}
                                className="mr-2"
                            />
                            <span >{storeVariant?.label}</span>
                        </div>
                    </div>
                )
            }
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            align: 'left',
            width: '40%',
            render: (_item, record) => {
                return (
                    <div className='d-flex flex-column'>
                        <InfoProduct
                            sku={record?.sku}
                            isSingle
                        />
                        {record?.product?.variantAttributeValues?.length > 0 && (
                            <span className='mt-1 fs-12 text-secondary-custom'>{record?.name?.replaceAll(' + ', ' - ')}</span>
                        )}
                    </div>
                )
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Tồn' }),
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: '20%',
            render: (_item, record) => {
                return (
                    <span>{formatNumberToCurrency(record?.stock_on_hand)}</span>
                )
            }
        },
    ];

    return (
        <Modal
            show={!!smeVariantId}
            aria-labelledby="example-modal-sizes-title-sm"
            dialogClassName={'body-dialog-connect modal-info-variant'}
            centered
            backdrop={true}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Hàng hóa sàn' })}
                </Modal.Title>
                <span>
                    <i
                        className="drawer-filter-icon fas fa-times icon-md text-right cursor-pointer"
                        onClick={onHide}
                    ></i>
                </span>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div style={{ position: 'relative' }}>
                    {loading && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                            <span className="spinner spinner-primary" />
                        </div>
                    )}
                    <Table
                        style={loading ? { opacity: 0.4 } : {}}
                        className="upbase-table"
                        columns={columns}
                        data={dataProductVariant || []}
                        emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                            <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                            <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có hàng hóa nào' })}</span>
                        </div>}
                        tableLayout="auto"
                        scroll={{ y: 350 }}
                        sticky={{ offsetHeader: 0 }}
                    />
                </div>
            </Modal.Body>            
        </Modal>
    )
}

export default memo(ModalInfoVariant);