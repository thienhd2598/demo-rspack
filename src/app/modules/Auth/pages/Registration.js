import React, { useEffect, useState, useRef } from "react";
import { useFormik } from "formik";
import { connect } from "react-redux";
import * as Yup from "yup";
import { Link, useHistory } from "react-router-dom";
import { FormattedMessage, injectIntl } from "react-intl";
import { actions } from "../_redux/authRedux";
import { register } from "../_redux/authCrud";

import { auth } from '../../../../firebase'
import { useMutation } from '@apollo/client'
import AUTH_SSO from '../../../../graphql/authen-sso'

const initialValues = {
  fullname: "",
  email: "",
  password: "",
  changepassword: "",
  acceptTerms: false,
};

function Registration(props) {
  const [mutationAuthen] = useMutation(AUTH_SSO)
  const fullname = useRef('')
  const { intl } = props;
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const RegistrationSchema = Yup.object().shape({
    fullname: Yup.string()
      .min(3, intl.formatMessage({
        defaultMessage: "tối thiểu {min} ký tự",
      }, {
        min: 3
      }))
      .max(50, intl.formatMessage({
        defaultMessage: "Nhiều nhất {min} ký tự",
      }, {
        min: 50
      }))
      .required(
        intl.formatMessage({
          defaultMessage: "Không được để trống",
        })
      ),
    email: Yup.string()
      .email(intl.formatMessage({
        defaultMessage: "Email không hợp lệ",
      }))
      .min(3, intl.formatMessage({
        defaultMessage: "tối thiểu {min} ký tự",
      }, {
        min: 3
      }))
      .max(50, intl.formatMessage({
        defaultMessage: "Nhiều nhất {min} ký tự",
      }, {
        min: 50
      }))
      .required(
        intl.formatMessage({
          defaultMessage: "Không được để trống",
        })
      ),
    password: Yup.string()
      .min(3, intl.formatMessage({
        defaultMessage: "tối thiểu {min} ký tự",
      }, {
        min: 3
      }))
      .max(50, intl.formatMessage({
        defaultMessage: "Nhiều nhất {min} ký tự",
      }, {
        min: 50
      }))
      .required(
        intl.formatMessage({
          defaultMessage: "Không được để trống",
        })
      ),
    changepassword: Yup.string()
      .required(
        intl.formatMessage({
          defaultMessage: "Không được để trống",
        })
      )
      .when("password", {
        is: (val) => (val && val.length > 0 ? true : false),
        then: Yup.string().oneOf(
          [Yup.ref("password")],
          intl.formatMessage({
            defaultMessage: "Hai mật khẩu phải trùng khớp nhau",
          })
        ),
      }),
    acceptTerms: Yup.bool().required(
      intl.formatMessage({
        defaultMessage: "Bạn phải đồng ý với điều khoản và chính sách",
      })
    ),
  });

  const enableLoading = () => {
    setLoading(true);
  };

  const disableLoading = () => {
    setLoading(false);
  };


  async function onAuthStateChanged(user) {
    if (!!user && !!fullname.current) {
      let updateProfile = await user.updateProfile({ displayName: fullname.current })
      try {
        let idToken = await user.getIdToken(true)

        let resRegister = await mutationAuthen({
          variables: {
            firebase_id: user.uid,
            idToken,
            provider: user.providerData[0].providerId
          }
        })
        if (resRegister.data) {
          let newIdToken = await user.getIdToken(true)
          props.register(newIdToken)

          history.push('/')
        } else {
          throw new Error(resRegister.errors[0].message);
        }
      } catch (error) {
        console.log('error', error)
        auth.signOut()
        formik.setStatus(
          error.message
        );
        formik.setSubmitting(false);
        disableLoading();
      }
    } else {
    }
  }

  useEffect(() => {
    auth.signOut();

    const subscriberStateChanged = auth.onAuthStateChanged(onAuthStateChanged);
    return () => {
      subscriberStateChanged()
    }; // unsubscribe on unmount
  }, []);

  const getInputClasses = (fieldname) => {
    if (formik.touched[fieldname] && formik.errors[fieldname]) {
      return "is-invalid";
    }

    // if (formik.touched[fieldname] && !formik.errors[fieldname]) {
    //   return "is-valid";
    // }

    return "";
  };

  const formik = useFormik({
    initialValues,
    validationSchema: RegistrationSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        setStatus(
          ""
        );
        setSubmitting(true);
        enableLoading();
        fullname.current = values.fullname;
        const res = await auth.createUserWithEmailAndPassword(values.email, values.password)
        if (!res) {
          setSubmitting(false);
          disableLoading();
        } else {
        }
      } catch (error) {
        setSubmitting(false);
        disableLoading();
        setStatus(
          error.message
        );
      }
    },
  });

  return (
    <div className="login-form login-signin" style={{ display: "block" }}>
      <div className="text-center mb-10 mb-lg-20">
        <h3 className="font-size-h1">
          <FormattedMessage defaultMessage="ĐĂNG KÝ" />
        </h3>
        <p className="text-muted font-weight-bold">
          <FormattedMessage defaultMessage="Nhập thông tin của bạn để tạo tài khoản" />
        </p>
      </div>

      <form
        id="kt_login_signin_form"
        className="form fv-plugins-bootstrap fv-plugins-framework animated animate__animated animate__backInUp"
        onSubmit={formik.handleSubmit}
      >
        {/* begin: Alert */}
        {formik.status && (
          <div className="mb-10 alert alert-custom alert-light-danger alert-dismissible">
            <div className="alert-text font-weight-bold">{formik.status}</div>
          </div>
        )}
        {/* end: Alert */}

        {/* begin: Fullname */}
        <div className="form-group fv-plugins-icon-container">
          <input
            placeholder={intl.formatMessage({
              defaultMessage: "Họ tên",
            })}
            type="text"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "fullname"
            )}`}
            name="fullname"
            {...formik.getFieldProps("fullname")}
          />
          {formik.touched.fullname && formik.errors.fullname ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.fullname}</div>
            </div>
          ) : null}
        </div>
        {/* end: Fullname */}

        {/* begin: Email */}
        <div className="form-group fv-plugins-icon-container">
          <input
            placeholder="Email"
            type="email"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "email"
            )}`}
            name="email"
            {...formik.getFieldProps("email")}
          />
          {formik.touched.email && formik.errors.email ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.email}</div>
            </div>
          ) : null}
        </div>
        {/* end: Email */}

        {/* begin: Password */}
        <div className="form-group fv-plugins-icon-container">
          <input
            placeholder={intl.formatMessage({
              defaultMessage: "Mật khẩu mới",
            })}
            type="password"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "password"
            )}`}
            name="password"
            {...formik.getFieldProps("password")}
          />
          {formik.touched.password && formik.errors.password ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.password}</div>
            </div>
          ) : null}
        </div>
        {/* end: Password */}

        {/* begin: Confirm Password */}
        <div className="form-group fv-plugins-icon-container">
          <input
            placeholder={intl.formatMessage({
              defaultMessage: "Nhập lại mật khẩu mới",
            })}
            type="password"
            className={`form-control form-control-solid h-auto py-5 px-6 ${getInputClasses(
              "changepassword"
            )}`}
            name="changepassword"
            {...formik.getFieldProps("changepassword")}
          />
          {formik.touched.changepassword && formik.errors.changepassword ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">
                {formik.errors.changepassword}
              </div>
            </div>
          ) : null}
        </div>
        {/* end: Confirm Password */}

        {/* begin: Terms and Conditions */}
        <div className="form-group">
          <label className="checkbox">
            <input
              type="checkbox"
              name="acceptTerms"
              className="m-1"
              {...formik.getFieldProps("acceptTerms")}
            />
            <Link
              to="#"
              // target="_blank"
              className="mr-3"
              rel="noopener noreferrer"
            >
              <FormattedMessage defaultMessage="Bạn đồng ý với điều khoản và chính sách?" />
            </Link>
            <span />
          </label>
          {formik.touched.acceptTerms && formik.errors.acceptTerms ? (
            <div className="fv-plugins-message-container">
              <div className="fv-help-block">{formik.errors.acceptTerms}</div>
            </div>
          ) : null}
        </div>
        {/* end: Terms and Conditions */}
        <div className="form-group d-flex flex-wrap flex-center">
          <button
            type="submit"
            disabled={
              formik.isSubmitting ||
              !formik.isValid ||
              !formik.values.acceptTerms
            }
            className="btn btn-primary font-weight-bold px-9 py-4 my-3 mx-4"
          >
            <span><FormattedMessage defaultMessage="Tiếp tục" /></span>
            {loading && <span className="ml-3 spinner spinner-white"></span>}
          </button>

          <Link to="/auth/login">
            <button
              type="button"
              className="btn btn-light-primary font-weight-bold px-9 py-4 my-3 mx-4"
            >
              <FormattedMessage defaultMessage="Huỷ" />
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default injectIntl(connect(null, actions)(Registration));
