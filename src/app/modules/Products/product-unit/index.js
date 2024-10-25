import { Field, useFormikContext } from "formik";
import React, { Fragment, useMemo, memo, useCallback, useRef, useState } from "react";
import { useIntl } from "react-intl";
import {
    Card,
    CardBody,
    CardHeader,
    InputVertical
} from "../../../../_metronic/_partials/controls";
import { ReSelect } from "../../../../_metronic/_partials/controls/forms/ReSelect";
import { Switch } from "../../../../_metronic/_partials/controls/forms/Switch";
import { useProductsUIContext } from "../ProductsUIContext";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import { CONVERSION_CALCULATION } from "../ProductsUIHelpers";
import { flatten } from 'lodash';
import clsx from "clsx";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { randomString } from "../../../../utils";
import ModalConfirm from "./ModalConfirm";

const ProductUnit = ({ isCreating, isSyncVietful }) => {
    const { formatMessage } = useIntl();
    const { addVariantsUnit, variants, removeVariantsUnit, variantsUnit, setIsUnit, setVariantsUnit } = useProductsUIContext();
    const { values, setFieldValue, errors, } = useFormikContext();
    const [showConfirm, setShowConfirm] = useState(false)
    // console.log('errors', errors)

    const [isVariantFullUnit, optionsVariantUnit] = useMemo(() => {



        const optionAll = [{ label: 'Tất cả phân loại', value: 'all' }];
        let optionsVariantUnit = variants?.filter(_variant => {
            if (!isCreating) {
                return !values[`variant-${_variant.code}-totalStockReserve`] && !values[`variant-${_variant.code}-totalStockPreallocate`]
            }
            return true
        }).map(variant => ({
            value: variant?.code,
            label: variant?.name?.replaceAll('+', '-'),
        }));
        if (optionsVariantUnit.length == variants?.length) {
            optionsVariantUnit = optionAll.concat(optionsVariantUnit)
        }

        // Lấy all variant đã chọn để tạo unit
        const codesVariantSelected = variantsUnit?.flatMap(unit => {
            if (unit?.isGroupAll) {
                return variants?.map(variant => variant?.code)
            }

            return values[`attribute-unit-${unit?.id}`]?.value
        });

        const findUnitAll = variantsUnit.find(unit => values[`attribute-unit-${unit?.id}`]?.value == 'all')
        const findUnitNotAll = variantsUnit.filter(unit => values[`attribute-unit-${unit?.id}`]?.value !== 'all' || !values[`attribute-unit-${unit?.id}`]?.value)

        // Check dk sum tất cả variant theo nhóm = 2
        const isVariantFullUnit = variants?.every(variant => codesVariantSelected?.filter(code => code == variant?.code)?.length == 2) ||
            (variantsUnit?.length / variants?.length == 2) || (findUnitAll && (findUnitNotAll?.length / variants?.length == 1))

        return [isVariantFullUnit, optionsVariantUnit]
    }, [isCreating, variantsUnit, variants, ...variantsUnit?.map(unit => values[`attribute-unit-${unit?.id}`]), ...variants?.map(_variant => values[`variant-${_variant.code}-totalStockPreallocate`]), ...variants?.map(_variant => values[`variant-${_variant.codes}-totalStockReserve`])]);

    const generateOptionsUnit = useCallback((id) => {
        const variantUnitSelected = variantsUnit?.find(unit => unit?.id == id);
        const codeUnit = values[`attribute-unit-${id}`]?.value;

        // Lấy all variant đã chọn để tạo unit
        const codesVariantSelected = variantsUnit?.flatMap(unit => {
            if (unit?.isGroupAll) {
                return variants?.map(variant => variant?.code)
            }

            return values[`attribute-unit-${unit?.id}`]?.value
        });

        let isShowAll = true;
        const newOptionsUnit = optionsVariantUnit?.filter(unit => {
            const countExistUnit = codesVariantSelected?.filter(code => code == unit?.value)?.length;
            // Case đang chọn tất cả phân loại
            if (variantUnitSelected?.isGroupAll) {
                isShowAll = false;
                return true;
            }

            // Case chọn phân loại
            if (codeUnit == unit?.value) return false;

            // Case tồn tại 2 phân loại trùng nhau
            if (countExistUnit == 2) {
                isShowAll = false;
                return false
            };

            return true;
        })
        // console.log(newOptionsUnit?.slice(isShowAll ? 0 : 1, newOptionsUnit?.length))
        return newOptionsUnit?.slice(isShowAll ? 0 : 1, newOptionsUnit?.length)
    }, [variantsUnit, optionsVariantUnit, variants, values]);

    const viewAddUnit = useMemo(() => {
        if (!isCreating && (!!values['variant--totalStockPreallocate'] || !!values['variant--totalStockReserve']) || isSyncVietful)
            return null
        let view = (
            <span className="mt-6" style={{ color: '#0D6EFD', cursor: 'pointer' }} onClick={() => addVariantsUnit()}>
                {formatMessage({ defaultMessage: '+ Thêm đơn vị khác' })}
            </span>
        )
        if (!variants?.length) {
            if (!Boolean(variantsUnit?.length == 2)) {
                return view
            }
        } else {
            if (!isVariantFullUnit) {
                return view
            }
        }
        return null
    }, [variants, isVariantFullUnit, variantsUnit, addVariantsUnit, isCreating, values['variant--totalStockPreallocate'], values['variant--totalStockReserve']])


    useMemo(() => {
        (variantsUnit || []).forEach(unit => {
            if (values[`attribute-unit-${unit?.id}`]?.value == 'all') {
                (variantsUnit).forEach((unit, index) => {
                    setFieldValue(`attribute-unit-${unit?.id}-${variants?.at(-1)?.code}`, { label: variants?.at(-1)?.name, value: variants?.at(-1)?.code })
                })
            }
        })
    }, [variants])

    useMemo(() => {

        (variantsUnit?.filter(unit => values[`attribute-unit-${unit?.id}`]?.value == 'all') || []).forEach(findUnit => {
            (variants || []).forEach((variant) => {
                (variantsUnit?.filter(unit => unit?.id == findUnit?.id) || []).forEach((unit, index) => {
                    setFieldValue(`attribute-unit-${unit?.id}-${variant?.code}`, { label: variant?.name, value: variant?.code })
                })
            })

        })


    }, [variants, variantsUnit])


    const validateNameUnit = (_values) => {
        if (!_values) _values = values
        let nameUnitError = {};
        let nameMainUnitError = {};

        (variantsUnit || []).forEach(unitItem => {
            const att = _values[`attribute-unit-${unitItem?.id}`]?.value || 'all'

            const nameUnit = _values[`name-unit-${unitItem?.id}`]

            const exist = (variantsUnit?.filter(item => item?.id !== unitItem?.id) || []).some(unit =>
                (att == _values[`attribute-unit-${unit?.id}`]?.value ||
                    att == 'all'
                    || _values[`attribute-unit-${unit?.id}`]?.value == 'all')
                && nameUnit?.toLowerCase() == _values[`name-unit-${unit?.id}`]?.toLowerCase())
            nameUnitError[unitItem?.id] = false
            nameMainUnitError[unitItem.id] = false

            if (exist || _values['main-unit']?.toLowerCase() == nameUnit?.toLowerCase()) {
                nameUnitError[exist?.id] = true
                nameUnitError[unitItem?.id] = true
                nameMainUnitError[unitItem.id] = true
            } else {
                nameUnitError[unitItem?.id] = false
                nameMainUnitError[unitItem.id] = false
            }

        })

        setFieldValue(`variant-unit_boolean`, nameUnitError)
        setFieldValue(`main-unit_boolean`, nameMainUnitError)
    }

    useMemo(() => {
        validateNameUnit()
    }, [variantsUnit])

    return (
        <>
        {showConfirm && <ModalConfirm show={showConfirm}
            onHide={() => {
                setFieldValue(`switch-unit`, false)
                setIsUnit(false)
                setShowConfirm(false)
            }}
            onConfirm={() => {
                setIsUnit(true)
                setShowConfirm(false)
                setFieldValue('main-unit', '')
            }}
            title={'Hệ thống sẽ XOÁ toàn bộ đơn vị tính hiện tại của hàng hoá và quy đổi đơn vị tính của hàng hoá theo đơn vị tính chính. Bạn có đồng ý bật chuyển đổi ?'} />}
        <Card>
            {/* <CardHeader title={formatMessage({ defaultMessage: "ĐƠN VỊ TÍNH" })} /> */}
            <CardBody>
                <div className='mt-4 mb-4'>
                    <div className='d-flex align-items-center mt-4'>
                        <div>
                            <h6 className='mb-0 d-flex align-items-center'>
                                <span>{formatMessage({ defaultMessage: 'CHUYỂN ĐỔI ĐƠN VỊ TÍNH' })}</span>
                            </h6>
                        </div>
                        <div className={`col-md-3`} >
                            <Field
                                name={`switch-unit`}
                                component={Switch}
                                disabled={isSyncVietful}
                                disableActions={(!isCreating && values[`edit-switch-unit`]) || (!isCreating && (!!values['variant--totalStockPreallocate'] || !!values['variant--totalStockReserve']))} //check them dieu kien tong du tru vs tong tam ung > 0
                                value={values[`switch-unit`]}
                                onChangeState={() => {
                                    if (!isCreating && !values[`switch-unit`] && !variantsUnit?.length) {
                                        setVariantsUnit([])
                                    }
                                    if (!values[`switch-unit`]) {
                                        setShowConfirm(true)
                                    } else {
                                        setIsUnit(false)
                                        setFieldValue('main-unit', null)
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <span className="mt-2" style={{ color: '#0D6EFD', fontStyle: 'italic', fontSize: 12 }}>{formatMessage({defaultMessage: '*Bật chuyển đổi đơn vị tính khi hàng hoá kho có nhiều đơn vị tính ảnh hưởng lẫn nhau.'})}</span>
                </div>

                {!!values['switch-unit'] && (
                    <Fragment>
                        <div className='d-flex align-items-center'>
                            <span>{formatMessage({ defaultMessage: 'Đơn vị tính chính' })}</span>
                            <OverlayTrigger
                                placement="bottom-start"
                                overlay={
                                    <Tooltip className="custom-tooltip">
                                        {formatMessage({ defaultMessage: 'Đơn vị tính chính là đơn vị tính nhỏ nhất.' })}
                                    </Tooltip>
                                }
                            >
                                <i className="fas fa-info-circle ml-2"></i>
                            </OverlayTrigger>
                            <div className={`col-md-4`} >
                                <Field
                                    name="main-unit"
                                    component={InputVertical}
                                    disabled={isSyncVietful}
                                    type='text'
                                    placeholder={formatMessage({ defaultMessage: 'Nhập đơn vị tính chính' })}
                                    customFeedbackLabel={' '}
                                    absolute
                                    countChar
                                    maxChar={120}
                                />
                            </div>
                        </div>
                        {variantsUnit?.map((unit, index) => (
                            <div className='row pr-4 d-flex align-items-top mb-6' >
                                {!!values['is_has_sell_info'] && variants?.length > 0 && (
                                    <div className={`col-unit-item-5`} style={{ zIndex: 90 - index }}>
                                        <Field
                                            name={`attribute-unit-${unit?.id}`}
                                            component={ReSelect}
                                            isClear={false}
                                            hideBottom
                                            type='text'
                                            placeholder='Tất cả'
                                            label={'Phân loại sản phẩm'}
                                            hideText="Chọn phân loại"
                                            required={true}
                                            isDisabled={isSyncVietful || !!unit?.sme_variant_id}
                                            onChanged={(option) => {
                                                if (option?.value == 'all') {
                                                    setVariantsUnit(prev => prev.map(item => {
                                                        if (item?.id == unit?.id) {
                                                            const codes = variants?.map(variant => variant?.code)
                                                            return { ...item, isGroupAll: true, codes }
                                                        }
                                                        return item;
                                                    }));
                                                    (variants || []).forEach((variant) => {
                                                        (variantsUnit?.filter(item => item?.id == unit?.id) || []).forEach((unit, index) => {
                                                            setFieldValue(`attribute-unit-${unit?.id}-${variant?.code}`, { label: variant?.name, value: variant?.code } || undefined)
                                                        })
                                                    })
                                                } else {
                                                    setVariantsUnit(prev => prev.map(item => {
                                                        if (item?.id == unit?.id) {
                                                            return { ...item, isGroupAll: false, codes: item?.codes?.concat(option?.value) }
                                                        }
                                                        return item;
                                                    }));
                                                    (variants || []).forEach((variant) => {
                                                        (variantsUnit?.filter(item => item?.id == unit?.id) || []).forEach((unit, index) => {
                                                            setFieldValue(`attribute-unit-${unit?.id}-${variant?.code}`, {} || undefined)
                                                        })
                                                    })
                                                }
                                                validateNameUnit({ ...values, [`attribute-unit-${unit?.id}`]: option })
                                            }}
                                            customFeedbackLabel={'x'}
                                            options={generateOptionsUnit(unit?.id)}
                                            absolute
                                            cols={['col-12', 'col-12']}
                                        />
                                    </div>
                                )}


                                <div className={variants?.length > 0 ? `col-unit-item-5` : `col-unit-item-4`}>
                                    <Field
                                        name={`name-unit-${unit?.id}`}
                                        component={InputVertical}
                                        type='text'
                                        placeholder=""
                                        hideText="Nhập tên đơn vị"
                                        disabled={isSyncVietful}
                                        required
                                        onIsChangeState={async (value) => {
                                            setFieldValue('curreng_id_unit_change', unit?.id)
                                            setFieldValue(`ratio_name_changed_${unit?.id}`, value)
                                            validateNameUnit({ ...values })
                                        }}
                                        onBlurChange={async (value) => {
                                            validateNameUnit({ ...values })
                                        }}
                                        label={formatMessage({ defaultMessage: 'Đơn vị chuyển đổi' })}
                                        customFeedbackLabel={'x'}
                                        absolute
                                    />
                                </div>
                                <div className='col-3'>
                                    <Field
                                        name={`ratio-unit-${unit?.id}`}
                                        component={InputVertical}
                                        type='number'
                                        hideText="Nhập tỷ lệ"
                                        placeholder=""
                                        required
                                        onIsChangeState={async (value) => {
                                            setFieldValue('curreng_id_unit_change', unit?.id)
                                            setFieldValue(`ratio_name_changed_${unit?.id}`, value)
                                        }}
                                        disabled={isSyncVietful || (!isCreating && !!unit?.sme_variant_id)}
                                        label={formatMessage({ defaultMessage: 'Tỷ lệ chuyển đổi về ĐVT' })}
                                        customFeedbackLabel={' '}
                                        tooltip={formatMessage({ defaultMessage: "Khai báo tỷ lệ chuyển đổi giữa ĐVT chính và ĐVT chuyển đổi. VD: 1 Thùng = 10 Hộp => Tỷ lệ chuyển đổi =10" })}
                                        absolute
                                    />
                                </div>

                                <div className={variants?.length > 0 ? `col-unit-item-5` : `col-unit-item-4`}>
                                    <Field
                                        name={`description-unit-${unit?.id}`}
                                        component={() => {
                                            let description = "";
                                            const errorUnit = Object.keys(errors)?.some(err => err.startsWith(`name-unit-${unit?.id}`) || err.startsWith(`ratio-unit-${unit?.id}`))

                                            if (!errorUnit && !!values[`main-unit`] && !!values[`name-unit-${unit?.id}`] && !!values[`ratio-unit-${unit?.id}`]) {
                                                description = formatMessage({ defaultMessage: '1 {nameUnit} = {ratioUnit} {mainUnit}' }, {
                                                    mainUnit: values[`main-unit`],
                                                    nameUnit: values[`name-unit-${unit?.id}`],
                                                    ratioUnit: values[`ratio-unit-${unit?.id}`]
                                                })
                                            } else {
                                                description = "";
                                            }

                                            return (
                                                <Fragment>
                                                    <label className="col-form-label">{formatMessage({ defaultMessage: 'Mô tả' })}</label>
                                                    <div className="input-group" style={{ position: 'relative', width: '100%' }} >
                                                        <div className={`input-group`} >
                                                            <input
                                                                className={"form-control"}
                                                                disabled={true}
                                                                value={description}
                                                                style={{ background: '#F7F7FA', border: 'none' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </Fragment>
                                            )
                                        }}
                                        type='text'
                                        disabled={true}
                                        placeholder=""
                                        isPlaceholder={true}
                                        label={formatMessage({ defaultMessage: 'Mô tả' })}
                                        customFeedbackLabel={' '}
                                        absolute
                                    />
                                </div>
                                {!unit?.sme_variant_id && (
                                    <div
                                        className='d-flex align-items-center justify-content-center col-unit-icon'
                                        style={{ position: 'relative', top: 3, pointerEvents: `${isSyncVietful ? 'none' : ''}` }}
                                        onClick={() => {
                                            removeVariantsUnit(unit?.id)
                                            const handleDeleteKeyErr = (key) => {
                                                try {
                                                    delete errors[`name-unit-${key}`]
                                                    delete values['variant-unit_boolean'][key]
                                                    delete values['main-unit_boolean'][key]
                                                } catch (err) { }
                                            }
                                            const findUnitExist = (variantsUnit?.filter(it => it?.id != unit?.id)?.find(it => values[`attribute-unit-${it?.id}`]?.value == values[`attribute-unit-${unit?.id}`]?.value))
                                            const errorsUnit = Object.keys(errors)?.some(key => key.startsWith('name-unit'))
                                            const findAtt = variantsUnit?.find(unit => values[`attribute-unit-${unit?.id}`]?.value == 'all')
                                            if (findAtt) {
                                                (variantsUnit || []).forEach(unit => {
                                                    handleDeleteKeyErr(unit?.id)
                                                })
                                            }

                                            if (values['is_has_sell_info'] && !!errors[`name-unit-${unit?.id}`] && findUnitExist) {
                                                handleDeleteKeyErr(unit?.id)
                                                handleDeleteKeyErr(findUnitExist?.id)
                                            }
                                            if (errorsUnit && !values['is_has_sell_info']) {
                                                (variantsUnit || []).forEach(unit => {
                                                    if (!!errors[`name-unit-${unit?.id}`]) {
                                                        handleDeleteKeyErr(unit?.id)
                                                    }
                                                })
                                            }



                                        }}
                                    >
                                        <img className="cursor-pointer" src={toAbsoluteUrl("/media/svg/trash-red.svg")} alt="" />
                                    </div>
                                )}
                            </div>
                        ))}


                        {!!values['main-unit'] && viewAddUnit}
                    </Fragment>
                )}
            </CardBody>
        </Card>
        </>
    )
};

export default memo(ProductUnit);