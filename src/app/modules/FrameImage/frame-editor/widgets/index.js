import { useMutation, useQuery } from "@apollo/client";
import { Field, useFormikContext } from "formik";
import { sortBy } from "lodash";
import React, { memo, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import { Card, CardBody, InputVertical } from "../../../../../_metronic/_partials/controls";
import mutate_delete_sme_catalog_photo_library_by_pk from "../../../../../graphql/mutate_delete_sme_catalog_photo_library_by_pk";
import mutate_insert_sme_catalog_photo_library from "../../../../../graphql/mutate_insert_sme_catalog_photo_library";
import query_sme_catalog_photo_library from "../../../../../graphql/query_sme_catalog_photo_library";
import query_sme_catalog_photo_library_category from "../../../../../graphql/query_sme_catalog_photo_library_category";
import ImageWidget from "./ImageWidget";
import TextWidget from "./TextWidget";
import { queryCheckExistFrameName } from "../../dialogs/ModalAddFrames";
import TypeFrameWidget from "./TypeFrameWidget";
import NameFrameFilter from "./NameFrameFilter";

const Widgets = () => {
    const { formatMessage } = useIntl();
    const { setFieldValue, errors } = useFormikContext();
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState(null);
    const [currentType, setCurrentType] = useState(1);
    const [currentTypeFrame, setCurrentTypeFrame] = useState(null);

    return (
        <Card>
            <CardBody>
                <div className='row mb-4'>
                    <div className='col-3 text-right'>
                        <span style={{ position: 'relative', top: 10 }}>
                            <span>{formatMessage({ defaultMessage: 'Tên' })}</span>
                            <span className='text-danger ml-1'>*</span>
                        </span>
                    </div>
                    <div className='col-9'>
                        <Field
                            name={'name'}
                            component={InputVertical}
                            placeholder={formatMessage({ defaultMessage: 'Nhập tên' })}
                            label={""}
                            maxChar={120}
                            maxLength={120}
                            nameTxt={"--"}
                            countChar
                            required
                            customFeedbackLabel={' '}
                            loading={loading}
                            onChangeCapture={e => {
                                setFieldValue('name_boolean', { name: false })
                            }}
                            onBlurChange={async (value) => {
                                const valueErrorForm = errors?.['name'];
                                if (!!valueErrorForm) return;

                                setLoading(true);
                                const checkExistFrameName = await queryCheckExistFrameName(value);
                                setLoading(false);
                                if (checkExistFrameName) {
                                    setFieldValue('name_boolean', { name: true })
                                } else {
                                    setFieldValue('name_boolean', { name: false })
                                }
                            }}
                        />
                    </div>
                </div>
                <div className='row mb-6'>
                    <div className='col-3 text-right'>
                        <span style={{ position: 'relative', top: 10 }}>
                            <span>{formatMessage({ defaultMessage: 'Thêm yếu tố' })}</span>
                            <span className='text-danger ml-1'>*</span>
                        </span>
                    </div>
                    <div className='col-9'>
                        <TextWidget />
                    </div>
                </div>
                <TypeFrameWidget />
                {currentType == 2 && currentTab?.id == 1 && 
                <NameFrameFilter 
                    currentTab={currentTab} 
                    setCurrentTab={setCurrentTab} 
                    currentTypeFrame={currentTypeFrame}
                    setCurrentTypeFrame={setCurrentTypeFrame}
                />}
                <ImageWidget 
                    currentTab={currentTab} 
                    setCurrentTab={setCurrentTab} 
                    currentType={currentType} 
                    setCurrentType={setCurrentType}
                    currentTypeFrame={currentTypeFrame}
                />
            </CardBody>
        </Card>
    )
}

export default memo(Widgets);