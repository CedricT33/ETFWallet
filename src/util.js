/**********************************
                UTIL
**********************************/
const util = (function() {


    //////////////////////////////////////////////////
    ///////////// FONCTIONS PRIVEES //////////////////
    //////////////////////////////////////////////////


    /**
     * FONCTION PRIVEE ASYNCHRONE D'APPEL D'API
     * @param {string} url 
     * @param {object} params 
     */
    function appelerAPI(url, params) {
        return new Promise((resolve, reject) => {
            fetch(url, params).then(reponse => {
                const contentType = reponse.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    return resolve(reponse.json()); 
                }
                else {
                    return resolve(reponse.text()); 
                }               
            }).catch(error => {
                return reject(error);
            });
        });
    }

    /**
     * FONCTION PRIVEE QUI CONSTRUIT LES PARAMETRES D'APPEL
     * @param {string} verbe 
     * @param {string} body 
     */
    function constructionParamsRequete(verbe, body) {
        const params = { 
            method: verbe
        };

        if (verbe === "POST") {
            params.headers = new Headers({
                "Content-Type": "application/x-www-form-urlencoded",
            });
            params.credentials = "include";
            params.body = body
        }

        return params;
    }


    //////////////////////////////////////////////////
    ///////////// FONCTIONS PUBLIQUES ////////////////
    //////////////////////////////////////////////////


    /**
     * FONCTION APPELEE POUR LE DEBRANCHEMENT DE PAGE
     * @param {[string]} listIdsShow tableau d'id des éléments à faire apparaitre.
     * @param {[string]} listIdsHide tableau d'id des éléments à faire disparaitre.
     */
    function changerDePage(listIdsShow, listIdsHide) {
        if (this.isNotNullOrUndefined(listIdsHide)) {
            listIdsHide.forEach(id => {
                this.cacherElement(id);
            });
        }
        if (this.isNotNullOrUndefined(listIdsShow)) {
            listIdsShow.forEach(id => {
                this.afficherElement(id);
            });
        }
    }

    /**
     * FONCTION QUI FAIT UNE REQUETE VERS UNE API REST
     * @param {string} verbe 
     * @param {string} url 
     * @param {string} body 
     * @param {boolean} isBouchon 
     */
    function faireRequeteAPI(verbe, url, body, isBouchon) {
        
        return new Promise((resolve, reject) => {
            if (isBouchon) {
                console.log("[APPEL BOUCHON]");
                const bouchon = creerBouchon(url, body);
                setTimeout(() => {
                    return resolve(bouchon);
                }, 500);
            }
            else {
                const params = constructionParamsRequete(verbe, body);

                appelerAPI(url, params).then(reponse => {
                    return resolve(reponse);
                }).catch(error => {
                    return reject(error.message);
                });;
            }   
        });
    }

    /**
     * FONCTION QUI VERIFIE SI UN PARAMETRE N'EST NI NULL NI UNDEFINED
     * @param {*} aVerifier 
     */
    function isNotNullOrUndefined(aVerifier) {
        if (aVerifier != null && aVerifier != 'null') {
            return true;
        }
        return false;
    }

    /**
     * FONCTION QUI AFFICHE UN ELEMENT DU DOM
     * @param {string} element id de l'élement 
     */
     function afficherElement(element) {
        var elmt = document.getElementById(element);
        elmt.classList.remove('hide');
        elmt.classList.add('show');
    }

    /**
     * FONCTION QUI CACHE UN ELEMENT DU DOM
     * @param {string} element id de l'élement 
     */
     function cacherElement(element) {
        var elmt = document.getElementById(element);
        elmt.classList.add('hide');
        elmt.classList.remove('show');
    }

    /**
     * FONCTION QUI AFFICHE UNE LOG EN MODE DEV
     * @param {string} description description de la log
     * @param {string} log la log  afficher
     * @param {boolean} isDev mode dev ou prod
     */
     function loguer(description, log, isDev) {
        if (isDev) {
            console.log("-->> " + description, log);
        }
    }

    /**
     * FONCTION QUI ADDITIONNE LES VALEURS D'UN TABLEAU
     * @param {array} tableau tableau de valeurs à additionner
     */
     function additionnerTableau(tableau) {
        return tableau.reduce((accumulator, value) => {
            return accumulator + value;
        }, 0);
    }

    //////////////////////////////////////////////////
    ////////////////// EXPOSITION ////////////////////
    //////////////////////////////////////////////////

    return {
        changerDePage: changerDePage,
        faireRequeteAPI: faireRequeteAPI,
        isNotNullOrUndefined: isNotNullOrUndefined,
        afficherElement: afficherElement,
        cacherElement: cacherElement,
        loguer: loguer,
        additionnerTableau: additionnerTableau
    };

})();