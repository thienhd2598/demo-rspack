import React, { useState } from 'react'
import {
    Card,
    CardBody,
    CardHeader
} from "../../../../../_metronic/_partials/controls";
import { Fragment } from "react";
import LoadingDialog from '../../../ProductsStore/product-new/LoadingDialog';
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import { useIntl } from "react-intl";

const BlockPackProcess = ({setIDs, refetch, getOrderLoading, ids, total}) => {
    const [detectLoading, setDetectLoading] = useState(false)
    const history = useHistory();
    const location = useLocation();
    const {formatMessage} = useIntl()
    const params = queryString.parse(location.search.slice(1, 100000));
  return (
    <Fragment>
        {<LoadingDialog show={getOrderLoading && detectLoading} />}
    <Card className="mb-4">
        <CardHeader title={formatMessage({defaultMessage: "Xử lý hàng hàng loạt"})} />
       
        <CardBody>
        <div className="text-primary mt-2 mb-4" style={{fontSize: '12px'}}>
        {formatMessage({defaultMessage: "Những đơn hàng đã được tạo vận đơn sẽ được chuyển sang phần Đang đóng gói"})}
        </div>
            <div className="d-flex flex-column">
                <span className="mb-2">{formatMessage({defaultMessage: "Số kiện theo bộ lọc"})}: {total}</span>
                <button
                    type="button"
                    disabled={total == 0}
                    className="btn btn-outline-primary btn-elevate"
                    onClick={() => {
                        setDetectLoading(true)
                        if(params.is_check_status) {
                            refetch()
                            setIDs([])
                            return
                        }
                        setIDs([])
                        history.push(`/orders/list-batch?${queryString.stringify({
                            ...params,
                            is_check_status: 1
                        })}`)
                    }}
                >
                    {formatMessage({defaultMessage: "Kiểm tra trạng thái theo bộ lọc"})}
                </button>
            </div>
        </CardBody>
    </Card>
</Fragment>
  )
}

export default BlockPackProcess