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

    static passwordAuthenticate(username, password) {
        const redirectUrl = `${ProjectApi.OriginApiUrl}/api/v1/users/passwordlogin?username=${username}&password=${password}`

        // TODO: open a popup to login.
        // Authentication.fireAuthenticated(username, token)
    }

    // DEPRECATED
    static authenticate() {
        const isLocal = location.hostname === 'localhost';
        const redirectUrl = `${ProjectApi.OriginApiUrl}/api/users/login` + (isLocal ? 'Local' : '');
        const base64 = btoa(redirectUrl);
        return new Promise((resolve, reject) => {
            let login;

            const handleMessageReciever = (event) => {
                if (event.origin !== ProjectApi.OriginApiUrl) {
                    return;
                }
                const data = event.data && event.data.a2;
                if (!data) {
                    return;
                }

                const token = data.token;
                window.removeEventListener("message", handleMessageReciever);
                login.close();

                localStorage.setItem("SCAM-ALERT", "Do NOT send anyone your PV code! If someone told you to do this, stop now!");
                localStorage.setItem("token", token);
                Authentication.fireAuthenticated(username, token);
                resolve(username, token);
            };

            window.addEventListener("message", handleMessageReciever);

            login = window.open(
                `https://auth.itinerary.eu.org/auth/?redirect=${base64}&name=PenguinMod`,
                "Scratch Authentication",
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
            fetch(`${ProjectApi.OriginApiUrl}/api/v1/users/tokenlogin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, token })
            }).then(r => r.json().then(j => {
                if (j.error) return reject(j.error);
                resolve(j.token);
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
                    isApprover: j.approver
                })
            }).catch(reject)).catch(reject)
        })
    }
}
export default Authentication;