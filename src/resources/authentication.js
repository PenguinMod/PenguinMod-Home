import ProjectApi from "./projectapi";

class Authentication {
    static eventListeners = [];

    static createAccount(username, password) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/createAccount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }

    static verifyPassword(username, password) {
        const url = `${ProjectApi.OriginApiUrl}/api/v1/users/passwordlogin?username=${username}&password=${password}`;

        return new Promise((resolve, reject) => {
            fetch(url).then(r => r.json().then(j => {
                if (j.error) return resolve(false);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }

    static authenticate() {
        const url = `${window.location.origin}/signin?redirect=${window.location.pathname}&embed=true`;
        return new Promise((resolve, reject) => {
            let login;

            const handleMessageReciever = (event) => {
                if (event.origin !== location.origin) {
                    return;
                }

                resolve();
            };

            window.addEventListener("message", handleMessageReciever);

            login = window.open(
                url,
                "Login",
                `scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no,width=1024,height=512,left=200,top=200`
            );
            if (!login) {
                window.removeEventListener("message", handleMessageReciever);
                reject("PopupBlocked");
            };
        });
    }

    static verifyToken(username, token) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/tokenlogin?username=${username}&token=${token}`)
            .then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve();
            }).catch(reject)).catch(reject);
        });
    }

    static onAuthentication(cb) {
        Authentication.eventListeners.push({ callback: cb, type: "LOGIN" });
    }
    static onLogout(cb) {
        Authentication.eventListeners.push({ callback: cb, type: "LOGOUT" });
    }
    static fireAuthenticated(pv) {
        Authentication.eventListeners.forEach(thinkle => {
            if (thinkle.type === "LOGIN") {
                thinkle.callback(pv);
            }
        })
    }
    static fireLogout() {
        Authentication.eventListeners.forEach(thinkle => {
            if (thinkle.type === "LOGOUT") {
                thinkle.callback();
            }
        })
    }
    static usernameFromCode(username, token) {
        // name is a misnomer, was just to lazy to change after new api update.
        // TODO: make this less misleading 
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/userfromcode?username=${username}&token=${token}`).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve({
                    username: username, 
                    isAdmin: j.admin,
                    isApprover: j.approver,
                    loginMethods: j.loginMethods,
                    lastPolicyRead: j.lastPolicyRead,
                })
            }).catch(reject)).catch(reject)
        })
    }

    static changePassword(username, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/changePassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, old_password: oldPassword, new_password: newPassword })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }
}
export default Authentication;