/*
 * Created by duydatpham@gmail.com on 28/07/2021
 * Copyright (c) 2021 duydatpham@gmail.com
 */

import { useFormikContext } from "formik"
import React, { memo, useCallback, useMemo, useRef, useState } from "react"
import _ from 'lodash'
import { Dropdown, Modal } from "react-bootstrap"
import { FormattedMessage } from "react-intl"
import { Divider } from "@material-ui/core"
import { FieldFeedbackLabel } from "../_metronic/_partials/controls"
import { useIntl } from "react-intl"
const CategoryList = memo(({ index, categoriesSelected, setCategoriesSelected, setIsDoneSelect, scrollToX, categories }) => {
    let current_parent = categoriesSelected[index - 1]
    let current_select = categoriesSelected[index]
    const data = categories[index == 0 ? 'root' : current_parent?.id] || []
    return (
        <div className="flex-grow-1 list-group py-2" style={{
            position: 'relative',
            height: '100%', overflowY: 'scroll',
            minWidth: 300
        }} >
            {
                (index == 0 || !!current_parent) && data?.map((_category, __index) => {
                    let selected = current_select?.id == _category.id;
                    let childs = categories[_category.id] || [];
                    return (
                        <a key={`cate-gory-${_category.id}`} href="#"
                            className="d-flex justify-content-between align-items-center px-4 py-2 "
                            onClick={e => {
                                e.preventDefault();
                                !!scrollToX && scrollToX(index)
                                let newcategoriesSelected = categoriesSelected.slice(0, index)
                                newcategoriesSelected[index] = _category
                                setCategoriesSelected(newcategoriesSelected)
                                setIsDoneSelect(childs.length == 0)
                            }}
                        >
                            <span className={selected ? 'text-primary' : 'text-secondary'} >{`${__index + 1}. ${_category.display_name}`}</span>
                            {childs?.length > 0 && <i className={`fas fa-angle-right ${selected ? 'text-primary' : 'text-secondary'}`} > </i>}
                        </a>
                    )
                })
            }
        </div>
    )
})


const CustomMenu = React.forwardRef(
    ({ children, style, className, 'aria-labelledby': labeledBy, close, categories, name, selected, onSelect, show, hideConfirm }, ref) => {
        const { setFieldValue, values, setFieldTouched } = useFormikContext()      
        const {formatMessage} = useIntl()  
        const [categoriesSelected, setCategoriesSelected] = useState(values[name] || [])
        const [isDoneSelect, setIsDoneSelect] = useState(false)
        const [showConfirm, setShowConfirm] = useState(false)
        const _refDiv = useRef()
        const _scrollTo = useCallback((index) => {
            if (!!_refDiv.current) {
                requestAnimationFrame(() => _refDiv.current.scrollTo(index * 200, 0))
            }
        }, [_refDiv.current])

        // useMemo(() => {
        //     if (!show) {
        //         setFieldTouched(name, true)
        //     }
        // }, [show])

        return (
            <div
                ref={ref}
                className={className}
                aria-labelledby={labeledBy}
                style={{ width: '100%' }}
            >
                <div className="card card-custom">
                    <div ref={_refDiv} style={{ overflowX: 'scroll' }}>
                        <div style={{ width: 'fit-content' }} >
                            <div className={'mx-4 my-4 d-flex flex-row align-items-center'} style={{ fontSize: 14 }} >
                                {formatMessage({defaultMessage:'Ngành hàng đang chọn'})}:&ensp;
                                {
                                    categoriesSelected.map((_category, index) => {
                                        return [
                                            index > 0 && <i key={`iright--${index}`} className={`fas fa-angle-right text-secondary mx-4`} > </i>,
                                            <span key={`iright----${index}`} className={'text-primary'} >{_category.display_name}</span>
                                        ]
                                    })
                                }
                            </div>
                            <Divider orientation='horizontal' />
                            <div className="card-body d-flex flex-row p-0" style={{ height: 250 }} >
                                <CategoryList index={0} categoriesSelected={categoriesSelected} setCategoriesSelected={setCategoriesSelected} setIsDoneSelect={setIsDoneSelect} scrollToX={_scrollTo} categories={categories} />
                                <Divider orientation='vertical' variant='fullWidth' />
                                <CategoryList index={1} categoriesSelected={categoriesSelected} setCategoriesSelected={setCategoriesSelected} setIsDoneSelect={setIsDoneSelect} scrollToX={_scrollTo} categories={categories} />
                                <Divider orientation='vertical' variant='fullWidth' />
                                <CategoryList index={2} categoriesSelected={categoriesSelected} setCategoriesSelected={setCategoriesSelected} setIsDoneSelect={setIsDoneSelect} scrollToX={_scrollTo} categories={categories} />
                                {
                                    categoriesSelected.slice(2, 100).map((_category, index) => {
                                        if ((categories[_category.id] || []).length > 0) {
                                            return [
                                                <Divider key={`divider-${index}`} orientation='vertical' variant='fullWidth' />,
                                                <CategoryList key={`CategoryList-${index}`} index={index + 2 + 1} categoriesSelected={categoriesSelected} setCategoriesSelected={setCategoriesSelected} setIsDoneSelect={setIsDoneSelect} scrollToX={_scrollTo} categories={categories} />
                                            ]
                                        }
                                        return null;
                                    })
                                }
                            </div>
                        </div>
                    </div>
                    <div className="card-footer d-flex flex-row-reverse py-3">
                        <button
                            type="button"
                            className="btn btn-primary btn-elevate"
                            disabled={!isDoneSelect}
                            onClick={e => {
                                e.preventDefault();
                                setFieldValue('__changed__', true);
                                if (!!selected && selected.id != categoriesSelected[categoriesSelected.length - 1].id && !hideConfirm) {
                                    setShowConfirm(true)
                                } else {
                                    setFieldValue(name, [...categoriesSelected], true)
                                    !!onSelect && onSelect(categoriesSelected[categoriesSelected.length - 1])
                                }
                                !!close && close()
                            }}
                        >
                            <FormattedMessage defaultMessage="XÁC NHẬN" />
                        </button>
                        <button
                            type="button"
                            className="btn btn-light btn-elevate mr-3"
                            onClick={e => {
                                e.preventDefault();
                                !!close && close()
                            }}
                        >
                            <FormattedMessage defaultMessage="ĐÓNG" />
                        </button>
                    </div>
                </div>
                <Modal
                    show={showConfirm}
                    onHide={() => setShowConfirm(false)}
                    aria-labelledby="example-modal-sizes-title-sm"
                    centered
                >
                    <Modal.Body className="overlay overlay-block cursor-default text-center" >
                    {formatMessage({defaultMessage:'Việc thay đổi danh mục có thể bị xóa một phần thông tin bạn đã nhập bên dưới (nếu những thông tin đó không còn phù hợp với danh mục hiện tại bạn chọn). Bạn vẫn muốn tiếp tục'})}?
                    </Modal.Body>
                    <Modal.Footer className="form" style={{ borderTop: 'none', justifyContent: 'center', paddingTop: 0 }} >
                        <div className="form-group">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="btn btn-light btn-elevate mr-3"
                                style={{ width: 100 }}
                            >
                                <FormattedMessage defaultMessage="ĐÓNG" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFieldValue(name, [...categoriesSelected])
                                    onSelect(categoriesSelected[categoriesSelected.length - 1])
                                    // setAttributesSelected([])
                                    setShowConfirm(false)
                                }}
                                className="btn btn-primary btn-elevate"
                                style={{ width: 100 }}
                            >
                                <FormattedMessage defaultMessage="XÁC NHẬN" />
                            </button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </div >
        );
    },
);
const CustomToggle = React.forwardRef(({ children, onClick, selected, name, disableInputStyle }, ref) => {
    const { values, touched, submitCount, errors, setFieldTouched } = useFormikContext()
    const { formatMessage } = useIntl();
    const isInvalid = (submitCount > 0 || touched[name]) && errors[name];

    // useMemo(() => {
    //     let allCategories = _.flatten(Object.values(categories));
    //     if (!!categorySelected && allCategories.length > 0 && (!values[name] || values[name].length == 0)) {
    //         let newArray = []
    //         newArray.push(categorySelected)
    //         let parent = allCategories.find(_cate => _cate.id == categorySelected.parent_id)
    //         while (!!parent) {
    //             newArray = [parent, ...newArray]
    //             parent = allCategories.find(_cate => _cate.id == parent.parent_id)
    //         }
    //         setFieldValue(name, newArray)
    //     } else if (!categorySelected) {
    //         // setFieldValue(name, [])
    //     }
    // }, [categorySelected, values[name], categories])
    return <>
        <input type="text" name={name} className={`form-control `} placeholder={formatMessage({defaultMessage:"Chọn ngành hàng"})} ref={ref}
            onClick={(e) => {
                e.preventDefault();
                onClick(e);
            }}
            value={!!values[name] ? values[name].map(_cate => _cate.display_name).join('  >  ') : ''}
            onChange={() => { }}
            onFocus={() => setFieldTouched(name, true)}
            style={!disableInputStyle ? { background: '#F7F7FA', border: isInvalid ? '1px solid #F5222D' : 'none' } : { paddingRight: !!selected ? 30 : 0 }}
            autoComplete='off'
        />
        <FieldFeedbackLabel
            error={errors[name]}
            touched={isInvalid}
        />
    </>
});

export default memo((props) => {
    const { formatMessage } = useIntl();
    return (
        <div className="form-group row">
            {!props.hideLabel && <label className={`col-12 col-form-label ${!props.disablePaddingTop ? 'mt-4' : ''}`}>{formatMessage({defaultMessage:'Ngành hàng'})} <span className='text-danger' > *</span></label>}
            <div className="col-12 input-group">
                <Dropdown style={{ width: '100%' }} drop={'down'} >
                    <Dropdown.Toggle as={CustomToggle} style={{ width: '100%' }} {...props} >
                        <FormattedMessage defaultMessage="GIAN HÀNG/KÊNH BÁN" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu as={CustomMenu} {...props} >
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    )
})