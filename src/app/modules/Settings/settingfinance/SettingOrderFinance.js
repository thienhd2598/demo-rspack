import React, { useMemo, useState } from 'react'
import { TooltipWrapper } from '../../Finance/payment-reconciliation/common/TooltipWrapper'
import { useIntl } from 'react-intl'
import { useToasts } from 'react-toast-notifications'
import Select from "react-select";
import { useHistory, useLocation } from "react-router-dom";
import mutate_saveFinanceOrderSetting from '../../../../graphql/mutate_saveFinanceOrderSetting'
import _, { isArray, omitBy, pickBy } from 'lodash';
import { INVOICE_STATUS, INVOICE_STATUS_RETURN, STATUS_CREATE_FINANCE, WHEN_CREATE_FINANCE } from './constant';
import { useMutation } from '@apollo/client';
import LoadingDialog from '../../ProductsStore/product-new/LoadingDialog';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
const SettingOrderFinance = ({ loadingGetFinanceOrder, dataFinanceOrderSetting }) => {
    const { formatMessage } = useIntl()
    const { addToast } = useToasts()

    const [variables, setVariables] = useState({
        is_create_order: false,
        allow_order_status: [],
        order_code_type: 'auto',
        is_create_return: false,
        return_when: [],
        return_code_type: 'auto'
    })

    useMemo(() => {
        if (!!dataFinanceOrderSetting?.getFinanceOrderSetting) {
            const { allow_order_status, is_create_order, is_create_return, order_code_type, return_code_type, return_when } = dataFinanceOrderSetting?.getFinanceOrderSetting ?? {}

            setVariables({
                is_create_order: !!is_create_order,
                allow_order_status: STATUS_CREATE_FINANCE.flatMap(stt => allow_order_status?.includes(stt?.value) ? stt : []) || [],
                order_code_type: order_code_type,
                is_create_return: !!is_create_return,
                return_when: WHEN_CREATE_FINANCE.flatMap(stt => return_when?.includes(stt?.value) ? stt : []) || [],
                return_code_type: return_code_type
            })
        }
    }, [dataFinanceOrderSetting])

    const [saveFinancySetting, { loading }] = useMutation(mutate_saveFinanceOrderSetting,
        { awaitRefetchQueries: true }
    );

    const handleSaveFinanceSetting = async () => {
        const { is_create_order, is_create_return, allow_order_status, return_when, ...remaining } = variables
        const checkEmptyStatusOrder = allow_order_status?.length ? { allow_order_status: allow_order_status?.map(it => it?.value) } : {}
        const checkEmptyStatusReturnWhen = return_when?.length ? { return_when: return_when?.map(it => it?.value) } : {}
        const { data } = await saveFinancySetting({
            variables: {
                ...remaining,
                ...checkEmptyStatusOrder,
                ...checkEmptyStatusReturnWhen,
                is_create_order: is_create_order ? 1 : 0,
                is_create_return: is_create_return ? 1 : 0,
            }
        })

        if (!!data?.saveFinanceOrderSetting?.success) {
            addToast('Thành công', { appearance: 'success' })
            return
        }
        addToast('Thất bại', { appearance: 'error' })
    }

    return (
        <div className='row col-7' style={{ display: 'flex', flexDirection: 'column' }}>
            <LoadingDialog show={loading} />
            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 97 }}>
                <div className='text-right'>{formatMessage({ defaultMessage: "Bật tạo đơn bán hàng" })}
                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Đơn bán hàng bên tài chính sẽ được tạo từ đơn hàng khi bật tính năng này.' })}>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div className='d-flex justify-contend-end'>
                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                        <label>
                            <input
                                disabled={loadingGetFinanceOrder}
                                type={'checkbox'}
                                onChange={() => {
                                    setVariables(prev => ({ ...prev, is_create_order: !prev['is_create_order'] }))
                                }}
                                style={{ background: '#F7F7FA', border: 'none' }}
                                checked={variables['is_create_order']} />
                            <span></span>
                        </label>
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 96 }}>
                <div className='text-right'>{formatMessage({ defaultMessage: "Trạng thái tạo đơn bán hàng" })}
                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Đơn bán hàng sẽ được tạo khi đơn hàng ở trạng thái này.' })}>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div>
                    <Select
                        isDisabled={loadingGetFinanceOrder}
                        isLoading={loadingGetFinanceOrder}
                        isClearable
                        isMulti
                        placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        value={variables['allow_order_status']}
                        options={STATUS_CREATE_FINANCE}
                        onChange={(value) => {
                            setVariables(prev => ({ ...prev, allow_order_status: value }))
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{formatMessage(option.label)}</div>;
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 95 }}>
                <div className='text-right'>{formatMessage({ defaultMessage: "Tạo số chứng từ" })}
                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Số chứng từ của đơn bán hàng có thể chọn theo logic tùy chọn.' })}>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div>
                    <Select
                        isDisabled={loadingGetFinanceOrder}
                        isLoading={loadingGetFinanceOrder}
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        value={
                            _.find(_.omit(INVOICE_STATUS), (_bill) => _bill?.value == variables['order_code_type']) || _.omit(INVOICE_STATUS)
                        }
                        defaultValue={variables['order_code_type']}
                        options={INVOICE_STATUS}
                        onChange={({ value }) => {
                            if (value) {
                                setVariables(prev => ({ ...prev, order_code_type: value }))
                            }

                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>;
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center' }}>
                <div className='text-right'>{formatMessage({ defaultMessage: "Bật tạo đơn trả hàng" })}
                    <TooltipWrapper note={formatMessage({ defaultMessage: 'Đơn trả lại hàng bán sẽ được tạo từ đơn hàng hoàn/hủy khi bật tính năng này.' })}>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div className='d-flex justify-contend-end'>
                    <span className="switch" style={{ transform: 'scale(0.8)' }}>
                        <label>
                            <input
                                disabled={loadingGetFinanceOrder}
                                type={'checkbox'}
                                onChange={() => {
                                    setVariables(prev => ({ ...prev, is_create_return: !prev['is_create_return'] }))
                                }}
                                style={{ background: '#F7F7FA', border: 'none' }}
                                checked={variables['is_create_return']} />
                            <span></span>
                        </label>
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 94 }}>
                <div className='text-right'>{formatMessage({ defaultMessage: "Trạng thái đơn trả hàng khi" })}
                    <TooltipWrapper note=''>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div>
                    <Select
                        isDisabled={loadingGetFinanceOrder}
                        isLoading={loadingGetFinanceOrder}
                        isClearable
                        isMulti
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        placeholder={formatMessage({ defaultMessage: 'Tất cả' })}
                        value={variables['return_when']}
                        options={WHEN_CREATE_FINANCE}
                        onChange={(value) => {
                            setVariables(prev => ({ ...prev, return_when: value }))
                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{formatMessage(option.label)}</div>;
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '30% auto', alignItems: 'center', zIndex: 93 }}>
                <div className='text-right'>{formatMessage({ defaultMessage: 'Tạo số chứng từ' })}
                    <TooltipWrapper note='Số chứng từ của đơn trả lại hàng bán có thể chọn theo logic tùy chọn.'>
                        <i className="fas fa-info-circle fs-14 ml-2 mr-2"></i>
                    </TooltipWrapper>
                </div>
                <div>
                    <Select
                        isDisabled={loadingGetFinanceOrder}
                        isLoading={loadingGetFinanceOrder}
                        className="w-100 custom-select-warehouse"
                        theme={(theme) => ({
                            ...theme,
                            borderRadius: 0,
                            colors: {
                                ...theme.colors,
                                primary: "#ff5629",
                            },
                        })}
                        value={
                            _.find(_.omit(INVOICE_STATUS_RETURN), (_bill) => _bill?.value == variables['return_code_type']) || _.omit(INVOICE_STATUS_RETURN)
                        }
                        defaultValue={variables['return_code_type']}
                        options={INVOICE_STATUS_RETURN}
                        onChange={({ value }) => {
                            if (value) {
                                setVariables(prev => ({ ...prev, return_code_type: value }))
                            }

                        }}
                        formatOptionLabel={(option, labelMeta) => {
                            return <div>{option.label}</div>;
                        }}
                    />
                </div>
            </div>

            <div disabled={loading || loadingGetFinanceOrder} className='d-flex justify-content-end mt-2'>
                <AuthorizationWrapper keys={['setting_finance_action']}>
                    <button onClick={async () => await handleSaveFinanceSetting()} className='btn btn-primary'>Cập nhật</button>
                </AuthorizationWrapper>
            </div>
        </div>
    )
}

export default SettingOrderFinance