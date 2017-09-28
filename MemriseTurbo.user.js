// ==UserScript==
// @name           Memrise Turbo
// @namespace      https://github.com/infofarmer
// @description    Makes Memrise faster
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/water/*
// @match          https://www.memrise.com/garden/review/*
// @version        0.1.8
// @updateURL      https://github.com/cooljingle/memrise-turbo/raw/master/MemriseTurbo.user.js
// @downloadURL    https://github.com/cooljingle/memrise-turbo/raw/master/MemriseTurbo.user.js
// @grant          none
// ==/UserScript==

console.log("turbo script loaded");
var oldstart = MEMRISE.garden.feedback.start;
MEMRISE.garden.feedback.start = function (){
    if (MEMRISE.garden.box.state === 'choosing-mem') {
        oldstart(1);
        MEMRISE.garden.boxes.advance();
    }else{
        MEMRISE.garden.box.next_press();
    }
};

var isComposing = false;
var cachedEvent;

$('body').on('compositionstart', function() {
    isComposing = true;
});

$('body').on('compositionend', function() {
    isComposing = false;
    processInput(cachedEvent);
});

$('body').on('input', function(e) {
    cachedEvent = e;
    if ($(e.target).is('input') && !(isComposing)) {
        processInput(e);
    }
});

function processInput(e)
{
    try {
        var g = MEMRISE.garden;
        var b = g.box;
        var v = b.$input.val();
        var lastChar = v.slice(-1);
        var clearBox = false;
        if(lastChar === "·" || lastChar === "；" || lastChar === ";") {
            clearBox = true;
            b.$input.val(v.slice(0, -1));
        }
        if(b.template !== "copytyping") {
            var s = g.scoring.score_response(
                b.$input.val(), b.accepted, b.learnable.is_typing_strict);
            if (s === 1) {
                MEMRISE.garden.box.check();
            }
        }
        if(clearBox) {
            b.$input.val("");
        }
    } catch (err) {
        console.log('error - falling back to default behaviour', err);
    }
}

// always let audio play in full
MEMRISE.audioPlayer.stop = $.noop;
MEMRISE.audioPlayer.stopAfter = $.noop;

// always disable timer
$("div.garden-timer div.txt").bind("DOMSubtreeModified", function() {
    MEMRISE.garden.timer.cancel();
});
