import React, { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { Modal, ProgressBar } from "react-bootstrap";

const ReloadCampaign = ({ total, totalInprogress, totalCampaignError, totalCampaignSuccess, show }) => {
    const { formatMessage } = useIntl();    

    return (
        <Modal
            style={{ zIndex: 9999 }}
            show={show}
            aria-labelledby="example-modal-sizes-title-lg"
            centered
            backdrop={'true'}
            dialogClassName='width-fit-content'
        >
            <Modal.Header>
                <Modal.Title>
                    {formatMessage({ defaultMessage: 'Tải lại chương trình' })}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="overlay overlay-block cursor-default" style={{ width: 500, zIndex: 9999 }} >
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số chương trình cần tải lại: {count}' }, { count: total ?? 0 })}</span>
                </div>
                <div className="mb-2">
                    <span>{formatMessage({ defaultMessage: 'Tổng số chương trình tải lại thành công:' })}</span>
                    <span className="ml-1 text-success">{totalCampaignSuccess ?? 0}</span>
                </div>
                <div className="mb-4">
                    <span>{formatMessage({ defaultMessage: 'Tổng số chương trình tải lại thất bại:' })}</span>
                    <span className="ml-1 text-danger">{totalCampaignError ?? 0}</span>
                </div>
                <ProgressBar
                    style={{ height: 20 }}
                    className='fs-14 mb-6'
                    now={(((total - totalInprogress) / total) * 100).toFixed()}
                    label={`${(((total - totalInprogress) / total) * 100).toFixed()}%`}
                />
            </Modal.Body>
        </Modal>
    )
};

export default memo(ReloadCampaign);