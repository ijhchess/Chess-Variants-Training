﻿function startWithRandomPuzzle() {
    jsonXhr("/Puzzle/Train/GetOneRandomly" + (window.trainingSessionId ? "?trainingSessionId=" + window.trainingSessionId : ""), "GET", null, function (req, jsonResponse) {
        setup(jsonResponse["id"]);
    }, function (req, err) {
        alert(err);
    });
}

function setup(puzzleId) {
    window.puzzleId = puzzleId;
    jsonXhr("/Puzzle/Train/Setup", "POST", "id=" + window.puzzleId + (window.trainingSessionId ? "&trainingSessionId=" + window.trainingSessionId : ""), function (req, jsonResponse) {
        window.ground.set({
            fen: jsonResponse["fen"],
            orientation: jsonResponse["whoseTurn"],
            turnColor: jsonResponse["whoseTurn"],
            lastMove: null,
            selected: null,
            movable: {
                free: false,
                dests: jsonResponse["dests"]
            }
        });
        clearExplanation();
        clearComments();
        loadComments();
        document.getElementById("nextPuzzleLink").classList.add("nodisplay");
        document.getElementById("result").setAttribute("class", "");
        document.getElementById("result").innerHTML = "";
        document.getElementById("author").textContent = jsonResponse["author"];
        window.trainingSessionId = jsonResponse["trainingSessionId"];
    }, function (req, err) {
        alert(err);
    });
}

function showExplanation(expl) {
    document.getElementById("explanation").innerHTML = expl;
}

function clearExplanation() {
    document.getElementById("explanation").innerHTML = "";
}

function submitPuzzleMove(origin, destination, metadata) {
    jsonXhr("/Puzzle/Train/SubmitMove", "POST", "id=" + window.puzzleId + "&trainingSessionId=" + window.trainingSessionId + "&origin=" + origin + "&destination=" + destination, function (req, jsonResponse) {
        window.ground.set({
            fen: jsonResponse["fen"]
        });
        if (jsonResponse["check"]) {
            window.ground.setCheck(jsonResponse["check"]);
        } else {
            window.ground.set({ check: null });
        }
        if (jsonResponse["play"]) {
            var parts = jsonResponse["play"].split("-");
            window.ground.move(parts[0], parts[1]);
            window.ground.set({
                fen: jsonResponse["fenAfterPlay"]
            });
            if (jsonResponse["checkAfterAutoMove"]) {
                window.ground.setCheck(jsonResponse["checkAfterAutoMove"]);
            }
        }
        switch (jsonResponse["correct"]) {
            case 0:
                break;
            case 1:
                document.getElementById("nextPuzzleLink").classList.remove("nodisplay");
                with (document.getElementById("result")) {
                    textContent = "Success!";
                    setAttribute("class", "green");
                };
                break;
            case -1:
                document.getElementById("nextPuzzleLink").classList.remove("nodisplay");
                with (document.getElementById("result")) {
                    textContent = "Sorry, that's not correct. This was correct: " + jsonResponse["solution"];
                    setAttribute("class", "red");
                }
        }
        if (jsonResponse["dests"]) {
            window.ground.set({
                movable: {
                    dests: jsonResponse["dests"]
                }
            });
        }
        if (jsonResponse["explanation"]) {
            showExplanation(jsonResponse["explanation"] + "<br><br>Puzzle rating: " + jsonResponse["rating"]);
        }
    }, function (req, err) {
        alert(err);
    });
}

function submitComment(e) {
    e = e || window.event;
    e.preventDefault();
    jsonXhr("/Puzzle/Comment/PostComment", "POST", "commentBody=" + encodeURIComponent(document.getElementById("commentBody").value) + "&puzzleId=" + window.puzzleId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    },
    function (req, err) {
        alert(err);
    });
}

function clearComments() {
    var commentContainer = document.getElementById("commentContainer");
    while (commentContainer.firstChild) {
        commentContainer.removeChild(commentContainer.firstChild);
    }
}

function loadComments() {
    xhr("/Puzzle/Comment/ViewComments?puzzleId=" + window.puzzleId, "GET", null, function (req) {
        document.getElementById("commentContainer").innerHTML = req.responseText;
        var comments = document.getElementById("commentContainer").querySelectorAll(".comment");
        for (var i = 0; i < comments.length; i++) {
            comments[i].style.marginLeft = comments[i].dataset.indentlevel + "vw";
        }
        var voteLinks = document.getElementById("commentContainer").querySelectorAll("a[data-vote]");
        for (var i = 0; i < voteLinks.length; i++) {
            voteLinks[i].addEventListener("click", voteClicked);
        }
        var replyLinks = document.getElementById("commentContainer").querySelectorAll("a[data-to]");
        for (var i = 0; i < replyLinks.length; i++) {
            replyLinks[i].addEventListener("click", replyLinkClicked);
        }
        var sendLinks = document.getElementById("commentContainer").getElementsByClassName("send-reply");
        for (var i = 0; i < sendLinks.length; i++) {
            sendLinks[i].addEventListener("click", sendLinkClicked);
        }
        var cancelLinks = document.getElementById("commentContainer").getElementsByClassName("cancel-reply");
        for (var i = 0; i < cancelLinks.length; i++) {
            cancelLinks[i].addEventListener("click", cancelLinkClicked);
        }
        var reportLinks = document.getElementById("commentContainer").getElementsByClassName("report-link");
        for (var i = 0; i < reportLinks.length; i++) {
            reportLinks[i].addEventListener("click", reportLinkClicked);
        }
        var modLinks = document.getElementById("commentContainer").getElementsByClassName("mod-link");
        for (var i = 0; i < modLinks.length; i++) {
            modLinks[i].addEventListener("click", modLinkClicked);
        }
    }, function (req, err) {
        alert(err);
    });
}

function upvoteComment(commentId) {
    jsonXhr("/Puzzle/Comment/Upvote", "POST", "commentId=" + commentId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    }, function (req, err) {
        alert(err);
    });
}

function downvoteComment(commentId) {
    jsonXhr("/Puzzle/Comment/Downvote", "POST", "commentId=" + commentId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    }, function (req, err) {
        alert(err);
    });
}

function undoVote(commentId) {
    jsonXhr("/Puzzle/Comment/UndoVote", "POST", "commentId=" + commentId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    }, function (req, err) {
        alert(err);
    });
}

function sendReply(to, body) {
    jsonXhr("/Puzzle/Comment/Reply", "POST", "to=" + to + "&body=" + encodeURIComponent(body) + "&puzzleId=" + window.puzzleId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    },
    function (req, err) {
        alert(err);
    });
}

function voteClicked(e) {
    e = e || window.event;
    e.preventDefault();
    var target = e.target;
    if (target.dataset.vote === "up") {
        if (target.classList.contains("upvote-highlighted")) {
            undoVote(target.dataset.commentid);
        } else {
            upvoteComment(target.dataset.commentid);
        }
    } else {
        if (target.classList.contains("downvote-highlighted")) {
            undoVote(target.dataset.commentid);
        } else {
            downvoteComment(target.dataset.commentid);
        }
    }
}

function replyLinkClicked(e) {
    e = e || window.event;
    e.preventDefault();
    (document.getElementById("to-" + e.target.dataset.to) || { style: {} }).style.display = "block";
}

function sendLinkClicked(e) {
    e = e || window.event;
    e.preventDefault();
    var to = e.target.parentElement.id.slice(3);
    var body = e.target.parentElement.firstElementChild.value;
    sendReply(to, body);
}

function cancelLinkClicked(e) {
    e = e || window.event;
    e.preventDefault();
}

function reportLinkClicked(e) {
    e = e || window.event;
    e.preventDefault();
    var itemToReport = e.target.dataset.item;
    if (!window.reportDialogHtml) {
        xhr("/Report/Dialog/Comment", "GET", null, function (req) {
            window.reportDialogHtml = req.responseText;
            showReportDialog(itemToReport);
        }, function (req, err) {
            alert(err);
        });
    }
    else {
        showReportDialog(itemToReport);
    }
}

function showReportDialog(itemToReport) {
    var itemToReportElement = document.getElementById(itemToReport);
    itemToReportElement.getElementsByClassName("comment-content")[0].style.display = "none";
    itemToReportElement.insertAdjacentHTML("beforeend", window.reportDialogHtml);
    itemToReportElement.getElementsByClassName("report-dialog")[0].lastElementChild.addEventListener("click", reportLinkInDialogClicked);
}

function removeReportDialog(itemReported) {
    var itemReportedElement = document.getElementById(itemReported);
    itemReportedElement.getElementsByClassName("comment-content")[0].style.display = "flex";
    itemReportedElement.removeChild(itemReportedElement.getElementsByClassName("report-dialog")[0]);
}

function reportLinkInDialogClicked(e) {
    e = e || window.event;
    e.preventDefault();
    var parent = e.target.parentElement;
    jsonXhr("/Report/Submit/Comment", "POST", "item=" + parent.parentElement.id + "&reason=" + parent.getElementsByTagName("select")[0].value + "&reasonExplanation=" + encodeURIComponent(parent.getElementsByTagName("textarea")[0].value),
        function (req, jsonResponse) {
            removeReportDialog(parent.parentElement.id);
        },
        function (req, err) {
            alert(err);
        });
}

function modLinkClicked(e) {
    e = e || window.event;
    e.preventDefault();
    var action = e.target.dataset.action;
    var commentId = e.target.dataset.commentid;
    jsonXhr("/Puzzle/Comment/Mod/" + action, "POST", "commentId=" + commentId, function (req, jsonResponse) {
        clearComments();
        loadComments();
    }, function (req, err) {
        alert(err);
    });
}

function nextPuzzle(e) {
    e = e || window.event;
    if (e.target.getAttribute("href") !== "#") return true;
    e.preventDefault();
    startWithRandomPuzzle();
}

window.addEventListener("load", function () {
    window.ground = Chessground(document.getElementById("chessground"), {
        coordinates: false,
        movable: {
            free: false,
            dropOff: "revert",
            showDests: false,
            events: {
                after: submitPuzzleMove
            }
        }
    });
    document.getElementById("submitCommentLink").addEventListener("click", submitComment);
    document.getElementById("nextPuzzleLink").addEventListener("click", nextPuzzle);
    if (!window.selectedPuzzle) {
        startWithRandomPuzzle();
    } else {
        setup(window.selectedPuzzle);
    }
});