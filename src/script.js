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
var isBouchon = false;
/////////////////////

var urlAPIBase = "https://eodhistoricaldata.com/api/real-time/";
var apiKey = "614381e909d510.28957559";
// requetes max : 20/jour, 20/min
// exemple : https://eodhistoricaldata.com/api/real-time/CW8.PA?api_token=614381e909d510.28957559&fmt=json&s=ESE.PA,PANX.PA,PAASI.PA,RS2K.PA

/**********************************
            VERSION
**********************************/
var version = "02.00.000";


/**********************************
            CONSTANTES
**********************************/
var init = {
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

var storage = [];
var profil = init.profilInitial;
var profilSelected = 0;
var objetQuantiteETF = new Object();
var objetTotalETF = new Object();
var objetCoursETFJSON = new Object();
var objetAchatsETF = new Object();
var ExTotalETF = 0;
var totalAchats = 0;
var totalETFs = 0;
var miseAJour = init.miseAJour;
var ETFs = init.ETFs;


/**********************************
                SW
**********************************/

/**
 * PROPOSE A L'UTILISATEUR D'INSTALLER L'APPLICATION SUR SON TEL
 */
 function propositionInstallationApp() {
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
 * @returns prix format?? type String
 */
 function formatPrix(prix) {
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
    var tableauIndex = [];
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
        type === "pourcentage" ? symbole = " %" : symbole = " ???";
        end >= 0 && operator ? plusOuMoins = "+ " : plusOuMoins = "";
        operator ? parentheseG = "(" : parentheseG = "";
        operator ? parentheseD = ")" : parentheseD = "";
        obj.innerHTML = parentheseG + plusOuMoins + formatPrix(progress * (end - start) + start) + symbole + parentheseD;
        if (progress < 1) {
        window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * TRI DU STORAGE PAR DATE (CROISSANT)
 */
 function triStorageParDate() {
    if (profil) {
        profil.transactions.forEach( (donnee) => {
            var dateString = "" + donnee.annee + "-" + donnee.mois + "-" + donnee.jour;
            var date = Date.parse(dateString);
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
 * @param objetCoursETFs la r??ponse de l'API des cours d'ETF en JSON (reconstruite)
 */
 function calcultotalETFs(objetCoursETFs) {
    for (const etf in objetQuantiteETF) {
        objetTotalETF[etf] = objetCoursETFs[etf].close * objetQuantiteETF[etf];
    }
    console.log("objetTotalETF : ", objetTotalETF);
    for (const etf in objetTotalETF) {
        totalETFs += objetTotalETF[etf];
    }
    console.log("totalETFs : ", totalETFs);
}

/**
 * CREE LE JSON EN RETOUR DE L'APPEL DES COURS D'ETF
 * @param reponseAPI la r??ponse de l'API des cours d'ETF en JSON
 */
 function constructionObjetCoursETFJSON(reponseAPI) {
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
    console.log("objetCoursETFJSON : ", objetCoursETFJSON);
}


/**********************************
           UTILS TEMPLATE
**********************************/

/**
 * CONSTRUIT UN ELEMENT HTML
 */
 function creerElement(type, id, classes, content, attribut) {
    var newElmt = document.createElement(type);
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
function constructionVignetteCoursHTML(etf_nom, etf_complet, cours, coursEuro) {
    var achatTotalETF = objetAchatsETF[etf_nom];
    var quantiteTotalETF = objetQuantiteETF[etf_nom];
    var totalRentabiliteETF = (((coursEuro * quantiteTotalETF) - achatTotalETF) / achatTotalETF) * 100;
    var totalRentabiliteETFFormated = formatPrix(totalRentabiliteETF) + " %";
    var rentabiliteFinale = totalRentabiliteETF >= 0 ? "+" + totalRentabiliteETFFormated : totalRentabiliteETFFormated;
    var couleurRentabilite = totalRentabiliteETF >= 0 ? '' : ' negatif';

    var couleur = cours >= 0 ? '' : ' negatif';
    var pourcentage = formatPrix(cours) + " %";
    var elmtCoursConteneur = document.getElementById('cours_container');
    var elmtVignetteConteneur = creerElement('div', 0, 'vignette_cours');
    var elmtInfos = creerElement('div', 0, 'vignette_infos');
    var elmtNoms = creerElement('div', 0, 'vignette_noms');
    var elmtAcronymeETF = creerElement('div', 0, 'acronyme_etf', etf_nom);
    var elmtNomETF = creerElement('div', 0, 'nom_etf', etf_complet);
    var elmtPrix = creerElement('div', 0, 'vignette_prix');
    var elmtPrixETF = creerElement('div', 0, 'vignette_prix_ETF' + couleur, pourcentage);
    var elmtPrixTotal = creerElement('div', 0, 'vignette_prix_total');
    var elmtMotTotal = creerElement('div', 0, 'vignette_mot_total', "TOTAL : ");
    var elmtPrixTotalETF = creerElement('div', 0, 'vignette_prix_total_ETF' + couleurRentabilite, rentabiliteFinale);
    
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
 function constructionVignetteAchatsHTML(index, etf, quantite, total, date) {
    var prixAchat = formatPrix(total) + " ???";

    var rentabilite = ((objetCoursETFJSON[etf].close - (total/quantite)) / (total/quantite)) * 100;
    var rentabiliteFormated = formatPrix(rentabilite) + " %";
    var rentabiliteFinale = rentabilite >= 0 ? "+" + rentabiliteFormated : rentabiliteFormated;
    var couleur = rentabilite >= 0 ? '' : ' negatif';

    var elmtAchatsConteneur = document.getElementById('achats_container');
    var elmtVignetteConteneur = creerElement('div', 0, 'vignette_achats');
    var elmtInfos = creerElement('a', 0, 'vignette_infos', undefined, 'clickAccordeon(this)');
    var elmtNoms = creerElement('div', 0, 'vignette_noms');
    var elmtAcronymeETF = creerElement('div', 0, 'acronyme_etf', etf);
    var elmtNomETF = creerElement('div', 0, 'nom_etf', ETFs[etf]);
    var elmtAchat = creerElement('div', 0, 'vignette_achat');
    var elmtAchatPrix = creerElement('div', 0, 'vignette_achat_prix', prixAchat);
    var elmtAchatDate = creerElement('div', 0, 'vignette_achat_date', date);
    var elmtCoursAchat = creerElement('div', 0, 'vignette_cours_achat');
    var elmtCours = creerElement('div', 0, 'vignette_rentabilite' + couleur, rentabiliteFinale);
    var elmtQuantite = creerElement('div', 0, 'vignette_quantite', quantite);
    var elmtAccordeon = creerElement('div', 0, 'accordeon-content');
    var elmtSuppr = creerElement('a', 'suppr-' + index, 'btn-suppr', undefined, 'clickSuppr(this)');
    var elmtImgSuppr = creerElement('div', 0, 'img-suppr');
    var elmtTextSuppr = creerElement('div', 0, 'supprimer', 'Supprimer');
    var elmtModif = creerElement('a', 'modif-' + index, 'btn-modif', undefined, 'clickModif(this)');
    var elmtImgModif = creerElement('div', 0, 'img-modif');
    var elmtTextModif = creerElement('div', 0, 'modifier', 'Modifier');
    
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
 * @param objetCoursETFs la r??ponse de l'API des cours d'ETF en JSON (reconstruite)
 */
function ajoutVignettesHTMLCours(objetCoursETFs) {
    var etf_nom = '';
    var etf_complet = '';
    var cours = 0;
    var coursEuro = 0;

    suppressionVignettesCours();

    for (const etf in objetQuantiteETF) {
        etf_nom = etf;
        etf_complet = ETFs[etf];
        cours = objetCoursETFs[etf].change_p;
        coursEuro = objetCoursETFs[etf].close;
        constructionVignetteCoursHTML(etf_nom, etf_complet, cours, coursEuro);
    }
}

/**
 * SUPPRESSION PUIS CREATION VIGNETTES ACHATS
 */
 function ajoutVignettesHTMLAchats() {
    suppressionVignettesAchats();
    triStorageParDate();
    if (profil) {
        profil.transactions.forEach( (achat) => {
            var date = "" + achat.jour + "/" + achat.mois + "/" + achat.annee;
            constructionVignetteAchatsHTML(achat.index, achat.etf, achat.quantite, achat.total, date);
        })
    }
}

/**
 * MISE A JOUR DU PORTEFEUILLE DANS LE TEMPLATE AVEC ANIMATION
 */
function miseAJourPortefeuilleTemplate() {
    var elmtPortefeuilleNomProfil = document.getElementById('nom_profil');
    var elmtPortefeuilleTotal = document.getElementById('total');
    var elmtPortefeuilleGains = document.getElementById('gains-total');
    var elmtPortefeuillePoucentage = document.getElementById('pourcentage-total');
    var elmtPortefeuilleGainsJour = document.getElementById('gains-jour');
    var elmtPortefeuillePoucentageJour = document.getElementById('pourcentage-jour');

    elmtPortefeuilleNomProfil.textContent = profil.nom;

    var gains = totalETFs - totalAchats;
    var pourcentage = ((totalETFs - totalAchats)*100)/totalAchats;
    var totalETFsVeille = 0;
    for (var i = 0; i < Object.keys(objetQuantiteETF).length; i++) {
        var tableauETFs = Object.keys(objetQuantiteETF);
        totalETFsVeille += objetCoursETFJSON[tableauETFs[i]].previousClose * objetQuantiteETF[tableauETFs[i]]
    }
    var pourcentageVeille = (((totalETFsVeille - totalAchats) * 100 ) / totalAchats);
    var gainJour = totalETFs - totalETFsVeille;
    var pourcentageJour = pourcentage - pourcentageVeille;

    animateValue(elmtPortefeuilleTotal, ExTotalETF, totalETFs, 1000, "prix", false);
    animateValue(elmtPortefeuilleGains, 0, gains, 1000, "prix", false);
    animateValue(elmtPortefeuillePoucentage, 0, pourcentage, 1000, "pourcentage", false);
    animateValue(elmtPortefeuilleGainsJour, 0, gainJour, 1000, "prix", true);
    animateValue(elmtPortefeuillePoucentageJour, 0, pourcentageJour, 1000, "pourcentage", true);
}

/**
 * SUPPRIME LES VIGNETTES COURS
 */
 function suppressionVignettesCours() {
    var elmtConteneur = document.getElementById('cours_container');
    while (elmtConteneur.lastElementChild) {
        elmtConteneur.removeChild(elmtConteneur.lastElementChild);
    }
}

/**
 * SUPPRIME LES VIGNETTES ACHATS
 */
 function suppressionVignettesAchats() {
    var elmtConteneur = document.getElementById('achats_container');
    while (elmtConteneur.lastElementChild) {
        elmtConteneur.removeChild(elmtConteneur.lastElementChild);
    }
}


/**********************************
              STORAGE
**********************************/

/**
 * AJOUT DANS LE LOCAL STORAGE DU PROFIL SELECTIONNE
 */
 function ajoutLocalStorageProfilSelected() {
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
    ajoutLocalStorageProfilSelected();
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
    recuperationLocalStorage();
    miseAJourPortefeuille();
    gestionAffichagePresentation();
}

/** ----- RECUPERE L'OBJET DU LOCAL STORAGE AVEC L'INDEX ------ */
function recupererObjetVignette(index) {
    var element = {};
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
 function ajoutAchatLocalStorage(objetAchat) {
    // suppression de la donn??e si elle existe
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
 function recuperationProfil() {
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
 function recuperationLocalStorage() {
    storage = JSON.parse(localStorage.getItem("achats_etfwallet"));
    if (!storage) {
        storage = [];
        storage.push(profil);
    }
    majAncienneVersionStorage();
    recuperationProfil();
}

/**
 * MAJ STRUCTURE LOCALSTORAGE ANCIENNE VERSION (SANS PROFILS)
 */
function majAncienneVersionStorage() {
    if (Object.keys(storage[0]).indexOf("nom") === -1) {
        profil.transactions = storage;
        storage = [];
        storage.push(profil);
    }
}


/**********************************
            INTERACTIONS
**********************************/

/** ----- AU CLIC SUR LE BOUTON RESET ------ */
function clickReset() {
    ouverturePopinSuppressionTotale();
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
    var valueIndex = document.getElementById('index-popin').value;
    if (valueIndex !== 'version' && valueIndex !== 'maj' && valueIndex !== 'reset' && !valueIndex.includes('supprWallet')) {
        supprimerDonneeStorage(valueIndex);
        detruirePopin();
        clickRetour();
    } else if (valueIndex === 'reset') {
        supprimerLocalStorage();
        remiseAZeroProfil();
        miseAJourPortefeuille();
        gestionAffichagePresentation();
        detruirePopin();
        gestionRetourApresReset();
    } else if (valueIndex.includes('supprWallet')) {
        var index = valueIndex.split(':')[1];
        profil = storage[0];
        var storageIndex = storage.findIndex((wallet => wallet.id == index));
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
    var index = element.id.substr(6,1);
    var etf = "";
    document.getElementById('index-popin').value = index;
    storage.forEach( elmt => {
        if (elmt.index == index) {
            etf = elmt.etf;
        }
    })
    ouverturePopinSuppression(etf);
}

/** ----- AU CLIC SUR SUPPRIMER UN PROFIL ------ */
function clickSupprProfil() {
    var index = document.getElementById('suppr-profil').getAttribute('index');
    if (index != 1 && index != "NEW") {
        ouverturePopinSuppressionWallet(index);
    }
}

/** ----- AU CLIC SUR MODIFIER UNE VIGNETTE ------ */
function clickModif(element) {
    var index = element.id.substring(6);
    remplirFormulaire(index);  
    faireApparaitrePageFormulaire();
}

/**
 * AU CLIC SUR AJOUTER UN ACHAT (BOUTON +)
 */
function clickAjout() {
    propositionInstallationApp();
    faireApparaitrePageFormulaire(); 
}

/**
 * AU CLIC SUR LE BOUTON GRAPH
 */
 function clickGraph() {
    if (profil && profil.transactions.length !== 0 ) {
        var elemtDeco = document.getElementById('deco');
        var elemtTitre = document.getElementById('titre_vignettes');
        var idElmts = ['portefeuille-container', 'bitcoin', 'retour', 'graph', 'ajout', 'cours_container', 'achats_container', 'graph_container'];

        elemtDeco.classList.remove('wallet');
        elemtDeco.classList.add('stats');
        elemtTitre.textContent = "Transactions";
        creationGraph();
        FW.changementDePage(idElmts);
    }
    else {
        // TODO popin -> "Aucunes donn??es" ?
    }
}

/**
 * AU CLIC SUR RETOUR DE LA PAGE GRAPH (BOUTON <)
 */
 function clickRetour() {
    var elemtDeco = document.getElementById('deco');
    var elemtVignettesCours = document.getElementsByClassName('vignette_cours');
    var elemtTitre = document.getElementById('titre_vignettes');
    var idElmts = ['portefeuille-container', 'bitcoin', 'retour', 'graph', 'ajout', 'cours_container', 'achats_container', 'graph_container'];

    elemtDeco.classList.remove('stats');
    elemtDeco.classList.add('wallet');
    for (const element of elemtVignettesCours) {
        element.classList.add('animation');
    }   
    elemtTitre.textContent = "March??s";
    FW.changementDePage(idElmts);
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
    var elmtsAccordeons = document.getElementsByClassName("accordeon-content");
    var listClassElmt = element.nextElementSibling.classList;

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
    var elemtIndex = document.getElementById('index').value;
    var saisieETF = document.getElementById('saisieETF').value;
    var saisieQuantite = document.getElementById('saisieQuantite').value;
    var saisieCours = document.getElementById('saisieCours').value;
    var saisieCommission = document.getElementById('saisieCommission').value;
    var saisieJour = document.getElementById('saisieJour').value;
    var saisieMois = document.getElementById('saisieMois').value;
    var saisieAnnee = document.getElementById('saisieAnnee').value;
    var totalAchat = 0;
    var commission = 0;

    if (saisieQuantite !== 0 && saisieCours !== 0) {
        commission = saisieCours * (saisieCommission / 100) * saisieQuantite;
        totalAchat = (saisieQuantite * saisieCours) + commission;
    }

    var objetAchat = {
        index: elemtIndex ? Number(elemtIndex) : recupererIndexMax(),
        etf: saisieETF,
        quantite: Number(saisieQuantite),
        cours: Number(saisieCours),
        total: totalAchat,
        jour: saisieJour,
        mois: saisieMois,
        annee: saisieAnnee
    };

    var controleOK = controleSaisie(objetAchat);

    if (controleOK) {
        ajoutAchatLocalStorage(objetAchat);
        miseAJourPortefeuille();
        faireDisparaitrePageFormulaire();
        gestionAffichagePresentation();
    }
    else {
        //TODO -> popin erreur?
    }
}

/**
 * AU CLIC SUR OK DE LA PAGE PROFIL
 */
 function clickOKFormulaireProfil() {
    var elmtModifNom = document.getElementById('modifNom').value.toUpperCase();
    var elmtSaisieProfil = document.getElementById('saisieProfil').value;

    // modification du nom du wallet
    if (elmtSaisieProfil == profil.id && elmtModifNom !== profil.nom) {
        profil.nom = elmtModifNom;
        ajoutLocalStorage();
    }

    // ajout d'un nouveau wallet
    if (elmtSaisieProfil === "NEW") {
        var newId = storage.length + 1;
        var newNom = elmtModifNom.includes("PORTEFEUILLE") ? "PORTEFEUILLE " + newId : elmtModifNom;
        var isDejaNom = storage.find(wallet => { return wallet.nom === newNom});
        newNom = isDejaNom ? newNom.concat(newId) : newNom;
        var newProfil = {
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
        var storageIndex = storage.findIndex((wallet => wallet.id == elmtSaisieProfil));
        profil = storage[storageIndex];
    }
    
    ajoutLocalStorageProfilSelected();
    faireDisparaitrePageProfils();
}

/**********************************
               POPIN
**********************************/

//** -----DESTRUCTION POPIN----- */
function detruirePopin() {
    var elmtPopin = document.getElementById('popin');
    var elmtMasquePopin = document.getElementById('popin-masque');
    var elmtPopinTitre = document.getElementById('popin-titre');
    var elmtPopinCorps = document.getElementById('popin-corps');
  
    elmtPopinTitre.innerText = '';
    elmtPopinCorps.innerText = '';
    elmtPopin.classList.remove('open');
    elmtMasquePopin.classList.remove('open');
}

//** -----CREATION POPIN----- */
function creationPopin(titre, corps) {
    var elmtPopin = document.getElementById('popin');
    var elmtMasquePopin = document.getElementById('popin-masque');
    var elmtPopinTitre = document.getElementById('popin-titre');
    var elmtPopinCorps = document.getElementById('popin-corps');
  
    elmtPopinTitre.innerText = titre;
    elmtPopinCorps.innerText = corps;
    elmtPopin.classList.add('open');
    elmtMasquePopin.classList.add('open');
}

//** -----OUVERTURE POPIN SUPPRESSION----- */
function ouverturePopinSuppression(etf) {
    var titre = 'SUPPRESSION';
    var corps = 'Etes-vous s??r de vouloir supprimer cette transaction de ' + etf + ' ?';
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN SUPPRESSION WALLET----- */
function ouverturePopinSuppressionWallet(index) {
    document.getElementById('index-popin').value = 'supprWallet:' + index;
    var wallet = storage.find(wallet => { return wallet.id == index});
    var titre = 'SUPPRESSION';
    var corps = 'Etes-vous s??r de vouloir supprimer le wallet ' + wallet.nom + ' ?';
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN SUPPRESSION TOTALE----- */
function ouverturePopinSuppressionTotale() {
    document.getElementById('index-popin').value = 'reset';
    var titre = 'SUPPRESSION';
    var corps = "Etes-vous s??r de vouloir supprimer toutes les donn??es de l'application ?";
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN MAJ----- */
function ouverturePopinMAJ(miseAJour) {
    document.getElementById('index-popin').value = 'maj';
    var titre = 'NOUVEAUTEES';
    var corps = miseAJour.texte;
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN CONFIRMATION UPLOAD----- */
function ouverturePopinConfirmationUpload(nomFichier) {
    document.getElementById('index-popin').value = 'maj';
    var titre = 'UPLOAD';
    var corps = "Les donn??es ont ??t?? sauvegard??es dans le fichier " + nomFichier;
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN CONFIRMATION DOWNLOAD----- */
function ouverturePopinConfirmationDownload() {
    document.getElementById('index-popin').value = 'maj';
    var titre = 'DOWNLOAD';
    var corps = "Les donn??es ont ??t?? import??es dans l'application";
    creationPopin(titre, corps);
}

//** -----OUVERTURE POPIN ERREUR DONNEES----- */
function ouverturePopinErreurDonnees() {
    document.getElementById('index-popin').value = 'maj';
    var titre = 'ERREUR';
    var corps = "Il n' a pas de donn??e ?? enregistrer...";
    creationPopin(titre, corps);
}

/**********************************
             PROFILS
**********************************/

/**
 * FAIT APPARAITRE LA PAGE DES PROFILS
 */
 function faireApparaitrePageProfils() {
    var listIds = ['container_principal', 'profil-container'];
    remplirFormulaireProfil();
    ajouterEcouteurProfils();
    FW.changementDePage(listIds);
}

/**
 * FAIT DISPARAITRE LA PAGE DES PROFILS
 */
 function faireDisparaitrePageProfils() {
    var listIds = ['container_principal', 'profil-container'];
    var elmtGraph = document.getElementById('graph_container');

    if (elmtGraph.classList.contains("show")) {
        clickRetour();
    }

    viderFormulaireProfil();
    miseAJourPortefeuille();
    gestionAffichagePresentation();
    FW.changementDePage(listIds);
}

/**
 * AJOUTE UN ECOUTEUR SUR LA SELECTION D'UN NOUVEAU PROFIL
 */
function ajouterEcouteurProfils() {
    var elmtSaisieProfil = document.getElementById('saisieProfil');
    var elmtSuprrProfil = document.getElementById('suppr-profil');

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
    var elmtModifNom = document.getElementById('modifNom');
    var elmtSaisieProfil = document.getElementById('saisieProfil');
    var elmtDefaultWallet = document.getElementById('defaultWallet');

    elmtModifNom.value = profil.nom;
    elmtDefaultWallet.value = profil.id;
    elmtDefaultWallet.textContent = profil.nom;

    if (storage && storage.length !== 0) {
        storage.forEach(wallet => {
            if (wallet.id !== profil.id) {
                var newElmt = document.createElement('option');
                newElmt.textContent = wallet.nom;
                newElmt.setAttribute('value', wallet.id);
                elmtSaisieProfil.appendChild(newElmt);
            }
        });
    }

    var newElmt = document.createElement('option');
    newElmt.textContent = "AJOUTER UN WALLET";
    newElmt.setAttribute('value', "NEW");
    elmtSaisieProfil.appendChild(newElmt);
}

/**
 * VIDE LES CHAMPS DE LA PAGE DES PROFILS
 */
 function viderFormulaireProfil() {
    var elmtSaisieProfil = document.getElementById('saisieProfil');

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
    var listIds = ['container_principal', 'params-container'];
    FW.changementDePage(listIds);
}

/**
 * FAIT DISPARAITRE LA PAGE DES PARAMETRES
 */
 function faireDisparaitrePageParametres() {
    var listIds = ['container_principal', 'params-container'];
    FW.changementDePage(listIds);
    miseAJourPortefeuille();
    gestionAffichagePresentation();
}

/**
 * GESTION DU RETOUR APRES RESET
 */
function gestionRetourApresReset() {
    var elmtGraph = document.getElementById('graph_container');

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
    var objetVignette = recupererObjetVignette(index);
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
    var listIds = ['container_principal', 'ajout-container'];
    FW.changementDePage(listIds);

    logiqueFormulaire();
}

/**
 * LOGIQUE DU FORMULAIRE (CALCUL DU TOTAL)
 */
function logiqueFormulaire() {
    var elmtQuantite = document.getElementById('saisieQuantite');
    var elmtCours = document.getElementById('saisieCours');
    var elmtCommission = document.getElementById('saisieCommission');
    var elmtTotal = document.getElementById('form_total');
    var commission = 0;

    elmtCommission.value = 0.5;

    function remplirTotal() {
        if (elmtQuantite.value !== 0 && elmtCours.value !== 0) {
            commission = elmtCours.value * (elmtCommission.value / 100) * elmtQuantite.value;
            elmtTotal.textContent = formatPrix((elmtQuantite.value * elmtCours.value) + commission);
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
    var elmtJour = document.getElementById('saisieJour');
    var elmtMois = document.getElementById('saisieMois');
    var elmtAnnee = document.getElementById('saisieAnnee');
    var btnOK = document.getElementById('btn-ok');

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
    var listIds = ['container_principal', 'ajout-container'];
    FW.changementDePage(listIds);
    viderFormulaire();
}

/**
 * VIDE LE FORMULAIRE D'ACHAT
 */
function viderFormulaire() {
    var elmtFormulaire = document.getElementById('formulaire-container');
    var elmtTotal = document.getElementById('form_total');
    elmtTotal.textContent = 0;
    elmtFormulaire.reset();
}

/**
 * CONTROLE DE SAISIE DU FORMULAIRE
 */
 function controleSaisie(objetAchat) {
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
 function ajoutETFsFormulaire() {
    var saisieETF = document.getElementById('saisieETF');

    for (const etf in ETFs) {
        var newElmt = document.createElement('option');
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
    var encodedUri = encodeURI(fichier);
    var link = document.createElement("a");
    var nomFichier = "etf_wallet.json";
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", nomFichier);
    document.body.appendChild(link);
    link.click();
    ouverturePopinConfirmationUpload(nomFichier);
}

/** ----- SAUVEGARDE D'UN FICHIER AU FORMAT JSON ------ */
function sauvegardeJSON() {
    var fichierJSON = 'data:text/json;charset=utf-8,';
    if (storage && storage.length !== 0) {
        fichierJSON += JSON.stringify(storage);
        uploadFichier(fichierJSON);
    } else {
        ouverturePopinErreurDonnees();
    }
}

function rechercheFichier() {
    var fileInput = document.querySelector( "#input-file" );
    fileInput.click();
}
 
function readFichier(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        var obj_json = new Object();
        reader.readAsBinaryString(input.files[0]);
        reader.onload = function (e) {
            obj_json.size = e.total;
            obj_json.dataFile = e.target.result;
            enregistrerDonneesFichier(obj_json.dataFile);
        }
    }
}
 
function enregistrerDonneesFichier(data){
    var donneesFichier = JSON.parse(data);

    if (donneesFichier && donneesFichier !== null && donneesFichier.length !== 0) {
        supprimerLocalStorage();
        storage = donneesFichier;
        profil = storage[0];
        ajoutLocalStorage();
        ouverturePopinConfirmationDownload();
    }    
}


/**********************************
             FONCTIONS
**********************************/

/**
 * CREATION DU GRAPH DE STATS
 */
 function creationGraph() {
     var donneesGraph = [];

    for (const etf in objetQuantiteETF) {
        donneesGraph.push({
            name: etf.toString(),
            y: objetTotalETF[etf],
            z: objetCoursETFJSON[etf].close,
            pc: ((objetTotalETF[etf] * 100) / totalETFs).toFixed(2),
            t: formatPrix(objetTotalETF[etf]) + " ???",
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
              'Total poss??d?? : <b>{point.t}</b><br/>' +
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
function gestionAffichagePresentation() {
    var elmtFleche = document.getElementById('fleche-presentation');
    var elmtPresentation = document.getElementById('presentation-container');

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
 * APPEL D'API
 * @param urlAPI
 * @returns objet JSON type Promise
 */
 function appelAPI(urlAPI) {
    var storageData = JSON.parse(localStorage.getItem("data_etfwallet"));
    var objetData = {
        date: Date.now(),
        data: {}
    }
    return new Promise(function(resolve) {
        var elmtAlert = document.getElementById("img-alert");
        if (isBouchon) {
            var bouchon = creationBouchon(urlAPI);
            console.log("[APPEL BOUCHON]");
            objetData.data = bouchon;
            localStorage.setItem("data_etfwallet", JSON.stringify(objetData));
            elmtAlert.classList.remove('hide');
            resolve(bouchon);
        }
        else {
            console.log("[APPEL API]");
            ajaxGet(urlAPI, function (reponse) {
                if (reponse.status >= 200 && reponse.status < 400) {
                    objetData.data = JSON.parse(reponse.responseText);
                    localStorage.setItem("data_etfwallet", JSON.stringify(objetData));
                    elmtAlert.classList.add('hide');
                    resolve(JSON.parse(reponse.responseText));
                }
                else {
                    console.log("Error : ", reponse);
                    console.log("[APPEL STORAGE]");
                    elmtAlert.classList.remove('hide');
                    resolve(storageData.data);
                }
            });
        }
    });
}

/**
 * APPEL DE RECUPERATION DU COURS DES ETFs EN EURO
 * @param tableauETF
 * @returns objet JSON type Promise
 */
function recuperationCoursETFs(tableauETF) {
    var elmtAlert = document.getElementById("img-alert");
    var premierETF = tableauETF[0].toString() + ".PA";
    var autresETF = "";
    if (tableauETF.length > 1) {
        autresETF += "&s=";
    }
    for (var i=1; i < tableauETF.length; i++) {
        autresETF += "," + tableauETF[i].toString() + ".PA";
    }
    return new Promise(function(resolve) {
        var urlAPI = urlAPIBase  + premierETF + "?api_token=" + apiKey + "&fmt=json" + autresETF;
        var storageData = JSON.parse(localStorage.getItem("data_etfwallet"));

        if (storageData) {
            var delaiAppel = Date.now() - storageData.date;
            var cinqMinutes = 5 * 60000;
            if (delaiAppel < cinqMinutes) {
                console.log("[STORAGE] delai d'appel inf ?? 5 min : ", delaiAppel);
                elmtAlert.classList.remove('hide');
                resolve(storageData.data);
            }
            else {
                console.log("[APPEL] delai d'appel sup ?? 5 min : ", delaiAppel);
                elmtAlert.classList.add('hide');
                resolve(appelAPI(urlAPI));
            }
        }
        else {
            resolve(appelAPI(urlAPI));
        }
    });
}

/**
 * REMISE A ZERO DU PROFIL
 */
function remiseAZeroProfil() {
    profil = {
        id: 1,
        nom: "PORTEFEUILLE 1",
        transactions: []
    };
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
function miseAJourPortefeuille() {

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
            console.log("r??ponse de l'API : ", reponse);
            constructionObjetCoursETFJSON(reponse);
            calcultotalETFs(objetCoursETFJSON);
            miseAJourPortefeuilleTemplate();
            ajoutVignettesHTMLCours(objetCoursETFJSON);
            ajoutVignettesHTMLAchats();
        });
    }
    else {
        miseAJourPortefeuilleTemplate();
        ajoutVignettesHTMLCours(objetCoursETFJSON);
    }
}

//** -----AFFICHE LES MAJ S'IL Y EN A----- */
function gestionMiseAJour() {
    var miseAJourOld = JSON.parse(localStorage.getItem("maj_etfwallet"));
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
    ajoutETFsFormulaire();
    recuperationLocalStorage();
    gestionAffichagePresentation();
    miseAJourPortefeuille();
    gestionMiseAJour();
}

/** -----AU CHARGEMENT DU DOM----- */
document.onload = onDocumentReady();
