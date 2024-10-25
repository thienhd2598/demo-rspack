import axios from "axios";
import { createApolloClientSSR } from "../../../../apollo";
import USER_ME from '../../../../graphql/user-me'

export const LOGIN_URL = `${process.env.REACT_APP_API_URL}/auth/login`;
export const REGISTER_URL = "api/auth/register";
export const REQUEST_PASSWORD_URL = "api/auth/forgot-password";
export const ME_URL = `${process.env.REACT_APP_API_URL}/auth/me`;

export function login(email, password) {
  return axios.post(LOGIN_URL, { email, password });
}

export function register(email, fullname, username, password) {
  return axios.post(REGISTER_URL, { email, fullname, username, password });
}

export function requestPassword(email) {
  return axios.post(REQUEST_PASSWORD_URL, { email });
}

export async function getUserByToken() {
  // Authorization head should be fulfilled in interceptor.

  let client = createApolloClientSSR()
  let { data, error } = await client.query({
    query: USER_ME,
    fetchPolicy: 'no-cache'
  })
  return data?.userMe
}
