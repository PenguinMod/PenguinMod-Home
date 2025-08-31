import { PUBLIC_API_URL, PUBLIC_STUDIO_URL, PUBLIC_MAX_UPLOAD_SIZE } from "$env/static/public";
import pmp_protobuf from "pmp-protobuf";
import JSZip from "jszip";

let OriginApiUrl = PUBLIC_API_URL;

function MB(num) {
    const Kb = num / 1000;
    const Mb = num / 1000000;
    const Gb = num / 1000000000;
    if (Gb >= 1) return `${Gb.toFixed(2)}GB`;
    if (Mb >= 1) return `${Mb.toFixed(2)}MB`;
    if (Kb >= 1) return `${Kb.toFixed(2)}KB`;
    return `${num}B`;
}

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

    static getUsernameById(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/getusername?ID=${id}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((result) => {
                        resolve(result.username);
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
                        resolve(badges.badges);
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
            const url = `${OriginApiUrl}/api/v1/users/profile?target=${user}${includeBio ? '&bio=true' : ''}&username=${localStorage.getItem("username")}&token=${localStorage.getItem("token")}`;
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
    static getProjects(page, oldFirst=false, username="", token="") {
        return new Promise((resolve, reject) => {
            const reverseParam = oldFirst ? '&reverse=true' : '';
            const url = `${OriginApiUrl}/api/v1/projects/getprojects?page=${page}${reverseParam}&username=${username}&token=${token}`;
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
        });
    }

    /**
     * @param {number} page page
     * @param {string} query query for searching projects
     * @param {string} username username of user
     * @param {string} token token of user
     * @returns Array of projects
     */
    static searchProjects(page, searchQuery, username, token, allow_user=false, reverse=false) {
        const query = searchQuery.split(":", 1)[0];
        let api = `${OriginApiUrl}/api/v1/projects/searchprojects?page=${page}&query=${encodeURIComponent(query)}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}&reverse=${reverse}`;
        switch (query) {
            case "user":
                if (allow_user) {
                    const userQuery = searchQuery.split(":");
                    userQuery.shift();
                    api = `${OriginApiUrl}/api/v1/projects/searchusers?page=${page}&query=${encodeURIComponent(userQuery.join())}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
                    break;
                }
                // fallthrough
            case "by":
                const byQuery = searchQuery.split(":");
                byQuery.shift();
                api = `${OriginApiUrl}/api/v1/projects/getprojectsbyauthor?page=${page}&authorUsername=${encodeURIComponent(byQuery.join())}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
                break;
            case "remixes":
                const projectID = searchQuery.split(":");
                projectID.shift();
                return ProjectApi.getProjectRemixes(projectID, page, username, token);
            case "featured":
            case "newest":
            case "views":
            case "votes":
            case "loves":
                const actual_query = searchQuery.split(":");
                actual_query.shift();
                api = `${OriginApiUrl}/api/v1/projects/searchprojects?page=${page}&query=${encodeURIComponent(actual_query.join())}&type=${query}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}&reverse=${reverse}`;
                break;
            default:
                break;
        }

        return new Promise((resolve, reject) => {
            fetch(api)
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
                    console.error(err);
                    reject(err);
                });
        });
    }

    getRemovedProjects() {
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
    
    async getFrontPage() {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/frontpage?username=${this.username}&token=${this.token}`; // so mods can see ALL!!!!!!!!!!!!!
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

    static getProjectThumbnail(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getproject?projectID=${id}&requestType=thumbnail`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.blob().then(resolve);
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }

    static getProjectRemixes(id, page=0, username, token) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getremixes?projectID=${id}&page=${page}&username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`;
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

    static getProjectFile(id) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getprojectwrapper?projectId=${id}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    return res.json();
                })
                .then((res) => {
                    const blob = new Uint8Array(res.project.data);
                    const assets = []
                    for (const asset of res.assets) {
                        assets.push({
                            id: asset.id,
                            buffer: new Uint8Array(asset.buffer.data).buffer
                        });
                    }
                    return pmp_protobuf.protobufToPMP(blob, assets);
                })
                .then((arrayBuffer) => {
                    resolve(arrayBuffer);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    async downloadHardRejectedProject(id) {
        return new Promise(((resolve, reject) => {
            const params = `project=${id}&username=${this.username}&token=${this.token}`;
            const url = `${OriginApiUrl}/api/v1/projects/downloadHardReject?${params}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    return res.json();
                })
                .then(((res) => {
                    const blob = new Uint8Array(res.project.data);
                    const assets = []
                    for (const asset of res.assets) {
                        assets.push({
                            id: asset.id,
                            buffer: new Uint8Array(asset.buffer.data).buffer
                        });
                    }
                    return pmp_protobuf.protobufToPMP(blob, assets);
                }).bind(this))
                .then((arrayBuffer) => {
                    resolve(arrayBuffer);
                })
                .catch((err) => {
                    reject(err);
                });
        }).bind(this))
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
                        const mods = users.mods;
                        const url = `${OriginApiUrl}/api/v1/users/getadmins?username=${this.username}&token=${this.token}`;
                        fetch(url)
                            .then((res) => {
                                if (!res.ok) {
                                    res.text().then(reject);
                                    return;
                                }
                                res.json().then((users) => {
                                    const admins = users.admins;
                                    resolve({ mods, admins });
                                });
                            })
                            .catch((err) => {
                                reject(err);
                            });
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
                    res.json().then((projectList) => {
                        resolve(projectList);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getUserProjects(user, page) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/projects/getprojectsbyauthor?page=${page}&authorUsername=${user}&username=${this.username}&token=${this.token}`;
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

    isFollowing(username, target, raw) {
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/users/isfollowing?username=${username}&target=${target}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((info) => {
                        if (raw) return resolve(info);
                        resolve(info.following);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    isFollowingUser(username, returnRawInfo) {
        return this.isFollowing(this.username, username, returnRawInfo);
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
    
    getReports(type, userOrId, page=0) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/reports/getReportsByTarget?target=${userOrId}&username=${this.username}&token=${this.token}&page=${page}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((reports) => {
                        resolve(reports.reports);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    getTypeWithReports(type, page) {
        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            const url = `${OriginApiUrl}/api/v1/reports/getReports?username=${this.username}&token=${this.token}&type=${type}&page=${page}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((reports) => {
                        resolve(reports.reports);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    closeReport(id) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                reportID: id
            };
            const url = `${OriginApiUrl}/api/v1/reports/deleteReport`;
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

    restoreRejectedProject(id) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                project: id
            };
            const url = `${OriginApiUrl}/api/v1/projects/restore`;
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
            const url = `${OriginApiUrl}/api/v1/misc/getProfanityList?username=${this.username}&token=${this.token}`;
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
            const url = `${OriginApiUrl}/api/v1/misc/setProfanityList`;
            const data = {
                username: this.username,
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
            fetch(`${OriginApiUrl}/api/v1/users/setBadges`, {
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
    setUsersBadges(targets, badges, optIsRemoving) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                targets,
                badges,
                removing: optIsRemoving
            };
            fetch(`${OriginApiUrl}/api/v1/users/setbadgesmultiple`, {
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
    banUser(username, reason, time, toggle) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                token: this.token,
                target: username,
                reason,
                toggle: toggle,
                time,
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
    reportContent(type, nameOrId, reason) {
        const body = {
            username: this.username,
            token: this.token,
            report: reason,
            target: nameOrId,
            type
        }

        if (type !== "project" && type !== "user") throw new Error('Invalid reporting type');
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/reports/sendReport`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
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
    assingUsersPermisions(username, admin, approver) {
        return new Promise((resolve, reject) => {
            const body = {
                username: this.username,
                token: this.token,
                target: username,
                admin,
                approver
            }
            fetch(`${OriginApiUrl}/api/v1/users/assignPossition`, {
                method:"POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body:JSON.stringify(body)
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

    setErrorAllGetProjects(enabled) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                username: this.username,
                token: this.token,
                toggle: enabled
            })
            fetch(`${OriginApiUrl}/api/v1/projects/toggleviewing`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
    setErrorAllUploadProjects(enabled) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                username: this.username,
                token: this.token,
                toggle: enabled
            })
            fetch(`${OriginApiUrl}/api/v1/projects/toggleuploading`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
    setErrorAccountCreation(enabled) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify({
                username: this.username,
                token: this.token,
                toggle: enabled
            })
            fetch(`${OriginApiUrl}/api/v1/projects/toggleaccountcreation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
    
    deleteProject(id, reason) {
        const body = JSON.stringify({
            projectID: id,
            username: this.username,
            token: this.token,
            reason
        })

        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/hardDeleteProject`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
    
    removeProjectThumbnail(id) {
        const body = JSON.stringify({
            projectID: String(id),
            token: this.token
        })

        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/deletethumb`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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

    hardRejectProject(id, reason) {
        const data = {
            token: this.token,
            username: this.username,
            project: id,
            message: reason,
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/hardreject`, {
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
            fetch(`${OriginApiUrl}/api/v1/users/${adminForced ? 'setBioAdmin' : "setBio"}`, {
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
            project: id,
            title
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/users/setmyfeaturedproject`, {
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
    filloutSafetyDetails(birthday, country) {
        const data = {
            username: this.username,
            token: this.token,
            birthday,
            country
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/users/filloutSafetyDetails`, {
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
    sendModeratorMessage(target, text, disputable) {
        const data = {
            token: this.token,
            username: this.username,
            target,
            message: text,
            disputable
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/modmessage`, {
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
    deleteModeratorMessage(messageID) {
        const data = {
            username: this.username,
            token: this.token,
            messageID,
        };
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/deletemodmessage`, {
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
    updateProject(id, data) {
        const username = this.username;
        const token = this.token;
        const title = data.newMeta.title;
        const instructions = data.newMeta.instructions;
        const notes = data.newMeta.notes;

        return new Promise(async (resolve, reject) => {

            if (!data.project) {
                const API_ENDPOINT = `${OriginApiUrl}/api/v1/projects/updateProject`;
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

                formData.append("username", username);
                formData.append("token", token);
                formData.append("title", title);
                formData.append("instructions", instructions);
                formData.append("notes", notes);
                formData.append("projectID", id);

                if (data.image) {
                    formData.append("thumbnail", data.image);
                }

                request.send(formData);
                return;
            }

            JSZip.loadAsync(data.project).then(async zip => {
                // TODO: change the pmp-protobuf library to have a like PMPToParts
                const projectJSON = JSON.parse(await zip.file("project.json").async("text"))

                const protobuf = pmp_protobuf.jsonToProtobuf(projectJSON);

                const assets = [];
                zip.forEach((relativePath, file) => {
                    if (file.dir) return;
                    if (relativePath === "project.json") return;
                    assets.push(file);
                });
                
                const API_ENDPOINT = `${OriginApiUrl}/api/v1/projects/updateProject`;
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

                formData.append("username", username);
                formData.append("token", token);
                formData.append("title", title);
                formData.append("instructions", instructions);
                formData.append("notes", notes);
                formData.append("projectID", id);

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

    resolveProjectSizes(file, imageSize = 0) {
        return JSZip.loadAsync(file)
            .then(async zip => {
                const projectJSON = JSON.parse(await zip.file("project.json").async("text"));
                let protobuf = pmp_protobuf.jsonToProtobuf(projectJSON);

                const projectSize = protobuf.length;
                const targets = projectJSON.targets;

                projectJSON.targets = [];
                protobuf = pmp_protobuf.jsonToProtobuf(projectJSON);
                const metaSize = pmp_protobuf.jsonToProtobuf(projectJSON).length;

                const assets = (await Promise.all(zip
                    .filter((name, file) => 
                            !file.dir && 
                            name !== 'project.json')
                    .map(async file => [await file.async('blob'), file.name])))
                    .reduce((c,v) => (c[v[1]] = v[0], c), {});

                const statTree = [];
                for (const target of targets) {
                    projectJSON.targets[0] = target;
                    const costumes = target.costumes
                        .map(asset => [asset.name, assets[asset.md5ext]]);
                    const sounds = target.sounds
                        .map(asset => [asset.name, assets[asset.md5ext]]);

                    const totalCodeSize = pmp_protobuf.jsonToProtobuf(projectJSON).length - metaSize;

                    const original_target = projectJSON.targets[0];

                    projectJSON.targets[0] = {
                        isStage: false,
                        name: "",
                        variables: {},
                        lists: {},
                        broadcasts: {},
                        customVars: [],
                        blocks: {},
                        comments: {},
                        currentCostume: 0,
                        costumes: [],
                        sounds: [],
                        id: "",
                        volume: 0,
                        layerOrder: 0,
                        tempo: 0,
                        videoTransparency: 0,
                        videoState: "",
                        textToSpeechLanguage: null,
                        visible: false,
                        x: 0,
                        y: 0,
                        size: 0,
                        direction: 0,
                        draggable: false,
                        rotationStyle: "",
                        extensionData: {}
                    };

                    const emptySize = pmp_protobuf.jsonToProtobuf(projectJSON).length;

                    projectJSON.targets[0].blocks = original_target.blocks;

                    const blockSize = pmp_protobuf.jsonToProtobuf(projectJSON).length - emptySize;

                    projectJSON.targets[0].blocks = {};
                    projectJSON.targets[0].variables = original_target.variables;

                    const variableSize = pmp_protobuf.jsonToProtobuf(projectJSON).length - emptySize;

                    projectJSON.targets[0].variables = {};
                    projectJSON.targets[0].lists = original_target.lists;

                    const listSize = pmp_protobuf.jsonToProtobuf(projectJSON).length - emptySize;

                    projectJSON.targets[0] = original_target;

                    const costumeSize = costumes.reduce((c,v) => c + v[1].size, 0);
                    const soundSize = sounds.reduce((c,v) => c + v[1].size, 0);
                    const size = totalCodeSize
                        + costumeSize
                        + soundSize;
                    
                    statTree.push({
                        name: `${target.name}: ${MB(size)}`,
                        value: [
                            {
                                name: `code: ${MB(totalCodeSize)}`,
                                value: [
                                    `blocks: ${MB(blockSize)}`,
                                    `variables: ${MB(variableSize)}`,
                                    `lists: ${MB(listSize)}`
                                ]
                            },
                            {
                                name: `costumes: ${MB(costumeSize)}`,
                                value: costumes.map(([name, asset]) => `${name}: ${MB(asset.size)}`)
                            },
                            {
                                name: `sounds: ${MB(soundSize)}`,
                                value: sounds.map(([name, asset]) => `${name}: ${MB(asset.size)}`)
                            }
                        ]
                    })
                }

                const size = Object.values(assets)
                    .reduce((c,v) => c + v.size, projectSize);

                const max_size = PUBLIC_MAX_UPLOAD_SIZE * ((await this.isDonator()) ? 1.75 : 1);

                let extraAssetsSize = 0
                if (zip.files['extraAssets/']) {
                    extraAssetsSize = await (zip
                        .filter((name, file) => !file.dir && name.startsWith('extraAssets/')))
                        .reduce(async (o, v) => await o + (await v.async('blob')).size, 0)
                }

                let returns = [
                    {
                        name: `${MB(size)}/${max_size}MB`,
                        value: [
                            `thumbnail: ${MB(imageSize)}`,
                            {
                                name: `project: ${MB(size-extraAssetsSize)}`,
                                value: statTree
                            }
                        ]
                    }, 
                    size > (Number(max_size) * 1024 * 1024)
                ];
                if (extraAssetsSize > 0) {
                    returns[0].value.push(`extra assets: ${MB(extraAssetsSize)}`)
                }
                return returns;
            });
    }
    // TODO: move this into the pmp-protobuf library
    handleProjectFile(file, imageSize = 0) {
        return JSZip.loadAsync(file)
            .then(async zip => {
                const projectJSON = JSON.parse(await zip.file("project.json").async("text"));
                const protobuf = new Blob([pmp_protobuf.jsonToProtobuf(projectJSON)]);

                const assets = await Promise.all(zip
                    .filter((name, file) => 
                            !file.dir && 
                            name !== 'project.json')
                    .map(async file => [await file.async('blob'), file.name]));
                
                const size = assets.reduce((c,v) => c + v[0].size, protobuf.size + imageSize);
                if (size > (Number(PUBLIC_MAX_UPLOAD_SIZE) * ((await this.isDonator()) ? 1.75 : 1) * 1024 * 1024)) 
                    throw 'ProjectTooLarge';
    
                return { protobuf, assets };
            });
    }

    uploadProject(data) {
        const username = this.username;
        const token = this.token;
        const title = data.title;
        const instructions = data.instructions;
        const notes = data.notes;
        const remix = data.remix || 0;

        return new Promise(async (resolve, reject) => {
            const { protobuf, assets } = await this.handleProjectFile(data.project, data.image.size)
                .catch(err => {
                    reject(err);
                    return { protobuf: null, assets: [] };
                });
            if (!protobuf) return;

            const API_ENDPOINT = `${OriginApiUrl}/api/v1/projects/uploadProject`;
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

            formData.append("username", username);
            formData.append("token", token);
            formData.append("title", title);
            formData.append("instructions", instructions);
            formData.append("notes", notes);
            formData.append("remix", remix);
            assets.forEach(ent => formData.append("assets", ...ent))
            formData.append("jsonFile", protobuf);
            formData.append("thumbnail", data.image);

            console.debug(formData.getAll("assets"))

            request.send(formData);
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
    featureProject(id, value) {
        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            projectID: id,
            toggle: value,
        });
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/manualfeature`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }
    setCanBeFeatured(id, value) {
        const body = JSON.stringify({
            token: this.token,
            projectID: id,
            toggle: value,
        });
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/projects/setCanBeFeatured`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
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

    setLastPolicyUpdate(policies) {
        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            types: policies
        });
        return new Promise((resolve, reject) => {
            fetch(`${OriginApiUrl}/api/v1/misc/setLastPolicyUpdate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    getLastPolicyUpdate() {
        const url = `${OriginApiUrl}/api/v1/misc/getLastPolicyUpdate`
        return new Promise((resolve, reject) => {
            fetch(url).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    markPolicyAsRead(policy) {
        let url;
        switch (policy) {
            case "TOS":
                url = `${OriginApiUrl}/api/v1/misc/markTOSAsRead`;
                break;
            case "privacyPolicy":
                url = `${OriginApiUrl}/api/v1/misc/markPrivacyPolicyAsRead`;
                break;
            case "guidelines":
                url = `${OriginApiUrl}/api/v1/misc/markGuidelinesAsRead`;
                break;
            default:
                throw new Error("Invalid policy type");
        }

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: this.username,
                    token: this.token
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
        });
    }

    updatePrivateProfile(privateProfile, privateToFollowing) {
        const url = `${OriginApiUrl}/api/v1/users/privateProfile`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            privateProfile,
            privateToFollowing
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    ipBanUser(username, toggle) {
        const url = `${OriginApiUrl}/api/v1/users/banuserip`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            target: username,
            toggle
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    deleteUserAccount(username, reason) {
        const url = `${OriginApiUrl}/api/v1/users/deleteaccount`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            target: username,
            reason,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    getConnectedIPs(username) {
        const url = `${OriginApiUrl}/api/v1/users/getAllIPs`

        const query = `?username=${this.username}&token=${this.token}&target=${username}`;

        return new Promise((resolve, reject) => {
            fetch(url + query).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.ips);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    getConnectedUsers(ip) {
        const url = `${OriginApiUrl}/api/v1/users/getAllAccountsWithIP`

        const query = `?username=${this.username}&token=${this.token}&target=${ip}`;

        return new Promise((resolve, reject) => {
            fetch(url + query).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.users);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    getAlts(target_username) {
        const url = `${OriginApiUrl}/api/v1/users/getAlts`

        const query = `?username=${this.username}&token=${this.token}&target=${target_username}`;

        return new Promise((resolve, reject) => {
            fetch(url + query).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.alts);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    banIP(ip, toggle) {
        const url = `${OriginApiUrl}/api/v1/users/banip`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            targetIP: ip,
            toggle
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    setNewUsername(newName) {
        const url = `${OriginApiUrl}/api/v1/users/changeUsername`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            newUsername: newName,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }
    setUsernameOfUser(targetUsername, newName) {
        const url = `${OriginApiUrl}/api/v1/users/changeusernameadmin`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            target: targetUsername,
            newUsername: newName,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }
    setPFP(file) {
        return new Promise((resolve, reject) => {
            const API_ENDPOINT = `${OriginApiUrl}/api/v1/users/setpfp?username=${this.username}&token=${this.token}`;
            const request = new XMLHttpRequest();
            const formData = new FormData();

            request.open("POST", API_ENDPOINT, true);
            request.onload = () => {
                const response = JSON.parse(request.response);

                if (response.error) {
                    reject(response.error);
                    return;
                }

                resolve();
            };

            formData.append("picture", new Blob([file]));

            request.send(formData);
        });
    }
    setPFPOfUser(target, file) {
        return new Promise((resolve, reject) => {
            const API_ENDPOINT = `${OriginApiUrl}/api/v1/users/setpfpadmin`;
            const request = new XMLHttpRequest();
            const formData = new FormData();

            request.open("POST", API_ENDPOINT, true);
            request.onload = () => {
                const response = JSON.parse(request.response);

                if (response.error) {
                    reject(response.error);
                    return;
                }

                resolve();
            };

            formData.append("username", this.username);
            formData.append("token", this.token);
            formData.append("target", target);
            formData.append("picture", new Blob([file]));

            request.send(formData);
        });
    }

    updateEmail(email) {
        const url = `${OriginApiUrl}/api/v1/users/setEmail`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            email
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    removeOAuthMethod(method) {
        const url = `${OriginApiUrl}/api/v1/users/removeoauthmethod`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            method
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
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
        });
    }

    block(user, active) {
        const url = `${OriginApiUrl}/api/v1/users/blockuser`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            target: user,
            active,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body
            }).then(res => {
                res.json().then(() => {
                    resolve();
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    checkIfBlocked(user) {
        const url = `${OriginApiUrl}/api/v1/users/hasblocked?username=${this.username}&token=${this.token}&target=${user}`;

        return new Promise((resolve, reject) => {
            fetch(url).then(res => {
                res.json().then(json => {
                    resolve(json.has_blocked);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    registerView(projectID) {
        const url = `${OriginApiUrl}/api/v1/projects/interactions/registerView`;

        // ?username=${this.username}&token=${this.token}&projectID=${projectID}

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            projectID,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body
            }).then(res => {
                res.json().then(json => {
                    resolve(json.success);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }

    putOnWatchlist(target, enabled) {
        const url = `${OriginApiUrl}/api/v1/users/putonwatchlist`;

        const body = JSON.stringify({
            username: this.username,
            token: this.token,
            target,
            enabled,
        });

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body
            }).then(res => {
                res.json().then(json => {
                    resolve(json.success);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        });
    }
}
export default ProjectApi;
