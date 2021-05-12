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
            "http://localhost:5000/social-6ce6c/us-central1/webApi/api/v1/",
        unauthorizedURL: "//localhost:3000/logout",
    },
};

const prod = {
    // Section for backend locale information
    api: {
        URLprefix:
            "https://us-central1-social-6ce6c.cloudfunctions.net/webApi/api/v1/",
        unauthorizedURL: "//social-6ce6c.firebaseapp.com/logout",
    },
};

// Usage of the proper config object based on the env variable (REACT_APP_STAGE)
const config = process.env.REACT_APP_STAGE === "production" ? prod : dev;

export default {
    // Common settings for both dev and prod configs

    // Delay before updating the device after the ArcSlider has been used
    sliderUpdateDelay: 1500,

    ...config,
};
// TODO: Adding some constants here (like statuses = upcoming,processing,posted etc.)
