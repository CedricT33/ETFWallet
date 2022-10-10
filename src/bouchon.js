/**********************************
              BOUCHON 
**********************************/

function creerBouchon(urlAPI, bodyAPI) {
    var bouchonComplet = []
    var bouchonCW8 = {
        "code": "CW8.PA",
        "timestamp": 1631892900,
        "gmtoffset": 0,
        "open": 403.9288,
        "high": 404,
        "low": 400.3423,
        "close": 400.7661,
        "volume": 4986,
        "previousClose": 401.98,
        "change": -1.2139,
        "change_p": -0.302
    };
    var bouchonESE = {
        "code": "ESE.PA",
        "timestamp": 1631892900,
        "gmtoffset": 0,
        "open": 18.2915,
        "high": 18.2915,
        "low": 18.1593,
        "close": 18.1824,
        "volume": 45469,
        "previousClose": 18.2,
        "change": -0.0176,
        "change_p": -0.0967
    };
    var bouchonPANX = {
        "code": "PANX.PA",
        "timestamp": 1631892900,
        "gmtoffset": 0,
        "open": 38.117,
        "high": 38.144,
        "low": 37.731,
        "close": 37.731,
        "volume": 3035,
        "previousClose": 37.83,
        "change": -0.099,
        "change_p": -0.2617
    };
    var bouchonPAASI = {
        "code": "PAASI.PA",
        "timestamp": 1631892900,
        "gmtoffset": 0,
        "open": 24.872,
        "high": 24.946,
        "low": 24.789,
        "close": 24.812,
        "volume": 26717,
        "previousClose": 24.769,
        "change": 0.043,
        "change_p": 0.1736
    };
    var bouchonRS2K = {
        "code": "RS2K.PA",
        "timestamp": 1631892900,
        "gmtoffset": 0,
        "open": 272.7094,
        "high": 272.8088,
        "low": 270.091,
        "close": 272.0711,
        "volume": 340,
        "previousClose": 270.9795,
        "change": 1.0916,
        "change_p": 0.4028
    };

    if (urlAPI.indexOf("CW8") !== -1) {
        bouchonComplet.push(bouchonCW8);
    }
    if (urlAPI.indexOf("ESE") !== -1) {
        bouchonComplet.push(bouchonESE);
    }
    if (urlAPI.indexOf("PANX") !== -1) {
        bouchonComplet.push(bouchonPANX);
    }
    if (urlAPI.indexOf("PAASI") !== -1) {
        bouchonComplet.push(bouchonPAASI);
    }
    if (urlAPI.indexOf("RS2K") !== -1) {
        bouchonComplet.push(bouchonRS2K);
    }
    return bouchonComplet;
}

function creerBouchonZero() {
    return [
        {
            "code": "CW8.PA",
            "close": 0,
            "previousClose": 0,
            "change_p": 0
        },
        {
            "code": "ESE.PA",
            "close": 0,
            "previousClose": 0,
            "change_p": 0
        },
        {
            "code": "PANX.PA",
            "close": 0,
            "previousClose": 0,
            "change_p": 0
        },
        {
            "code": "PAASI.PA",
            "close": 0,
            "previousClose": 0,
            "change_p": 0
        },
        {
            "code": "RS2K.PA",
            "close": 0,
            "previousClose": 0,
            "change_p": 0
        }
    ]
}