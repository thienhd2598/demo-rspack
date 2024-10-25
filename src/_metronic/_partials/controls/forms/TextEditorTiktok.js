import { useFormikContext } from "formik";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";


import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import axios from "axios";
import { loadSizeImage } from '../../../../utils'
import _ from "lodash";
import { useIntl } from "react-intl";


export function TextEditorTiktok({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  type = "text",
  required = false,
  countChar = false,
  maxChar = 10000,
  rows = 10,
  cols = ['col-3', 'col-9'],
  onErrorUpload,
  ...props
}) {
  const {formatMessage} = useIntl()
  const { setFieldValue, values, setFieldTouched } = useFormikContext()
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const _refdebounce = useRef(_.debounce((_state) => {
    let raw = convertToRaw(_state.getCurrentContent());
    raw.blocks = raw.blocks.map(__ => {
      if (__.text.trim().length != 0) {
        return {
          ...__,
          entityRanges: []
        }
      }
      return __
    })
    
    setFieldValue(field.name, draftToHtml(raw), true)
  }, 300))

  useEffect(() => {

    let _html = !!values[`${field.name}`] ? values[`${field.name}`].trim() : ''
    const blocksFromHtml = htmlToDraft(_html.startsWith("<br><img") || _html.startsWith("<img") ? (`<div>${_html}</div>`) : _html);
    // const blocksFromHtml = htmlToDraft(values[`${field.name}_init`] ? (values[`${field.name}_init`]) : ``);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    const _state = EditorState.createWithContent(contentState);
    setEditorState(_state);    
    setFieldValue(field.name, draftToHtml(convertToRaw(_state.getCurrentContent())), true)
    // console.log(convertToRaw(_state.getCurrentContent()))
  }, [values[`${field.name}_init`]])

  const _imageCountRef = useRef(0)
  const _refSubmitCount = useRef(submitCount)
  const _uploadImageCallBack = useCallback((file) => {
    console.log('file----', file)

    return new Promise(
      async (resolve, reject) => {

        if (_imageCountRef.current >= 30) {
          !!onErrorUpload && onErrorUpload(formatMessage({defaultMessage:'Bạn chỉ có thể tải lên tối đa 30 ảnh'}))
          reject()
          return
        }

        let resSize = await loadSizeImage(file)
        console.log('resSize', resSize)
        let ratio = resSize.width / resSize.height
        if (resSize.width < 100 || resSize.height < 100) {
          !!onErrorUpload && onErrorUpload(formatMessage({defaultMessage:'Không thể được tải lên. Kích thước ảnh tối thiểu phải đạt 100x100.'}))
          reject();
          return
        }

        if (resSize.size > 5 * 1024 * 1024) {
          !!onErrorUpload && onErrorUpload(formatMessage({defaultMessage:'Không thể tải ảnh lên. Dung lượng ảnh tối đa 5.0 MB.'}))
          reject()
          return
        }

        let formData = new FormData();
        formData.append('type', 'file')
        formData.append('file', file, file.name || 'file.jpg')
        let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData)
        if (res.data.success) {
          resolve({ data: { link: res.data.data.source } });
        } else {
          !!onErrorUpload && onErrorUpload("-1")
          reject(formatMessage({defaultMessage:'Gặp lỗi trong quá trình tải lên'}))
        }

      }
    );
  }, [])

  const [count, imgCount] = useMemo(() => {
    let _count = 0;
    let _imageCount = 0
    try {
      let { blocks } = convertToRaw(editorState.getCurrentContent());
      _count = blocks.reduce(
        (previousValue, currentValue) => {
          if (currentValue.entityRanges.length > 0) {
            _imageCount++;
            return previousValue
          }
          return previousValue + currentValue.text.length
        },
        0
      )
    } catch (error) {
    }

    _imageCountRef.current = _imageCount;

    setFieldValue(field.name + '_count', _count, true)
    setFieldValue(field.name + '_img_count', _imageCount, true)
    return [_count, _imageCount]
  }, [editorState, field.name])

  return (
    <div className="form-group row " style={{ position: 'relative' }} >
      {label && <label className={`${cols[0]} col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`${cols[1]}`}>
        <div className='w-100 ' style={{ position: 'relative' }}>
          <Editor
            editorState={editorState}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName={`editorClassName ${(submitCount != _refSubmitCount.current || touched[field.name]) && errors[field.name] ? 'border-error' : ''}`}
            toolbar={{
              options: ['list', 'image'],
              image: {
                uploadCallback: _uploadImageCallBack,
                previewImage: true,
                inputAccept: 'image/jpeg,image/jpg,image/png',
                defaultSize: {
                  height: 'auto',
                  width: '100%',
                },
              },
            }}
            handlePastedText={() => false}
            placeholder={props.placeholder}
            onEditorStateChange={(_editorState) => {
              setEditorState(_editorState)
              setFieldValue(`${field.name}_error`, false)
              setFieldValue('__changed__', true)
              _refdebounce.current(_editorState)
            }}
            onBlur={(e) => {
              setFieldTouched(field.name, true)
            }}
          />
          <span className="" style={{ position: 'absolute', right: 0, bottom: -20, color: 'rgba(0,0,0, 0.45)' }} >{`${(values[field.name] || '').length}/${maxChar}`}</span>
        </div>
        {withFeedbackLabel && (
          <FieldFeedbackLabel
            error={errors[field.name]}
            touched={submitCount != _refSubmitCount.current || touched[field.name]}
            label={label}
            type={type}
            customFeedbackLabel={customFeedbackLabel}
          />
        )}
      </div>
    </div >
  );
}
