import { HistoryRounded } from '@material-ui/icons';
import React, { useState, useCallback, useMemo, Fragment, memo } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from "react-router-dom";
import TagDialog from '../dialogs/TagDialog';
import ExportCustomerDialog from '../dialogs/ExportCustomerDialog';
import AuthorizationWrapper from '../../../../../components/AuthorizationWrapper';

const ActionsCustomerInfo = ({ ids, setIds, onShowCreateDialog, onShowImportDialog, onShowExportDialog, onAddTagMutilple, optionsTags, optionsChannelCode }) => {
    const history = useHistory();
    const [showAddTag, setShowAddTag] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const { formatMessage } = useIntl();

    return (
        <Fragment>
            {!!showExport && <ExportCustomerDialog
                show={showExport}
                onHide={() => setShowExport(false)}
                optionsChannelCode={optionsChannelCode}
                optionsTags={optionsTags}
            />}
            {!!showAddTag && <TagDialog
                show={showAddTag}
                onHide={() => {
                    setIds([]);
                    setShowAddTag(false);
                }}
                dataTags={[]}
                list_customer_id={ids?.map(item => item?.id)}
                optionsTags={optionsTags}
                type="mutilple"
            />}
            <div className='d-flex algin-items-center justify-content-between mb-8'>
                <div className="d-flex align-items-center">
                    <div className="mr-4 text-primary" style={{ fontSize: 14 }}>
                        {formatMessage({ defaultMessage: "Đã chọn {selected}" }, { selected: ids?.length })}
                    </div>
                    <button
                        type="button"
                        className="btn btn-elevate btn-primary ml-4"
                        disabled={ids?.length == 0}
                        style={{
                            color: "white",
                            width: 'max-content',
                            minWidth: 120,
                            background: ids?.length == 0 ? "#6c757d" : "",
                            border: ids?.length == 0 ? "#6c757d" : "",
                        }}
                        onClick={() => setShowAddTag(true)}
                    >
                        {formatMessage({ defaultMessage: "Thêm tag" })}
                    </button>
                </div>
                <div className='d-flex align-items-center'>
                    <AuthorizationWrapper keys={['customer_service_customer_info_create']}>
                        <button
                            className="btn btn-primary d-flex justify-content-center align-items-center mr-4"
                            style={{ minWidth: 120 }}
                            onClick={onShowCreateDialog}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-plus-square" viewBox="0 0 16 16">
                                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                            </svg>
                            <span>{formatMessage({ defaultMessage: "Thêm mới" })}</span>
                        </button>
                        <button
                            className="btn mr-4"
                            style={{ color: '#ff5629', borderColor: '#ff5629', background: '#ffffff' }}
                            onClick={onShowImportDialog}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2 bi bi-cloud-upload" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z" />
                                <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z" />
                            </svg>
                            {formatMessage({ defaultMessage: 'Thêm file khách hàng' })}
                        </button>
                    </AuthorizationWrapper>
                    <AuthorizationWrapper keys={['customer_service_customer_info_export']}>
                        <button
                            className="btn btn-primary btn-elevate mr-4"
                            style={{ minWidth: 120 }}
                            onClick={() => setShowExport(true)}
                        >
                            {formatMessage({ defaultMessage: "Xuất file" })}
                        </button>
                        <button
                            className="btn btn-secondary btn-elevate"
                            onClick={(e) => {
                                e.preventDefault();
                                history.push("/customer-service/export-histories");
                            }}
                        >
                            <HistoryRounded />
                        </button>
                    </AuthorizationWrapper>
                </div>
            </div>
        </Fragment>
    )
};

export default memo(ActionsCustomerInfo);