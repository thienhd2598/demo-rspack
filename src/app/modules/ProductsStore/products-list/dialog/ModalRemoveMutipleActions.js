import { useMutation } from "@apollo/client";
import React, { Fragment, useState } from "react";
import { Modal } from "react-bootstrap";
import { injectIntl, useIntl } from "react-intl";
import { useHistory, useLocation } from "react-router-dom";
import { useToasts } from "react-toast-notifications";
import mutate_scActionMultipleProduct from "../../../../../graphql/mutate_scActionMultipleProduct";
import queryString from 'querystring';

function ModalRemoveMutipleActions({
    show,
    onHide,
    ids,
    setIds
}) {
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000))
    const { formatMessage } = useIntl()
    const [current, setCurrent] = useState({
        prefix_name: false,
        frame: false,
    });
    const { addToast } = useToasts();

    const [mutateActionMutipleProduct, { loading: loadingActionMutipleProduct }] = useMutation(mutate_scActionMultipleProduct, {
        refetchQueries: ['ScGetSmeProducts', 'sc_composite_image_sync', 'scListPrefixName', 'scStatisticScProducts'],
        awaitRefetchQueries: true,
        onCompleted: () => setIds([])
    });

    return <Modal
        show={show}
        aria-labelledby="example-modal-sizes-title-sm"
        onHide={() => {}}
        centered
        backdrop={loadingActionMutipleProduct ? 'static' : true}
        dialogClassName={loadingActionMutipleProduct ? 'width-fit-content' : ''}
    >
        {loadingActionMutipleProduct && <div className='text-center m-8'>
            <div className="mb-4" >{formatMessage({ defaultMessage: 'Đang thực hiện' })}</div>
            <div className="mb-2" style={{ paddingRight: 15, paddingTop: 10 }}><span className="spinner spinner-primary mb-8"></span></div>
        </div>}
        {!loadingActionMutipleProduct && <Fragment>
            <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Xóa tiền tố tên & khung ảnh' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ position: 'relative' }}>
                <Fragment>
                    {[
                        {
                            label: formatMessage({ defaultMessage: 'Xóa tiền tố tên hàng loạt' }),
                            value: 'prefix_name',
                        },
                        {
                            label: formatMessage({ defaultMessage: 'Xóa khung ảnh hàng loạt' }),
                            value: 'frame'
                        },
                    ].map(_option => {
                        return <label key={`_option--${_option.value}`} className="checkbox checkbox-primary mb-4">
                            <input type="checkbox"
                                checked={current[_option.value]}
                                onChange={(e) => {
                                    setCurrent(prev => {
                                        return {
                                            ...prev,
                                            [_option.value]: !prev[_option.value],
                                        }
                                    })
                                }}
                            />
                            <span></span>
                            &ensp;{_option.label}
                        </label>
                    })}
                </Fragment>
            </Modal.Body>
            <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                <div className="form-group">
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-elevate mr-4"
                        style={{ width: 100 }}
                        onClick={e => {
                            e.preventDefault()
                            onHide();
                            setCurrent({
                                prefix_name: false,
                                frame: false,
                            });
                        }}
                    >
                        {formatMessage({ defaultMessage: 'ĐỂ SAU' })}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: 100 }}
                        disabled={Object.values(current).every(v => !v)}
                        onClick={async e => {
                            e.preventDefault()

                            let { data } = await mutateActionMutipleProduct({
                                variables: {
                                    action_type: 'remove',
                                    check_frame: !!current?.frame ? 1 : 0,
                                    check_prefix: !!current?.prefix_name ? 1 : 0,
                                    products: ids?.map(item => item?.id),
                                }
                            })

                            onHide();
                            setCurrent({
                                prefix_name: false,
                                frame: false,
                            })
                            if (!!data?.scActionMultipleProduct?.success) {
                                if (!!current?.prefix_name) {
                                    history.push(`/product-stores/list?${queryString.stringify(_.omit({ ...params, page: 1, }, ['prefix_name', 'prefix_type']))}`);
                                }
                                addToast(formatMessage({ defaultMessage: 'Xóa tiền tố tên & khung ảnh hàng loạt thành công' }), { appearance: 'success' });
                            } else {
                                addToast(data?.scActionMultipleProduct?.message || formatMessage({ defaultMessage: 'Xóa tiền tố tên & khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
                            }
                        }}
                    >
                        {formatMessage({ defaultMessage: 'ÁP DỤNG' })}
                    </button>
                </div>
            </Modal.Footer>
        </Fragment>}
    </Modal >
}

export default injectIntl(ModalRemoveMutipleActions);