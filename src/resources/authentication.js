class Authentication {
    static eventListeners = [];

    static authenticate() {
        const isLocal = location.hostname === 'localhost';
        const redirectUrl = 'https://projects.penguinmod.site/api/users/login' + (isLocal ? 'Local' : '');
        const base64 = btoa(redirectUrl);
        return new Promise((resolve, reject) => {
            let login;

            const handleMessageReciever = (event) => {
                if (event.origin !== 'https://projects.penguinmod.site') {
                    return;
                }
                const data = event.data && event.data.a2;
                if (!data) {
                    return;
                }

                const privateCode = data.pv;
                window.removeEventListener("message", handleMessageReciever);
                login.close();

                localStorage.setItem("SCAM-ALERT", "Do NOT send anyone your PV code! If someone told you to do this, stop now!");
                localStorage.setItem("PV", privateCode);
                Authentication.fireAuthenticated(privateCode);
                resolve(privateCode);
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
            fetch(`https://projects.penguinmod.site/api/users/usernameFromCode?privateCode=${code}`).then(r => r.json().then(j => {
                if (j.username == null) return reject(j.error);
                resolve({
                    username: j.username, 
                    isAdmin: j.admin,
                    isApprover: j.approver
                })
            }).catch(reject)).catch(reject)
        })
    }
}
export default Authentication;