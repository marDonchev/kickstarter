/* eslint-disable indent */
/* eslint-disable no-unused-vars */
const functions = require("firebase-functions");
const Sentry = require("@sentry/node");
// const Tracing = require("@sentry/tracing");
const configEnv = functions.config().env;
const cors = require("cors");
const admin = require("firebase-admin");
const express = require("express");
const session = require("cookie-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")();

Sentry.init({
    dsn: "https://bc4f57bcfc1340c782fa92d65c817137@o233614.ingest.sentry.io/5759164",

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
});

// const transaction = Sentry.startTransaction({
//     op: "test",
//     name: "My First Test Transaction",
// });

// setTimeout(() => {
//     try {
//         foo();
//     } catch (e) {
//         Sentry.captureException(e);
//     } finally {
//         transaction.finish();
//     }
// }, 99);

console.info("configEnv", configEnv);

// If in emulation mode
if (
    process.env.FUNCTIONS_EMULATOR &&
    process.env.FUNCTIONS_EMULATOR.toString() === "true"
) {
    console.log("Running in EMULATION MODE");
    const serviceAccount = require("./../" + configEnv.serviceAccount);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: configEnv.databaseURL,
        storageBucket: JSON.parse(process.env.FIREBASE_CONFIG).storageBucket,
    });
} else {
    console.log("Running in THE CLOUD");
    // Running in the cloud
    admin.initializeApp({
        databaseURL: configEnv.databaseURL,
        storageBucket: JSON.parse(process.env.FIREBASE_CONFIG).storageBucket,
    });
}

const database = admin.database();

if (
    process.env.FUNCTIONS_EMULATOR &&
    process.env.FUNCTIONS_EMULATOR.toString() === "true"
) {
    // Point to the RTDB emulator running on localhost.
    database.useEmulator("localhost", 9000);
    console.log("WE ARE USING LOCAL DATABASE !!!");
}
//const db = admin.firestore(); // Add this

const app = express();
const main = express();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
    //console.log("Check if request is authorized with Firebase ID token");

    if (
        (!req.headers.authorization ||
            !req.headers.authorization.startsWith("Bearer ")) &&
        !(req.cookies && req.cookies.__session)
    ) {
        console.error(
            "No Firebase ID token was passed as a Bearer token in the Authorization header.",
            "Make sure you authorize your request by providing the following HTTP header:",
            "Authorization: Bearer <Firebase ID Token>",
            'or by passing a "__session" cookie.'
        );
        res.status(403).send("Unauthorized");
        return;
    }

    let idToken;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        //console.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.cookies) {
        //console.log('Found "__session" cookie');
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // No cookie
        //console.log('no cookie');
        res.status(403).send("Unauthorized");
        return;
    }
    //console.log('Found idToken = '+idToken);
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        //console.log("ID Token correctly decoded", decodedIdToken);
        req.user = decodedIdToken;

        // adding the world_key to the data
        if (!req.body || !req.body.world_key)
            req.body["world_key"] = req.user.world_key;

        next();
        return;
    } catch (error) {
        console.error("Error while verifying Firebase ID token:", error);
        res.status(403).send("Unauthorized");
        return;
    }
};

var unless = function (paths, middleware) {
    return function (req, res, next) {
        if (paths.indexOf(req.path) !== -1) {
            return next();
        } else {
            return middleware(req, res, next);
        }
    };
};

// Get Promise.allSettled if not set
if (!Promise.allSettled) {
    Promise.allSettled = (promises) =>
        Promise.all(
            promises.map((promise, i) =>
                promise
                    .then((value) => ({
                        status: "fulfilled",
                        value,
                    }))
                    .catch((reason) => ({
                        status: "rejected",
                        reason,
                    }))
            )
        );
}

app.use(cors({ origin: true }));
main.use(cors({ origin: true }));
app.use(cookieParser);

// Validate middleware (unless public urls)
app.use(unless(["/warm"], validateFirebaseIdToken));

app.set("trust proxy", 1); // trust first proxy
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        //cookie: { secure: true }
    })
);

main.use("/api/v1", app);
main.use(bodyParser.json());

exports.webApi = functions.https.onRequest(main);

app.get("/warm", (req, res) => {
    res.send({
        message: "Hello!",
    });
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
