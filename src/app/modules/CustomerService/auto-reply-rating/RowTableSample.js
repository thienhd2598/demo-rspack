import React, { useMemo } from 'react'
import { toAbsoluteUrl } from '../../../../_metronic/_helpers'
import { Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import dayjs from "dayjs";
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';

const RowTableSample = ({ setItemUpdate, confirmDeleteTemplate, item }) => {
    const { formatMessage } = useIntl();
    const renderAction = useMemo(() => {
        return (
            <AuthorizationWrapper keys={['customer_service_auto_reply_rating']}>
                <Dropdown drop="down">
                    <Dropdown.Toggle className="btn-outline-secondary text-primary">
                        {formatMessage({ defaultMessage: 'Chọn' })}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={setItemUpdate} className="mb-1 d-flex text-primary">
                            {formatMessage({ defaultMessage: 'Chỉnh sửa' })}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={confirmDeleteTemplate} className="mb-1 d-flex text-primary">
                            {formatMessage({ defaultMessage: 'Xóa' })}
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </AuthorizationWrapper>
        );
    }, [item]);
    return (
        <tr key={item?.id}>
            <td><span>{item?.name}</span></td>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item?.stars?.sort()?.map(amountStar => <span>{Array(amountStar).fill(0).map(star => <img className="my-2" src={toAbsoluteUrl("/media/svg/star-fill.svg")} alt='' />)}</span>)}
                </div>
            </td>
            <td className='text-center'>{!!item?.created_at ? dayjs(item?.created_at).format("HH:mm DD/MM/YYYY") : '--'}</td>
            <td className='text-center'>{!!item?.updated_at ? dayjs(item?.updated_at).format("HH:mm DD/MM/YYYY") : '--'}</td>
            <td className='text-center'>
                {renderAction}
            </td>
        </tr>
    )
}

export default RowTableSample