import Rebase from "re-base";
import firebase from "firebase";
import config from "./config";

const app = firebase.initializeApp(config.firebase);
const base = Rebase.createClass(app.database());
const facebookProvider = new firebase.auth.FacebookAuthProvider();
const googleProvider = new firebase.auth.GoogleAuthProvider();

export { base, app, facebookProvider, firebase, googleProvider };
