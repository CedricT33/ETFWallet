/**********************************
                LOADER
**********************************/
const loader = (function() {


    //////////////////////////////////////////////////
    ///////////// FONCTIONS PRIVEES //////////////////
    //////////////////////////////////////////////////


    


    //////////////////////////////////////////////////
    ///////////// FONCTIONS PUBLIQUES ////////////////
    //////////////////////////////////////////////////

    /**
     * FONCTION QUI LANCE UN LOADER
     */
     function show() {
        var loaderElmt = document.getElementById('loader-container');
        loaderElmt.classList.remove('hide');
    }

    /**
     * FONCTION QUI LANCE UN LOADER
     */
     function hide() {
        var loaderElmt = document.getElementById('loader-container');
        loaderElmt.classList.add('hide');
    }
    

    //////////////////////////////////////////////////
    ////////////////// EXPOSITION ////////////////////
    //////////////////////////////////////////////////

    return {
        show: show,
        hide: hide
    };

})();