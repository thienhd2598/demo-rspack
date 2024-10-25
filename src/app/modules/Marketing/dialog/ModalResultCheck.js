import React, { memo, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useIntl } from "react-intl";
import { STATUS_PRODUCTS } from '../Constants';
import InfoProduct from '../../../../components/InfoProduct';
import query_mktLoadScheduleFrameVerifyResult from '../../../../graphql/query_mktLoadScheduleFrameVerifyResult';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import PaginationModal from '../../../../components/PaginationModal'

const ModalResultCheck = ({verified_result, dateCampaign, dateScheduledFrame, campaign_id, onHide, show, title }) => {    
    const {formatMessage} = useIntl()    
    const [page, setPage] = useState(1);
    const [tabActive, setTabActive] = useState(1)
  

    const selectSubMenu = useMemo(() => {
        return STATUS_PRODUCTS?.find(tab => tab?.status == tabActive)
    }, [tabActive])

    const [subtab, setSubTab] = useState()
    console.log('subtab', subtab)
    const { loading, data, error, refetch } = useQuery(query_mktLoadScheduleFrameVerifyResult, {
        fetchPolicy: "cache-and-network",
        variables: {
            campaign_id: +campaign_id,
            error_type: subtab || tabActive,
            page: page,
            per_page: 10
        },
    });
    console.log('data', data)

    let totalRecord = data?.mktLoadScheduleFrameVerifyResult?.total || 0;

    let totalPage = Math.ceil(totalRecord / 5);

    const amount = (status) => {
        const {total_miss, total_validate_fail,total_miss_campaign,total_miss_scheduled  } = data?.mktLoadScheduleFrameVerifyResult || {}
        console.log({total_miss, total_validate_fail,total_miss_campaign,total_miss_scheduled})
        if(status == 1) {
            return total_validate_fail || 0
        }
        if(status == 'miss_product') {
            return total_miss || 0
        }
        if(status == 2) {
            return total_miss_campaign || 0
        }
        if(status == 3) {
            return total_miss_scheduled || 0
        }
    }
    return (
        <Modal
            show={show}
            aria-labelledby="example-modal-sizes-title-sm"
            centered
            onHide={onHide}
            backdrop={true}
            dialogClassName={'body-dialog-connect'}
        >
            <Modal.Header>
                <Modal.Title>
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default">
                <div className="mb-4 font-size-lg">{formatMessage({defaultMessage:'THÔNG TIN CHUNG'})} </div>
                {!verified_result && <>
                    <div className="text-primary mb-4">{formatMessage({defaultMessage: 'Thời gian diễn ra lịch áp khung và chương trình khuyến mãi chưa khớp.'})}</div>
                <div style={{width: '70%'}}>
                    <div className="d-flex justify-content-between">
                        <div>Lịch áp khung:</div>
                        <div>{dayjs(dateScheduledFrame?.apply_from_time).format('DD/MM/YYYY HH:mm')} ~ {dayjs(dateScheduledFrame?.apply_to_time).format('DD/MM/YYYY HH:mm')}</div>
                    </div>
                    <div className="d-flex justify-content-between">
                        <div>Chương trình khuyến mãi:</div>
                        <div>{dayjs.unix((dateCampaign?.startTime)).format('DD/MM/YYYY HH:mm')} ~ {dayjs.unix((dateCampaign?.endTime)).format('DD/MM/YYYY HH:mm')}</div>
                    </div>
                </div>
                </>}
                {totalRecord > 0 && (
                    <>
                        <div className="mb-4 mt-4 font-size-lg">{formatMessage({defaultMessage:'SẢN PHẨM'})} </div>
                <div style={{ flex: 1 }}>
                    <ul className="nav nav-tabs">
                      {STATUS_PRODUCTS.map((tab, index) => {
                      const isTabActive = tabActive == tab?.status
                      return (
                          <li key={index} onClick={() => {
                            setTabActive(tab?.status)
                            setSubTab()
                          }}>
                            <a style={{ fontSize: "14px" }} className={`nav-link ${isTabActive ? "active" : ""}`}>{tab?.title} {`(${amount(tab?.status_tab || tab?.status)})`}</a>
                            
                          </li>
                        );
                      }
                      )}
                    </ul>
                   {!!selectSubMenu?.sub?.length && (
                    <div className="d-flex mt-2 mb-2">
                    {selectSubMenu?.sub?.map(
                    (sub_status, index) => (
                        <span
                            key={`sub-status-order-${index}`}
                            className="mx-2 py-1 px-3 d-flex justify-content-between align-items-center"
                            style={{borderRadius: 20,background: sub_status?.status === (subtab || selectSubMenu?.sub[0]?.status) ? "#ff6d49" : "#828282", color: "#fff", cursor: "pointer"}}
                            onClick={() => setSubTab(sub_status?.status)}
                        >
                        {sub_status?.title} 
                        {` `}
                        {`(${amount(sub_status?.status || selectSubMenu?.sub[0]?.status)})`}
                        </span>
                    )
                    )}
                </div>
                   )}   
                </div>

                  

                <table className="mt-2 table table-borderless product-list table-vertical-center fixed">
                <thead style={{borderRight: '1px solid #d9d9d9', borderLeft: '1px solid #d9d9d9'}}>
                    <tr className="font-size-lg">
                        <th style-={{fontSize: '14px'}} width="40%">{formatMessage({defaultMessage: 'SKU'})}</th>
                        <th style-={{fontSize: '14px'}}>{formatMessage({defaultMessage: 'Lỗi'})}</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>
                    }
                    {!!error && !loading && (
                        <div className="w-100 text-center mt-8" style={{ position: 'absolute' }} >
                            <div className="d-flex flex-column justify-content-center align-items-center">
                                <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        refetch();
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'Tải lại' })}
                                </button>
                            </div>
                        </div>
                    )}
                    {!loading && !error && data?.mktLoadScheduleFrameVerifyResult?.data?.map(result => (
                    <tr>
                        <td>
                        <InfoProduct
                            short={true}
                            sku={result?.sc_product_sku}
                        />
                                
                        </td>
                        <td>{result?.error_msg}</td>
                    </tr>
                    ))}
                    
                </tbody>
                </table>

                <div className="col-12" style={{padding: "1rem", boxShadow: "rgb(0 0 0 / 20%) 0px -2px 2px -2px",}}>
                    <PaginationModal
                        page={page}
                        totalPage={totalPage}
                        limit={5}
                        totalRecord={totalRecord}
                        count={data?.mktLoadScheduleFrameVerifyResult?.data?.slice(10 * (page - 1),10 + 10 * (page - 1))?.length}
                        onPanigate={(page) => setPage(page)}
                        emptyTitle={formatMessage({
                            defaultMessage: "Không có dữ liệu",
                        })}
                    />
                </div>
                    </>
                )}
                

            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: '1px solid #dbdbdb', justifyContent: 'end', paddingTop: 10, paddingBottom: 10 }} >
                <div className="form-group">
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-primary btn-elevate mr-3"
                        style={{ width: 100 }}
                    >
                       {formatMessage({defaultMessage:'Đóng'})} 
                    </button>
                </div>
            </Modal.Footer>
        </Modal >
    )
};

export default memo(ModalResultCheck);