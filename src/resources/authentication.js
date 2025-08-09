import ProjectApi from "./projectapi";

class Authentication {
    static eventListeners = [];

    static createAccount(username, password, email = "", birthday, country, hCaptcha_token) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/createAccount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password, email, birthday, country, captcha_token: hCaptcha_token })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);

                this.fireAuthenticated(username, j.token);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }

    static verifyPassword(username, password, captcha_token) {
        const url = `${ProjectApi.OriginApiUrl}/api/v1/users/passwordlogin`;

        const body = {
            username,
            password,
            captcha_token,
        };

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }).then(r => r.json().then(j => {
                if (j.error === "InvalidCaptcha") return reject("InvalidCaptcha");
                if (j.error) return resolve(false);

                this.fireAuthenticated(username, j.token);
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

                console.log(event.data)

                this.fireAuthenticated(localStorage.getItem("username"), localStorage.getItem("token"));
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
    static fireAuthenticated(username, token) {
        Authentication.eventListeners.forEach(thinkle => {
            if (thinkle.type === "LOGIN") {
                thinkle.callback(username, token);
            }
        })
    }
    static logout() {
        return new Promise((resolve, reject) => {
            const username = localStorage.getItem("username")
		    const token = localStorage.getItem("token");
		    fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/logout`,
		    	{
		    		method: "POST",
		    		headers: {
		    			"Content-Type": "application/json",
		    		},
		    		body: JSON.stringify({
		    			username: username,
		    			token: token,
		    		})
		    	}
		    ).then((res) => {
		    	if (!res.ok) return reject("Not OK");
                localStorage.removeItem("username");
                localStorage.removeItem("token");
                Authentication.fireLogout();
                resolve();
		    }).catch(reject);
        });
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
                    ...j
                })
            }).catch(reject)).catch(reject)
        })
    }

    static changePassword(username, token, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/changePassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, token, old_password: oldPassword, new_password: newPassword })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }

    static resetPassword(email, state, newPassword) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/resetpassword/reset`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, state, password: newPassword })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }

    static sendResetPasswordEmail(email, captcha_token) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/resetpassword/sendEmail`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, captcha_token })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        })
    }

    static verifyEmail(username, token) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/resetpassword/sendVerifyEmail`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, token })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve();
            }).catch(reject)).catch(reject);
        })
    }

    static changeUsername(username, token, newUsername) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/changeUsername`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, token, newUsername })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
            }).catch(reject)).catch(reject);
        });
    }
}
export default Authentication;