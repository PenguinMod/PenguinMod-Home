import ProjectApi from "./projectapi";

class Authentication {
    static eventListeners = [];
    static clientId = 1027756650;

    static authenticate() {
        const isLocal = location.hostname === 'localhost';
        const redirectUrl = `${ProjectApi.OriginApiUrl}/api/users/login` + (isLocal ? 'Local' : '');
        return new Promise(async (resolve, reject) => {
            let loginWindow;
            let loginSession = await ProjectApi.requestLoginSession();

            const handleMessageReciever = (event) => {
                if (!loginWindow) return;
                if (event.origin !== ProjectApi.OriginApiUrl) {
                    return;
                }
                const data = event.data && event.data.a2;
                if (!data) {
                    return;
                }

                const privateCode = data.pv;
                window.removeEventListener("message", handleMessageReciever);
                loginWindow.close();

                localStorage.setItem("SCAM-ALERT", "Do NOT send anyone your PV code! If someone told you to do this, stop now!");
                localStorage.setItem("PV", privateCode);
                Authentication.fireAuthenticated(privateCode);
                resolve(privateCode);
            };

            window.addEventListener("message", handleMessageReciever);

            const client_id = Authentication.clientId;
            loginWindow = window.open(
                `https://oauth2.scratch-wiki.info/wiki/Special:ScratchOAuth2/authorize`
                    + `?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirectUrl)}&scopes=identify&state=${encodeURIComponent(loginSession)}`,
                "Scratch OAuth2",
                `scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no,width=1024,height=512,left=200,top=200`
            );
            if (!loginWindow) {
                window.removeEventListener("message", handleMessageReciever);
                reject("PopupBlocked");
            };
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
    static usernameFromCode(code) {
        return new Promise((resolve, reject) => {
            fetch(`${ProjectApi.OriginApiUrl}/api/users/usernameFromCode?privateCode=${code}`).then(r => r.json().then(j => {
                if (j.username == null) return reject(j.error);
                resolve({
                    isAdmin: j.admin,
                    isApprover: j.approver,
                    ...j
                });
            }).catch(reject)).catch(reject);
        });
    }
}
export default Authentication;