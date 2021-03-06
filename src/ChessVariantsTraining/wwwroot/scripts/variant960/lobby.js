﻿(function main() {
    var ws;
    var clientId;
    var currentLobbySeek;
    var bumpInterval;
    var closing = false;

    function initialTimeChanged() {
        var value = parseInt(document.getElementById("time-range").value, 10);
        var text = "";
        switch (value) {
            case 0:
                text = "0 minutes";
                break;
            case 1:
                text = "30 seconds";
                break;
            case 2:
                text = "45 seconds";
                break;
            case 3:
                text = "1 minute";
                break;
            case 4:
                text = "90 seconds";
                break;
            default:
                text = (value - 3).toString(10) + " minutes";
                break;
        }
        document.getElementById("initial-time").innerHTML = text;
    }

    function incrementChanged() {
        var value = document.getElementById("inc-range").value;
        document.getElementById("increment").innerHTML = value === "1" ? "1 second" : value.toString() + " seconds";
    }

    function makeSeek() {
        if (currentLobbySeek) {
            ws.send(JSON.stringify({ "t": "remove", "d": currentLobbySeek }));
        }
        var initialTimeValue = parseInt(document.getElementById("time-range").value, 10);
        switch (initialTimeValue) {
            case 0:
                var initialTimeSeconds = "0";
                break;
            case 1:
                initialTimeSeconds = "30";
                break;
            case 2:
                initialTimeSeconds = "45";
                break;
            case 3:
                initialTimeSeconds = "60";
                break;
            case 4:
                initialTimeSeconds = "90";
                break;
            default:
                initialTimeSeconds = ((initialTimeValue - 3) * 60).toString(10);
                break;
        }
        var inc = document.getElementById("inc-range").value;
        var variant = document.getElementById("variant-selector").value;
        var position = document.querySelector('input[name="pos-radio"]:checked').value;
        var sym = document.getElementById("symmetry-selector").value === "symmetrical" ? "true" : "false";
        var whitePosition = parseInt(document.getElementById("white-position").value, 10) || 0;
        var blackPosition = parseInt(document.getElementById("black-position").value, 10) || 0;
        if (whitePosition === 518 && blackPosition === 518 && variant !== "RacingKings") {
            displayError("You chose the standard starting position; you can play this on lichess.org.");
            return;
        }
        var message = { "t": "create", "d": [initialTimeSeconds, inc, variant, position, sym, whitePosition, blackPosition].join(";") };
        console.log(message);
        ws.send(JSON.stringify(message));
    }

    function bumper() {
        if (!currentLobbySeek) return;
        ws.send(JSON.stringify({ "t": "bump", "d": currentLobbySeek }));
    }

    function seekClicked(e) {
        e = e || window.event;
        if (e.target.classList.contains("own") || e.target.parentElement.classList.contains("own")) {
            clearInterval(bumpInterval);
            ws.send(JSON.stringify({ "t": "remove", "d": currentLobbySeek }));
            currentLobbySeek = null;
        } else {
            if (e.target.getAttribute("id") && e.target.getAttribute("id").startsWith("seek-")) {
                var seekId = e.target.getAttribute("id").slice(5);
            } else {
                seekId = e.target.parentElement.getAttribute("id").slice(5);
            }
            ws.send(JSON.stringify({ "t": "join", "d": seekId }));
        }
    }

    function wsMessageReceived(e) {
        var message = JSON.parse(e.data);
        var type = message.t;
        var data = message.d;
        switch (type) {
            case "add":
                var seekTableRow = document.createElement("div");
                seekTableRow.setAttribute("id", "seek-" + data.i);
                var playerDiv = document.createElement("div");
                playerDiv.innerHTML = data.o;
                playerDiv.classList.add("seek-player");
                seekTableRow.appendChild(playerDiv);
                var timeDiv = document.createElement("div");
                timeDiv.innerHTML = data.c;
                timeDiv.classList.add("seek-time");
                seekTableRow.appendChild(timeDiv);
                var variantDiv = document.createElement("div");
                variantDiv.innerHTML = data.l;
                variantDiv.classList.add("seek-variant");
                seekTableRow.appendChild(variantDiv);
                seekTableRow.addEventListener("click", seekClicked);
                document.getElementById("seek-table").appendChild(seekTableRow);
                break;
            case "remove":
                if (document.getElementById("seek-" + data)) {
                    document.getElementById("seek-" + data).remove();
                }
                break;
            case "ack":
                currentLobbySeek = data;
                bumpInterval = setInterval(bumper, 3000);
                document.getElementById("seek-" + data).classList.add("own");
                break;
            case "redirect":
                ws.close();
                window.location.assign("/Variant960/Game/" + data);
                break;
        }
    }

    function wsOpened() {
        ws.send(JSON.stringify({ "t": "init", d: "" }));
        setInterval(function () {
            ws.send(JSON.stringify({ "t": "keepAlive", d: "" }));
        }, 20 * 1000);
    }

    function wsClose() {
        if (!closing) {
            displayError("WebSocket closed! Please reload the page (there is no auto-reconnect yet)");
        }
    }

    window.addEventListener("load", function () {
        initialTimeChanged();
        incrementChanged();
        document.getElementById("time-range").addEventListener("input", initialTimeChanged);
        document.getElementById("time-range").addEventListener("change", initialTimeChanged);
        document.getElementById("inc-range").addEventListener("input", incrementChanged);
        document.getElementById("inc-range").addEventListener("change", incrementChanged);
        document.getElementById("create-game").addEventListener("click", makeSeek);

        jsonXhr("/Variant960/Lobby/StoreAnonymousIdentifier", "POST", null, function (req, jsonResponse) {
            ws = new WebSocket(window.wsUrl);
            ws.addEventListener("message", wsMessageReceived);
            ws.addEventListener("open", wsOpened);
            ws.addEventListener("close", wsClose);
        },
        function (req, err) {
            displayError(err);
        });
    });

    window.addEventListener("beforeunload", function () {
        closing = true;
    });
})();