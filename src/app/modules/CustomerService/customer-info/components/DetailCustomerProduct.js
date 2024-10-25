import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl';
import { useHistory, useParams, Link } from "react-router-dom";
import Table from 'rc-table';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import query_crmProductByCustomer from '../../../../../graphql/query_crmProductByCustomer';
import PaginationModal from '../../../../../components/PaginationModal';
import InfoProduct from '../../../../../components/InfoProduct';
import { useQuery } from '@apollo/client';
import client from '../../../../../apollo';
import query_sme_catalog_product_variant from '../../../../../graphql/query_sme_catalog_product_variant';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import HoverImage from '../../../../../components/HoverImage';

const queryGetSmeProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_sme_catalog_product_variant,
        variables: {
            where: {
                id: { _in: ids },
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_product_variant || [];
}

const DetailCustomerProduct = () => {
    const params = useParams();
    const { formatMessage } = useIntl();
    const history = useHistory();
    const [loadingSmeImg, setLoadingSmeImg] = useState(false);
    const [dataSmeVariant, setDataSmeVariant] = useState([]);
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);

    const { loading: loadingCrmProductByCustomer, data: dataCrmProductByCustomer } = useQuery(query_crmProductByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            crm_customer_id: Number(params?.id),
            first: Number(limit),
            page,
        },
        onCompleted: (data) => {
            if (data?.crmProductByCustomer?.data?.length > 0) {
                setLoadingSmeImg(true);

                queryGetSmeProductVariants(data?.crmProductByCustomer?.data?.map(product => product?.sme_variant_id))
                    .then(smeVariants => {
                        setLoadingSmeImg(false);
                        setDataSmeVariant(smeVariants || []);
                    })
            }
        }
    });

    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Tên sản phẩm kho' }),
                dataIndex: 'id',
                key: 'id',
                width: 100,
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    const smeVariant = dataSmeVariant?.find(variant => variant?.id == record?.sme_variant_id);

                    console.log({ smeVariant })

                    return <div className='d-flex align-items-center'>
                        {loadingSmeImg && (
                            <Skeleton
                                style={{
                                    width: 30, height: 30, marginRight: 4,
                                    borderRadius: 8, minWidth: 30
                                }}
                                count={1}
                            />
                        )}
                        {!loadingSmeImg && <Link to={`/products/edit/${smeVariant?.sme_catalog_product?.id}`} target="_blank">
                            <HoverImage
                                styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                size={{ width: 320, height: 320 }}
                                defaultSize={{ width: 30, height: 30 }}
                                url={smeVariant?.sme_catalog_product_variant_assets[0]?.asset_url || ''}
                            />
                        </Link>}
                        <InfoProduct
                            name={record?.sme_product_name || '--'}
                            productOrder={true}
                            isSingle
                            url={() => window.open(`/products/edit/${smeVariant?.sme_catalog_product?.id}`, "_blank")}
                        />
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Phân loại' }),
                dataIndex: 'sme_variant_name',
                key: 'sme_variant_name',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    const smeVariant = dataSmeVariant?.find(variant => variant?.id == record?.sme_variant_id);

                    if (loadingSmeImg) {
                        return <div style={{ position: 'absolute', left: '45%' }}>
                            <span className="spinner spinner-primary" />
                        </div>
                    }

                    return <span>{smeVariant?.attributes?.length > 0 ? smeVariant?.name?.replaceAll(' - ', ' + ') : ''}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Số lượng hiệu quả' }),
                dataIndex: 'count_purchased',
                key: 'count_purchased',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Số lượng hoàn' }),
                dataIndex: 'count_returned',
                key: 'count_returned',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Đơn hàng hiệu quả' }),
                dataIndex: 'count_order',
                key: 'count_order',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Tổng tiền hiệu quả' }),
                dataIndex: 'total_paid',
                key: 'total_paid',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{formatNumberToCurrency(item)}đ</span>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Giao dịch gần nhất' }),
                dataIndex: 'last_order_at',
                key: 'last_order_at',
                width: 100,
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{!!item ? dayjs.unix(item).format('HH:mm DD/MM/YYYY') : '--'}</span>
                }
            },
        ]
    }, [dataSmeVariant, loadingSmeImg]);

    return (
        <Fragment>
            <div style={{ position: 'relative' }}>
                {loadingCrmProductByCustomer && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingCrmProductByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataCrmProductByCustomer?.crmProductByCustomer?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataCrmProductByCustomer?.crmProductByCustomer?.paginatorInfo?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onPanigate={(page) => setPage(page)}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    totalPage={Math.ceil(dataCrmProductByCustomer?.crmProductByCustomer?.paginatorInfo?.total / limit)}
                    totalRecord={dataCrmProductByCustomer?.crmProductByCustomer?.paginatorInfo?.total || 0}
                    count={dataCrmProductByCustomer?.crmProductByCustomer?.data?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                />
            )}
        </Fragment>
    )
};

export default memo(DetailCustomerProduct);