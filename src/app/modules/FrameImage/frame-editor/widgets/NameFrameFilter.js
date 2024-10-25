import { useQuery } from "@apollo/client";
import React, { memo, useMemo, useState } from "react"
import Select from 'react-select';
import { useIntl } from "react-intl";
import { useFrameEditorContext } from "../FrameEditorContext";
import query_sme_catalog_photo_library_category from "../../../../../graphql/query_sme_catalog_photo_library_category";

const NameFrameFilter = ({currentTab, setCurrentTab, currentTypeFrame, setCurrentTypeFrame}) => {
    const { formatMessage } = useIntl();    
    // const [currentTypeFrame, setCurrentTypeFrame] = useState(null);

    const { data: dataPhotoLibCategory } = useQuery(query_sme_catalog_photo_library_category, {

        fetchPolicy: 'cache-and-network'
    });
    // const defaultCate = dataPhotoLibCategory?.sme_catalog_photo_library_category?.filter(cate => !cate?.parent_id)

    const optionNameFrame = useMemo(() => {
        const children = dataPhotoLibCategory?.sme_catalog_photo_library_category?.filter(cate => cate?.parent_id && cate?.parent_id == currentTab?.id)
        return children?.map((child) => {
            return {
                label: child?.name,
                value: child?.id
            }
        })
    }, [dataPhotoLibCategory])

    return (
        <div className='row mb-4'>
            <div className='col-3 text-right'>
                <span style={{ position: 'relative', top: 10 }}>
                    <span>{formatMessage({ defaultMessage: 'Loại danh mục' })}</span>
                </span>
            </div>
            <div className='col-9'>
                <Select
                    className='w-100 select-report-custom'
                    isMulti
                    value={currentTypeFrame}
                    options={optionNameFrame}
                    placeholder={formatMessage({ defaultMessage: 'Chọn danh mục' })}
                    // isLoading={loading}
                    onChange={value => {
                        console.log(value)
                        setCurrentTypeFrame(value)
                    }}
                />
            </div>
        </div>
    )
};

export default memo(NameFrameFilter);