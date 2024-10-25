import React, { memo, useMemo, useCallback, Fragment, useState } from 'react';
import dayjs from 'dayjs'
import mutate_inventoryChecklistUpdateStatus from '../../../../graphql/mutate_inventoryChecklistUpdateStatus';
import { useMutation } from '@apollo/client';
import { useToasts } from 'react-toast-notifications';
import { Link, useHistory, useLocation } from 'react-router-dom';
import queryString from 'querystring';
import mutate_inventoryChecklistDelete from '../../../../graphql/mutate_inventoryChecklistDelete';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import { formatNumberToCurrency } from '../../../../utils';
import { useIntl } from "react-intl";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const InventoryChecklistRow = ({ inventory_sheet, data_warehouse, deleteChecklist, selectToComplete, setDataError, setDataResults, setUploadFile }) => {
    const { addToast } = useToasts();
    const [loading, setLoading] = useState(false)
    const {formatMessage} = useIntl()
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const history = useHistory();
    const getNameWareHoust = () => {
        let warehouse = data_warehouse.find((item) => item?.id == inventory_sheet.sme_warehouse_id);
        return warehouse?.name
    }

    console.log('getNameWareHoust',getNameWareHoust())

    const [inventoryChecklistUpdateStatus] = useMutation(mutate_inventoryChecklistUpdateStatus, {
    })


    const updateChecklistStatus = async (status) => {
        setLoading(true)
        let { data } = await inventoryChecklistUpdateStatus({
            variables: {
                checkListId: inventory_sheet.id || null,
                status: status
            }
        })
        setLoading(false)
        if (data?.inventoryChecklistUpdateStatus?.success == 1) {
            addToast(formatMessage({defaultMessage:'Chuyển trạng thái phiếu kiểm kho thành công'}), { appearance: 'success' });
            history.push(`/products/inventory/list?${queryString.stringify({
                ...params,
                page: 1,
                status: status
            })}`)
        } else {
            if(data?.inventoryChecklistUpdateStatus?.error_items?.length > 0 ){
                setDataError(data?.inventoryChecklistUpdateStatus)
            }
            addToast(data?.inventoryChecklistUpdateStatus?.message || formatMessage({defaultMessage:"Chuyển trạng thái phiếu kiểm kho không thành công"}), { appearance: 'error' });
        }
    }


    const renderAction = () => {
        switch (params?.status || 'new') {
            case 'new':
                return (
                    <>
                        <AuthorizationWrapper keys={['product_inventory_action']}>
                            <span role="button" onClick={() => {
                                updateChecklistStatus('processing')
                            }} className='mr-2 text-primary-update'>{formatMessage({defaultMessage: 'Bắt đầu'})}</span>
                            <Link to={`/products/inventory/update/${inventory_sheet.id}`}>
                                <span role="button" className='px-2 text-primary-update border-left border-right'>{formatMessage({defaultMessage: 'Cập nhật'})}</span>
                            </Link>
                            <span role="button"
                                onClick={() => {
                                    deleteChecklist(inventory_sheet.id)
                                }}
                                className='ml-2 text-primary-update'>{formatMessage({defaultMessage: 'Xóa'})}</span>
                        </AuthorizationWrapper>
                    </>
                )
                break;

            case 'processing':
                return (
                    <>
                        <AuthorizationWrapper keys={['product_inventory_action']}>
                            <Link to={`/products/inventory/processing/${inventory_sheet.id}`}>
                                <span role="button" className='mr-2 text-primary-update'>{formatMessage({defaultMessage: 'Kiểm kho'})}</span>
                            </Link>
                            <span role="button" className='px-2 text-primary-update border-left border-right'
                                onClick={e => {
                                    setUploadFile(true)
                                    selectToComplete(inventory_sheet.id)
                                }}
                            >{formatMessage({defaultMessage: 'Nhập excel'})}</span>
                        </AuthorizationWrapper>
                        <AuthorizationWrapper keys={['product_inventory_approve']}>
                            <span role="button" onClick={() => {
                                updateChecklistStatus('complete')
                            }} className='ml-2 text-primary-update'>{formatMessage({defaultMessage: 'Kết thúc'})}</span>
                        </AuthorizationWrapper>
                    </>
                )
                break;

            case 'complete':
                return (
                    <AuthorizationWrapper keys={['product_inventory_detail']}>
                        <Link to={`/products/inventory/completed/${inventory_sheet.id}`}>
                            <span role="button" className='ml-2 text-primary-update'>{formatMessage({defaultMessage: 'Chi tiết'})}</span>
                        </Link>
                    </AuthorizationWrapper>
                )
                break;

        }
    }

    return (
        <Fragment>
            {
                <LoadingDialog show={loading} />
            }
            <tr>
                <td>{inventory_sheet.code}</td>
                <td>{getNameWareHoust()}</td>
                <td className='text-center'>{formatNumberToCurrency(inventory_sheet.items_aggregate.aggregate.count)}</td>
                <td>{dayjs(inventory_sheet.created_at).format('DD/MM/YYYY[\n]HH:mm')}</td>
                <td>
                    {renderAction()}
                </td>
            </tr>
        </Fragment>
    )
};

export default memo(InventoryChecklistRow);