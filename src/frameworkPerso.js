/**
 * Fonction appelée pour le débranchement
 * @param {[string]} listIds tableau d'id des éléments à faire apparaitre/dispraitre.
 */
function changementDePage(listIds) {
    listIds.forEach(id => {
        document.getElementById(id).classList.toggle('hide');
        document.getElementById(id).classList.toggle('show');
    });
}

var FW = {
    changementDePage : changementDePage
};