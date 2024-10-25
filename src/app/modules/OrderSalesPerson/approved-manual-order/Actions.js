import { HistoryRounded } from '@material-ui/icons'
import React from 'react'
import { Dropdown } from 'react-bootstrap'
import { useIntl } from 'react-intl'
import { useHistory, useLocation } from "react-router-dom";
import queryString from "querystring";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const Actions = ({onShowImportDialog, onShowExportDialog, onApprovedManualOrder, onSetDataSmeNote, onOpenConfirmDialog, dataSelectedOrder }) => {
  const location = useLocation();
    const { formatMessage } = useIntl()
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
  return (
    <div style={{ position: "sticky", top: 45, background: "#fff", zIndex: 90 }}>
    <div className={`col-12 d-flex align-items-center py-4 ${(params?.type == 'pending' && !params?.is_old_order) ? 'justify-content-between' :'justify-content-end'}`}>
    {params?.type == 'pending' && !params?.is_old_order && (
         <div className="d-flex align-items-center">
         <div className="mr-4 text-primary" style={{ fontSize: 14 }}>{formatMessage({ defaultMessage: "Đã chọn: {pack} kiện hàng" }, {pack: dataSelectedOrder?.length})} </div>
 
           <Dropdown drop='down'>
               <Dropdown.Toggle disabled={!dataSelectedOrder?.length} className={`${dataSelectedOrder?.length ? 'btn-primary' : 'btn-darkk'} btn`} >
                {formatMessage({ defaultMessage: "Thao tác hàng loạt" })}
               </Dropdown.Toggle>
             <Dropdown.Menu>
              <AuthorizationWrapper keys={['order_approved']}>
                 <Dropdown.Item className="mb-1 d-flex" onClick={onApprovedManualOrder} >
                  {formatMessage({ defaultMessage: "Duyệt" })}
                </Dropdown.Item>
              </AuthorizationWrapper>
                <AuthorizationWrapper keys={['order_sales_person_order_cancel']}>
                  <Dropdown.Item className="mb-1 d-flex" onClick={(e) => {
                    e.preventDefault()
                    onOpenConfirmDialog()
                  }} >
                    {formatMessage({ defaultMessage: "Hủy đơn" })}
                  </Dropdown.Item>
                </AuthorizationWrapper>
                <AuthorizationWrapper keys={['order_sales_person_order_add_note']}>
                  <Dropdown.Item className="mb-1 d-flex" onClick={onSetDataSmeNote} >
                    {formatMessage({ defaultMessage: "Thêm ghi chú" })}
                  </Dropdown.Item>
                </AuthorizationWrapper>
                 
             </Dropdown.Menu>
           </Dropdown>
 
       </div>
    )}

      <div className="d-flex justify-content-end" style={{ gap: 10 }}>
        {!params?.is_old_order && (
          <AuthorizationWrapper keys={['order_sales_person_create_manual']}>
           <Dropdown drop='down'>
               <Dropdown.Toggle className={`btn-primary btn`} >
                {formatMessage({ defaultMessage: "Tạo đơn" })}
               </Dropdown.Toggle>
             <Dropdown.Menu>
                 <Dropdown.Item className="mb-1 d-flex" onClick={(e) => history.push({pathname: '/order-sales-person/create-manual', state: { urlRedirect: '/order-sales-person/list-order' }})}>
                    {formatMessage({ defaultMessage: "Tạo đơn" })}
                 </Dropdown.Item>
                 <Dropdown.Item className="mb-1 d-flex" onClick={(e) => {
                  e.preventDefault()
                  onShowImportDialog()
                 }} >
                   {formatMessage({ defaultMessage: "Tải file đơn hàng" })}
                 </Dropdown.Item>
                 
             </Dropdown.Menu>
           </Dropdown>
          </AuthorizationWrapper>
        )}
        <AuthorizationWrapper keys={['order_sales_person_export_file']}>
          <div className="pr-0">
            <button className="btn btn-primary btn-elevate w-100"
              onClick={onShowExportDialog}
              style={{ flex: 1 }}
            >
              {formatMessage({ defaultMessage: "Xuất đơn hàng" })}
            </button>
          </div>
          <div>
            <button className="btn btn-secondary btn-elevate"
              onClick={() => history.push('/order-sales-person/history-export-file-approved-order')}
            >
              <HistoryRounded />
            </button>
          </div>
        </AuthorizationWrapper>
      </div>


    </div>

  </div>
  )
}

export default Actions