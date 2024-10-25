import firebase from 'firebase';

const { REACT_APP_MODE } = process.env || {}

export const FIREBASE_PRIVATE_KEY_STAG = {
  apiKey: "AIzaSyAeKJUMhGqVnN3apFSlpx1D_dyYdUHmOWk",
  authDomain: "upbase-staging.firebaseapp.com",
  projectId: "upbase-staging",
  storageBucket: "upbase-staging.appspot.com",
  messagingSenderId: "306404081425",
  appId: "1:306404081425:web:bc8f4a1b0a1762d8c316b0",
  measurementId: "G-J98EZWHE1H"
};

export const FIREBASE_PRIVATE_KEY_PROD = {
  apiKey: "AIzaSyCnaPS-qB_7WEdxgP-TLZw1UmtEY5yzZTw",
  authDomain: "upbase-prod.firebaseapp.com",
  projectId: "upbase-prod",
  storageBucket: "upbase-prod.appspot.com",
  messagingSenderId: "749624894748",
  appId: "1:749624894748:web:41e7d6391c110a504c86d9",
  measurementId: "G-2J13F3VXQG"
}

firebase.initializeApp(REACT_APP_MODE == 'PROD' ? FIREBASE_PRIVATE_KEY_PROD : FIREBASE_PRIVATE_KEY_STAG);

export const auth = firebase.auth();
export default firebase;
