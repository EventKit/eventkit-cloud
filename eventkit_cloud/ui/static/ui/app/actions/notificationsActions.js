import axios from 'axios';
import actions from './actionTypes';

export function getNotifications(args = {}) {
    return (dispatch) => {
        // const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_NOTIFICATIONS,
            // cancelSource: cancelSource,
        });

        const pageSize = args.pageSize || 10;
        const page = args.page || 1;

        ////////////////////////
        // MOCK
        const now = new Date();
        const response = {
            data: [
                {
                    uid: 11,
                    read: false,
                    type: 'datapack-complete-success',
                    date: new Date().setDate(now.getDate() - 5),
                    data: {
                        run: {
                            uid: 3,
                            job: {
                                uid: 3,
                                name: 'A',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 10,
                    read: true,
                    type: 'datapack-complete-error',
                    date: new Date().setHours(now.getHours() - 5),
                    data: {
                        run: {
                            uid: 2,
                            job: {
                                uid: 2,
                                name: 'B',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 9,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setHours(now.getDate() - 4),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 8,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setHours(now.getDate() - 3),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 7,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setHours(now.getDate() - 2),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 6,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setHours(now.getDate() - 1),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 5,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setMinutes(now.getMinutes() - 55),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 4,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setMinutes(now.getMinutes() - 50),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 3,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setMinutes(now.getMinutes() - 45),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 2,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setSeconds(now.getSeconds() - 55),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
                {
                    uid: 1,
                    read: true,
                    type: 'datapack-complete-success',
                    date: new Date().setSeconds(now.getSeconds() - 30),
                    data: {
                        run: {
                            uid: 1,
                            job: {
                                uid: 1,
                                name: 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
                            },
                            expiration: new Date(2018, 5, 1),
                        },
                    },
                },
            ]
        };

        setTimeout(() => {
            dispatch({
                type: actions.RECEIVED_NOTIFICATIONS,
                notifications: response.data,
                nextPage: false,
                range: '5/5',
            });
        }, 100);
        ///////////////////////

        // return axios({
        //     url: `/api/user/notifications&page_size=${pageSize}`,
        //     method: 'GET',
        //     // cancelToken: cancelSource.token,
        // }).then((response) => {
        //     let nextPage = false;
        //     let links = [];
        //
        //     if (response.headers.link) {
        //         links = response.headers.link.split(',');
        //     }
        //     for (const i in links) {
        //         if (links[i].includes('rel="next"')) {
        //             nextPage = true;
        //         }
        //     }
        //     let range = '';
        //     if (response.headers['content-range']) {
        //         range = response.headers['content-range'].split('-')[1];
        //     }
        //
        //     dispatch({
        //         type: actions.RECEIVED_NOTIFICATIONS,
        //         payload: response.data,
        //         nextPage,
        //         range,
        //     });
        // }).catch((error) => {
        //     if (axios.isCancel(error)) {
        //         console.log(error.message);
        //     } else {
        //         dispatch({
        //             type: actions.FETCH_NOTIFICATIONS_ERROR,
        //             error: error.response.data,
        //         });
        //     }
        // });
    };
}

export function markNotificationsAsRead(notifications) {
    return (dispatch) => {
        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_READ,
            notifications,
        });

        //////////////////////////
        // MOCK
        setTimeout(() => {
            dispatch({
                type: actions.MARKED_NOTIFICATIONS_AS_READ,
                notifications,
            });
        }, 100);
        //////////////////////////
    };
}

export function markNotificationsAsUnread(notifications) {
    return (dispatch) => {
        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_UNREAD,
            notifications,
        });

        //////////////////////////
        // MOCK
        setTimeout(() => {
            dispatch({
                type: actions.MARKED_NOTIFICATIONS_AS_UNREAD,
                notifications,
            });
        }, 100);
        //////////////////////////
    };
}

export function markAllNotificationsAsRead() {
    return (dispatch) => {
        dispatch({
            type: actions.MARKING_ALL_NOTIFICATIONS_AS_READ,
        });

        //////////////////////////
        // MOCK
        setTimeout(() => {
            dispatch({
                type: actions.MARKED_ALL_NOTIFICATIONS_AS_READ,
            });
        }, 100);
        //////////////////////////
    }
}

export function removeNotifications(notifications) {
    return (dispatch) => {
        dispatch({
            type: actions.REMOVING_NOTIFICATIONS,
            notifications,
        });

        //////////////////////////
        // MOCK
        setTimeout(() => {
            dispatch({
                type: actions.REMOVED_NOTIFICATIONS,
                notifications,
            });
        }, 100);
        //////////////////////////
    };
}

export function getNotificationsUnreadCount() {
    return (dispatch) => {
        dispatch({
            type: actions.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
        });

        //////////////////////////
        // MOCK
        setTimeout(() => {
            dispatch({
                type: actions.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
                unreadCount: 1,
            });
        }, 100);
        //////////////////////////
    }
}
