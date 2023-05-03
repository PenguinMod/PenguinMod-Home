class ProjectApi {
    constructor(pv, username) {
        this.privateCode = pv;
        this.username = username;
    }

    static getProjects() {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/projects/paged?length=100`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projects) => {
                        resolve(projects.flat(Infinity));
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

    getMyProjects() {
        return new Promise((resolve, reject) => {
            const url = `https://projects.penguinmod.site/api/users/getMyProjects?user=${this.username}&code=${this.privateCode}&sorted=true`;
            fetch(url)
                .then((res) => {
                    if (!res.ok) {
                        res.text().then(reject);
                        return;
                    }
                    res.json().then((projects) => {
                        resolve(projects);
                    });
                })
                .catch((err) => {
                    reject(err);
                });
        })
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
}
export default ProjectApi;