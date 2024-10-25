import { useQuery } from "@apollo/client";
import React, { Fragment, memo, useState } from "react";
import { Link } from 'react-router-dom';
import { useIntl } from "react-intl";
import client from "../../../../../apollo";
import query_sme_catalog_product_variant from "../../../../../graphql/query_sme_catalog_product_variant";
import query_sfListProductInSessionPickup from "../../../../../graphql/query_sfListProductInSessionPickup";
import { toAbsoluteUrl } from "../../../../../_metronic/_helpers";
import PaginationModal from "../../../../../components/PaginationModal";
import Table from 'rc-table';
import dayjs from "dayjs";
import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'
import HoverImage from "../../../../../components/HoverImage";
import InfoProduct from "../../../../../components/InfoProduct";
import ModalCombo from "../../../ProductsStore/products-list/dialog/ModalCombo";

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

const SectionProducts = ({ pickUpId, optionsStore }) => {
    const { formatMessage } = useIntl();

    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);
    const [loadingSmeImg, setLoadingSmeImg] = useState(false);
    const [dataSmeVariant, setDataSmeVariant] = useState([]);
    const [dataCombo, setDataCombo] = useState();

    const { loading: loadingProducts, data: dataProducts } = useQuery(query_sfListProductInSessionPickup, {
        fetchPolicy: "cache-and-network",
        variables: {
            pickup_id: pickUpId,
            per_page: Number(limit),
            page,
        },
        onCompleted: (data) => {
            if (data?.sfListProductInSessionPickup?.list_record?.length > 0) {
                setLoadingSmeImg(true);

                queryGetSmeProductVariants(data?.sfListProductInSessionPickup?.list_record?.map(product => product?.sme_variant_id))
                    .then(smeVariants => {
                        setLoadingSmeImg(false);
                        setDataSmeVariant(smeVariants || []);
                    })
            }
        }
    });

    const columns = [
        {
            title: formatMessage({ defaultMessage: 'Tên hàng hóa kho' }),
            dataIndex: 'id',
            key: 'id',
            width: '30%',
            fixed: 'left',
            align: 'left',
            render: (item, record) => {
                const smeVariant = dataSmeVariant?.find(variant => variant?.id == record?.sme_variant_id);

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
                            defaultSize={{ width: 40, height: 40 }}
                            url={smeVariant?.sme_catalog_product_variant_assets[0]?.asset_url || ''}
                        />
                    </Link>}
                    <InfoProduct
                        name={smeVariant?.sme_catalog_product?.name || '--'}
                        productOrder={true}
                        isSingle
                        setDataCombo={setDataCombo}
                        fitCombo
                        combo_items={smeVariant?.combo_items}
                        url={() => {
                            if (!!smeVariant?.is_combo) {
                                window.open(`/products/edit-combo/${smeVariant?.sme_catalog_product?.id}`, '_blank');
                            } else {
                                window.open(`/products/edit/${smeVariant?.sme_catalog_product?.id}`, "_blank");
                            }
                        }}
                    />
                </div>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Phân loại' }),
            dataIndex: 'sme_variant_name',
            key: 'sme_variant_name',
            width: '12%',
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
            title: formatMessage({ defaultMessage: 'SKU' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '20%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const smeVariant = dataSmeVariant?.find(variant => variant?.id == record?.sme_variant_id);
                return <InfoProduct sku={smeVariant?.sku} />
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Số lượng' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '12%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                return <span>{record?.total_quantity || 0}</span>
            }
        },
        {
            title: formatMessage({ defaultMessage: 'Đơn vị tính' }),
            dataIndex: 'ref_id',
            key: 'ref_id',
            width: '12%',
            fixed: 'center',
            align: 'center',
            render: (item, record) => {
                const smeVariant = dataSmeVariant?.find(variant => variant?.id == record?.sme_variant_id);
                return <span>{smeVariant?.unit}</span>
            }
        },
    ];

    return (
        <Fragment>
            <ModalCombo
                dataCombo={dataCombo}
                onHide={() => setDataCombo()}
            />
            <div style={{ position: 'relative' }}>
                {loadingProducts && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingProducts ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataProducts?.sfListProductInSessionPickup?.list_record || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có sản phẩm' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                />
            </div>
            {dataProducts?.sfListProductInSessionPickup?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    onPanigate={(page) => setPage(page)}
                    totalPage={Math.ceil(dataProducts?.sfListProductInSessionPickup?.total / limit)}
                    totalRecord={dataProducts?.sfListProductInSessionPickup?.total || 0}
                    count={dataProducts?.sfListProductInSessionPickup?.list_record?.length}
                />
            )}
        </Fragment>
    )
}

export default memo(SectionProducts);