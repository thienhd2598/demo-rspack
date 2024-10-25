import React, { Fragment, useMemo, useState, memo } from 'react'
import { useIntl } from 'react-intl';
import { useHistory, useParams, Link } from "react-router-dom";
import Table from 'rc-table';
import dayjs from 'dayjs';
import { formatNumberToCurrency } from '../../../../../utils';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications';
import query_crmRatingByCustomer from '../../../../../graphql/query_crmRatingByCustomer';
import PaginationModal from '../../../../../components/PaginationModal';
import { useQuery } from '@apollo/client';
import InfoProduct from '../../../../../components/InfoProduct';
import HoverImage from '../../../../../components/HoverImage';
import CommentDialog from '../dialogs/CommentDialog';
import ReplyDialog from '../dialogs/ReplyDialog';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import gql from 'graphql-tag';
import client from '../../../../../apollo';

const queryGetScProducts = gql`
    query scGetSmeProductByListId($list_product_id: [Int]) {
        scGetSmeProductByListId(list_product_id: $list_product_id) {
            id
            productAssets {
                id
                origin_image_url
                position
                ref_id
                ref_url
                sc_product_id
                sme_asset_id
                sme_url
                template_image_url
                type
            }
        }
    }
`;

const getScProducts = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: queryGetScProducts,
        variables: {
            list_product_id: ids
        },
        fetchPolicy: "network-only",
    });

    return data?.scGetSmeProductByListId || [];
}

const DetailCustomerRating = ({ optionsStore }) => {
    const params = useParams();
    const { formatMessage } = useIntl();
    const { addToast } = useToasts();
    const history = useHistory();

    const [currentCommentRating, setCurrentCommentRating] = useState(null);
    const [currentCommentReply, setCurrentCommentReply] = useState(null);
    const [limit, setLimit] = useState(25);
    const [page, setPage] = useState(1);
    const [loadingSmeImg, setLoadingSmeImg] = useState(false);
    const [dataScProducts, setDataScProducts] = useState([]);

    const { loading: loadingRatingByCustomer, data: dataRatingByCustomer } = useQuery(query_crmRatingByCustomer, {
        fetchPolicy: "cache-and-network",
        variables: {
            crm_customer_id: Number(params?.id),
            first: Number(limit),
            page,
        },
        onCompleted: (data) => {
            if (data?.crmRatingByCustomer?.data?.length > 0) {
                setLoadingSmeImg(true);

                getScProducts(data?.crmRatingByCustomer?.data?.map(product => product?.sc_product_id))
                    .then(scProducts => {
                        setLoadingSmeImg(false);
                        setDataScProducts(scProducts || []);
                    })
            }
        }
    });

    console.log({ dataRatingByCustomer, optionsStore })

    const columns = useMemo(() => {
        return [
            {
                title: formatMessage({ defaultMessage: 'Sao đánh giá' }),
                dataIndex: 'rating',
                key: 'rating',
                width: '15%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    return <div>
                        {Array(item || 0).fill(0).map(star => <img className='mr-1' src={toAbsoluteUrl("/media/svg/star-fill.svg")} alt='' />)}
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Đánh giá' }),
                dataIndex: 'comment',
                key: 'comment',
                width: '10%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    const isShowRating = !!record?.comment || record?.comment_images?.length > 0 || record?.comment_videos?.length > 0;

                    return <div>
                        {isShowRating ? <span className='text-primary' role="button" onClick={() => setCurrentCommentRating(record)}>
                            {formatMessage({ defaultMessage: 'Chi tiết' })}
                        </span> : '--'}
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Gian hàng' }),
                dataIndex: 'id',
                key: 'id',
                width: '15%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    const store = optionsStore?.find(st => st?.value == record?.store_id);

                    if (!store) return <span>{formatMessage({ defaultMessage: 'Gian đã ngắt kết nối' })}</span>

                    return <div className='d-flex align-items-center'>
                        <img
                            style={{ width: 15, height: 15 }}
                            src={store?.logo}
                            className="mr-2"
                        />
                        <span>{store?.label}</span>
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Sản phẩm' }),
                dataIndex: 'id',
                key: 'id',
                width: '35%',
                fixed: 'left',
                align: 'left',
                render: (item, record) => {
                    const scVariant = dataScProducts?.find(product => product?.id == record?.sc_product_id);                    

                    const imgOrigin = scVariant?.productAssets?.find(_asset => _asset.type == 4);
                    const urlImage = !!imgOrigin && !!imgOrigin.template_image_url ? imgOrigin : (scVariant?.productAssets || []).filter(_asset => _asset.type == 1)[0];

                    if (!scVariant) {
                        return <span>{formatMessage({ defaultMessage: 'Sản phẩm không tồn tại' })}</span>
                    }

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
                        {!loadingSmeImg && !!urlImage?.sme_url && <Link to={`/product-stores/edit/${scVariant?.id}`} target="_blank">
                            <HoverImage
                                styles={{ borderRadius: '4px', border: '1px solid #d9d9d9', cursor: 'pointer', marginRight: 10 }}
                                size={{ width: 320, height: 320 }}
                                defaultSize={{ width: 30, height: 30 }}
                                url={urlImage?.sme_url || ''}
                            />
                        </Link>}
                        <InfoProduct
                            name={record?.sc_product_name}
                            productOrder={true}
                            isSingle
                            url={() => window.open(`/product-stores/edit/${scVariant?.id}`, "_blank")}
                        />
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Phản hồi' }),
                dataIndex: 'reply',
                key: 'reply',
                width: '10%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <div>
                        {!!item ? <span className='text-primary' role="button" onClick={() => setCurrentCommentReply(record)}>
                            {formatMessage({ defaultMessage: 'Chi tiết' })}
                        </span> : '--'}
                    </div>
                }
            },
            {
                title: formatMessage({ defaultMessage: 'Thời gian đánh giá' }),
                dataIndex: 'rating_time',
                key: 'rating_time',
                width: '15%',
                fixed: 'center',
                align: 'center',
                render: (item, record) => {
                    return <span>{!!item ? dayjs.unix(item).format('HH:mm DD/MM/YYYY') : '--'}</span>
                }
            },
        ]
    }, [optionsStore, dataScProducts, loadingSmeImg]);

    return (
        <Fragment>
            <CommentDialog
                show={!!currentCommentRating}
                data={currentCommentRating}
                onHide={() => setCurrentCommentRating(null)}
            />
            <ReplyDialog
                show={!!currentCommentReply}
                data={currentCommentReply}
                onHide={() => setCurrentCommentReply(null)}
            />
            <div style={{ position: 'relative' }}>
                {loadingRatingByCustomer && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', zIndex: 99 }}>
                        <span className="spinner spinner-primary" />
                    </div>
                )}
                <Table
                    className="upbase-table"
                    style={loadingRatingByCustomer ? { opacity: 0.4 } : {}}
                    columns={columns}
                    data={dataRatingByCustomer?.crmRatingByCustomer?.data || []}
                    emptyText={<div className='d-flex flex-column align-items-center justify-content-center my-10'>
                        <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                        <span className='mt-4'>{formatMessage({ defaultMessage: 'Chưa có đánh giá' })}</span>
                    </div>}
                    tableLayout="auto"
                    sticky={{ offsetHeader: 45 }}
                // scroll={{ x: 'max-content' }}
                />
            </div>
            {dataRatingByCustomer?.crmRatingByCustomer?.paginatorInfo?.total > 0 && (
                <PaginationModal
                    page={page}
                    limit={limit}
                    onPanigate={(page) => setPage(page)}
                    onSizePage={(limit) => {
                        setPage(1);
                        setLimit(limit);
                    }}
                    totalPage={Math.ceil(dataRatingByCustomer?.crmRatingByCustomer?.paginatorInfo?.total / limit)}
                    totalRecord={dataRatingByCustomer?.crmRatingByCustomer?.paginatorInfo?.total || 0}
                    count={dataRatingByCustomer?.crmRatingByCustomer?.data?.length}
                    emptyTitle={formatMessage({ defaultMessage: 'Chưa có dữ liệu' })}
                />
            )}
        </Fragment>
    )
};

export default memo(DetailCustomerRating);