// Exécute un appel AJAX GET
// Prend en paramètres l'URL cible et la fonction callback appelée en cas de succès
function ajaxGet(url, callback) {
  var req = new XMLHttpRequest();
  var reponse = {
    status: "",
    responseText: ""
  };
  req.open("GET", url);
  req.addEventListener("readystatechange", function () {
    // XMLHttpRequest.DONE = réception totale des données (= 4)
    if ( req.readyState === XMLHttpRequest.DONE ) {
      reponse.status = req.status;
      reponse.responseText = req.responseText;
      callback(reponse);
    }
  });
  req.addEventListener("error", function () {
    console.error("Erreur réseau avec l'URL " + url);
    var error = {};
    error.state = 'error';
    error.result = 'Cross-Origin';
    callback(JSON.stringify(error));
  });
  req.send(null);
}


// Exécute un appel AJAX POST
// Prend en paramètres l'URL cible et la fonction callback appelée en cas de succès
function ajaxPost(url, body, callback) {
  var req = new XMLHttpRequest();
  req.open("POST", url);
  req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  req.withCredentials = true;
  req.addEventListener("readystatechange", function () {
    // XMLHttpRequest.DONE = réception totale des données (= 4)
    if ( req.readyState === XMLHttpRequest.DONE ) {
      if (req.status >= 200 && req.status < 400) {
          // Appelle la fonction callback en lui passant la réponse de la requête
          callback(req.responseText);
      } else {
          console.error(req.status + " " + req.statusText + " " + url);
          var error = {};
          error.state = 'error';
          error.result = req.status + " " + req.statusText;
          callback(JSON.stringify(error));
      }
    }
  });
  req.addEventListener("error", function () {
      console.error("Erreur réseau avec l'URL " + url);
      var error = {};
      error.state = 'error';
      error.result = 'Cross-Origin';
      callback(JSON.stringify(error));
  });
  req.send(body);
}


// FONCTION QUI MET EN PAUSE LE PROGRAMME
function sleep(milliseconds) {
console.log('------------------ ' + (milliseconds / 1000) + 's -----------------------');
const date = Date.now();
let currentDate = null;
do {
  currentDate = Date.now();
} while (currentDate - date < milliseconds);
}