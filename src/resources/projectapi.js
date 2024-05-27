let OriginApiUrl = "https://projects.penguinmod.com";
OriginApiUrl = "http://localhost:8080";

import JSZip from "jszip";
import { Project } from "./project.protobuf.js";
import Pbf from "./pbf.js";

class ProjectApi {
    constructor(token, username) {
        this.token = token;
        this.username = username;
    }

    static OriginApiUrl = OriginApiUrl;
    static CachedDonators = {};

    static getServerInfo(user) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/misc/getStats`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((stats) => {
                        resolve(stats);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    static getUserBadges(user) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getBadges?username=${user}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((badges) => {
                        resolve(badges);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    static getFollowerCount(user) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/meta/getfollowercount?username=${user}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.text().then((count) => {
                        resolve(Number(count));
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    static getProfile(user, includeBio) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/profile?username=${user}${includeBio ? '&bio=true' : ''}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((profile) => {
                        resolve(profile);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    static async isDonator(user) {
        if (user in ProjectApi.CachedDonators) {
            return ProjectApi.CachedDonators[user];
        }
        const badges = await ProjectApi.getUserBadges(user);
        ProjectApi.CachedDonators[user] = badges.includes('donator');
        return badges.includes('donator');
    }
    static getProjects(page, oldFirst) {
        return new Promise((resolve, reject) => {
            const reverseParam = oldFirst ? '&reverse=true' : '';
            const url = `${OriginApiUrl}/api/v1/projects/getprojects?page=${page}${reverseParam}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projectList) => {
                        resolve(projectList.projects);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * @deprecated Cannot be used statically anymore.
     */
    static getUnapprovedProjects() {
        throw new Error("Unapproved Projects can only be viewed in a client")
    }

    /**
     * @param {string} user username
     * @param {number} page page
     * @returns Array of projects
     */
    static getUserProjects(user, page) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getprojectsbyauthor?page=${page}&authorUsername=${user}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projectList) => {
                        resolve(projectList);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    
    static getFrontPage() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/frontpage`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((info) => {
                        resolve(info);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    static getProjectMeta(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getproject?projectID=${id}&requestType=metadata`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((project) => {
                        resolve(project);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    static getProjectRemixes(id, page=0) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getremixes?id=${id}&page=${page}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projectList) => {
                        resolve(projectList.projects);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    // TODO: make this convert the pbf to a pmp
    static getProjectFile(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getprojectwrapper?projectId=${id}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.arrayBuffer().then((blob) => {
                        resolve(blob);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    setToken(p) {
        this.token = p;
    }
    setUsername(u) {
        this.username = u;
    }
    setAdmin(bool) {
        this.admin = bool;
    }

    getAllPermitedUsers() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getmods?username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((users) => {
                        resolve(users);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    isAdmin() {
        return this.admin;
    }
    isDonator() {
        return ProjectApi.isDonator(this.username);
    }

    getMyProjects(page) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getmyprojects?page=${page}&username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then(resolve);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getMyFeed(page) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getMyFeed?page=${page}&username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((feedList) => {
                        const feed = feedList.feed;
                        resolve(feed);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getMyMessages(page) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getmessages?page=${page}&username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((messageList) => {
                        resolve(messageList.messages);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    getMessageCount() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getmessagecount?username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((count) => {
                        resolve(count.count);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    getUnreadMessageCount() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getunreadmessagecount?username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((count) => {
                        resolve(count.count);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    isFollowingUser(username, returnRawInfo) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/isfollowing?username=${this.username}&target=${username}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((info) => {
                        if (returnRawInfo) return resolve(info);
                        resolve(info.following);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    toggleFollowingUser(username, toggle) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                target: username,
                toggle
            };
            const url = `${OriginApiUrl}/api/v1/users/follow`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then(() => {
                        resolve();
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    readMessage(id) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                messageID: id
            };
            if (typeof id !== 'string') {
                reject();
                return;
            }
            const url = `${OriginApiUrl}/api/v1/users/markMessageAsRead`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then(() => {
                        resolve();
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    markAllMessagesAsRead() {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token
            };
            const url = `${OriginApiUrl}/api/v1/users/markAllMessagesAsRead`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then(() => {
                        resolve();
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    disputeMessage(id, text) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                messageID: id,
                dispute: text
            };
            const url = `${OriginApiUrl}/api/v1/projects/dispute`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then(() => {
                        resolve();
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    
    getReports(type, userOrId) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/${type}s/getReports?target=${userOrId}&username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((reports) => {
                        resolve(reports);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getTypeWithReports(type) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/${type}s/getContentWithReports?username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((reports) => {
                        resolve(reports);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    closeReports(type, idOrName, reporter) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                id: idOrName,
                target: reporter
            };
            const url = `${OriginApiUrl}/api/${type}s/deleteReports`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getRejectedProjectFile(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/projects/downloadRejected?id=${id}&approver=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.arrayBuffer().then((arrayBuffer) => {
                        resolve(arrayBuffer);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    restoreRejectedProject(id) {
        return new Promise((resolve, reject) => {
            const data = {
                approver: this.username,
                token: this.token,
                id
            };
            const url = `${OriginApiUrl}/api/projects/restoreRejected`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    deleteRejectedProject(id) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                projectID: id
            };
            const url = `${OriginApiUrl}/api/v1/projects/hardDeleteProject`;
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    getProfanityFilter() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/users/getProfanityList?username=${this.username}&token=${this.token}`;
            fetch(url)
                .then((res) => {
                    res.json().then(json => {
                        if (!res.ok) {
                            reject(json.error);
                            return;
                        }
                        resolve(json);
                    }).catch(err => {
                        reject(err);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    setProfanityFilter(newData) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/users/setProfanityList`;
            const data = {
                user: this.username,
                token: this.token,
                json: newData
            };
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            })
                .then((res) => {
                    res.json().then(json => {
                        if (!res.ok) {
                            reject(json.error);
                            return;
                        }
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    setUserBadges(target, badges) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                badges,
                target
            };
            fetch(`${OriginApiUrl}/api/users/setBadges`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    banUser(username, reason) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                target: username,
                reason,
                toggle: true,
            };
            fetch(`${OriginApiUrl}/api/v1/users/ban`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    unbanUser(username, reason) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                target: username,
                reason
            };
            fetch(`${OriginApiUrl}/api/users/unban`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    reportContent(type, nameOrId, reason) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/${type}s/report?username=${this.username}&token=${this.token}&target=${nameOrId}&reason=${reason}`).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    assingUsersPermisions(username, admin, approver) {
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/users/assignPossition?username=${this.username}&token=${this.token}&target=${username}&admin=${admin}&approver=${approver}`).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    setErrorAllGetProjects(enabled) {
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/errorAllProjectRequests?username=${this.username}&token=${this.token}&enabled=${enabled}`).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    setErrorAllUploadProjects(enabled) {
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/errorAllProjectUploads?username=${this.username}&token=${this.token}&enabled=${enabled}`).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        });
    }
    deleteProject(id) {
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/projects/delete?token=${this.token}&approver=${this.username}&id=${id}`).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    rejectProject(id, reason) {
        const data = {
            token: this.token,
            username: this.username,
            project: id,
            message: reason,
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/softreject`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    attemptRankUp() {
        const data = {
            token: this.token,
            username: this.username
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/users/requestrankup`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    setBio(text, adminForced, adminTarget) {
        const data = {
            username: this.username,
            token: this.token,
            bio: text,
            target: adminTarget,
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/users/${adminForced ? 'setUserBioAdmin' : "setBio"}`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    setMyFeaturedProject(id, title) {
        const data = {
            username: this.username,
            token: this.token,
            id,
            title
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/users/setMyFeaturedProject`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    respondToDispute(messageId, text) {
        const data = {
            token: this.token,
            username: this.username,
            disputeID: messageId,
            message: text,
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/modresponse`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    addMessage(type, target, data) {
        const gdata = {
            token: this.token,
            username: this.username,
            target,
            message: {
                ...data,
                type
            },
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/users/addMessage`, {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gdata),
                method: "POST"
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    updateProject(id, newData) {
        newData.id = id;
        newData.requestor = this.username;
        newData.token = this.token;
        if (typeof newData.newMeta === "object") {
            newData.newMeta = JSON.stringify(newData.newMeta);
        }
        return new Promise((resolve, reject) => {
            fetch(
                `${OriginApiUrl}/api/projects/update`,
                {
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newData),
                    method: "POST"
                }
            ).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }

    jsonToProtobuf(json) {
        function castToString(value) {
            if (typeof value !== "object") {
                return String(value);
            } else {
                return JSON.stringify(value);
            }
        }

        let newjson = {
            targets: [],
            monitors: [],
            extensionData: {},
            extensions: json.extensions,
            extensionURLs: {},
            metaSemver: "",
            metaVm: "",
            metaAgent: ""
        }

        newjson.metaSemver = json.meta.semver;
        newjson.metaVm = json.meta.vm;
        newjson.metaAgent = json.meta.agent;

        for (const target in json.targets) {

            let newtarget = {
                id: json.targets[target].id,
                isStage: json.targets[target].isStage,
                name: json.targets[target].name,
                variables: {},
                lists: {},
                broadcasts: {},
                customVars: [],
                blocks: {},
                comments: {},
                currentCostume: json.targets[target].currentCostume,
                costumes: [],
                sounds: [],
                volume: json.targets[target].volume,
                layerOrder: json.targets[target].layerOrder,
                x: json.targets[target].x,
                y: json.targets[target].y,
                size: json.targets[target].size,
                direction: json.targets[target].direction,
                draggable: json.targets[target].draggable,
                rotationStyle: json.targets[target].rotationStyle,
                tempo: json.targets[target].tempo,
                videoTransparency: json.targets[target].videoTransparency,
                videoState: json.targets[target].videoState,
                textToSpeechLanguage: json.targets[target].textToSpeechLanguage,
                visible: json.targets[target].visible,
            }

            // loop over the variables
            for (const variable in json.targets[target].variables) {
                newtarget.variables[variable] = {
                    name: json.targets[target].variables[variable][0],
                    value: castToString(json.targets[target].variables[variable][1])
                }
            }

            // loop over the lists
            for (const list in json.targets[target].lists) {
                newtarget.lists[list] = {
                    name: list,
                    value: json.targets[target].lists[list].map(x => castToString(x))
                }
            }

            // loop over the broadcasts
            for (const broadcast in json.targets[target].broadcasts) {
                newtarget.broadcasts[broadcast] = json.targets[target].broadcasts[broadcast];
            }

            // loop over the customVars
            for (const customVar in json.targets[target].customVars) {
                newtarget.customVars.push(json.targets[target].customVars[customVar]);
            }

            const blocks = json.targets[target].blocks;
            // loop over the blocks
            for (const block in blocks) {
                newtarget.blocks[block] = {
                    opcode: blocks[block].opcode,
                    next: blocks[block].next,
                    parent: blocks[block].parent,
                    inputs: {},
                    fields: {},
                    shadow: blocks[block].shadow,
                    topLevel: blocks[block].topLevel,
                    x: blocks[block].x,
                    y: blocks[block].y
                }

                if (blocks[block].mutation) {
                    newtarget.blocks[block].mutation = {
                        tagName: blocks[block].mutation.tagName,
                        proccode: blocks[block].mutation.proccode,
                        argumentids: blocks[block].mutation.argumentids,
                        argumentnames: blocks[block].mutation.argumentnames,
                        argumentdefaults: blocks[block].mutation.argumentdefaults,
                        warp: blocks[block].mutation.warp,
                        _returns: blocks[block].mutation.returns,
                        edited: blocks[block].mutation.edited,
                        optype: blocks[block].mutation.optype,
                        color: blocks[block].mutation.color
                    }
                }

                // loop over the inputs
                for (const input in blocks[block].inputs) {
                    newtarget.blocks[block].inputs[input] = JSON.stringify(blocks[block].inputs[input]);
                }

                // loop over the fields
                for (const field in blocks[block].fields) {
                    newtarget.blocks[block].fields[field] = JSON.stringify(blocks[block].fields[field]);
                }
            }

            // loop over the comments
            for (const comment in json.targets[target].comments) {
                newtarget.comments[comment] = {
                    blockId: json.targets[target].comments[comment].blockId,
                    x: json.targets[target].comments[comment].x,
                    y: json.targets[target].comments[comment].y,
                    width: json.targets[target].comments[comment].width,
                    height: json.targets[target].comments[comment].height,
                    minimized: json.targets[target].comments[comment].minimized,
                    text: json.targets[target].comments[comment].text
                }
            }

            // loop over the costumes
            for (const costume in json.targets[target].costumes) {
                newtarget.costumes[costume] = {
                    assetId: json.targets[target].costumes[costume].assetId,
                    name: json.targets[target].costumes[costume].name,
                    bitmapResolution: json.targets[target].costumes[costume].bitmapResolution,
                    rotationCenterX: json.targets[target].costumes[costume].rotationCenterX,
                    rotationCenterY: json.targets[target].costumes[costume].rotationCenterY,
                    md5ext: json.targets[target].costumes[costume].md5ext,
                    dataFormat: json.targets[target].costumes[costume].dataFormat,
                }
            }

            // loop over the sounds
            for (const sound in json.targets[target].sounds) {
                newtarget.sounds[sound] = {
                    assetId: json.targets[target].sounds[sound].assetId,
                    name: json.targets[target].sounds[sound].name,
                    dataFormat: json.targets[target].sounds[sound].dataFormat,
                    rate: json.targets[target].sounds[sound].rate,
                    sampleCount: json.targets[target].sounds[sound].sampleCount,
                    md5ext: json.targets[target].sounds[sound].md5ext
                }
            }

            newjson.targets.push(newtarget);
        }

        // loop over the monitors
        for (const monitor in json.monitors) {
            newjson.monitors.push({
                id: json.monitors[monitor].id,
                mode: json.monitors[monitor].mode,
                opcode: json.monitors[monitor].opcode,
                params: json.monitors[monitor].params,
                spriteName: json.monitors[monitor].spriteName,
                value: String(json.monitors[monitor].value),
                width: json.monitors[monitor].width,
                height: json.monitors[monitor].height,
                x: json.monitors[monitor].x,
                y: json.monitors[monitor].y,
                visible: json.monitors[monitor].visible,
                sliderMin: json.monitors[monitor].sliderMin,
                sliderMax: json.monitors[monitor].sliderMax,
                isDiscrete: json.monitors[monitor].isDiscrete,
            });
        }

        // loop over the extensionData
        for (const extensionData in json.extensionData) {
            newjson.extensionData[extensionData] = castToString(json.extensionData[extensionData]);
        }

        // loop over the extensionURLs
        for (const extensionURL in json.extensionURLs) {
            newjson.extensionURLs[extensionURL] = json.extensionURLs[extensionURL];
        }

        const pbf = new Pbf();
        Project.write(newjson, pbf);
        return pbf.finish();
    }

    uploadProject(data) {
        const username = this.username;
        const token = this.token;
        const title = data.title;
        const instructions = data.instructions;
        const notes = data.notes;
        const remix = data.remix || 0;


        return new Promise(async (resolve, reject) => {
            JSZip.loadAsync(data.project).then(async zip => {
                const projectJSON = JSON.parse(await zip.file("project.json").async("text"))

                const protobuf = this.jsonToProtobuf(projectJSON);

                const assets = [];
                zip.forEach((relativePath, file) => {
                    if (file.dir) return;
                    if (relativePath === "project.json") return;
                    assets.push(file);
                });

                
                const API_ENDPOINT = `${OriginApiUrl}/api/v1/projects/uploadProject?username=${username}&token=${token}&title=${title}&instructions=${instructions}&notes=${notes}&remix=${remix}`;
                const request = new XMLHttpRequest();
                const formData = new FormData();

                request.open("POST", API_ENDPOINT, true);
                request.onload = () => {
                    const response = JSON.parse(request.response);

                    if (response.error) {
                        reject(response.error);
                        return;
                    }

                    resolve(response.id);
                };

                for (let i = 0; i < assets.length; i++) {
                    // convert to blob
                    formData.append("assets", await assets[i].async("blob"), assets[i].name);
                }

                formData.append("jsonFile", new Blob([protobuf]));
                formData.append("thumbnail", data.image);

                request.send(formData);
            });
        });
    }

    approveProject(id, webhook) {
        const url = `${OriginApiUrl}/api/projects/approve?token=${this.token}&approver=${this.username}&webhook=${webhook}&id=${id}`;
        return new Promise((resolve, reject) => {
            fetch(url).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.id);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    featureProject(id, webhook) {
        const url = `${OriginApiUrl}/api/projects/feature?token=${this.token}&approver=${this.username}&webhook=${webhook}&id=${id}`;
        return new Promise((resolve, reject) => {
            fetch(url).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }

    toggleVoteProject(id, type, toggle) {
        type = String(type).toLowerCase().trim();
        switch (type) {
            case 'feature':
            case 'features':
            case 'featured':
            case 'vote':
            case 'voted':
                type = 'vote';
                break;
            case 'love':
            case 'loved':
            case 'like':
            case 'liked':
            case 'likes':
                type = 'love';
                break;
            default:
                type = 'vote';
        }
        const url = `${OriginApiUrl}/api/v1/projects/interactions/${type}Toggle`;
        return new Promise((resolve, reject) => {
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    projectId: id,
                    username: this.username,
                    token: this.token,
                    toggle: toggle
                })
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    getVoteStates(id) {
        const url = `${OriginApiUrl}/api/v1/projects/getuserstatewrapper?username=${this.username}&token=${this.token}&projectId=${id}`;
        return new Promise((resolve, reject) => {
            fetch(url).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve({loved: json.hasLoved, voted: json.hasVoted});
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
}
export default ProjectApi;