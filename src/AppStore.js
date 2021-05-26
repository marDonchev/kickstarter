import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { computed, observable, action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
import config from "./config";
// import CONSTS from "./consts";

import Api from "mdpapi";

import shortid from "shortid";
import { base, firebase } from "./base";

// const { Text } = Typography;

const fetch = window.fetch.bind(window);

class AppStore {
    // make appApi instance of the provided API
    appApi = new Api({
        //prefix: config.api.URLprefix,
        fetchLib: fetch, //axios
        // fetchLibName: "fetch", //"axios"
        logStyle: "color: green",
        // includeDetails: true,
        logEnabled: true,
    });

    // General Flags for binding collections
    flag_bindUsersCollection = null;

    modalListeners = [];

    flag_allLoaded = false; // flag to show whether the intial data was loaded
    loggedUser = {};

    // users
    users = [];

    // modals
    openModals = [];
    modalListeners = [];

    // callbacks
    callbacks = {};

    // notifications
    notifications = [];

    print_to_console = {
        print: process.env.REACT_APP_STAGE === "development" ? true : false,
        prefix: "AppStore >",
        style: "background: #1890ff; color: white; padding: 2px 5px; border-radius: 2px",
    };

    upload = [];

    constructor() {
        this._log("store constructor");
        this._info("config.api.URLprefix = ", config.api.URLprefix);

        // Decorate the store
        makeObservable(this, {
            flag_allLoaded: observable,
            loggedUser: observable,

            users: observable,
            upload: observable,

            notifications: observable,

            getLoggedUser: computed,
            saveLoggedUser: action,
            resetLoggedUser: action,
            updateLoggedUserState: action,
            pullLoggedUserState: action,

            // Users
            loadAllUsers: action,
            bindUsersCollection: action,
            unbindUsersCollection: action,
            updateAllUsers: action,
            getAllUsers: computed,
            getAllUsersLength: computed,

            showModalByKey: action,
            hideModalByKey: action,

            notifications_Add: action,
            notifications_Remove: action,
            notifications_Render: computed,

            graphQL: action,
        });

        if (!this.loggedUser.id) {
            return;
        } else {
            this.init();
        }
    }

    // Initial Loading
    async init() {
        this._log("INIT");

        this.appApi.get(
            "https://jsonplaceholder.typicode.com/posts/1",
            null,
            function (data) {
                console.info("data", data);
            },
            function (error) {
                console.error("error", error);
            }
        );
        this.appApi.setHeaders({
            "Content-Type": "application/json",
        });

        //   load the users from firebase
        await this.loadAllUsers().then((usersData) => {
            // users are loaded
            // console.info("usersData", usersData);
            // this.updateAllUsers(usersData); ????
        });
        this.bindUsersCollection();
    }

    removeAllListeners() {
        this.unbindUsersCollection();
    }

    // Pause function
    _pause(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Overwrite the loggin function
    _log = (() => {
        var context = `%c${this.print_to_console.prefix}%s`;
        if (this.print_to_console.print) {
            return Function.prototype.bind.call(
                console.log,
                console,
                context,
                this.print_to_console.style
            );
        } else {
            return () => {};
        }
    })();

    _info = (() => {
        var context = `%c${this.print_to_console.prefix}%s`;
        if (this.print_to_console.print) {
            return Function.prototype.bind.call(
                console.info,
                console,
                context,
                this.print_to_console.style
            );
        } else {
            return () => {};
        }
    })();

    // --- Callbacks ---------------------------------------------------------------------
    registerCallback = (_event, _callback) => {
        // add listeners if not existing
        if (!this.callbacks[_event] || !this.callbacks[_event].length)
            this.callbacks[_event] = [];

        // adding
        this.callbacks[_event].push(_callback);
    };
    unregisterCallbacks = (_event) => {
        if (this.callbacks[_event]) delete this.callbacks[_event];
    };
    fireCallback = (_event, _payload) => {
        if (this.callbacks[_event]) {
            this.callbacks[_event].map((callbackFn) => {
                if (typeof callbackFn === "function") callbackFn(_payload);
                return true;
            });
        }
    };
    // --- GraphQL ------------------------------------------------------------------------
    graphQL(_query) {
        //console.log("graphQL _query=" + _query);
        return new Promise(async (resolve, reject) => {
            this.appApi
                .post(
                    config.api.graphQLurl,
                    // "http://localhost:5000/challenges-fba64/us-central1/webApi/api/v1/graphql",
                    {
                        query: _query,
                    }
                )
                .then((data) => {
                    // Error checking
                    if (data.errors) {
                        console.warn("GRAPHQL ERROR");
                        data.errors.map((error) => {
                            this.notifications_Add({
                                type: "error",
                                duration: 3,
                                title: "Backend Error",
                                description: error.message,
                            });
                            return true;
                        });
                    }
                    resolve(data);
                })
                .catch((err) => {
                    console.log("ERROR");
                    reject(err);
                });
        });
        //   return this.appApi.post(
        //       config.api.graphQLurl,
        //       // "http://localhost:5000/challenges-fba64/us-central1/webApi/api/v1/graphql",
        //       {
        //           query: _query,
        //       }
        //   );
    }

    // Notifications
    notifications_Add = (_notification) => {
        _notification.key = shortid.generate();
        if (_notification.duration && _notification.duration > 0) {
            _notification.timeout = setTimeout(
                (that, key) => {
                    that.notifications_Remove(key);
                },
                _notification.duration * 1000,
                this,
                _notification.key
            );
        }
        this.notifications.push(_notification);
    };
    notifications_Remove = async (_key) => {
        let found = this.notifications.filter((n) => n.key === _key);
        if (found.length === 0) return;

        found[0].cls_extra = "ch_popout";
        await this._pause(250);
        this.notifications = this.notifications.filter(
            (notification) => notification.key !== _key
        );
    };
    get notifications_Render() {
        return (
            <div className="ch_Notifications">
                {this.notifications.map((notification) => {
                    const cls = notification.type
                        ? `ch_notification ch_${notification.type}`
                        : `ch_notification`;
                    const cls_extra = notification.cls_extra
                        ? notification.cls_extra
                        : null;

                    let cls_icon = "";
                    switch (notification.type) {
                        case "warning":
                            cls_icon = "ch_icon icofont-warning";
                            break;
                        case "error":
                            cls_icon = "ch_icon icofont-error";
                            break;
                        case "info":
                            cls_icon = "ch_icon icofont-info-circle";
                            break;
                        default:
                            break;
                    }

                    return (
                        <div
                            className={cls + " " + cls_extra}
                            key={notification.key}
                        >
                            <i
                                className="ch_close icofont-close"
                                onClick={(e) =>
                                    this.notifications_Remove(notification.key)
                                }
                            ></i>
                            <i className={cls_icon}></i>
                            <div className="ch_title">{notification.title}</div>
                            <div className="ch_description">
                                {notification.description}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Upload -----
    uploadMedia(_data) {
        let store = this;

        return new Promise(async (resolve, reject) => {
            //let that = this;
            this._info("uploadMedia _data", _data);
            const key = shortid.generate();
            //this._info("uploadMedia store.upload", store.upload);
            const loggedUser = store.getLoggedUser;
            store.upload.push({
                key,
                file: _data.file,
                visible: true,
                progress: 0,
                transferred_bytes: 0,
                total_bytes: 0,
                author: loggedUser,
            });

            let increaseProgress = (_key, _bytesTransferred, _bytesTotal) => {
                // console.info(
                // 	"increaseProgress _key",
                // 	_key,
                // 	"_bytesTransferred",
                // 	_bytesTransferred,
                // 	"_bytesTotal",
                // 	_bytesTotal
                // );
                let progress = Math.round(
                    (_bytesTransferred / _bytesTotal) * 100
                );
                let targetUpload = store.upload.filter(
                    (u) => u.key === _key
                )[0];
                targetUpload.progress = progress;
                targetUpload.transferred_bytes = _bytesTransferred;
                targetUpload.total_bytes = _bytesTotal;
                //store.updateLibraryNotifications();
            };

            let upload_element = store.upload[store.upload.length - 1];
            //store._info("uploadMedia upload_element", upload_element);

            const file = upload_element.file;

            //store._info("uploadMedia file", file);

            const storageRef = firebase.storage().ref(_data.world);
            let now = Date.now();
            let fileparts = file.name.split(".");
            let fileext = fileparts.pop();
            let new_filename =
                _data.type +
                "_" +
                fileparts.join(".") +
                "_" +
                now.valueOf() +
                "." +
                fileext;

            const mainFile = storageRef.child(new_filename);

            //console.info("mainFile", mainFile);
            let uploadTask = mainFile.put(file);

            uploadTask.on(
                "state_changed",
                function (snapshot) {
                    // Observe state change events such as progress, pause, and resume
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded

                    //console.log("Upload is progress % done");
                    const percent = Number(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    increaseProgress(
                        key,
                        snapshot.bytesTransferred,
                        snapshot.totalBytes
                    );
                    if (typeof _data.progressCallback === "function")
                        _data.progressCallback(
                            key,
                            snapshot.bytesTransferred,
                            snapshot.totalBytes,
                            percent
                        );
                },
                function (error) {
                    // Handle unsuccessful uploads
                    console.error("unsuccessful upload: " + error);
                    if (typeof _data.errorCallback === "function")
                        _data.errorCallback(key, error);
                },
                function () {
                    // Handle successful uploads on complete
                    // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                    uploadTask.snapshot.ref
                        .getDownloadURL()
                        .then(function (downloadURL) {
                            console.log("File available at", downloadURL);
                            if (typeof _data.successCallback === "function")
                                _data.successCallback(
                                    key,
                                    downloadURL,
                                    new_filename,
                                    store.upload.filter((u) => u.key === key)[0]
                                );
                        });
                }
            );
        });
    }

    deleteMedia(_media) {
        return new Promise(async (resolve, reject) => {
            // Checked if the library item is locked

            const storageRef = firebase.storage().ref(config.WORLD);
            // Create a reference to the file to delete
            var desertRef = storageRef.child(_media.filename);

            // Delete the file
            desertRef
                .delete()
                .then(() => {
                    resolve();
                })
                .catch((error) => {
                    // Uh-oh, an error occurred!
                    reject(error);
                });
        });
    }

    registerMedia(_media) {
        this._info("store.registerMedia _media", _media);

        // Base64 uploading
        // if (_base64Flag) {
        //   const _query = "";
        //   return this.graphQL(_query);
        // }
    }

    // Logged user
    get getLoggedUser() {
        return this.loggedUser;
    }
    saveLoggedUser(_user) {
        this.loggedUser = _user;
        this.init();
    }
    async pullLoggedUserState() {
        const logged_user_key = this.getLoggedUserKey;
        const graphQL = await this.graphQL(`{
                records(
                query: "FOR_USER",
                param: "${logged_user_key}"
                ) {
                    datetime,
                    datetime_formated,
                    event,
                    param,
                    user {
                        key,
                        displayName,
                        email,
                        score
                    }
                }
        }`);
        console.info("pullLoggedUserState graphQL", graphQL);
        let teams = [];
        let challenges = [];
        // calculate last action of the current user
        graphQL.data.records.filter((rec) => {
            // // check teams
            // if (rec.event === CONSTS.REC_EVENTS.TEAM.JOIN) {
            //     teams.push({ key: rec.param, datetime: rec.datetime });
            // }
            // if (rec.event === CONSTS.REC_EVENTS.TEAM.LEAVE) {
            //     teams = teams.filter((team) => team.key !== rec.param);
            // }
            // // challenges
            // if (rec.event === CONSTS.REC_EVENTS.CHALLENGE.ACCEPT) {
            //     challenges.push({ key: rec.param, datetime: rec.datetime });
            // }
            // if (
            //     rec.event === CONSTS.REC_EVENTS.CHALLENGE.CANCEL ||
            //     rec.event === CONSTS.REC_EVENTS.CHALLENGE.CONFIRM
            // ) {
            //     challenges = challenges.filter(
            //         (challenge) => challenge.key !== rec.param
            //     );
            // }
        });

        //console.info("teams", teams, "challenges", challenges);
        this.updateLoggedUserState({ teams, challenges });

        // mix the information of the user
        let loggedUserObj = null;
        // patch from users
        if (this.users.length > 0) {
            const usersItem = this.users.filter(
                (user) => user.uid === this.loggedUser.uid
            )[0];
            loggedUserObj = usersItem;
        }

        // update the location name
        //   loggedUserObj.locationName = loggedUserObj.location
        //       ? config.LOCATIONS[loggedUserObj.location].name
        //       : CONSTS.SYSTEM.NA;

        this.updateLoggedUser(loggedUserObj);
    }
    updateLoggedUserState(_state_info) {
        this.loggedUser.state = _state_info;
    }
    updateLoggedUser(_update_data) {
        this.loggedUser = { ...this.loggedUser, ..._update_data };
    }
    resetLoggedUser() {
        this.loggedUser = {};
        this.removeAllListeners();
    }
    get getLoggedUserKey() {
        let userToReturn = null;
        // patch from users
        if (this.users.length > 0) {
            const usersItem = this.users.filter(
                (user) => user.uid === this.loggedUser.uid
            )[0];
            userToReturn = usersItem;
        }

        return userToReturn ? userToReturn.key : null;
    }

    // --- Accounts ------------------------------------------------------------------------
    // loadAllAccounts(_successCallback) {
    //     base.fetch("accounts", {
    //         context: this,
    //         asArray: true,
    //         then(accountsData) {
    //             if (typeof _successCallback === "function")
    //                 _successCallback(accountsData);
    //         }
    //     });
    // }

    // Users
    loadAllUsers() {
        return new Promise(async (resolve, reject) => {
            base.fetch("users", {
                context: this,
                asArray: true,
            })
                .then((usersData) => {
                    resolve(usersData);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    bindUsersCollection() {
        this.flag_bindUsersCollection = base.listenTo("users", {
            context: this,
            asArray: true,
            then(usersData) {
                //console.info("bind usersData", usersData);
                this.updateAllUsers(usersData);
            },
        });
    }

    unbindUsersCollection() {
        if (typeof this.flag_bindUsersCollection === "function")
            this.flag_bindUsersCollection();
    }
    get getAllUsers() {
        //console.log("getAllUsers");
        return this.users;
    }
    updateAllUsers(_data) {
        // console.info("updateAllUsers BEFORE PATCH _data", _data);
        _data = this.patchUsersData(_data);
        // console.info("updateAllUsers AFTER PATCH _data", _data);
        this.users = _data;

        this.fireCallback("users_updated");
    }
    patchUsersData(_data) {
        let tempData = JSON.parse(JSON.stringify(_data));
        tempData.map((_element) => {
            delete _element.providerData;

            // _element.media = _element.media
            //     ? this.getMediaByKeys(_element.media)
            //     : null;
            // _element.thumbnail = _element.thumbnail
            //     ? this.getMediaByKeys([_element.thumbnail])[0]
            //     : null;
            if (!_element.score) _element.score = 0;
            config.RANKS.map((rank) => {
                if (_element.score >= rank.from && _element.score < rank.to) {
                    _element.rank = rank;
                }
                return true;
            });
        });
        return tempData;
    }
    get getAllUsersLength() {
        return this.users.length;
    }
    getUserByKeys(_keys) {
        //console.info("getUserByKeys _keys", _keys);
        const toReturn = this.users.filter((_user) => {
            //console.log("typeof = " + typeof _media);
            if (typeof _user !== "string") {
                return _keys.includes(_user.key);
            } else {
                // string
                return _keys.includes(_user);
            }
        });
        // console.info("getUserByKeys toReturn", toReturn);
        return toReturn;
    }

    // --- Examples ---

    // --- Modal functions ------------------------------------------
    showModalByKey = (_key, _payload) => {
        //console.log("showModalByKey(" + _key + ")");
        if (!this.openModals.includes(_key)) {
            this.openModals.push(_key);
        }
        //console.info("showModalByKey this.openModals", this.openModals);

        //console.info("showModalByKey this.modalListeners", this.modalListeners);
        this.modalListeners.map((listener) => {
            if (
                listener.key === _key &&
                typeof listener.listener === "function"
            )
                listener.listener("show", _payload);
            return false;
        });
    };
    hideModalByKey = (_key) => {
        //console.log("hideModalByKey(" + _key + ")");
        if (this.openModals.includes(_key)) {
            this.openModals.splice(this.openModals.indexOf(_key), 1);
        }
        //console.info("hideModalByKey this.openModals", this.openModals);

        //this._info("hideModalByKey this.modalListeners", this.modalListeners);
        this.modalListeners.map((listener) => {
            if (
                listener.key === _key &&
                typeof listener.listener === "function"
            )
                listener.listener("hide");
            return false;
        });
    };
    get getAllModals() {
        //console.log("getAllModals");
        return this.openModals;
    }
    registerModalListener(_key, _listener) {
        this._info("registerModalListener _key", _key, "_listener", _listener);
        this.modalListeners.push({
            key: _key,
            listener: _listener,
        });
    }
    unregisterModalListener(_key) {
        //console.info("unregisterModalListener _key", _key);
        const filteredListeners = this.modalListeners.filter(
            (listener) => listener.key !== _key
        );
        this.modalListeners = filteredListeners;
    }
    // getAllModals = computedFn(function getModals(_key) {
    //     const results = JSON.parse(JSON.stringify(this.modals));
    //     console.info("getAllModals results", results);
    //     return results;
    // });

    humanFileSize = (bytes) => {
        var thresh = 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + " B";
        }
        var units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + " " + units[u];
    };
}

// declare a clone in window.store so we can monitor the store from the console
var store = (window.store = new AppStore());

export default store;
