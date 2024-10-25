import React, { memo, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '../../../../../_metronic/_partials/controls';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../../_metronic/_helpers';
import { groupBy } from 'lodash';

const PermissionMapping = ({ dataMappingPermissions, currentSelectedPermission, setCurrentSelectedPermission, currentSelectedCate, setCurrentSelectedCate }) => {
    const { formatMessage } = useIntl();    

    const permissionsSelected = useMemo(() => {
        if (!currentSelectedCate) return [];

        const selectedGroups = dataMappingPermissions
            ?.filter(cate => currentSelectedCate?.includes(cate?.categoryCode))            
            ?.flatMap(item => item?.groups?.map(gr => ({
                ...gr,
                categoryName: item?.categoryName 
            })));

        const groupByPermission = groupBy(selectedGroups, 'categoryName');

        console.log({ groupByPermission });

        // return groupByPermission;
        return selectedGroups;
    }, [dataMappingPermissions, currentSelectedCate])

    console.log({ dataMappingPermissions, permissionsSelected, currentSelectedCate });
    console.log({ currentSelectedPermission });

    return (
        <div className='row'>
            <div className='col-3'>
                <Card>
                    <CardHeader
                        className="margin-auto"
                        title={<span className='fs-16 font-weight-bolder'>{formatMessage({ defaultMessage: 'Danh mục' })}</span>}
                    />
                    <CardBody>
                        <div className='d-flex justify-content-center'>
                            <div className='d-flex flex-column' style={{ gap: 10 }}>
                                {dataMappingPermissions?.map(role => (
                                    <label
                                        key={`role-${role?.categoryCode}`}
                                        style={{ flexGrow: 1 }}
                                        className="checkbox checkbox-primary mb-4 mr-4"
                                    >
                                        <input
                                            type="checkbox"
                                            value={role?.categoryCode}
                                            checked={currentSelectedCate?.includes(role?.categoryCode)}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCurrentSelectedCate(prev => {
                                                    const isExist = prev.includes(role?.categoryCode);

                                                    if (isExist) {
                                                        return prev.filter(item => item != role?.categoryCode)
                                                    }

                                                    return prev.concat(role?.categoryCode);
                                                });
                                            }}
                                        />
                                        <span></span>
                                        &ensp;{role?.categoryName}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
            <div className='col-9'>
                <Card>
                    <CardHeader
                        className="margin-auto"
                        title={<span className='fs-16 font-weight-bolder'>{formatMessage({ defaultMessage: 'Chọn quyền' })}</span>}
                    />
                    <CardBody>
                        {/* {Object.keys(permissionsSelected)?.length == 0 && <div className='d-flex  align-items-center justify-content-center'> */}
                        {permissionsSelected?.length == 0 && <div className='d-flex  align-items-center justify-content-center'>
                            <div className='d-flex flex-column align-items-center justify-content-center my-26'>
                                <img src={toAbsoluteUrl("/media/empty.png")} alt="image" width={80} />
                                <span className='mt-4'>
                                    {formatMessage({ defaultMessage: "Chưa có thông tin nhóm quyền" })}
                                </span>
                            </div>
                        </div>}
                        {permissionsSelected?.map(group => {
                            const isCheckedAll = currentSelectedPermission?.length > 0 && group?.permissions?.every(per => currentSelectedPermission?.includes(per?.code));

                            return (
                                <div className='mb-10'>
                                    <label key={`group-${group?.groupCode}`} className="checkbox checkbox-primary mb-4 font-weight-bolder" style={{ flexGrow: 1 }}>
                                        <input
                                            type="checkbox"
                                            value={group?.groupCode}
                                            checked={isCheckedAll}
                                            onChange={(e) => {
                                                const value = e.target.value;                                                

                                                setCurrentSelectedPermission(prev => {
                                                    if (!isCheckedAll) {
                                                        return [...new Set(prev.concat(group?.permissions?.map(per => per?.code)))]
                                                    }

                                                    return prev.filter(item => !group?.permissions?.some(per => per?.code == item))
                                                })
                                            }}
                                        />
                                        <span></span>
                                        &ensp;{group?.groupName}
                                    </label>
                                    <div className='d-flex align-items-start ml-4'>
                                        <div className='mr-4'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-return-right" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M1.5 1.5A.5.5 0 0 0 1 2v4.8a2.5 2.5 0 0 0 2.5 2.5h9.793l-3.347 3.346a.5.5 0 0 0 .708.708l4.2-4.2a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 8.3H3.5A1.5 1.5 0 0 1 2 6.8V2a.5.5 0 0 0-.5-.5" />
                                            </svg>
                                        </div>
                                        <div className='row w-100'>
                                            {group?.permissions?.map(permission => (
                                                <div className='col-3 mb-2'>
                                                    <label
                                                        key={`role-${permission?.code}`}
                                                        className="checkbox checkbox-primary mb-4 mr-6 align-items-start"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className='mr-1'
                                                            value={permission?.code}
                                                            checked={currentSelectedPermission?.includes(permission?.code)}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setCurrentSelectedPermission(prev => {
                                                                    if (prev.includes(permission?.code)) {
                                                                        return prev.filter(item => item != permission?.code)
                                                                    }

                                                                    return prev.concat([permission?.code])
                                                                })
                                                            }}
                                                        />
                                                        <span></span>
                                                        <div className='ml-2' style={{ position: 'relative', top: -1 }}>{permission?.name}</div>
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}

export default memo(PermissionMapping);