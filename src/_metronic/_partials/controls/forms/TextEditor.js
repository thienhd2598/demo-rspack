import { useFormikContext } from "formik";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FieldFeedbackLabel } from "./FieldFeedbackLabel";


import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { EditorState, convertToRaw, convertFromRaw, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import axios from "axios";
import { stateFromHTML } from "draft-js-import-html";
import { useIntl } from "react-intl";
export function TextEditor({
  field, // { name, value, onChange, onBlur }
  form: { touched, errors, submitCount, ...rest }, // also values, setXXXX, handleXXXX, dirty, isValid, status, etc.
  label,
  withFeedbackLabel = true,
  customFeedbackLabel,
  type = "text",
  required = false,
  countChar = false,
  maxChar = 0,
  rows = 10,
  cols = ['col-3', 'col-9'],
  toolbar,
  ...props
}) {

  const { setFieldValue, values, setFieldTouched } = useFormikContext()
  const [editorState, setEditorState] = useState(EditorState.createEmpty())
  const {formatMessage} = useIntl()
  useEffect(() => {
    const blocksFromHtml = htmlToDraft(values[`${field.name}_init`] ? ('<div>' + values[`${field.name}_init`] + '</div>') : ``);
    const { contentBlocks, entityMap } = blocksFromHtml;
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    const _state = EditorState.createWithContent(contentState);
    setEditorState(_state);
  }, [values[`${field.name}_init`]])

  const _refSubmitCount = useRef(submitCount)
  const _uploadImageCallBack = useCallback((file) => {
    console.log('file----', file)

    return new Promise(
      async (resolve, reject) => {
        let formData = new FormData();
        formData.append('type', 'file')
        formData.append('file', file, file.name || 'file.jpg')
        let res = await axios.post(process.env.REACT_APP_URL_FILE_UPLOAD, formData)
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
            toolbar={toolbar || {
              options: ['inline', 'list', 'textAlign', 'history', 'image'],
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
            handlePastedText={(text, html) => {              
              // if they try to paste something they shouldn't let's handle it
              if (!!text && text.length > 0 && !html) {
                // we'll add a message for the offending user to the editor state
                // let content = EditorState.createEmpty()
                // text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '<br />').split("<br />").map(__ => {})
                try {
                  const newContent = Modifier.insertText(
                    editorState.getCurrentContent(),
                    editorState.getSelection(),
                    text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, `
              `)
                  );

                  // update our state with the new editor content
                  let newEditor = EditorState.push(
                    editorState,
                    newContent,
                    'insert-characters'
                  )                  
                  setEditorState(newEditor)
                  setFieldValue('__changed__', true)
                  setFieldValue(field.name, draftToHtml(convertToRaw(newEditor.getCurrentContent())), true)

                } catch (error) {
                  let content = EditorState.createEmpty()
                  const newContent = Modifier.insertText(
                    content.getCurrentContent(),
                    content.getSelection(),
                    text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, `
              `)
                  );

                  let newEditor = EditorState.push(
                    content,
                    newContent,
                    'insert-characters'
                  )

                  setEditorState(newEditor)
                  setFieldValue('__changed__', true)
                  setFieldValue(field.name, draftToHtml(convertToRaw(newEditor.getCurrentContent())), true)
                }
                return true;
              } else {
                if (!!html) {
                  try {
                    const blockMap = stateFromHTML(html).blockMap;
                    const newState = Modifier.replaceWithFragment(
                      editorState.getCurrentContent(),
                      editorState.getSelection(),
                      blockMap,
                    );
                    let newEditor = EditorState.push(editorState, newState, 'insert-fragment')
                    setEditorState(newEditor)
                    setFieldValue('__changed__', true)
                    setFieldValue(field.name, draftToHtml(convertToRaw(newEditor.getCurrentContent())), true)
                    return true;
                  } catch (error) {
                    const blockMap = stateFromHTML(html).blockMap;
                    let content = EditorState.createEmpty()
                    const newContent =Modifier.replaceWithFragment(
                      content.getCurrentContent(),
                      content.getSelection(),
                      blockMap,
                    );

                    let newEditor = EditorState.push(
                      content,
                      newContent,
                      'insert-characters'
                    )

                    setEditorState(newEditor)
                    setFieldValue('__changed__', true)
                    setFieldValue(field.name, draftToHtml(convertToRaw(newEditor.getCurrentContent())), true)
                  }

                }
              }
              return false
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
          {countChar && <span className="" style={{ position: 'absolute', right: 0, bottom: -20, color: 'rgba(0,0,0, 0.45)' }} >{`${(values[field.name] || '').length}`}{!!maxChar ? `/${maxChar}` : ``}</span>}
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
