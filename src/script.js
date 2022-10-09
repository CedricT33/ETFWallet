/**********************************
              SOMMAIRE
***********************************

**** API
**** CONSTANTES
**** VARIABLES GLOBALES
**** SW
**** UTILS
**** UTILS APPLI
**** UTILS TEMPLATE
**** STORAGE
**** INTERACTIONS
**** POPIN
**** PROFILS
**** PARAMETRES
**** FORMULAIRE
**** FICHIER
**** FONCTIONS
**** START

**********************************/
/**********************************
                API
**********************************/
/////////////////////
const isBouchon = true;
/////////////////////

const URL_API_BASE = "https://eodhistoricaldata.com/api/real-time/";
const API_KEY = "614381e909d510.28957559";
// requetes max : 20/jour, 20/min
// exemple : https://eodhistoricaldata.com/api/real-time/CW8.PA?api_token=614381e909d510.28957559&fmt=json&s=ESE.PA,PANX.PA,PAASI.PA,RS2K.PA

/**********************************
            VERSION
**********************************/
const version = "02.00.000";


/**********************************
            CONSTANTES
**********************************/
const init = {
    profilInitial: {
        id: 1,
        nom: "PORTEFEUILLE 1",
        transactions: []
    },
    miseAJour: {
        date: "25/06/2022",
        texte:  "- Ajout du multi-wallet !\n" +
                "(Version : " + version + ")"
    },
    ETFs: {
        CW8: 'MSCI World',
        ESE: 'S&P 500',
        PANX: 'Nasdaq 100',
        PAASI: 'Emerging Asia',
        RS2K: 'Russell 2000'
    }
}


/**********************************
        VARIABLES GLOBALES
**********************************/

let storage = [];
let profil = init.profilInitial;
let profilSelected = 0;
let objetQuantiteETF = new Object();
let objetTotalETF = new Object();
let objetCoursETFJSON = new Object();
let objetAchatsETF = new Object();
let ExTotalETF = 0;
let totalAchats = 0;
let totalETFs = 0;
let miseAJour = init.miseAJour;
let ETFs = init.ETFs;


/**********************************
                SW
**********************************/

/**
 * PROPOSE A L'UTILISATEUR D'INSTALLER L'APPLICATION SUR SON TEL
 */
 function proposerInstallationApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            console.log(choiceResult.outcome);

            if (choiceResult.outcome === 'dismissed') {
                console.log('User cancelled installation');
            }
            else {
                console.log('User added to home screen');
            }
        });
        deferredPrompt = null;
    }
}


/**********************************
               UTILS
**********************************/

/**
 * FORMATTE LE PRIX AVEC 2 CHIFFRES APRES LA VIRGULE
 * @param prix type Number
 * @returns prix formaté type String
 */
 function formaterPrix(prix) {
    if (prix) {
        return prix.toFixed(2).toString().replace('.', ',');
    }
    else {
        return 0;
    }
}

/**
 * RETOURNE L'INDEX LE PLUS GRAND DE LA LISTE + 1
 */
 function recupererIndexMax() {
    let tableauIndex = [];
    if (!profil || profil.transactions.length === 0) {
        return 1;
    }
    else {
        profil.transactions.forEach(elmt => {
            tableauIndex.push(elmt.index);
        })
        return (Math.max(...tableauIndex) + 1);
    }
}

/**
 * ANIMATION DES PRIX ET POURCENTAGES
 * @param obj type element du DOM
 * @param start type Number
 * @param end type Number
 * @param duration en millisecondes type Number
 * @param type 'pourcentage' ou 'prix' pour le symbole type String
 * @param operator type Boolean pour l'affichage ou non du + ou du -
 */
 function animateValue(obj, start, end, duration, type, operator) {
    let startTimestamp = null;
    let symbole = "";
    let plusOuMoins = "";
    let parentheseG = "";
    let parentheseD = "";
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        type === "pourcentage" ? symbole = " %" : symbole = " €";
        end >= 0 && operator ? plusOuMoins = "+ " : plusOuMoins = "";
        operator ? parentheseG = "(" : parentheseG = "";
        operator ? parentheseD = ")" : parentheseD = "";
        obj.innerHTML = parentheseG + plusOuMoins + formaterPrix(progress * (end - start) + start) + symbole + parentheseD;
        if (progress < 1) {
        window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * TRI DU STORAGE PAR DATE (CROISSANT)
 */
 function trierStorageParDate() {
    if (profil) {
        profil.transactions.forEach( (donnee) => {
            const dateString = "" + donnee.annee + "-" + donnee.mois + "-" + donnee.jour;
            const date = Date.parse(dateString);
            donnee.date = date;
        })
    }
    profil.transactions.sort((a,b) => (a.date > b.date) ? 1 : ((b.date > a.date) ? -1 : 0));
}


/**********************************
            UTILS APPLI
**********************************/

/**
 * CALCUL LE TOTAL EN EUROS DE LA SOMME DES ETFS
 * @param objetCoursETFs la réponse de l'API des cours d'ETF en JSON (reconstruite)
 */
 function calculerTotalETFs(objetCoursETFs) {
    for (const etf in objetQuantiteETF) {
        objetTotalETF[etf] = objetCoursETFs[etf].close * objetQuantiteETF[etf];
    }
    util.loguer("objetTotalETF : ", objetTotalETF, isBouchon);
    for (const etf in objetTotalETF) {
        totalETFs += objetTotalETF[etf];
    }
    util.loguer("totalETFs : ", totalETFs, isBouchon);
}

/**
 * CREE LE JSON EN RETOUR DE L'APPEL DES COURS D'ETF
 * @param reponseAPI la réponse de l'API des cours d'ETF en JSON
 */
 function construireObjetCoursETFJSON(reponseAPI) {
    var etf = "";
    if (Array.isArray(reponseAPI)) {
        reponseAPI.forEach( elmt => {
            etf = elmt.code.slice(0,-3)
            objetCoursETFJSON[etf] = elmt;
        })
    }
    else {
        etf = reponseAPI.code.slice(0,-3);
        objetCoursETFJSON[etf] = reponseAPI;
    }
    util.loguer("objetCoursETFJSON : ", objetCoursETFJSON, isBouchon);
}


/**********************************
           UTILS TEMPLATE
**********************************/

/**
 * CONSTRUIT UN ELEMENT HTML
 */
 function creerElement(type, id, classes, content, attribut) {
    const newElmt = document.createElement(type);
    if (id !== 0) {
        newElmt.id = id;
    }
    if (classes !== '') {
        newElmt.className = classes;
    }
    if (content !== undefined) {
        var newContent = document.createTextNode(content);
        newElmt.appendChild(newContent);
    }
    if (attribut !== undefined) {
        newElmt.setAttribute('onclick', attribut);
    }

    return newElmt;
}

/**
 * CONSTRUIT UNE VIGNETTE COURS
 */
function construireVignetteCoursHTML(etf_nom, etf_complet, cours, coursEuro) {
    const achatTotalETF = objetAchatsETF[etf_nom];
    const quantiteTotalETF = objetQuantiteETF[etf_nom];
    const totalRentabiliteETF = (((coursEuro * quantiteTotalETF) - achatTotalETF) / achatTotalETF) * 100;
    const totalRentabiliteETFFormated = formaterPrix(totalRentabiliteETF) + " %";
    const rentabiliteFinale = totalRentabiliteETF >= 0 ? "+" + totalRentabiliteETFFormated : totalRentabiliteETFFormated;
    const couleurRentabilite = totalRentabiliteETF >= 0 ? '' : ' negatif';

    const couleur = cours >= 0 ? '' : ' negatif';
    const pourcentage = formaterPrix(cours) + " %";
    const elmtCoursConteneur = document.getElementById('cours_container');
    const elmtVignetteConteneur = creerElement('div', 0, 'vignette_cours');
    const elmtInfos = creerElement('div', 0, 'vignette_infos');
    const elmtNoms = creerElement('div', 0, 'vignette_noms');
    const elmtAcronymeETF = creerElement('div', 0, 'acronyme_etf', etf_nom);
    const elmtNomETF = creerElement('div', 0, 'nom_etf', etf_complet);
    const elmtPrix = creerElement('div', 0, 'vignette_prix');
    const elmtPrixETF = creerElement('div', 0, 'vignette_prix_ETF' + couleur, pourcentage);
    const elmtPrixTotal = creerElement('div', 0, 'vignette_prix_total');
    const elmtMotTotal = creerElement('div', 0, 'vignette_mot_total', "TOTAL : ");
    const elmtPrixTotalETF = creerElement('div', 0, 'vignette_prix_total_ETF' + couleurRentabilite, rentabiliteFinale);
    
    elmtNoms.appendChild(elmtAcronymeETF);
    elmtNoms.appendChild(elmtNomETF);
    elmtPrixTotal.appendChild(elmtMotTotal);
    elmtPrixTotal.appendChild(elmtPrixTotalETF);
    elmtPrix.appendChild(elmtPrixETF);
    elmtPrix.appendChild(elmtPrixTotal);
    elmtInfos.appendChild(elmtNoms);
    elmtInfos.appendChild(elmtPrix);
    elmtVignetteConteneur.appendChild(elmtInfos);
    elmtCoursConteneur.appendChild(elmtVignetteConteneur);
}

/**
 * CONSTRUIT UNE VIGNETTE ACHAT
 */
 function construireVignetteAchatsHTML(index, etf, quantite, total, date) {
    const prixAchat = formaterPrix(total) + " €";

    const rentabilite = ((objetCoursETFJSON[etf].close - (total/quantite)) / (total/quantite)) * 100;
    const rentabiliteFormated = formaterPrix(rentabilite) + " %";
    const rentabiliteFinale = rentabilite >= 0 ? "+" + rentabiliteFormated : rentabiliteFormated;
    const couleur = rentabilite >= 0 ? '' : ' negatif';

    const elmtAchatsConteneur = document.getElementById('achats_container');
    const elmtVignetteConteneur = creerElement('div', 0, 'vignette_achats');
    const elmtInfos = creerElement('a', 0, 'vignette_infos', undefined, 'clickAccordeon(this)');
    const elmtNoms = creerElement('div', 0, 'vignette_noms');
    const elmtAcronymeETF = creerElement('div', 0, 'acronyme_etf', etf);
    const elmtNomETF = creerElement('div', 0, 'nom_etf', ETFs[etf]);
    const elmtAchat = creerElement('div', 0, 'vignette_achat');
    const elmtAchatPrix = creerElement('div', 0, 'vignette_achat_prix', prixAchat);
    const elmtAchatDate = creerElement('div', 0, 'vignette_achat_date', date);
    const elmtCoursAchat = creerElement('div', 0, 'vignette_cours_achat');
    const elmtCours = creerElement('div', 0, 'vignette_rentabilite' + couleur, rentabiliteFinale);
    const elmtQuantite = creerElement('div', 0, 'vignette_quantite', quantite);
    const elmtAccordeon = creerElement('div', 0, 'accordeon-content');
    const elmtSuppr = creerElement('a', 'suppr-' + index, 'btn-suppr', undefined, 'clickSuppr(this)');
    const elmtImgSuppr = creerElement('div', 0, 'img-suppr');
    const elmtTextSuppr = creerElement('div', 0, 'supprimer', 'Supprimer');
    const elmtModif = creerElement('a', 'modif-' + index, 'btn-modif', undefined, 'clickModif(this)');
    const elmtImgModif = creerElement('div', 0, 'img-modif');
    const elmtTextModif = creerElement('div', 0, 'modifier', 'Modifier');
    
    elmtNoms.appendChild(elmtAcronymeETF);
    elmtNoms.appendChild(elmtNomETF);
    elmtAchat.appendChild(elmtAchatPrix);
    elmtAchat.appendChild(elmtAchatDate);
    elmtCoursAchat.appendChild(elmtCours);
    elmtCoursAchat.appendChild(elmtQuantite);
    elmtInfos.appendChild(elmtNoms);
    elmtInfos.appendChild(elmtAchat);
    elmtInfos.appendChild(elmtCoursAchat);
    elmtModif.appendChild(elmtImgModif);
    elmtModif.appendChild(elmtTextModif);
    elmtSuppr.appendChild(elmtImgSuppr);
    elmtSuppr.appendChild(elmtTextSuppr);
    elmtAccordeon.appendChild(elmtSuppr);
    elmtAccordeon.appendChild(elmtModif);
    elmtVignetteConteneur.appendChild(elmtInfos);
    elmtVignetteConteneur.appendChild(elmtAccordeon);
    elmtAchatsConteneur.appendChild(elmtVignetteConteneur);
}

/**
 * SUPPRESSION PUIS CREATION VIGNETTES COURS
 * @param objetCoursETFs la réponse de l'API des cours d'ETF en JSON (reconstruite)
 */
function ajouterVignettesHTMLCours(objetCoursETFs) {
    let etf_nom = '';
    let etf_complet = '';
    let cours = 0;
    let coursEuro = 0;

    supprimerVignettesCours();

    for (const etf in objetQuantiteETF) {
        etf_nom = etf;
        etf_complet = ETFs[etf];
        cours = objetCoursETFs[etf].change_p;
        coursEuro = objetCoursETFs[etf].close;
        construireVignetteCoursHTML(etf_nom, etf_complet, cours, coursEuro);
    }
}

/**
 * SUPPRESSION PUIS CREATION VIGNETTES ACHATS
 */
 function ajouterVignettesHTMLAchats() {
    supprimerVignettesAchats();
    trierStorageParDate();
    if (profil) {
        profil.transactions.forEach( (achat) => {
            var date = "" + achat.jour + "/" + achat.mois + "/" + achat.annee;
            construireVignetteAchatsHTML(achat.index, achat.etf, achat.quantite, achat.total, date);
        })
    }
}

/**
 * MISE A JOUR DU PORTEFEUILLE DANS LE TEMPLATE AVEC ANIMATION
 */
function mettreAJourPortefeuilleTemplate() {
    const elmtPortefeuilleNomProfil = document.getElementById('nom_profil');
    const elmtPortefeuilleTotal = document.getElementById('total');
    const elmtPortefeuilleGains = document.getElementById('gains-total');
    const elmtPortefeuillePoucentage = document.getElementById('pourcentage-total');
    const elmtPortefeuilleGainsJour = document.getElementById('gains-jour');
    const elmtPortefeuillePoucentageJour = document.getElementById('pourcentage-jour');

    elmtPortefeuilleNomProfil.textContent = profil.nom;

    const gains = totalETFs - totalAchats;
    const pourcentage = ((totalETFs - totalAchats)*100)/totalAchats;
    let totalETFsVeille = 0;
    for (let i = 0; i < Object.keys(objetQuantiteETF).length; i++) {
        const tableauETFs = Object.keys(objetQuantiteETF);
        totalETFsVeille += objetCoursETFJSON[tableauETFs[i]].previousClose * objetQuantiteETF[tableauETFs[i]]
    }
    const pourcentageVeille = (((totalETFsVeille - totalAchats) * 100 ) / totalAchats);
    const gainJour = totalETFs - totalETFsVeille;
    const pourcentageJour = pourcentage - pourcentageVeille;

    animateValue(elmtPortefeuilleTotal, ExTotalETF, totalETFs, 1000, "prix", false);
    animateValue(elmtPortefeuilleGains, 0, gains, 1000, "prix", false);
    animateValue(elmtPortefeuillePoucentage, 0, pourcentage, 1000, "pourcentage", false);
    animateValue(elmtPortefeuilleGainsJour, 0, gainJour, 1000, "prix", true);
    animateValue(elmtPortefeuillePoucentageJour, 0, pourcentageJour, 1000, "pourcentage", true);
}

/**
 * SUPPRIME LES VIGNETTES ENFANTS
 * @param {string} idElmtParent
 */
 function supprimerVignettes(idElmtParent) {
    const elmtConteneur = document.getElementById(idElmtParent);
    while (elmtConteneur.lastElementChild) {
        elmtConteneur.removeChild(elmtConteneur.lastElementChild);
    }
}

/**
 * SUPPRIME LES VIGNETTES COURS
 */
 function supprimerVignettesCours() {
    supprimerVignettes('cours_container');
}

/**
 * SUPPRIME LES VIGNETTES ACHATS
 */
 function supprimerVignettesAchats() {
    supprimerVignettes('achats_container');
}


/**********************************
              STORAGE
**********************************/

/**
 * AJOUT DANS LE LOCAL STORAGE DU PROFIL SELECTIONNE
 */
 function ajouterProfilAuLocalStorage() {
    var profilSelected = {id: profil.id}
    localStorage.setItem("profil_selected_etfwallet", JSON.stringify(profilSelected));
}

/**
 * ENREGISTREMENT DU PROFIL ET AJOUT DANS LE LOCAL STORAGE 
 */
function ajoutLocalStorage() {
    storage.forEach( (profilSorage, id) => {
        if (profil.id === profilSorage.id) {
            storage.splice(id, 1, profil);
        }
    });
    localStorage.setItem("achats_etfwallet", JSON.stringify(storage));
    ajouterProfilAuLocalStorage();
}

/** ----- SUPPRESSION DE TOUT LE LOCAL STORAGE ------ */
function supprimerLocalStorage() {
    storage = [];
    localStorage.removeItem("achats_etfwallet");
    localStorage.removeItem("profil_selected_etfwallet");
}

/** ----- SUPPRESSION D'UNE DONNEE DU LOCAL STORAGE ------ */
function supprimerDonneeStorage(index) {
    profil.transactions.forEach( (elmt, id) => {
        if (elmt.index == index) {
            profil.transactions.splice(id, 1);
        }
    });
    ajoutLocalStorage();
    recupererLocalStorage();
    mettreAJourPortefeuille();
    gererAffichagePresentation();
}

/** ----- RECUPERE L'OBJET DU LOCAL STORAGE AVEC L'INDEX ------ */
function recupererObjetVignette(index) {
    let element = {};
    profil.transactions.forEach(elmt => {
        if (elmt.index == index) {
            element = elmt;
        }
    })
    return element;
}

/**
 * AJOUT DU NOUVEL ACHAT DANS LE LOCAL STORAGE
 */
 function ajouterAchatLocalStorage(objetAchat) {
    // suppression de la donnée si elle existe
    profil.transactions.forEach( (elmt, id) => {
        if (elmt.index == objetAchat.index) {
            profil.transactions.splice(id, 1);
        }
    })
    profil.transactions.push(objetAchat);
    ajoutLocalStorage();
}

/**
 * RECUPERE LE PROFIL DE DEPART
 */
 function recupererProfil() {
    profilSelected = JSON.parse(localStorage.getItem("profil_selected_etfwallet"));
    if (profilSelected) {
        storage.forEach(profilStorage => {
            if (profilStorage.id === profilSelected.id) {
                profil = profilStorage;
            }
        })
    }
    else {
        profil = storage[0];
    }
}

/**
 * RECUPERE LE LOCAL STORAGE
 */
 function recupererLocalStorage() {
    storage = JSON.parse(localStorage.getItem("achats_etfwallet"));
    if (!storage) {
        storage = [];
        storage.push(profil);
    }
    recupererProfil();
}


/**********************************
            INTERACTIONS
**********************************/

/** ----- AU CLIC SUR LE BOUTON RESET ------ */
function clickReset() {
    ouvrirPopinSuppressionTotale();
}

/** ----- AU CLIC SUR L'ICONE PARAMETRES ------ */
function clickParams() {
    faireApparaitrePageParametres();
}

/** ----- AU CLIC SUR L'ICONE PROFILS ------ */
function clickProfils() {
    faireApparaitrePageProfils();
}

/** ----- AU CLIC SUR VALIDATION POPIN ------ */
function clickOKPopin() {
    const valueIndex = document.getElementById('index-popin').value;
    if (valueIndex !== 'version' && valueIndex !== 'maj' && valueIndex !== 'reset' && !valueIndex.includes('supprWallet')) {
        supprimerDonneeStorage(valueIndex);
        detruirePopin();
        clickRetour();
    } else if (valueIndex === 'reset') {
        supprimerLocalStorage();
        remiseAZeroProfil();
        mettreAJourPortefeuille();
        gererAffichagePresentation();
        detruirePopin();
        gererRetourApresReset();
    } else if (valueIndex.includes('supprWallet')) {
        const index = valueIndex.split(':')[1];
        profil = storage[0];
        const storageIndex = storage.findIndex((wallet => wallet.id == index));
        storage.splice(storageIndex, 1);
        ajoutLocalStorage();
        detruirePopin();
        faireDisparaitrePageProfils();
    } else {
        detruirePopin();
    }
}

/** ----- AU CLIC SUR SUPPRIMER UNE VIGNETTE ------ */
function clickSuppr(element) {
    const index = element.id.substr(6,1);
    let etf = "";
    document.getElementById('index-popin').value = index;
    storage.forEach( elmt => {
        if (elmt.index == index) {
            etf = elmt.etf;
        }
    })
    ouvrirPopinSuppression(etf);
}

/** ----- AU CLIC SUR SUPPRIMER UN PROFIL ------ */
function clickSupprProfil() {
    const index = document.getElementById('suppr-profil').getAttribute('index');
    if (index != 1 && index != "NEW") {
        ouvrirPopinSuppressionWallet(index);
    }
}

/** ----- AU CLIC SUR MODIFIER UNE VIGNETTE ------ */
function clickModif(element) {
    const index = element.id.substring(6);
    remplirFormulaire(index);  
    faireApparaitrePageFormulaire();
}

/**
 * AU CLIC SUR AJOUTER UN ACHAT (BOUTON +)
 */
function clickAjout() {
    proposerInstallationApp();
    faireApparaitrePageFormulaire(); 
}

/**
 * AU CLIC SUR LE BOUTON GRAPH
 */
 function clickGraph() {
    if (profil && profil.transactions.length !== 0 ) {
        const elemtDeco = document.getElementById('deco');
        const elemtTitre = document.getElementById('titre_vignettes');
        const idElmtsShow = ['retour', 'achats_container', 'graph_container'];
        const idElmtsHide = ['portefeuille-container', 'bitcoin', 'graph', 'ajout', 'cours_container'];

        elemtDeco.classList.remove('wallet');
        elemtDeco.classList.add('stats');
        elemtTitre.textContent = "Transactions";
        creerGraph();
        util.changerDePage(idElmtsShow, idElmtsHide);
    }
    else {
        // TODO popin -> "Aucunes données" ?
    }
}

/**
 * AU CLIC SUR RETOUR DE LA PAGE GRAPH (BOUTON <)
 */
 function clickRetour() {
    const elemtDeco = document.getElementById('deco');
    const elemtVignettesCours = document.getElementsByClassName('vignette_cours');
    const elemtTitre = document.getElementById('titre_vignettes');
    const idElmtsShow = ['portefeuille-container', 'bitcoin', 'graph', 'ajout', 'cours_container'];
    const idElmtsHide = ['retour', 'achats_container', 'graph_container'];

    elemtDeco.classList.remove('stats');
    elemtDeco.classList.add('wallet');
    for (const element of elemtVignettesCours) {
        element.classList.add('animation');
    }   
    elemtTitre.textContent = "Marchés";
    util.changerDePage(idElmtsShow, idElmtsHide);
}

/**
 * AU CLIC SUR RETOUR DU FORMULAIRE (BOUTON <)
 */
function clickRetourFormulaire() {
    faireDisparaitrePageFormulaire();
}

/**
 * AU CLIC SUR RETOUR DES PARAMETRES (BOUTON <)
 */
 function clickRetourParametres() {
    faireDisparaitrePageParametres();
}

/**
 * AU CLIC SUR RETOUR DES PROFILS (BOUTON <)
 */
 function clickRetourProfils() {
    faireDisparaitrePageProfils();
}

/** ----- AU CLIC SUR UNE VIGNETTE ------ */
function clickAccordeon(element) {
    const elmtsAccordeons = document.getElementsByClassName("accordeon-content");
    const listClassElmt = element.nextElementSibling.classList;

    if (listClassElmt.contains('active')) {
        listClassElmt.remove('active');
    }
    else {
        for (let elmt of elmtsAccordeons) {
            if (elmt.classList.contains('active')) {
                elmt.classList.remove('active');
            }
        }
        listClassElmt.add('active');
    }
}

/**
 * AU CLIC SUR OK DU FORMULAIRE D'ACHAT
 */
function clickOKFormulaire() {
    const elemtIndex = document.getElementById('index').value;
    const saisieETF = document.getElementById('saisieETF').value;
    const saisieQuantite = document.getElementById('saisieQuantite').value;
    const saisieCours = document.getElementById('saisieCours').value;
    const saisieCommission = document.getElementById('saisieCommission').value;
    const saisieJour = document.getElementById('saisieJour').value;
    const saisieMois = document.getElementById('saisieMois').value;
    const saisieAnnee = document.getElementById('saisieAnnee').value;
    let totalAchat = 0;
    let commission = 0;

    if (saisieQuantite !== 0 && saisieCours !== 0) {
        commission = saisieCours * (saisieCommission / 100) * saisieQuantite;
        totalAchat = (saisieQuantite * saisieCours) + commission;
    }

    const objetAchat = {
        index: elemtIndex ? Number(elemtIndex) : recupererIndexMax(),
        etf: saisieETF,
        quantite: Number(saisieQuantite),
        cours: Number(saisieCours),
        total: totalAchat,
        jour: saisieJour,
        mois: saisieMois,
        annee: saisieAnnee
    };

    const controleOK = controlerSaisie(objetAchat);

    if (controleOK) {
        ajouterAchatLocalStorage(objetAchat);
        mettreAJourPortefeuille();
        faireDisparaitrePageFormulaire();
        gererAffichagePresentation();
    }
    else {
        //TODO -> popin erreur?
    }
}

/**
 * AU CLIC SUR OK DE LA PAGE PROFIL
 */
 function clickOKFormulaireProfil() {
    const elmtModifNom = document.getElementById('modifNom').value.toUpperCase();
    const elmtSaisieProfil = document.getElementById('saisieProfil').value;

    // modification du nom du wallet
    if (elmtSaisieProfil == profil.id && elmtModifNom !== profil.nom) {
        profil.nom = elmtModifNom;
        ajoutLocalStorage();
    }

    // ajout d'un nouveau wallet
    if (elmtSaisieProfil === "NEW") {
        const newId = storage.length + 1;
        let newNom = elmtModifNom.includes("PORTEFEUILLE") ? "PORTEFEUILLE " + newId : elmtModifNom;
        const isDejaNom = storage.find(wallet => { return wallet.nom === newNom});
        newNom = isDejaNom ? newNom.concat(newId) : newNom;
        const newProfil = {
            id: newId,
            nom: newNom,
            transactions: []
        };
        storage.push(newProfil);
        profil = newProfil;
        ajoutLocalStorage();
    }

    //selection d'un autre wallet existant
    if (elmtSaisieProfil !== "NEW" && elmtSaisieProfil != profil.id) {
        const storageIndex = storage.findIndex((wallet => wallet.id == elmtSaisieProfil));
        profil = storage[storageIndex];
    }
    
    ajouterProfilAuLocalStorage();
    faireDisparaitrePageProfils();
}

/**********************************
               POPIN
**********************************/

//** -----DESTRUCTION POPIN----- */
function detruirePopin() {
    const elmtPopin = document.getElementById('popin');
    const elmtMasquePopin = document.getElementById('popin-masque');
    const elmtPopinTitre = document.getElementById('popin-titre');
    const elmtPopinCorps = document.getElementById('popin-corps');
  
    elmtPopinTitre.innerText = '';
    elmtPopinCorps.innerText = '';
    elmtPopin.classList.remove('open');
    elmtMasquePopin.classList.remove('open');
}

//** -----CREATION POPIN----- */
function creerPopin(titre, corps) {
    const elmtPopin = document.getElementById('popin');
    const elmtMasquePopin = document.getElementById('popin-masque');
    const elmtPopinTitre = document.getElementById('popin-titre');
    const elmtPopinCorps = document.getElementById('popin-corps');
  
    elmtPopinTitre.innerText = titre;
    elmtPopinCorps.innerText = corps;
    elmtPopin.classList.add('open');
    elmtMasquePopin.classList.add('open');
}

//** -----OUVERTURE POPIN SUPPRESSION----- */
function ouvrirPopinSuppression(etf) {
    const titre = 'SUPPRESSION';
    const corps = 'Etes-vous sûr de vouloir supprimer cette transaction de ' + etf + ' ?';
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN SUPPRESSION WALLET----- */
function ouvrirPopinSuppressionWallet(index) {
    document.getElementById('index-popin').value = 'supprWallet:' + index;
    const wallet = storage.find(wallet => { return wallet.id == index});
    const titre = 'SUPPRESSION';
    const corps = 'Etes-vous sûr de vouloir supprimer le wallet ' + wallet.nom + ' ?';
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN SUPPRESSION TOTALE----- */
function ouvrirPopinSuppressionTotale() {
    document.getElementById('index-popin').value = 'reset';
    const titre = 'SUPPRESSION';
    const corps = "Etes-vous sûr de vouloir supprimer toutes les données de l'application ?";
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN MAJ----- */
function ouverturePopinMAJ(miseAJour) {
    document.getElementById('index-popin').value = 'maj';
    const titre = 'NOUVEAUTEES';
    const corps = miseAJour.texte;
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN CONFIRMATION UPLOAD----- */
function ouvrirPopinConfirmationUpload(nomFichier) {
    document.getElementById('index-popin').value = 'maj';
    const titre = 'UPLOAD';
    const corps = "Les données ont été sauvegardées dans le fichier " + nomFichier;
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN CONFIRMATION DOWNLOAD----- */
function ouvrirPopinConfirmationDownload() {
    document.getElementById('index-popin').value = 'maj';
    const titre = 'DOWNLOAD';
    const corps = "Les données ont été importées dans l'application";
    creerPopin(titre, corps);
}

//** -----OUVERTURE POPIN ERREUR DONNEES----- */
function ouvrirPopinErreurDonnees() {
    document.getElementById('index-popin').value = 'maj';
    const titre = 'ERREUR';
    const corps = "Il n' a pas de donnée à enregistrer...";
    creerPopin(titre, corps);
}

/**********************************
             PROFILS
**********************************/

/**
 * FAIT APPARAITRE LA PAGE DES PROFILS
 */
 function faireApparaitrePageProfils() {
    const idElmtsShow = ['profil-container'];
    const idElmtsHide = ['container_principal'];
    remplirFormulaireProfil();
    ajouterEcouteurProfils();
    util.changerDePage(idElmtsShow, idElmtsHide);
}

/**
 * FAIT DISPARAITRE LA PAGE DES PROFILS
 */
 function faireDisparaitrePageProfils() {
    const idElmtsShow = ['container_principal'];
    const idElmtsHide = ['profil-container'];
    const elmtGraph = document.getElementById('graph_container');

    if (elmtGraph.classList.contains("show")) {
        clickRetour();
    }

    viderFormulaireProfil();
    mettreAJourPortefeuille();
    gererAffichagePresentation();
    util.changerDePage(idElmtsShow, idElmtsHide);
}

/**
 * AJOUTE UN ECOUTEUR SUR LA SELECTION D'UN NOUVEAU PROFIL
 */
function ajouterEcouteurProfils() {
    const elmtSaisieProfil = document.getElementById('saisieProfil');
    const elmtSuprrProfil = document.getElementById('suppr-profil');

    function showIconeSuppr() {
        elmtSuprrProfil.classList.add('show');
        elmtSuprrProfil.setAttribute("index", elmtSaisieProfil.value);
    };

    function hideIconeSuppr() {
        elmtSuprrProfil.classList.remove('show');
        elmtSuprrProfil.setAttribute("index", elmtSaisieProfil.value);
    };

    if (elmtSaisieProfil.value != 1) {
        showIconeSuppr();
    }
    else {
        hideIconeSuppr()
    }

    elmtSaisieProfil.onchange = event => {
        if (elmtSaisieProfil.value != 1 && elmtSaisieProfil.value !== "NEW") {
            showIconeSuppr();
        }
        else {
            hideIconeSuppr();
        }
    }
}

/**
 * REMPLIT LES CHAMPS DE LA PAGE DES PROFILS
 */
function remplirFormulaireProfil() {
    const elmtModifNom = document.getElementById('modifNom');
    const elmtSaisieProfil = document.getElementById('saisieProfil');
    const elmtDefaultWallet = document.getElementById('defaultWallet');

    elmtModifNom.value = profil.nom;
    elmtDefaultWallet.value = profil.id;
    elmtDefaultWallet.textContent = profil.nom;

    if (storage && storage.length !== 0) {
        storage.forEach(wallet => {
            if (wallet.id !== profil.id) {
                const newElmt = document.createElement('option');
                newElmt.textContent = wallet.nom;
                newElmt.setAttribute('value', wallet.id);
                elmtSaisieProfil.appendChild(newElmt);
            }
        });
    }

    const newElmt = document.createElement('option');
    newElmt.textContent = "AJOUTER UN WALLET";
    newElmt.setAttribute('value', "NEW");
    elmtSaisieProfil.appendChild(newElmt);
}

/**
 * VIDE LES CHAMPS DE LA PAGE DES PROFILS
 */
 function viderFormulaireProfil() {
    const elmtSaisieProfil = document.getElementById('saisieProfil');

    [...elmtSaisieProfil.children].forEach(elmt => {
        if (elmt.id !== "defaultWallet") {
            elmtSaisieProfil.removeChild(elmt);
        } 
    })

}


/**********************************
             PARAMETRES
**********************************/

/**
 * FAIT APPARAITRE LA PAGE DES PARAMETRES
 */
 function faireApparaitrePageParametres() {
    const idElmtsShow = ['params-container'];
    const idElmtsHide = ['container_principal'];
    util.changerDePage(idElmtsShow, idElmtsHide);
}

/**
 * FAIT DISPARAITRE LA PAGE DES PARAMETRES
 */
 function faireDisparaitrePageParametres() {
    const idElmtsShow = ['container_principal'];
    const idElmtsHide = ['params-container'];
    util.changerDePage(idElmtsShow, idElmtsHide);
    mettreAJourPortefeuille();
    gererAffichagePresentation();
}

/**
 * GESTION DU RETOUR APRES RESET
 */
function gererRetourApresReset() {
    const elmtGraph = document.getElementById('graph_container');

    if (elmtGraph.classList.contains("show")) {
        clickRetour();
    }

    faireDisparaitrePageParametres();
}


/**********************************
             FORMULAIRE
**********************************/

/** ----- LE FORMULAIRE SE REMPLIT GRACE A L'INDEX ------ */
function remplirFormulaire(index) {
    const objetVignette = recupererObjetVignette(index);
    document.getElementById('index').value = objetVignette.index;
    document.getElementById('saisieETF').value = objetVignette.etf;
    document.getElementById('saisieQuantite').value = objetVignette.quantite;
    document.getElementById('saisieCours').value = objetVignette.cours;
    document.getElementById('saisieJour').value = objetVignette.jour;
    document.getElementById('saisieMois').value = objetVignette.mois;
    document.getElementById('saisieAnnee').value = objetVignette.annee;
}

/**
 * FAIT APPARAITRE LA PAGE D'AJOUT/MODIFICATION D'ACHAT
 */
 function faireApparaitrePageFormulaire() {
    const idElmtsShow = ['ajout-container'];
    const idElmtsHide = ['container_principal'];
    util.changerDePage(idElmtsShow, idElmtsHide);

    logiqueFormulaire();
}

/**
 * LOGIQUE DU FORMULAIRE (CALCUL DU TOTAL)
 */
function logiqueFormulaire() {
    const elmtQuantite = document.getElementById('saisieQuantite');
    const elmtCours = document.getElementById('saisieCours');
    const elmtCommission = document.getElementById('saisieCommission');
    const elmtTotal = document.getElementById('form_total');
    const commission = 0;

    elmtCommission.value = 0.5;

    function remplirTotal() {
        if (elmtQuantite.value !== 0 && elmtCours.value !== 0) {
            commission = elmtCours.value * (elmtCommission.value / 100) * elmtQuantite.value;
            elmtTotal.textContent = formaterPrix((elmtQuantite.value * elmtCours.value) + commission);
        }
    }

    remplirTotal();

    elmtQuantite.oninput = event => {
        remplirTotal();
    }
    elmtCours.oninput = event => {
        remplirTotal();
    }
    elmtCommission.oninput = event => {
        remplirTotal();
    }

    ajouterEcouteurDate();
}

/**
 * NAVIGATION AUTO DANS LA DATE
 */
 function ajouterEcouteurDate() {
    const elmtJour = document.getElementById('saisieJour');
    const elmtMois = document.getElementById('saisieMois');
    const elmtAnnee = document.getElementById('saisieAnnee');
    const btnOK = document.getElementById('btn-ok');

    elmtJour.onkeyup = event => {
        if (saisieJour.value.length >= 2) {
            elmtMois.focus();
        }
    }

    elmtMois.onkeyup = event => {
        if (elmtMois.value.length >= 2) {
            elmtAnnee.focus();
        }
    }

    elmtAnnee.onkeyup = event => {
        if (elmtAnnee.value.length >= 4) {
            btnOK.focus();
        }
    }
}

/**
 * FAIRE DISPARAITRE LA PAGE D'AJOUT/MODIFICATION D'ACHAT
 */
function faireDisparaitrePageFormulaire() {
    const idElmtsShow = ['container_principal'];
    const idElmtsHide = ['ajout-container'];
    util.changerDePage(idElmtsShow, idElmtsHide);
    viderFormulaire();
}

/**
 * VIDE LE FORMULAIRE D'ACHAT
 */
function viderFormulaire() {
    const elmtFormulaire = document.getElementById('formulaire-container');
    const elmtTotal = document.getElementById('form_total');
    elmtTotal.textContent = 0;
    elmtFormulaire.reset();
}

/**
 * CONTROLE DE SAISIE DU FORMULAIRE
 */
 function controlerSaisie(objetAchat) {
    if (objetAchat.etf && 
        objetAchat.total !== 0 && 
        objetAchat.jour &&
        objetAchat.jour >= 1 &&
        objetAchat.jour <= 31 &&
        objetAchat.mois &&
        objetAchat.mois >= 1 &&
        objetAchat.mois <= 12 &&
        objetAchat.annee &&
        objetAchat.annee > 1900 &&
        objetAchat.annee <= new Date().getFullYear()) {

        objetAchat.jour = ('0' + objetAchat.jour).slice(-2);
        objetAchat.mois = ('0' + objetAchat.mois).slice(-2);
        return true
    }
    else {
        return false;
    }
}

/**
 * AJOUT DES ETFS DANS LE SELECT DU FORMULAIRE D'ACHAT
 */
 function ajouterETFsFormulaire() {
    const saisieETF = document.getElementById('saisieETF');

    for (const etf in ETFs) {
        const newElmt = document.createElement('option');
        newElmt.textContent = etf;
        newElmt.setAttribute('value', etf);
        saisieETF.appendChild(newElmt);
    }
}


/**********************************
              FICHIER
**********************************/

/** ----- ENREGISTREMENT DU FICHIER CSV SUR LE DEVICE ------ */
function uploadFichier(fichier) {
    const encodedUri = encodeURI(fichier);
    const link = document.createElement("a");
    const nomFichier = "etf_wallet.json";
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", nomFichier);
    document.body.appendChild(link);
    link.click();
    ouvrirPopinConfirmationUpload(nomFichier);
}

/** ----- SAUVEGARDE D'UN FICHIER AU FORMAT JSON ------ */
function sauvegardeJSON() {
    let fichierJSON = 'data:text/json;charset=utf-8,';
    if (storage && storage.length !== 0) {
        fichierJSON += JSON.stringify(storage);
        uploadFichier(fichierJSON);
    } else {
        ouvrirPopinErreurDonnees();
    }
}

function rechercheFichier() {
    const fileInput = document.querySelector( "#input-file" );
    fileInput.click();
}
 
function readFichier(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        let obj_json = new Object();
        reader.readAsBinaryString(input.files[0]);
        reader.onload = function (e) {
            obj_json.size = e.total;
            obj_json.dataFile = e.target.result;
            enregistrerDonneesFichier(obj_json.dataFile);
        }
    }
}
 
function enregistrerDonneesFichier(data){
    const donneesFichier = JSON.parse(data);

    if (donneesFichier && donneesFichier !== null && donneesFichier.length !== 0) {
        supprimerLocalStorage();
        storage = donneesFichier;
        profil = storage[0];
        ajoutLocalStorage();
        ouvrirPopinConfirmationDownload();
    }    
}


/**********************************
             FONCTIONS
**********************************/

/**
 * CREATION DU GRAPH DE STATS
 */
 function creerGraph() {
    let donneesGraph = [];

    for (const etf in objetQuantiteETF) {
        donneesGraph.push({
            name: etf.toString(),
            y: objetTotalETF[etf],
            z: objetCoursETFJSON[etf].close,
            pc: ((objetTotalETF[etf] * 100) / totalETFs).toFixed(2),
            t: formaterPrix(objetTotalETF[etf]) + " €",
            tpc: ((objetTotalETF[etf] * 100) / totalETFs).toFixed(0) + " %",
            pt : objetQuantiteETF[etf]
        });
    }

    Highcharts.chart('graph_container', {
        chart: {
            type: 'variablepie',
            styledMode: true
        },
        tooltip: {
            headerFormat: '',
            pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {point.name}</b><br/>' +
              'Total possédé : <b>{point.t}</b><br/>' +
              'Pourcentage : <b>{point.tpc}</b><br/>' +
              'Parts : <b>{point.pt}</b><br/>'
        },
        series: [{
            minPointSize: 60,
            innerSize: '20%',
            zMin: 0,
            data: donneesGraph
        }]
    });
}

/**
 * AFFICHE LA PRESENTATION DE L'APPLI SI LE LOCAL STORAGE EST VIDE
 */
function gererAffichagePresentation() {
    const elmtFleche = document.getElementById('fleche-presentation');
    const elmtPresentation = document.getElementById('presentation-container');

    if (profil.transactions.length == 0) {
        elmtFleche.classList.remove('hide');
        elmtPresentation.classList.remove('hide');
    }
    else {
        elmtFleche.classList.add('hide');
        elmtPresentation.classList.add('hide');
    }
}

/**
 * CONSTRUCTION DE L'URL DE LA REQUETE
 * @param {*} tableauETF 
 * @returns 
 */
function construireUrlAPIAvecETFs(tableauETF) {
    const premierETF = tableauETF[0].toString() + ".PA";
    let autresETF = "";
    if (tableauETF.length > 1) {
        autresETF += "&s=";
    }
    for (let i=1; i < tableauETF.length; i++) {
        autresETF += "," + tableauETF[i].toString() + ".PA";
    }

    return URL_API_BASE + premierETF + "?api_token=" + API_KEY + "&fmt=json" + autresETF;
}

/**
 * APPEL DE RECUPERATION DU COURS DES ETFs EN EURO
 * @param tableauETF
 * @returns objet JSON type Promise
 */
function recuperationCoursETFs(tableauETF) {
    const urlAPI = construireUrlAPIAvecETFs(tableauETF);
    return new Promise((resolve, reject) => {
        const storageData = JSON.parse(localStorage.getItem("data_etfwallet"));
        const cinqMinutes = 5 * 60000;
        let delaiAppel = 0;
        let objetData = {
            date: Date.now(),
            data: {}
        };

        if (storageData) {
            delaiAppel = Date.now() - storageData.date;
            if (delaiAppel < cinqMinutes) {
                console.log("[STORAGE] delai d'appel inf à 5 min");
                util.afficherElement("img-alert");
                return resolve(storageData.data);
            }
        }

        util.faireRequeteAPI("GET", urlAPI, null, isBouchon).then(reponse => {
            objetData.data = reponse;
            localStorage.setItem("data_etfwallet", JSON.stringify(objetData));
            util.cacherElement("img-alert");
            return resolve(reponse);
        }).catch(error => {
            util.afficherElement("img-alert");
            return reject(error.message);
        })
    });
}

/**
 * REMISE A ZERO DU PROFIL
 */
function remiseAZeroProfil() {
    profil = init.profilInitial;
    storage = [];
    storage.push(profil);
}

/**
 * REMISE A ZERO DES VARIABLES GLOBALES
 */
function remiseAZeroVariablesGlobales() {
    ExTotalETF = totalETFs;
    totalAchats = 0;
    totalETFs = 0;
    objetQuantiteETF = new Object();
    objetTotalETF = new Object();
    objetCoursETFJSON = new Object();
    objetAchatsETF = new Object();
}

/**
 * MET A JOUR LE PORTEFEUILLE
 */
function mettreAJourPortefeuille() {

    remiseAZeroVariablesGlobales();

    if (profil) {
        profil.transactions.forEach( elmt => {
            totalAchats += elmt.total;
            if (Object.keys(objetQuantiteETF).indexOf(elmt.etf) !== -1) {
                objetQuantiteETF[elmt.etf] += elmt.quantite;
                objetAchatsETF[elmt.etf] += elmt.total;
            }
            else {
                objetQuantiteETF[elmt.etf] = elmt.quantite;
                objetAchatsETF[elmt.etf] = elmt.total;
            }
        })
    }
    console.log("totalAchats : ", totalAchats);
    console.log("objetQuantiteETF : ", objetQuantiteETF);
    console.log("objetAchatsETF : ", objetAchatsETF);

    if (Object.keys(objetQuantiteETF).length !== 0) {
        recuperationCoursETFs(Object.keys(ETFs)).then(function(reponse) {
            console.log("réponse de l'API : ", reponse);
            construireObjetCoursETFJSON(reponse);
            calculerTotalETFs(objetCoursETFJSON);
            mettreAJourPortefeuilleTemplate();
            ajouterVignettesHTMLCours(objetCoursETFJSON);
            ajouterVignettesHTMLAchats();
        });
    }
    else {
        mettreAJourPortefeuilleTemplate();
        ajouterVignettesHTMLCours(objetCoursETFJSON);
    }
}

//** -----AFFICHE LES MAJ S'IL Y EN A----- */
function gestionMiseAJour() {
    const miseAJourOld = JSON.parse(localStorage.getItem("maj_etfwallet"));
    if (miseAJourOld) {
        if(miseAJourOld.date !== miseAJour.date) {
            localStorage.setItem("maj_etfwallet", JSON.stringify(miseAJour));
            ouverturePopinMAJ(miseAJour);
        }
    }
    else {
        localStorage.setItem("maj_etfwallet", JSON.stringify(miseAJour));
    }
}


/**********************************
               START
**********************************/

/**
 * LANCE LES FONCTIONS DE DEMARRAGE DE L'APP
 */
function onDocumentReady() {
    ajouterETFsFormulaire();
    recupererLocalStorage();
    gererAffichagePresentation();
    mettreAJourPortefeuille();
    gestionMiseAJour();
}

/** -----AU CHARGEMENT DU DOM----- */
document.onload = onDocumentReady();
