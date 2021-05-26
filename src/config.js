/**
 * Config file for storing URLs and other settings the application needs
 *
 * @version 0.0.1
 * @author [Martin D.](https://github.com/marDonchev)
 *
 * @class config
 * * @visibleName Simple config class
 */

const dev = {
    // Section for backend locale information
    api: {
        URLprefix:
            "http://localhost:5000/kickstarter-f118c/us-central1/webApi/api/v1/",
        unauthorizedURL: "//localhost:3000/logout",
    },
};

const prod = {
    // Section for backend locale information
    api: {
        URLprefix:
            "https://us-central1-kickstarter-f118c.cloudfunctions.net/webApi/api/v1/",
        unauthorizedURL: "//kickstarter-f118c.firebaseapp.com/logout",
    },
};

// Usage of the proper config object based on the env variable (REACT_APP_STAGE)
const config = process.env.REACT_APP_STAGE === "production" ? prod : dev;

const configDefault = {
    // Common settings for both dev and prod configs

    // Delay before updating the device after the ArcSlider has been used
    sliderUpdateDelay: 1500,

    // Firebase
    firebase: {
        apiKey: "AIzaSyCr5A9I36Q0uaXQTMvpLgme_sDqkP-2nzQ",
        authDomain: "kickstarter-f118c.firebaseapp.com",
        databaseURL:
            "https://kickstarter-f118c-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "kickstarter-f118c",
        storageBucket: "kickstarter-f118c.appspot.com",
        messagingSenderId: "898990859672",
        appId: "1:898990859672:web:8f857855d2667a70deb7ed",
        measurementId: "G-QEMP187ZNK",
    },

    ...config,
};
export default configDefault;
// TODO: Adding some constants here (like statuses = upcoming,processing,posted etc.)
