/*
JSXGraph namespaces JS
This file is developed for the use of JSXGraph in Moodle (STACK Questions and Moodle Filter).
Author: Bernhard Gailer, OTH Amberg-Weiden.
Latest changes: 10/10/2022
*/


/*------------------------------------------------------------------------------------------------------------------*/


/** Namensraum für Workarounds aufgrund der STACK-Version */
var idealJSXGraphWorkarounds = new function () {

    /** Max Boundingbox (param bounds kann Zahl oder Array sein) */
    this.maxBounds = function (board, bounds = 2) {
        const bb1 = Number.isFinite(bounds) ? board.getBoundingBox().map(x => x * bounds) : bounds;
        let xDiff1 = Math.abs(bb1[0] - bb1[2]);
        let yDiff1 = Math.abs(bb1[1] - bb1[3]);
        let bb21, bb22;
        board.on("update", function () {
            bb22 = board.getBoundingBox(); // new boundingbox
            let xDiff2 = Math.abs(bb22[0] - bb22[2]);
            let yDiff2 = Math.abs(bb22[1] - bb22[3]);
            if (xDiff2 > xDiff1 || yDiff2 > yDiff1) {
                board.setBoundingBox(bb21)
            } else {
                bb21 = board.getBoundingBox(); // new is now current
            }
        })
    }


    /** Anzeigen und Verbergen von Slidern. 
     * Kann auch mit dem Wert 'inherit' für die Attribute baseline und highline des Slider-Elements gemacht werden.
     */
    this.setSliderVis = function (slider, visible = false) {
        for (let [key, val] of Object.entries(slider.ancestors)) {
            /* Punkte bleiben unsichtbar */
            if (val.elementClass != JXG.OBJECT_CLASS_POINT) {
                val.setAttribute({ visible: visible })
            }
        }
        for (let [key, val] of Object.entries(slider.childElements)) {
            val.setAttribute({ visible: visible })
        }
        slider.setAttribute({ visible: visible });
		slider.setAttribute({ withLabel: visible });
    }


    /** Slidern auf aktuelle Position festsetzen */
    this.setSliderFrozen = function (slider, frozen = true) {
        for (let [key, val] of Object.entries(slider.ancestors)) {
            /* Punkte bleiben unsichtbar */
            val.setAttribute({ frozen: frozen })
        }
        for (let [key, val] of Object.entries(slider.childElements)) {
            val.setAttribute({ frozen: frozen })

        }
        slider.setAttribute({ frozen: frozen })
    }


    /** Factory-Funktion zum Erstellen einer Vollbild Schaltfläche auf dem Board  
     * @param {Object} board - JSXGraph board element
     * @param {boolean} [responsive=false] - Ist das Board responsive (mit Wrapper-Div)?
     * @param {boolean} [responsiveNew=false] - Ist das Board responsive (ab Version 1.3.0 ohne Wrapper-Div)?
     * @returns {Object} - JSXGraph Text Element 
    */
    this.createFullscreenElement = function (board, responsive = false, responsiveNew = false) {
        /* Vollbildmodus Element */
        const fullscreenElement = board.create("text", [board.getBoundingBox()[2], board.getBoundingBox()[3],
        function () { return board.containerObj.parentNode.classList.contains("jsxgraph-fullscreen-wrapper") ? "Vollbild verlassen &#8690;" : "Vollbildmodus &#8689;" }], {
            highlight: false, anchorX: "right", anchorY: "bottom",
            strokeColor: "#333333",  // Farbe passt zur JSXGraph Navbar
            frozen: true, fixed: true,
            cssClass: "ideal-jsxgraph-fullscreen-element"
        })
        /* Eventlistener Fullscreen Text Element */
        document.getElementById(fullscreenElement.rendNode.id).addEventListener("pointerdown", function () {
            /* Befinden wir uns im Vollbildmodus? */
            if (!document.fullscreenElement && !document.webkitIsFullScreen) {
                /* Vollbildmodus-Methode aus Workarounds Namespace */
                responsive && responsiveNew ? boardToFullscreenResponsiveNew('jxgbox') : responsive ? boardToFullscreenResponsive('jxgbox') : boardToFullscreenStatic('jxgbox', board);
            } else {
                /* Vollbildmodus verlassen */
                if (document.exitFullscreen) { document.exitFullscreen() }
                else if (document.webkitExitFullscreen) { document.webkitExitFullscreen() } // Safari
            }
        })
        /* Element zurückgeben */
        return fullscreenElement
    }


    /** Vollbildmodus Responsive  */
    var boardToFullscreenResponsive = function (id) {
        var wrapId, wrapNode, innerNode, parentNode, containerNode;

        /* HTML Elements */
        innerNode = document.getElementById(id);
        responsiveNode = innerNode.parentElement
        parentNode = responsiveNode.parentElement

        /* Check for our custom responsive container div */
        if (!responsiveNode.classList.contains("ideal-jsxgraph-board-responsive-container")) {
            console.error("no responsive container with class 'ideal-jsxgraph-board-responsive-container' found; make sure to include 'makeBoardResponsive' from the workarounds namespace");
            return;
        }

        /* Wrapper ID */
        wrapId = 'ideal-fullscreenwrap-' + id;

        /* Wrapper div um die JSXGraph div herum */
        if (document.getElementById(wrapId)) {
            wrapNode = document.getElementById(wrapId);
        } else {
            wrapNode = document.createElement('div');
            wrapNode.setAttribute('id', wrapId);
            wrapNode.classList.add("ideal-jsxgraph-fullscreen-wrapper");
            parentNode.insertBefore(wrapNode, responsiveNode);
            wrapNode.appendChild(responsiveNode);
        }

        /* Breite auslesen */
        initialWidth = window.getComputedStyle(responsiveNode).getPropertyValue('max-width');
        //console.log(initialWidth)

        if (initialWidth == "") {
            console.error("wrapper needs the style attribute 'max-width'")
            return;
        }

        /* New max-width */
        let maxWidth = (innerNode.clientWidth / innerNode.clientHeight) * (screen.height - 40) + "px";
        let tmpMaxWidth = responsiveNode.style.maxWidth;
        responsiveNode.style.maxWidth = maxWidth;

        /* HTML5 Fullscreen API */
        if (wrapNode.requestFullscreen) {
            wrapNode.requestFullscreen().then(
                () => console.info("board " + id + " now in fullscreen mode"),
                () => { wrapNode.replaceWith(...wrapNode.childNodes); }
            )
        }

        /* Listener für Fullscreenchange Event */
        document.addEventListener('fullscreenchange', function () {
            /* Fullscreen Exit? */
            if (!document.fullscreenElement) {
                wrapNode.replaceWith(...wrapNode.childNodes); // Wrapper div vom DOM entfernen
                responsiveNode.style.maxWidth = tmpMaxWidth;
                console.info("fullscreenmode for board " + id + " ended") // Log some info
                board.update();
            }
        });
    }


    /** Vollbildmodus Responsive  */
    var boardToFullscreenResponsiveNew = function (id) {
        let wrapId, wrapNode, innerNode, parentNode, containerNode;

        /* HTML Elements */
        innerNode = document.getElementById(id);
        parentNode = innerNode.parentElement

        if (!parentNode.classList.contains("ideal-jsxgraph-board-parent")) {
            console.error("no parent div with class 'ideal-jsxgraph-board-parent' found");
            return;
        }

        /* Wrapper ID */
        wrapId = 'ideal-fullscreenwrap-' + id;

        /* Wrapper div um die JSXGraph div herum */
        if (document.getElementById(wrapId)) {
            wrapNode = document.getElementById(wrapId);
        } else {
            wrapNode = document.createElement('div');
            wrapNode.setAttribute('id', wrapId);
            wrapNode.classList.add("ideal-jsxgraph-fullscreen-wrapper");
            parentNode.insertBefore(wrapNode, innerNode);
            wrapNode.appendChild(innerNode);
        }

        /* Breite auslesen */
        initialWidth = window.getComputedStyle(innerNode).getPropertyValue('max-width');
        //console.log(initialWidth)

        /* New max-width */
        let maxWidth = (innerNode.clientWidth / innerNode.clientHeight) * (screen.height - 40) + "px";
        let tmpMaxWidth = innerNode.style.maxWidth;
        innerNode.style.maxWidth = maxWidth;

        /* HTML5 Fullscreen API */
        if (wrapNode.requestFullscreen) {
            wrapNode.requestFullscreen().then(
                () => console.info("board " + id + " now in fullscreen mode"),
                () => { wrapNode.replaceWith(...wrapNode.childNodes); }
            )
        }

        /* Listener für Fullscreenchange Event */
        document.addEventListener('fullscreenchange', function () {
            /* Fullscreen Exit? */
            if (!document.fullscreenElement) {
                wrapNode.replaceWith(...wrapNode.childNodes); // Wrapper div vom DOM entfernen
                innerNode.style.maxWidth = tmpMaxWidth;
                console.info("fullscreenmode for board " + id + " ended") // Log some info
                board.update();
            }
        });
    }


    /** Board im Vollbildmodus 
     * Erstellt eine Wrapper Div um das JSXGraph Board und passt die Höhe und Breite des Boards beim Vollbild-Event an.
     * @param {string} id - Board ID
     * @param {Object} board - JSXGraph board element
     * @param {number} [scale=2] - Skalierung des Boards im Vollbild (Wenn Wert zu hoch, dann ANpassung an Bildschirm)
    */
    var boardToFullscreenStatic = function (id, board, scale = 2) {
        let wrapId, wrapNode, innerNode, parentNode;

        /* HTML Elements */
        innerNode = document.getElementById(id);
        parentNode = innerNode.parentElement

        /* Wrapper ID */
        wrapId = 'ideal-fullscreenwrap-' + id;

        /* Wrapper div um die JSXGraph div herum */
        if (document.getElementById(wrapId)) {
            wrapNode = document.getElementById(wrapId);
        } else {
            wrapNode = document.createElement('div');
            wrapNode.setAttribute('id', wrapId);
            wrapNode.classList.add("ideal-jsxgraph-fullscreen-wrapper");
            parentNode.insertBefore(wrapNode, innerNode);
            wrapNode.appendChild(innerNode);
        }

        /* Höhe und Breite auslesen */
        var initialWidth = innerNode.style.width;
        var initialHeight = innerNode.style.height;

        /* HTML5 Fullscreen API */
        if (wrapNode.requestFullscreen) {
            wrapNode.requestFullscreen().then(
                () => { console.info("board " + id + " now in fullscreen mode"); resizeCalc(board, initialWidth, initialHeight, scale); },
                () => { wrapNode.replaceWith(...wrapNode.childNodes); }
            )
        }

        /* Listener für Fullscreenchange Event */
        document.addEventListener('fullscreenchange', function () {
            /* Fullscreen Exit? */
            if (!document.fullscreenElement) {
                wrapNode.replaceWith(...wrapNode.childNodes); // Wrapper div vom DOM entfernen
                resizeBoardOnce(board, initialWidth, initialHeight); // Board Resize
                console.info("fullscreenmode for board " + id + " ended") // Log some info
                board.update();
            }
        });

    }



    /** Responive Board
     * Erstellt eine Wrapper-div mit Resizing-Funktion für das JSXGraph Board. 
     * @param {string} board - JSXGraph Board
     * @param {number} timeBetweenResizeCalls - Zeitintervall zur Drosselung der Resize-Aufrufe auf dem Board
     * @param {boolean} needsWrapper - In Versionen < 1.3.0 wird das responsive Verhalten durch eine Wrapper Div hervorgerufen; bei Resize-Events wird dann die statischen Abmessungen der JSXGraph div angepasst. In Versionen <= 1.3.0 reicht es aus, die JSXGraph Div mit dem jxgnew Styles auszustatten, wodurch keine Wrapper div mehr gebraucht wird. Dieser Fall kommt z.B. vor, wenn wir mit STACK JSXGraph mit Version >=1.3.0 nutzen, da hier nur statische Abmessungen für das Board im Block angegeben werden können. 
     */
    this.makeBoardResponsive = function (board, timeBetweenResizeCalls=200, needsWrapper = true) {
        /* Variablen */
        let resizeTimeout, width, height;

        /* JSXGRaph Applet */
        const appletDiv = board.containerObj;

        /* Kein Wrapper gebraucht (Version >= 1.3.0) */
        if (!needsWrapper) {
            /* jxgnew Styles */
            appletDiv.style.aspectRatio = appletDiv.clientWidth + "/" + appletDiv.clientHeight;
            appletDiv.style.maxWidth = appletDiv.clientWidth + "px";
            appletDiv.style.margin = "0 auto"; // mittig platzieren
            appletDiv.style.overflow = "hidden";
            /* Inline-Styles löschen */
            appletDiv.style.removeProperty("width");
            appletDiv.style.removeProperty("height");
            return
        }

        /* Responsive Container erstellen */
        appletDiv.style.boxSizing = "border-box"; // wichtig
        const responsiveWrapperDiv = document.createElement("div");
        responsiveWrapperDiv.classList.add("ideal-jsxgraph-board-responsive-container")
        /* Styles des responsive div */
        /* Aspect ratio und max Width aus den statischen Abmessungen der Applet div erstellen */
        responsiveWrapperDiv.style.aspectRatio = appletDiv.clientWidth + "/" + appletDiv.clientHeight;
        responsiveWrapperDiv.style.maxWidth = appletDiv.clientWidth + "px";
        responsiveWrapperDiv.style.margin = "0 auto"; // mittig platzieren
        responsiveWrapperDiv.style.overflow = "hidden";
        appletDiv.parentNode.replaceChild(responsiveWrapperDiv, appletDiv);
        responsiveWrapperDiv.appendChild(appletDiv);

        /* Eventlistener Resize beim Laden des Dokuments und beim Resize-Event des Fensters */
        document.addEventListener("DOMContentLoaded", resizer);
        window.addEventListener("resize", resizer);

        /** Resize Board (Drosselung der Aufrufe mit setTimeout) */
        function resizer() {
            /* Container div vom Board */
            let boardContainer = document.getElementById(board.container)
            if (!resizeTimeout) {
                console.info(board.id + " is resizing");
                resizeTimeout = setTimeout(function () {
                    resizeTimeout = null;
                    /* Höhe und Breite für Applet div berechen (aus responsive container) */
                    width = responsiveWrapperDiv.getBoundingClientRect().width;
                    height = responsiveWrapperDiv.getBoundingClientRect().height;
                    /* Höhe und Breite zurücksetzen */
                    boardContainer.style.width = "";
                    boardContainer.style.height = "";
                    /* JSXGraph Resizer Funktion aufrufen */
                    let elements = board.select({ frozen: true })
                    elements.setAttribute({ frozen: false })
                    board.resizeContainer(width, height);
                    /* Elementposition auf dem Board fest */
                    elements.setAttribute({ frozen: true })
                }, timeBetweenResizeCalls);
            }
        }

    }


    /** Resize-Berechnung Vollbildmodus */
    var resizeCalc = function (board, initialWidth, initialHeight, scale) {
        /* Board Resize */
        if (initialWidth > initialHeight) {
            if (parseInt(initialWidth) * scale <= screen.width - 40) { resizeBoardOnce(board, parseInt(initialWidth) * scale, parseInt(initialHeight) * scale); }
            else { resizeBoardOnce(board, screen.width * 0.9, (parseInt(initialHeight) / parseInt(initialWidth)) * (screen.width * 0.9)); }
        }
        else {
            if (parseInt(initialHeight) * scale <= screen.height - 40) { resizeBoardOnce(board, parseInt(initialWidth) * scale, parseInt(initialHeight) * scale); }
            else { resizeBoardOnce(board, (parseInt(initialHeight) / parseInt(initialWidth)) * (screen.height * 0.9), screen.height * 0.9); }
        }
    }


    /** Einmaliges Resizing des Boards */
    var resizeBoardOnce = function (board, width, height) {
        /* Elementposition auf dem Board variabel */
        let elements = board.select({ frozen: true })
        elements.setAttribute({ frozen: false })
        /* Container div vom Board */
        let boardContainer = document.getElementById(board.container)
        /* Höhe und Breite zurücksetzen */
        boardContainer.style.width = "";
        boardContainer.style.height = "";
        /* Resize Methode */
        board.resizeContainer(width, height);
        /* Elementposition auf dem Board fest */
        elements.setAttribute({ frozen: true })
    }
}


/*------------------------------------------------------------------------------------------------------------------*/


/** Namensraum für Utils */
var idealJSXGraphUtils = new function () {

    /** JSXGraph Element (z.B. Text) fokussieren */
    this.focusElement = function (element) {
        if (!element.rendNode.hasAttribute("tabindex")) {
            /* Tabindex */
            element.rendNode.setAttribute("tabindex", "-1");
        }
        /* Fokus mit Scrolling */
        document.getElementById(element.rendNode.id).focus();
    }


    /** Board in den Viewport scrollen */
    this.scrollToBoard = function (board, offset = 50) {
        //console.log(board.containerObj.getBoundingClientRect().top);
        if (board.containerObj.getBoundingClientRect().top < offset) {
            /* Custom Methoden zum Element prototyp dazupacken */
            Element.prototype.documentOffsetTop = function () {
                return this.offsetTop + (this.offsetParent ? this.offsetParent.documentOffsetTop() : 0);
            };
            Element.prototype.scrollIntoViewOffset = function () {
                window.scrollTo(0, this.documentOffsetTop() - offset);
            };
            /* JSXGraph div suchen und custom Methode aufrufen */
            document.getElementById(board.containerObj.id).scrollIntoViewOffset();
        }
    }


    /** Bruchdarstellung einer Kommazahl */
    this.makeFrac = function (number, tfrac = false) {
        /* Wenn NaN, undefined oder Infinity, dann return */
        if (number == NaN || number == Infinity || number == undefined) return ""
        /* Wenn number eine Ganzzahl (Integer) ist, dann geben wir sofort number zurück */
        if (Number.isInteger(number)) return number
        /* Nenner und Zähler aufstellen */
        let len = Math.abs(number).toString().length - 2;
        let denominator = Math.pow(10, len); // Nenner mit Zehnerpotenz
        let numerator = Math.abs(number) * denominator; // Zähler (Zahl nach dem Komma)
        /* grössten gemeinsamen Teiler finden */
        let divisor = gcd(numerator, denominator);
        /* Teilen */
        numerator /= divisor;
        denominator /= divisor;
        /* Zähler und Nenner in Array zurückgeben */
        let frac = tfrac ? "\\tfrac" : "\\frac"
        let expression = frac + "{" + Math.abs(Math.floor(numerator)) + "}" + "{" + Math.abs(Math.floor(denominator)) + "}";
        return number < 0 ? "-" + expression : expression
        /* Grösster gemeinsamer Teiler */
        function gcd(a, b) {
            if (b < 0.000001) return a;
            return gcd(b, Math.floor(a % b));
        }
    }

    /** Neue STACK divid konstruieren (Zum Erstellen von mehreren Boards in einem JSXGraph Block) */
    this.constructDivids = function(numberOfBlocks, divid) {
        /* Array für die divids */
        const divids = [divid];
        const parts = divid.split('-');
        let number = Number(parts[2]);
        /* Loop */
        for(let i=numberOfBlocks-1; i>=1; i--) {
            console.log("ok");
            number--;
            let divid = parts[0].concat("-", parts[1]).concat("-", number)
            divids.unshift(divid)
        }
        return divids
    }

}


/*------------------------------------------------------------------------------------------------------------------*/


/** Namensraum für STACK Input Binding */
var idealJSXGraphSTACKBindings = new function () {

    /** Input zum Start manuell mit Standardwerten oder den Werten im Input (dadurch gilt die Aufgabe auch ohne Bewegen von Elementen als bearbeitet).
     * Wenn eine Filter-CSS-Klasse gefunden wird, dann werden keine Standardwerte in den Input geschrieben.
    * Wir brauchen kein doppeltes Binding; die Konstruktion soll vom Input aus nur beim Laden des Dokuments angepasst werden. 
    * Wir warten auf die laut Doku verfügbaren Utility-Funktionen stack_jxg.starts_moved(object) und stack_jxg.define_group(list) aus STACK 4.4, die uns hier helfen könnten. 
    */
    this.handleStateRef = function (board, stateRef, elements, defaultValue, filterClass = "", changeFunc = null) {
        /* Eventlistener DOM geladen und geparsed */
        document.addEventListener("DOMContentLoaded", function (event) {
            /* Input Element */
            const stateInput = document.getElementById(stateRef);
            const boardDiv = document.getElementById(board.containerObj.id)
            /* Filter da? */
            const isFilterThere = ((filterClass == "" ? null : boardDiv.closest("." + filterClass)) == null) ? false : true;
            /* State zum Start der Frage anpassen mit Standardwert, wenn kein Blur-Filter */
            if (stateInput && stateInput.value == '' && !isFilterThere) {
                document.getElementById(stateRef).value = JSON.stringify(defaultValue);
                /*State nach dem Prüfen oder Abschicken der Frage anpassen */
            } else if (stateInput && stateInput.value != '' && changeFunc) {
                /* Aufruf einer Parameter-Funktion zum Anpassen der JSXGraph-Konstruktion */
                changeFunc(elements, stateRef);
            }
            /* Binding mit dem Inpufeld */
            if (stateInput && stateInput.value != '' && changeFunc && !isFilterThere) {
                /* Input Eventlistener (input und change) */
                stateInput.addEventListener('input', (event) => {
                    changeFunc(elements, stateRef);
                });
                stateInput.addEventListener('change', (event) => {
                    changeFunc(elements, stateRef);
                });
            }
        });
    }

    /** Input auslesen (Getter) */
    this.getStateRef = function (stateRef, defaultValue) {
        var state = defaultValue;
        const stateInput = document.getElementById(stateRef);
        if (stateInput.value && stateInput.value != '') {
            state = JSON.parse(stateInput.value);
        }
        return state;
    }

    /** Neuen Inputwert setzen (Setter) */
    this.setStateRef = function (stateRef, newValue) {
        document.getElementById(stateRef).value = JSON.stringify(newValue);
    }

}


/*------------------------------------------------------------------------------------------------------------------*/


/** Namensraum für Feedback */
var idealJSXGraphFeedback = new function () {


    /** Check, ob PRT-Feedback nach dem Board vorkommt. Wenn ja, dann wird die Callback-Funktion aufgerufen. */
    this.prtFeedbackBelowBoard = function (board, callback, fbClass) {
        /* Variablen */
        var check = false;
        /* Board div und STACK Frage */
        let boardDiv = document.getElementById(board.containerObj.id);
        /* Alle parent divs mit der ideal jsxgraph Klasse suchen */
        let boardDivParents = [];
        let element = boardDiv.parentElement;
        while (/ideal-jsxgraph/.test(element.classList)) {
            boardDivParents.unshift(element);
            element = element.parentNode;
        }
        let theBoardDiv = boardDivParents.length > 0 ? boardDivParents[0] : boardDiv;
        /* Board ohne weitere div in STACK Frage */
        for (child of theBoardDiv.parentElement.children) {
            if (check) {
                /* Feedback kann in div oder span sein (standard oder kompaktes feedback) */
                if (child.classList.contains("stackprtfeedback") && child.querySelector("." + fbClass)) {
                    /* Callback Funktion aufrufen */
                    callback();
                    console.info("board changed because feedback was given");
                }
            }
            /* Div gefunden, Suche kann starten */
            if (child.id = board.containerObj.id || /ideal-jsxgraph/.test(child.className)) { check = true }
        }
    }

    /** Check, ob Feedback in der STACK-Frage vorkommt. */
    this.prtFeedbackInQuestion = function (board, callback) {
        /* Board div und STACK Frage */
        let boardDiv = document.getElementById(board.containerObj.id);
        let stackQuestion = boardDiv.closest("div.que.stack")
        if (stackQuestion.querySelector("div.stackprtfeedback")) {
            let feedback = stackQuestion.querySelector("div.stackprtfeedback").firstElementChild.className;
            /* Callback Funktion aufrufen */
            callback(feedback);
            console.info("board changed because feedback was given");
        }
    }

    /** Check, ob Feedback mit ID in der Frage vorkommt. */
    this.prtFeedbackById = function (board, elType, id, callback) {
        /* Board div und STACK Frage */
        let boardDiv = document.getElementById(board.containerObj.id);
        let stackQuestion = boardDiv.closest("div.que.stack")
        /* Bei formativem Feedback wird auf eine Klasse geprüft */
        if (stackQuestion.querySelector(elType + "#" + id)) {
            let feedback = stackQuestion.querySelector(elType + "#" + id).firstElementChild.className;
            /* Callback Funktion aufrufen */
            callback(feedback);
            console.info("board changed because feedback was given");
        }
    }

    /** Check, ob allgemeines Feedback in der STACK-Frage vorkommt. */
    this.generalFeedbackInQuestion = function (board, callback) {
        /* Board div und STACK Frage */
        let boardDiv = document.getElementById(board.containerObj.id);
        let stackQuestion = boardDiv.closest("div.que.stack")
        if (stackQuestion.querySelector("div.feedback")) {
            /* Callback Funktion aufrufen */
            callback();
            console.info("board changed because feedback was given");
        }
    }

}


/*------------------------------------------------------------------------------------------------------------------*/


/** Namensraum für Custom-Elemente */
var idealJSXGraphCustomElements = new function () {


    /** Factory-Funktion zum Erstellen eines HTML-Select Dropdown mit Custom Event 'custom:dropdown-change' auf dem HTML-Objekt des JSXGraph Boards (board div).
     * @param {Object} board - JSXGraph Board
     * @param {boolean} displayInBoard - Anzeige im Board?
     * @param {boolean} options - Optionen für Select-tag
     * @returns {Object} JSXGraph Textelement mit Dropdown-HTML
     */
    this.createDropdownMenu = function (board, displayInBoard, options) {
        /* Applet */
        const applet = document.getElementById(board.containerObj.id);
        /* Dropdown container div */
        const dropdownContainer = document.createElement("div")
        dropdownContainer.classList.add("ideal-jsxgraph-dropdown")
        dropdownContainer.style.width = applet.offsetWidth + "px";
        window.addEventListener("resize", () => dropdownContainer.style.width = applet.offsetWidth + "px"); // psoition bei resize anpassen
        /* Dropdown div */
        const dropdownDiv = document.createElement("div")
        dropdownDiv.classList.add("input-group", "input-group-sm")
        /* Check Layout */
        if (options.classicLayout) { dropdownDiv.classList.add("classic-jxgbox-layout") }
        else { dropdownDiv.classList.add("new-jxgbox-layout") }
        dropdownDiv.id = board.id + "_dropdown"
        /* Div for label */
        const newDiv = document.createElement("div")
        newDiv.classList.add("input-group-prepend");
        /* Label */
        const label = document.createElement("label")
        label.for = options.selectId
        label.innerHTML = options.labelText
        label.classList.add("input-group-text")
        /* Select */
        const selectElement = document.createElement("select")
        selectElement.name = options.selectName
        selectElement.id = options.selectId
        selectElement.size = "1"
        selectElement.classList.add("custom-select", "ideal-jsxgraph-select")
        /* Dynamically generate the options */
        options.options.forEach((info) => {
            let option = document.createElement("option")
            option.value = info[0]
            option.innerHTML = info[1]
            selectElement.appendChild(option);
        })
        /* Append childs */
        dropdownDiv.appendChild(newDiv)
        newDiv.appendChild(label)
        dropdownDiv.appendChild(selectElement)
        dropdownContainer.appendChild(dropdownDiv)
        /* Im Board anzeigen? */
        if (!displayInBoard) {
            board.containerObj.parentNode.insertBefore(dropdownContainer, board.containerObj)
            /* Custom Event */
            selectElement.addEventListener("change", function () {
                document.dispatchEvent(new CustomEvent('custom:dropdown-change', { detail: selectElement.value }))
            })
            return selectElement
        } else {
            let selectElementInBoard = board.create("text", [board.getBoundingBox()[2], board.getBoundingBox()[1], dropdownDiv.outerHTML], { fixed: true, highlight: false, frozen: true, anchorX: "right", anchorY: "top", cssStyle: "width: 100%" })
            selectElementInBoard.rendNode.addEventListener("change", function () {
                document.dispatchEvent(new CustomEvent('custom:dropdown-change', { detail: selectElementInBoard.rendNode.querySelector("select").value }))
            })
            /* Element zurückgeben */
            return selectElementInBoard
        }
    }

    /** Factory-Funktion zum Erstellen eines JSXGraph Sliders mit einem Inputfeld
     * @param {Object} board - JSXGraph Board
     * @param {Object[]} parents - Array mit den Elternelementen zum Erstellen des Sliders ( zwei Punkte, Slider-data und String für Input-Label)
     * @param {boolean} [bootstrapStyle=false] - Verwendung der Bootstrap CSS-Klassen für den Input
     * @param {Object} attributes - Attribute für den Slider 
     * @returns {Object} JSXGraph Composition mit Slider und Input
     */
    this.createInputSlider = function (board, parents, bootstrapStyle = false, attributes = {}) {

        /* Attribute */
        attributes.moveOnUp = false;
        attributes.withLabel = false;

        /* Slider */
        const slider = board.create('slider', [parents[0], parents[1], parents[2]], attributes);

        /* Input */
        const input = board.create('input', [slider.point2.X() + 0.1, slider.point2.Y(), slider.Value(), parents[3]+"&nbsp;"], {
            cssStyle: "width: 50px;", fixed: true, highlight: false
        });
        if (bootstrapStyle) {
            input.rendNodeInput.classList.add("form-control", "form-control-sm")
            input.rendNode.classList.add("form-inline")
            input.rendNodeInput.style.display = "inline-block" //kein Zeilenumbruch bei small screen
            input.rendNodeInput.style.height = "2em"
        }

        /* Data Attribut für Startwert */
        input.rendNodeInput.setAttribute("data-sliderval", slider.Value())

        /* Eventlistener Input DOM Element */
        input.rendNodeInput.addEventListener("input", function (e) {
            //console.log(e.target.value);
            //console.log(Number(e.target.value));

            /* Zahl? */
            if (!Number(e.target.value) && e.target.value !== "0") {
                console.warn("The provided value must be a number");
                input.rendNodeInput.style.color = "fireBrick"
                slider.setValue(input.rendNodeInput.getAttribute("data-sliderval"))
                return
            }
            /* Grenzwerte? */
            if (Number(e.target.value) < slider._smin || Number(e.target.value) > slider._smax) {
                console.warn("The provided slider value is out of bounds")
                input.rendNodeInput.style.color = "fireBrick"
                slider.setValue(input.rendNodeInput.getAttribute("data-sliderval"))
                return
            }

            input.rendNodeInput.style.color = "black"

            /* Wert setzen */
            slider.setValue(e.target.value)
            board.update();

            /* Data Attribut mit Sliderwert setzen */
            input.rendNodeInput.setAttribute("data-sliderval", e.target.value)

        })

        /* Slider Eventlistener */
        slider.on("drag", function () {
            input.rendNodeInput.value = slider.Value().toFixed(2)
            input.rendNodeInput.setAttribute("data-sliderval", slider.Value().toFixed(2))
        })

        /* Komposition (Slider und Input) */
        return new JXG.Composition({ slider: slider, input: input });
    }

    /** Factory-Funktion zum Erstellen eines Textelements mit Feedback-Icon HTML Code (Font Awesome)
         * @param {Object} board - JSXGraph Board
         * @param {Object} point - JSXGraph Point als Ankerpunkt für das Feedback-Icon
         * @param {string} iconType - Anzuzeigendes Feedback Icon (Mögliche Werte sind "correct", "incorrect", "partial")
         * @param {number} [fontSize=1.5] - Schriftgröße des Icons
         * @param {number[]} offset - Abstand zum Punkt (Angabe in usrCoords)
         * @param {Object} [attr={}] - Attribute für das JSXGraph Textelement
         * @returns {Object} - JSXGraph Text Element
         */
    this.createFeedbackIcon = function (board, point, iconType, fontSize=1.5, offset=[0.1,0.1], attr = {}) {
        /* Icon Variable */
        let myIcon;
        /* Switch case für das FA-Icon */
        switch (iconType) {
            case "correct":
                myIcon = "<span class='correct'><span style='font-size: "+fontSize+"em; color:green;'><i class='fa fa-check'></i></span></span>"
                break;
            case "incorrect":
                myIcon = "<span class='incorrect'><span style='font-size: "+fontSize+"em; color:red;'><i class='fa fa-times'></i></span></span>"
                break;
            case "partial":
                myIcon = "<span class='partiallycorrect'><span style='font-size: "+fontSize+"em; color:orange;'><i class='fa fa-adjust'></i></span></span>"
                break;
            default:
                console.error("The icon type can only be 'correct', 'incorrect' or 'partial'");
                return;
        }
        /* JSXGraph text element */
        const feedbackIcon = board.create("text", [() => point.X()+offset[0], () => point.Y()+offset[1], myIcon],
            { ...attr, fixed: true, parse: false, highlight: false, cssClass: "ideal-jsxgraph-feedbacksymbols" })
        /* Feedback Icon Element zurückgeben */
        return feedbackIcon
    }
}


/*------------------------------------------------------------------------------------------------------------------*/