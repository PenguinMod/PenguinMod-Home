class ProjectApi {
    constructor(pv, username) {
        this.privateCode = pv;
        this.username = username;
    }

    static getProjects(page, oldFirst) {
        return new Promise((resolve, reject) => {
            const reverseParam = oldFirst ? '&reverse=true' : '';
            const url = `https://projects.penguinmod.site/api/projects/getApproved?page=${page}${reverseParam}`;
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
    static getMaxProjects(count, onlyFeatured, hideFeatured) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/projects/max?amount=${count}` + (onlyFeatured ? '&featured=true' : '') + (hideFeatured ? '&hidefeatured=true' : '');
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projects) => {
                        resolve(projects);
                    }).catch(reject);
                })
                .catch((err) => {
                    reject(err);
                });
        })
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
            const url = `https://projects.penguinmod.site/api/projects/search?page=${page}&user=${user}`;
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

    static getProjectMeta(id) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/projects/getPublished?id=${id}`;
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
    static getProjectRemixes(id) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/pmWrapper/remixes?id=${id}`;
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

    static getProjectFile(id) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/projects/getPublished?type=file&id=${id}`;
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

    setPrivateCode(p) {
        this.privateCode = p;
    }
    setUsername(u) {
        this.username = u;
    }

    getMyProjects(page) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/users/getMyProjects?page=${page}&user=${this.username}&code=${this.privateCode}&sorted=true`;
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
    getMyMessages(page) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/users/getMessages?page=${page}&username=${this.username}&passcode=${this.privateCode}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((messageList) => {
                        resolve(messageList.items);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    getMessageCount() {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/users/getMessageCount?username=${this.username}&passcode=${this.privateCode}`;
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
        })
    }
    readMessages(id) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                passcode: this.privateCode,
            };
            if (typeof id !== 'undefined') {
                data.id = String(id);
            }
            const url = `https://projects.penguinmod.site/api/users/markMessagesAsRead`;
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
                passcode: this.privateCode,
                id,
                text
            };
            const url = `https://projects.penguinmod.site/api/users/dispute`;
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
    getUnapprovedProjects(page, oldFirst) {
        return new Promise((resolve, reject) => {
            const reverseParam = oldFirst ? '&reverse=true' : '';
            const url = `https://projects.penguinmod.site/api/projects/getUnapproved?page=${page}&user=${this.username}&passcode=${this.privateCode}${reverseParam}`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projectList) => {
                        const projects = projectList.projects;
                        const shown = projects.filter(p => !p.hidden);
                        resolve(shown);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
    }
    getRejectedProjectFile(id) {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/projects/downloadRejected?id=${id}&approver=${this.username}&passcode=${this.privateCode}`;
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
                passcode: this.privateCode,
                id
            };
            const url = `https://projects.penguinmod.site/api/projects/restoreRejected`;
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
    banUser(username, reason) {
        return new Promise((resolve, reject) => {
            const data = {
                username: this.username,
                passcode: this.privateCode,
                target: username,
                reason
            };
            fetch(`https://projects.penguinmod.site/api/users/ban`, {
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
                passcode: this.privateCode,
                target: username,
                reason
            };
            fetch(`https://projects.penguinmod.site/api/users/unban`, {
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
    deleteProject(id) {
        return new Promise((resolve, reject) => {
            fetch(`https://projects.penguinmod.site/api/projects/delete?passcode=${this.privateCode}&approver=${this.username}&id=${id}`).then(res => {
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
            passcode: this.privateCode,
            approver: this.username,
            id,
            reason,
        };
        return new Promise((resolve, reject) => {
            fetch(`https://projects.penguinmod.site/api/projects/reject`, {
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
    respondToDispute(disputerUsername, messageId, text) {
        const data = {
            passcode: this.privateCode,
            approver: this.username,
            username: disputerUsername,
            id: messageId,
            reason: text,
        };
        return new Promise((resolve, reject) => {
            fetch(`https://projects.penguinmod.site/api/users/disputeRespond`, {
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
    updateProject(id, newData) {
        newData.id = id;
        newData.requestor = this.username;
        newData.passcode = this.privateCode;
        if (typeof newData.newMeta === "object") {
            newData.newMeta = JSON.stringify(newData.newMeta);
        }
        return new Promise((resolve, reject) => {
            fetch(
                `https://projects.penguinmod.site/api/projects/update`,
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
    uploadProject(data) {
        data.author = this.username;
        data.passcode = this.privateCode;
        return new Promise((resolve, reject) => {
            fetch(
                `https://projects.penguinmod.site/api/projects/publish`,
                {
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                    method: "POST"
                }
            ).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.published);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }

    approveProject(id, webhook) {
        const url = `https://projects.penguinmod.site/api/projects/approve?passcode=${this.privateCode}&approver=${this.username}&webhook=${webhook}&id=${id}`;
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
    featureProject(id, webhook) {
        const url = `https://projects.penguinmod.site/api/projects/feature?passcode=${this.privateCode}&approver=${this.username}&webhook=${webhook}&id=${id}`;
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

    toggleVoteProject(id, type) {
        type = String(type).toLowerCase().trim();
        switch (type) {
            case 'feature':
            case 'features':
            case 'featured':
            case 'vote':
            case 'voted':
                type = 'votes';
                break;
            case 'love':
            case 'loved':
            case 'like':
            case 'liked':
            case 'likes':
                type = 'loves';
                break;
            default:
                type = 'votes';
        }
        const url = `https://projects.penguinmod.site/api/projects/toggleProjectVote`;
        return new Promise((resolve, reject) => {
            fetch(url, {
                headers: { "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({
                    id: id,
                    type: type,
                    user: this.username,
                    passcode: this.privateCode
                })
            }).then(res => {
                res.json().then(json => {
                    if (!res.ok) {
                        reject(json.error);
                        return;
                    }
                    resolve(json.state);
                }).catch(err => {
                    reject(err);
                })
            }).catch(err => {
                reject(err);
            })
        })
    }
    getVoteStates(id) {
        const url = `https://projects.penguinmod.site/api/projects/getProjectVote?user=${this.username}&passcode=${this.privateCode}&id=${id}`;
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
        })
    }
}
export default ProjectApi;