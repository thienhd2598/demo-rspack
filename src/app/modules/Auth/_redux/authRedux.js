import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { put, takeLatest } from "redux-saga/effects";
import { getUserByToken } from "./authCrud";

export const actionTypes = {
  Login: "[Login] Action",
  Logout: "[Logout] Action",
  Register: "[Register] Action",
  UserRequested: "[Request User] Action",
  UserLoaded: "[Load User] Auth API",
  SetUser: "[Set User] Action",
  ShowIntroStep: "[ShowIntroStep] Action",
  HideIntroStep: "[HideIntroStep] Action",
};

const initialAuthState = {
  user: undefined,
  authToken: undefined,
  showIntroStep: false
};

export const reducer = persistReducer(
  { storage, key: "v726-upbase-auth", whitelist: ["authToken"] },
  (state = initialAuthState, action) => {
    switch (action.type) {
      case actionTypes.Login: {
        const { authToken } = action.payload;

        return { authToken, user: undefined };
      }

      case actionTypes.Register: {
        const { authToken } = action.payload;

        return { authToken, user: undefined };
      }

      case actionTypes.Logout: {
        // TODO: Change this code. Actions in reducer aren't allowed.
        localStorage.removeItem('jwt')
        localStorage.removeItem('info_sub_user')
        localStorage.removeItem('refresh_token')
        return initialAuthState;
      }

      case actionTypes.UserLoaded: {
        const { user } = action.payload;
        return { ...state, user };
      }

      case actionTypes.SetUser: {
        const { user } = action.payload;
        return { ...state, user };
      }

      case actionTypes.ShowIntroStep: {        
        return { ...state, showIntroStep: true };
      }

      case actionTypes.HideIntroStep: {
        return { ...state, showIntroStep: false };
      }

      default:
        return state;
    }
  }
);

export const actions = {
  login: (authToken) => ({ type: actionTypes.Login, payload: { authToken } }),
  register: (authToken) => ({
    type: actionTypes.Register,
    payload: { authToken },
  }),
  logout: () => ({ type: actionTypes.Logout }),
  requestUser: (user) => ({
    type: actionTypes.UserRequested,
    payload: { user },
  }),
  fulfillUser: (user) => ({ type: actionTypes.UserLoaded, payload: { user } }),
  setUser: (user) => ({ type: actionTypes.SetUser, payload: { user } }),
  showIntroStep: () => ({ type: actionTypes.ShowIntroStep }),
  hideIntroStep: () => ({ type: actionTypes.HideIntroStep })
};

export function* saga() {
  yield takeLatest(actionTypes.Login, function* loginSaga(action) {
    localStorage.setItem('jwt', action.payload.authToken)
    yield put(actions.requestUser());
  });

  yield takeLatest(actionTypes.Register, function* registerSaga(action) {
    localStorage.setItem('jwt', action.payload.authToken)
    yield put(actions.requestUser());
  });

  yield takeLatest(actionTypes.UserRequested, function* userRequested() {
    const userMe = yield getUserByToken();
    yield put(actions.fulfillUser(userMe));
  });
}
