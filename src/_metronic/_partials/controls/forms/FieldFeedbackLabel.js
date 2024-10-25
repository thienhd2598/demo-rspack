import React from "react";

const inputLabel = ({ label, touched, error, customFeedbackLabel, absolute }) => {
  if (touched && error) {
    return <div className="invalid-feedback " style={absolute ? {
      position: 'absolute', top: 36, textOverflow: 'ellipsis',
      whiteSpace: 'wrap', overflow: 'hidden', display: 'block',
      fontSize: 10
    } : { display: 'block' }} >{error}</div>;
  }

  return null;
  // if (touched && !error && label) {
  //   return <div className="valid-feedback">{label} was entered correct</div>;
  // }

  // return (
  //   <div className="feedback">
  //     {customFeedbackLabel && <>{customFeedbackLabel}</>}
  //     {!customFeedbackLabel && (
  //       <>
  //         <b>{label}</b>
  //       </>
  //     )}
  //   </div>
  // );
};

const selectLabel = ({ label, touched, error, customFeedbackLabel }) => {
  if (touched && error) {
    return <div className="invalid-feedback">{error}</div>;
  }

  return (
    <div className="feedback">
      {customFeedbackLabel && <>{customFeedbackLabel}</>}
      {!customFeedbackLabel && label && (
        <>
          Please select <b>{label}</b>
        </>
      )}
    </div>
  );
};

export function FieldFeedbackLabel({
  label,
  touched,
  error,
  type,
  customFeedbackLabel,
  absolute = false
}) {
  // switch (type) {
  //   case "text":
  //     return inputLabel({ label, touched, error, customFeedbackLabel, absolute });
  //   case "email":
  //     return inputLabel({ label, touched, error, customFeedbackLabel });
  //   case "password":
  //     return inputLabel({ label, touched, error, customFeedbackLabel });
  //   default:
  return inputLabel({ label, touched, error, customFeedbackLabel, absolute });
  // }
}
