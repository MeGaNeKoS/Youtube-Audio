// ==UserScript==
// @name        Youtube Audio Mode
// @namespace 	https://github.com/MeGaNeKoS
// @description Listen to only the audio on YouTube without loading the video.
// @version     1.0
// @include     https://www.youtube.com/*
// @run-at      document-end
// @grant       GM_xmlhttpRequest
// @grant       GM.setValue
// @grant       GM.getValue
// @noframes
// ==/UserScript==

(function(open) {
    window.addEventListener("yt-navigate-finish", audioMode);
    window.onYouTubeIframeAPIReady = audioMode();

    async function audioMode() {
        if (location.pathname == "/watch") {
            let video = document.getElementsByTagName("video")[0];
            let audioMode = await GM.getValue("ytAudioMode");
            addToMenu(audioMode); //create the audio mode button
            if (audioMode) {
                setPoster(video, ["maxres", "hq", "sd"]); // go to setposter
                watchStream(video); //go to watch stream
            }
        }
    }

    // Watch the media streams so we can select the audio
    function watchStream(video) {
        XMLHttpRequest.prototype.open = function(method, url) {
            let validStream = /^(?!.*live=1).+audio.+$/;
            if (validStream.test(url) && ! video.src.includes("audio")) {
                video.pause();
                video.src = url.split("&range")[0]; // get the audio url
                video.play();

            }
            open.apply(this, arguments);
        }
    }

    // Add audio mode to the settings menu
    async function addToMenu(audioMode) {
        let panel = document.getElementsByClassName("ytp-panel-menu")[0];
        if (!panel.innerHTML.includes("Audio Mode")) {
            panel.innerHTML += `
            <div class="ytp-menuitem"
                aria-checked="${audioMode}"
                id="audio-mode">
                <div class="ytp-menuitem-icon"></div>
                <div class="ytp-menuitem-label">Audio Mode</div>
                <div class="ytp-menuitem-content">
                    <div class="ytp-menuitem-toggle-checkbox">
                </div>
            </div>`;
            // audioMode is true or false
            // Toggle audio mode on or off
            let audioToggle = document.getElementById("audio-mode");
            audioToggle.onclick = async function() {
                let video = document.getElementsByTagName("video")[0];
                let audioMode = ! await GM.getValue("ytAudioMode");
                this.setAttribute("aria-checked", audioMode);
                GM.setValue("ytAudioMode", audioMode);
                setPoster(video, ["maxres", "hq", "sd"]); // go to setposter
                watchStream(video);
                if(!audioMode){
                    location.reload();
                }
            }
        }
    }

    // Set the video poster from thumbnails with the best avaliable format
    // https://developers.google.com/youtube/v3/docs/thumbnails
    async function setPoster(video, fmts) {
        let img = new Image();
        let videoId = location.search.match(/v=(.+?)(&|$)/)[1];
        img.src = `//i.ytimg.com/vi/${videoId}/${fmts.shift()}default.jpg`
        img.onload = function() {
            // A height 90 is YouTube"s not found image.
            if (img.height <= 90) {
                setPoster(video, fmts);
            } else {
                video.style.background = `url(${img.src}) no-repeat center`;
                video.style.backgroundSize = "contain";
            }
        };
    }
})(XMLHttpRequest.prototype.open);
