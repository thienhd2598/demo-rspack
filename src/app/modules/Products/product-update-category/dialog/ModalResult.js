import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import PaginationModal from '../../../../../components/PaginationModal';
import query_sme_catalog_product from '../../../../../graphql/query_sme_catalog_product';
import { useQuery } from '@apollo/client';
import LoadingDialog from '../../product-new/LoadingDialog';

const ModalResults = ({
    dataResults,
    onHide,
}) => {
    const { formatMessage } = useIntl();
    const [page, setPage] = useState(1);
    let totalRecord = dataResults.errors?.length || 0;
    let totalPage = Math.ceil(totalRecord / 5);
    const {data: dataProducts, loading: loadingDataProducts} = useQuery(query_sme_catalog_product, {
        variables: {
            limit: 5,
            offset: (page - 1) * 5,
            where: {id: {_in: dataResults?.errors?.map(item => item?.id)}}
        }
    })
    return (
        <>
        <LoadingDialog show={loadingDataProducts} />
        <Modal
            show={!!dataResults}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Kết quả xử lý' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số {name} cần cập nhật' }, { name: 'sản phẩm'})}: <span className='font-weight-bold'>{dataResults?.total}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số {name} cập nhật thành công' }, { name: 'sản phẩm'})}: <span className='font-weight-bold text-success'>{dataResults?.totalSuccess}</span></div>
                    <div className='col-12 mt-3'>{formatMessage({ defaultMessage: 'Số {name} cập nhật thất bại ' }, { name:'sản phẩm'})}: <span className='font-weight-bold text-danger'>{dataResults?.total - dataResults?.totalSuccess}</span></div>
                <div className='row'>
                    <div className='col-12 mt-4'>
                        <table className="table table-borderless product-list table-vertical-center fixed">
                            <thead>
                                <tr className="font-size-lg">
                                    <th style={{ fontSize: '14px', textAlign:'center' }} width="50%">
                                        {formatMessage({defaultMessage: "Tên sản phẩm chuẩn SEO"})}
                                    </th>
                                    <th style={{ fontSize: '14px', textAlign: 'center' }}>
                                        {formatMessage({ defaultMessage: 'Mã lỗi' })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataResults.errors?.slice(5 * (page - 1), 5 + 5 * (page - 1))?.map((data) => {
                                    const selectedProduct = dataProducts?.sme_catalog_product?.find(item => item?.id == data?.id)
                                    return (<tr key={`inventory-row-${data.index}`}>
                                        <td style={{textAlign: 'center'}}>{selectedProduct?.name_seo}</td>
                                        <td style={{ wordBreak: 'break-word', textAlign:'center' }}>{data?.message}</td>
                                    </tr>)
                                }

                                )}
                               
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* <div className='row justify-content-end'> */}
                    <PaginationModal
                        page={page}
                        totalPage={totalPage}
                        limit={5}
                        totalRecord={totalRecord}
                        count={
                            dataResults.errors?.slice(
                                5 * (page - 1),
                                5 + 5 * (page - 1)
                            )?.length
                        }
                        onPanigate={(page) => setPage(page)}
                        // basePath={`/products/edit/${smeId}/affiliate`}
                        emptyTitle={formatMessage({
                            defaultMessage: "Chưa có dữ liệu",
                        })}
                    />
                {/* </div> */}
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                        {formatMessage({ defaultMessage: 'Đóng' })}
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
        </>
    )
};

export default memo(ModalResults);