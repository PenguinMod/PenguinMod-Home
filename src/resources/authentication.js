class Authentication {
    static eventListeners = [];

    static authenticate(dontSetAsLoginToken, dontSetInLocalStorage) {
        const redirectUrl = String(`${location.origin}/loading`);
        const base64 = btoa(redirectUrl);
        return new Promise((resolve, reject) => {
            const login = window.open(
                `https://auth.itinerary.eu.org/auth/?redirect=${base64}&name=PenguinMod`,
                "Scratch Authentication",
                `scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no,width=1024,height=512,left=200,top=200`
            );
            if (!login) {
                reject("PopupBlocked");
            };
            let cantAccessAnymore = false;
            let finished = false;
            let interval = null;
            interval = setInterval(() => {
                if (login?.closed && (!finished)) {
                    clearInterval(interval);
                    try {
                        login.close();
                    } catch {
                        // oh no
                    };
                    reject("PopupClosed");
                };
                try {
                    const query = login.location.search;
                    if (!cantAccessAnymore) return;
                    const parameters = new URLSearchParams(query);
                    const privateCode = parameters.get("privateCode");
                    finished = true;
                    clearInterval(interval);
                    if (dontSetAsLoginToken) {
                        setTimeout(() => {
                            login.close();
                        }, 500);
                        if (!dontSetInLocalStorage) {
                            localStorage.setItem("SCAM-ALERT", "Do NOT send anyone your PV code! If someone told you to do this, stop now!");
                            localStorage.setItem("PV", privateCode);
                            Authentication.fireAuthenticated(privateCode);
                        }
                        resolve(privateCode);
                    } else {
                        fetch(`https://projects.penguinmod.site/api/users/login?privateCode=${privateCode}`).then(res => {
                            if (!res.ok) {
                                setTimeout(() => {
                                    login.close();
                                }, 500);
                                return reject("error logging in");
                            }
                            setTimeout(() => {
                                login.close();
                            }, 500);
                            if (!dontSetInLocalStorage) {
                                localStorage.setItem("SCAM-ALERT", "Do NOT send anyone your PV code! If someone told you to do this, stop now!");
                                localStorage.setItem("PV", privateCode);
                                Authentication.fireAuthenticated(privateCode);
                            }
                            resolve(privateCode);
                        }).catch(() => {
                            setTimeout(() => {
                                login.close();
                            }, 500);
                            return reject("error logging in");
                        })
                    }
                } catch {
                    cantAccessAnymore = true;
                };
            }, 50);
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
                resolve(j.username)
            }).catch(reject)).catch(reject)
        })
    }
}
export default Authentication;