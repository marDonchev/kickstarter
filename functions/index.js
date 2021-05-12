/* eslint-disable indent */
const functions = require("firebase-functions");
const Sentry = require("@sentry/node");
// const Tracing = require("@sentry/tracing");
const configEnv = functions.config().env;

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

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
