/*
 * Created by duydatpham@gmail.com on 09/08/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */
import { Tooltip } from "react-bootstrap";
import React, { memo, useState } from 'react'
import { OverlayTrigger } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import 'react-bootstrap-table-next/dist/react-bootstrap-table2.min.css';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "@apollo/client";
import query_sme_users from "../../../../graphql/query_sme_users";
import mutate_userDeleteMember from "../../../../graphql/mutate_userDeleteMember";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useIntl } from 'react-intl'
export default memo(() => {
    const [showModal, setShowModal] = useState(false)
    const {formatMessage} = useIntl()
    const { user } = useSelector((state) => state.auth);
    const { data, loading } = useQuery(query_sme_users, {
        variables: {
            id: user?.id
        },
        fetchPolicy: 'cache-and-network'
    })
    const [mutate, { loading: loadingDelete }] = useMutation(mutate_userDeleteMember, {
        refetchQueries: ['sme_users'],
        awaitRefetchQueries: true
    })
    const { addToast } = useToasts();
    const columns = [
        {
            dataField: "full_name",
            text: formatMessage({defaultMessage:'TÊN TÀI KHOẢN'}),
        },
        {
            dataField: "email",
            text: 'EMAIL',
            formatter: (cellContent,
                row,
                rowIndex) => {
                return <span className='text-info' >{cellContent}</span>
            },
        },
        {
            dataField: "phone",
            text: formatMessage({defaultMessage:'SỐ ĐIỆN THOẠI'}),
            headerStyle: { width: 120 },
            headerAlign: 'center',
            align: 'center',
        },
        {
            dataField: "is_root",
            text: formatMessage({defaultMessage:"NHÓM QUYỀN"}),
            formatter: (cellContent,
                row,
                rowIndex) => {
                return formatMessage({defaultMessage:'Nhóm kinh doanh'})
            },
            headerAlign: 'center',
            align: 'center',
        },
        {
            dataField: "id",
            text: formatMessage({defaultMessage:"THAO TÁC"}),
            formatter: (cellContent,
                row,
                rowIndex) => {
                return <>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({defaultMessage:'Chỉnh sửa'})}
                            </Tooltip>
                        }
                    >
                        <Link
                            className="btn btn-icon btn-light btn-sm mr-2"
                            to={`/setting/profile/edit-member/${cellContent}`}
                        >
                            <span className="svg-icon svg-icon-md svg-icon-control">
                                <SVG src={toAbsoluteUrl("/media/svg/ic_edit_.svg")} />
                            </span>
                        </Link>
                    </OverlayTrigger>
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {formatMessage({defaultMessage:'Xoá'})}
                            </Tooltip>
                        }
                    >
                        <button
                            className="btn btn-icon btn-light btn-sm"
                            onClick={e => {
                                setShowModal(cellContent)
                            }}
                        >
                            <span className="svg-icon svg-icon-md svg-icon-control">
                                <SVG src={toAbsoluteUrl("/media/svg/ic_delete_.svg")} />
                            </span>
                        </button>
                    </OverlayTrigger>
                </>
            },
            headerStyle: { width: 94 },
            headerAlign: 'center',
            align: 'right',
        },
    ];
    return <div className="tab-pane fade show active" role="tabpanel"
        style={{
            // boxShadow: "inset -1px 0px 0px #D9D9D9, inset 1px 0px 0px #D9D9D9, inset 0px 1px 0px #D9D9D9, inset 0px -1px 0px #D9D9D9",
            borderRadius: 6, minHeight: 100
        }}>
        <BootstrapTable
            wrapperClasses="table-responsive"
            bordered={false}
            classes="table table-vertical-center overflow-hidden"
            bootstrap4
            headerClasses='header-member'
            wrapperClasses='table-header'
            keyField="id"
            data={data?.sme_users || []}
            columns={columns}
        // {...paginationTableProps}
        >
        </BootstrapTable>
        {
            loading && <div style={{ padding: 24, margin: 0, textAlign: 'center' }}>
                <span className="spinner spinner-primary mr-4"></span>
            </div>
        }
        <Modal
            show={!!showModal}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            backdrop={'static'}
        >
            <Modal.Body className="overlay overlay-block cursor-default text-center" >
                <div className="mb-6" >{formatMessage({defaultMessage:'Bạn có chắc chắn muốn xoá nhân sự này?'})}</div>
                <div  >
                    <button
                        className={`btn btn-secondary  px-9 `}
                        style={{ width: 150, marginRight: 16 }}
                        onClick={e => {
                            setShowModal(false)
                        }}
                        disabled={loadingDelete}
                    >
                        <span className="">{formatMessage({defaultMessage:'Không'})}</span>
                    </button>
                    <button
                        to='/setting/profile/members'
                        className={`btn btn-primary font-weight-bold px-9 `}
                        style={{ width: 150 }}
                        disabled={loadingDelete}
                        onClick={async e => {
                            let { data } = await mutate({
                                variables: {
                                    id: showModal
                                }
                            })

                            if (!!data?.userDeleteMember?.success) {
                                setShowModal(false)
                                addToast(formatMessage({defaultMessage:'Xoá tài khoản thành công.'}), { appearance: 'success' });
                            } else {
                                addToast(data?.userDeleteMember?.message || formatMessage({defaultMessage:'Xoá tài khoản không thành công'}), { appearance: 'error' });
                            }
                        }}
                    >
                        {loadingDelete ? <span className="spinner spinner-white mr-4"></span> : <span className="font-weight-boldest">{formatMessage({defaultMessage:'Có, xoá'})}</span>}
                    </button>
                </div>
            </Modal.Body>
        </Modal >
    </div>
})