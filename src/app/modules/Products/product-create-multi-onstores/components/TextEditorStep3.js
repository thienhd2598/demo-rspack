import { useFormikContext } from "formik";
import React, { useCallback, useEffect, useRef, useState } from "react";

import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import axios from "axios";
import { FieldFeedbackLabel } from "../../../../../_metronic/_partials/controls";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
export function TextEditor({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  type = "text",
  init,
  required = false,
  countChar = false,
  maxChar = 100,
  rows = 10,
  cols = ['col-3', 'col-9'],
  ...props
}) {
  const user = useSelector((state) => state.auth.user);
  const { setFieldValue, values, setFieldTouched } = useFormikContext()
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const {formatMessage} = useIntl()
  useEffect(() => {
    let _html = !!values[`${field.name}`] ? values[`${field.name}`].trim() : ''
    const blocksFromHtml = htmlToDraft(_html.startsWith("<img") ? (`<div>${_html}</div>`) : _html);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    const _state = EditorState.createWithContent(contentState);
    setEditorState(_state);
  }, [values[`${init}_${field.name.slice(field.name.length - 1)}`]])

  const _refSubmitCount = useRef(submitCount)
  const _uploadImageCallBack = useCallback((file) => {
    return new Promise(
      async (resolve, reject) => {
        let formData = new FormData();
        formData.append('type', 'file')
        formData.append('file', file, file.name || 'file.jpg')
        let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData, {
          isSubUser: user?.is_subuser,
        })
        if (res.data.success) {
          resolve({ data: { link: res.data.data.source } });
        } else {
          reject(formatMessage({defaultMessage:'Gặp lỗi trong quá trình tải lên'}))
        }

      }
    );
  }, [])

  return (
    <div className="form-group row " style={{ position: 'relative' }} >
      {label && <label className={`${cols[0]} col-form-label`}>{label}{!!required && <span className='text-danger' > *</span>}</label>}
      <div className={`${cols[1]}`}>
        <div className='w-100' style={{ position: 'relative' }}>
          <Editor
            editorState={editorState}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName={`editorClassName ${(submitCount != _refSubmitCount.current || touched[field.name]) && errors[field.name] ? 'border-error' : ''}`}
            toolbar={{
              options: ['inline', 'list', 'textAlign', 'history', 'image'],
              image: {
                uploadCallback: _uploadImageCallBack,
                previewImage: true,
                inputAccept: 'image/jpeg,image/jpg,image/png',
              },
            }}
            placeholder={props.placeholder}
            onEditorStateChange={(editorState) => {
              setEditorState(editorState)
              setFieldValue('__changed__', true)
              setFieldValue(field.name, draftToHtml(convertToRaw(editorState.getCurrentContent())), true)
            }}
            onBlur={(e) => {
              setFieldTouched(field.name, true)
            }}
          />
          {countChar && <span className="" style={{ position: 'absolute', right: 0, bottom: -20, color: 'rgba(0,0,0, 0.45)' }} >{`${(values[field.name] || '').length}/${maxChar}`}</span>}
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
