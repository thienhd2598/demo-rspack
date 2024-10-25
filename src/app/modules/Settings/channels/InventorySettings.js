import { useMutation, useQuery } from "@apollo/client";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import query_sc_stores from '../../../../graphql/query_sc_stores'
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import { Link, useHistory, useLocation } from "react-router-dom";
import scSaleAuthorizationUrl from '../../../../graphql/scSaleAuthorizationUrl'
import { useLazyQuery } from "@apollo/client";
import _ from 'lodash'
import { Button, Form, Modal, Tooltip } from 'react-bootstrap';
import { useToasts } from "react-toast-notifications";
import ChannelsConfirmUnlinkDialog from "./ChannelsConfirmUnlinkDialog";
import queryString from 'querystring'
import Pagination from '../../../../components/Pagination'
import mutate_scUpdateStore from '../../../../graphql/mutate_scUpdateStore';
import LoadingDialog from "../../ProductsStore/products-list/dialog/LoadingDialog";
import { Helmet } from 'react-helmet-async';
import { useIntl } from "react-intl";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import mutate_scSaleChannelStoreSummary from "../../../../graphql/mutate_scSaleChannelStoreSummary";


export default function InventorySettings() {
    const location = useLocation()
    const params = queryString.parse(location.search.slice(1, 100000))
    const { formatMessage } = useIntl()
    const [storeUnlinkCurrent, setStoreUnlinkCurrent] = useState()
    const [authorize, { data: dataAuthozie }] = useLazyQuery(scSaleAuthorizationUrl)
    const { addToast } = useToasts();
    const [show, setShow] = useState(false);
    const [infoMergeStock, setInfoMergeStock] = useState({});
    const [idErrorRatio, setIdErrorRatio] = useState();
    const [valueRatio, setValueRadio] = useState("");
    const [loadingReload, setLoadingReload] = useState(false);

    const [storeSummary, setStoreSummary] = useState([]);


    const [scUpdateStore, { loading: loadingUpdateStore }] = useMutation(mutate_scUpdateStore, {
        // refetchQueries: ['sc_stores'], 
        awaitRefetchQueries: true
    });

    let page = useMemo(() => {
        try {
            let _page = Number(params.page)
            if (!Number.isNaN(_page)) {
                return Math.max(1, _page)
            } else {
                return 1
            }
        } catch (error) {
            return 1
        }
    }, [params.page])
    let limit = useMemo(() => {
        try {
            let _value = Number(params.limit)
            if (!Number.isNaN(_value)) {
                return Math.max(25, _value)
            } else {
                return 25
            }
        } catch (error) {
            return 25
        }
    }, [params.limit])
    let filter_type = useMemo(() => {
        try {
            let _value = Number(params.filter_type)
            if (!Number.isNaN(_value)) {
                return _value
            } else {
                return 0
            }
        } catch (error) {
            return 0
        }
    }, [params.filter_type])

    const { data, loading } = useQuery(query_sc_stores, {
        variables: {
            filter_type: filter_type,
            per_page: limit,
            page: page,
            status: 1
        },
        fetchPolicy: "cache-and-network",
        pollInterval: 1000
    })

    const onConfirmInventorySync = async (id, merge_stock) => {
        let res = await scUpdateStore({
            variables: {
                store_id: id,
                merge_stock: merge_stock == 0 ? 10 : 0,
            }
        });
        setShow(false)
        if (res?.data?.scUpdateStore?.success) {
            addToast(res?.data?.scUpdateStore?.message || formatMessage({defaultMessage:'Cập nhật  thành công'}), { appearance: 'success' });
        } else {
            addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
        }
    }
    const [ scSaleChannelStoreSummary ] = useMutation(mutate_scSaleChannelStoreSummary);


    let list_store_id = useMemo( async () => {
        let list_store_id = [];
        if (data?.scStoreByFilter?.stores) {
          data.scStoreByFilter.stores.forEach(element => {
            if (element.status == 1) {
              list_store_id.push(element.id)
            }
          });
        }
        let res = await scSaleChannelStoreSummary({
            variables: {
                list_store_id: list_store_id
            }
        });
        setStoreSummary(res?.data?.scSaleChannelStoreSummary?.data);
        return list_store_id;
      }, [data])

    useMemo(() => {
        if (!!dataAuthozie && !!dataAuthozie.scSaleAuthorizationUrl && !!dataAuthozie.scSaleAuthorizationUrl.authorization_url) {
            window.location.replace(dataAuthozie.scSaleAuthorizationUrl.authorization_url)
        }

    }, [dataAuthozie]);
    let totalRecord = data?.scStoreByFilter?.total || 0
    let totalPage = Math.ceil(totalRecord / limit);

    const nameStore = (row) => {
        let channel = (data?.op_connector_channels || []).find(_channel => _channel.code == row.connector_channel_code)
        return (
            <>
                {!!channel && <img src={channel.logo_asset_url} className={` mr-2`} style={{ width: 24, height: 24 }} />}
                <span className={`font-size-h7`}>
                    {row.name}
                </span>
            </>
        );
    }

    const pushRatio = (row) => {
        return (
            <>
                <div className="d-flex justify-content-start align-items-center">
                    <span style={{width: '35px'}}>{row.percent_sync_up}%</span>
                    <OverlayTrigger
                        rootClose trigger="click" placement="right" overlay={popover(row)}>
                        <i onClick={() => { setValueRadio(row.percent_sync_up); setIdErrorRatio("") }} role="button" className="ml-4 text-dark far fa-edit"></i>
                    </OverlayTrigger>
                </div>
            </>
        )
        // }
    }
    const popover = (row) => {
        return (

            <Popover >
                <Popover.Title className="p-3" as="h6">Tỷ lệ đẩy
                </Popover.Title>
                <Popover.Content>
                    <div className="d-flex justify-content-between" style={{ height: '30px' }}>.
                        <input type="text" pattern="[0-9]*" style={{ height: '30px' }} onChange={(event) => handleChange(event)} value={valueRatio} className={`form-control mr-2 ${idErrorRatio ? 'border border-danger' : ''}`} />
                        <Button variant="primary" size="sm" onClick={() => handleSubmit(row.id)} className="mr-2 d-flex justify-content-center align-items-center"><i className="fas fa-check p-0 icon-nm"></i></Button>
                        <Button variant="secondary" onClick={() => document.body.click()} size="sm" className="d-flex justify-content-center align-items-center"><i className="fas fa-times p-0 icon-nm"></i></Button>
                    </div>
                </Popover.Content>
            </Popover>
        )
    };

    const handleSubmit = async (id) => {
        if (valueRatio == "") {
            setIdErrorRatio(id)
            addToast(formatMessage({defaultMessage:"Vui lòng nhập tỷ lệ đẩy"}), { appearance: 'error' });
            return;
        }
        let res = await scUpdateStore({
            variables: {
                store_id: id,
                percent_sync_up: Number(valueRatio),
            }
        });
        if (res?.data?.scUpdateStore?.success) {
            addToast(res?.data?.scUpdateStore?.message || formatMessage({defaultMessage:'Cập nhật  thành công'}), { appearance: 'success' });
            document.body.click()
        } else {
            setIdErrorRatio(id)
            addToast(res?.data?.scUpdateStore?.message || res.errors[0].message, { appearance: 'error' });
        }

    }

    const handleChange = (event) => {

        const newValue = event.target.value;

        if (newValue === "" || newValue === null) {
            setValueRadio(newValue);
        }

        if (/^\d+$/.test(newValue) && newValue >= 0 && newValue <= 100) {
            setValueRadio(newValue);
        }

    }

    const goodsBox = (row) => {
        const dataStoreSummary = storeSummary?.find(item => item.store_id == row.id)
        return (
          <span>
              {!dataStoreSummary && <span className="spinner spinner-primary" />}
              {dataStoreSummary && <span> {dataStoreSummary?.variant_linked}/{dataStoreSummary?.sum_variant} </span>}
          </span>
        );
      }

    return (
        <>
            <Helmet
                titleTemplate={formatMessage({defaultMessage:"Cài đặt đồng bộ tồn kho"}) +"- UpBase"}
                defaultTitle={formatMessage({defaultMessage:"Cài đặt đồng bộ tồn kho"}) +"- UpBase"}
            >
                <meta name="description" content={formatMessage({defaultMessage:"Cài đặt đồng bộ tồn kho"}) +"- UpBase"} />
            </Helmet>
            <div style={{
                boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
                borderRadius: 6, minHeight: 300
            }} >

                <table className="table table-borderless table-vertical-center fixed">
                    <thead
                        style={{
                            borderBottom: '1px solid #F0F0F0',
                            borderRight: '1px solid #d9d9d9',
                            borderLeft: '1px solid #d9d9d9',
                            background: "#F3F6F9",
                            fontWeight: "bold",
                            fontSize: "14px",
                        }}
                    >
                        <tr className="font-size-lg">
                            <th style={{fontSize: '14px'}} className="pl-6">{formatMessage({defaultMessage:"Tên gian hàng"})}</th>
                            <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage:"Hàng hóa"})}
                            <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({defaultMessage:"Tỷ lệ đã liên kết / Tổng Hàng hóa"})}
                                        </Tooltip>
                                    }
                                >
                                    <i className="ml-2 fas fa-info-circle"></i>
                                </OverlayTrigger>
                            </th>
                            <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage:"Tỷ lệ đẩy"})}
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip>
                                            {formatMessage({defaultMessage:"Tỷ lệ phần trăm đẩy để xác nhận số lượng tồn kho bạn cần đẩy đến gian hàng trên sàn là bao nhiêu"})}
                                        </Tooltip>
                                    }
                                >
                                    <i className="ml-2 fas fa-info-circle"></i>
                                </OverlayTrigger></th>
                            <th style={{fontSize: '14px'}}>{formatMessage({defaultMessage:"Đẩy tồn"})}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && data?.scStoreByFilter?.stores?.map((store, index) =>
                            <tr key={index} className="borderRight" style={{borderBottom: '0.5px solid #d9d9d9'}}>
                                <td>{nameStore(store)}</td>
                                <td>{<span>{goodsBox(store)}</span>}</td>
                                <td style={{ width: 400 }}>{pushRatio(store)}</td>
                                <td>
                                    <span className="switch" style={{ transform: 'scale(0.8)', float: 'left' }}>
                                        <label>
                                            <input
                                                type={'checkbox'}
                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                onChange={async () => {
                                                    if (!store.merge_stock) {
                                                        setShow(true)
                                                        setInfoMergeStock({
                                                            store_id: store.id,
                                                            merge_stock: store.merge_stock,
                                                        })
                                                    } else {
                                                        onConfirmInventorySync(store.id, store.merge_stock)
                                                    }
                                                }}
                                                checked={store.merge_stock}
                                            />
                                            <span></span>
                                        </label>
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {
                    loading && <div className='text-center w-100 mt-4' style={{ position: 'absolute' }} >
                        <span className="ml-3 spinner spinner-primary"></span>
                    </div>
                }
                <Pagination
                    page={page}
                    totalPage={totalPage}
                    loading={loading}
                    limit={limit}
                    totalRecord={totalRecord}
                    count={data?.scStoreByFilter?.stores?.length}
                    basePath={'/setting/channels'}
                    emptyTitle={formatMessage({defaultMessage:'Chưa có gian hàng nào'})}
                />
                <Modal
                    show={show}
                    aria-labelledby="example-modal-sizes-title-sm"
                    centered
                    size="md"
                    backdrop={true}
                >
                    <Modal.Body className="overlay overlay-block cursor-default">
                        <div className='text-center'>
                            <div className="mb-6" >
                                <b>{formatMessage({defaultMessage:"Tự động đồng bộ tồn kho"})}</b>
                                <p>{formatMessage({defaultMessage:"Tự động đẩy tồn sản phẩm kho lên sàn (Với những sản phẩm sàn liên kết với kho) mỗi khi có thay đổi. Ví dụ: có đơn hàng từ kênh bán hoặc bạn điều chỉnh tồn kho."})} </p>
                            </div>
                            <div className="form-group mb-0">
                                <button
                                    id="kt_login_signin_submit"
                                    className="btn btn-light btn-elevate mr-3"
                                    style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        setShow(false);
                                    }}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:"Không"})}</span>
                                </button>
                                <button
                                    className={`btn btn-primary font-weight-bold`}
                                    onClick={() => onConfirmInventorySync(infoMergeStock?.store_id, infoMergeStock?.merge_stock)}
                                >
                                    <span className="font-weight-boldest">{formatMessage({defaultMessage:"Bật đồng bộ"})}</span>
                                </button>
                            </div>
                        </div>
                    </Modal.Body>
                </Modal>
            </div>
            {/* </CardBody>
      </Card> */}

            <LoadingDialog show={loadingReload || loadingUpdateStore} />


            {
                !!storeUnlinkCurrent && <ChannelsConfirmUnlinkDialog
                    show={true}
                    storeUnlinkCurrent={storeUnlinkCurrent}
                    onHide={() => {
                        setStoreUnlinkCurrent(null)
                    }}
                />
            }
        </>
    )
}
