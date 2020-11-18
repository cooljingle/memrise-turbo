// ==UserScript==
// @name           Memrise Turbo
// @namespace      https://github.com/infofarmer
// @description    Makes Memrise faster
// @match          https://www.memrise.com/course/*/garden/*
// @match          https://www.memrise.com/garden/review/*
// @match          https://app.memrise.com/course/*/garden/*
// @match          https://app.memrise.com/garden/review/*
// @version        0.1.18
// @updateURL      https://github.com/cooljingle/memrise-turbo/raw/master/MemriseTurbo.user.js
// @downloadURL    https://github.com/cooljingle/memrise-turbo/raw/master/MemriseTurbo.user.js
// @grant          none
// ==/UserScript==

console.log("turbo script loaded");

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
        var i = b.$input.input || b.$input;
        var v = i.val();

        var lastChar = v.slice(-1);
        var clearBox = false;
        if(lastChar === "·" || lastChar === "；" || lastChar === ";") {
            clearBox = true;
            i.val(v.slice(0, -1));
        }
        if(b.get_score) {
            var s = b.get_score();
            if (s === 1)
                b.check();
        }
        if(clearBox)
            i.val("");
    } catch (err) {
        console.log('error - falling back to default behaviour', err);
    }
}


MEMRISE.garden._events.start.push(() => {
    NoScoreWhileInputting();
    NoTimer();
});

// don't score IME input while still inputting
function NoScoreWhileInputting() {
    var turboCount = 0;
    MEMRISE.garden.session.make_box = (function () {
        var cached_function = MEMRISE.garden.session.make_box;
        return function() {
            var result = cached_function.apply(this, arguments);
            //choosing mem
                result.next_press = (function () {
                    var cached_function = result.next_press;
                    return function() {
                        var skipChoosing = result.state === 'choosing-mem';
                        cached_function.apply(this, arguments);
                        if(skipChoosing){
                            this.state = 'mem-chosen';
                            result.next_press();
                        }
                    };
                }());
            //multiple choice
            if(result.select_choice) {
                result.select_choice = (function () {
                    var cached_function = result.select_choice;
                    return function() {
                        cached_function.apply(this, arguments);
                        result.next_press();
                    };
                }());
            }
            //normal checks
            if(result.check) {
                result.check = (function () {
                    var cached_function = result.check;
                    return function() {
                        if(!isComposing) {
                            cached_function.apply(this, arguments);
                            if(result.template !== 'copytyping' || result.answeredCorrectly) {
                                if(turboCount === 0) {
                                    turboCount++;
                                    result.next_press(); //quick change screens
                                    setTimeout(() => turboCount--, 300);
                                }
                            }
                        }
                    };
                }());
            }
            return result;
        };
    }());
}

// always disable timer
function NoTimer() {
    MEMRISE.garden.session.make_box = (function () {
        var cached_function = MEMRISE.garden.session.make_box;
        return function() {
            var result = cached_function.apply(this, arguments);
            result.getTimerLength = () => 0;
            return result;
        };
    }());
}

// always let audio play in full
MEMRISE.audioPlayer.stop = $.noop;
MEMRISE.audioPlayer.stopAfter = $.noop;
