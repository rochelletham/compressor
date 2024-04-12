const input = document.querySelector("audio");
const pre = document.querySelector("pre");
const compressButton = document.querySelector('#compressButton');
const thresholdButton = document.querySelector('#thresholdButton');
const kneeButton = document.querySelector('#kneeButton');
const ratioButton = document.querySelector('#ratioButton');
const attackButton = document.querySelector('#attackButton');
const releaseButton = document.querySelector('#releaseButton');
const hintButton = document.querySelector('#hintButton');
let context;

hintButton.onclick = function(){
    alert("Clicked hint!");
};
checkButton.onclick = function(){
    alert("Clicked check!");
};
// only will run audio context code when input audio is in play state
input.addEventListener("play", () => {
    // https://webaudio.github.io/web-audio-api/#DynamicsCompressorNode
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode/DynamicsCompressorNode
    var thresholdVal = -24; 
    var kneeVal = 30;
    var ratioVal = 12;
    var attckVal = 0.003;
    var releaseVal = 0.25;
if (!context) {
   context = new AudioContext();

    // Create a MediaElementAudioSourceNode
    // Feed the HTMLMediaElement into it
    const source = context.createMediaElementSource(input);

    // Create a compressor node
    const compressor = new DynamicsCompressorNode(context, {
        threshold: thresholdVal,
        knee: kneeVal,
        ratio: ratioVal,
        attack: attckVal,
        release: releaseVal,
    });

    // connect the AudioBufferSourceNode to the destination
    source.connect(context.destination);   
    compressButton.onclick = () => {
        const active = compressButton.getAttribute("data-active");
        if (active === "false") {
            compressButton.setAttribute("data-active", "true");
            compressButton.textContent = "Remove compression";
            // compressor node inside node chain
            source.disconnect(context.destination);
            source.connect(compressor);
            compressor.connect(context.destination);
        } else if (active === "true") {
            compressButton.setAttribute("data-active", "false");
            compressButton.textContent = "Enable compression";
            console.log("Added in compressor node!");
            // compressor node taken out of node chain
            source.disconnect(compressor);
            compressor.disconnect(context.destination);
            source.connect(context.destination);
        }
    };
    thresholdButton.onclick = () => {
        console.log("clicked threshold button");
        updateParam(thresholdButton, compressor.threshold);
    };
    kneeButton.onclick = () => {
        console.log("clicked knee button");
        updateParam(kneeButton, compressor.knee);
    };
    ratioButton.onclick = () => {
        console.log("clicked ratio button");
        updateParam(ratioButton, compressor.ratio);
    };
    attackButton.onclick = () => {
        console.log("clicked attack button");
        updateParam(attackButton, compressor.attack);
    };
    releaseButton.onclick = () => {
        console.log("clicked release button");
        updateParam(releaseButton, compressor.release);
    };

        /**
         * 
         * @param {object} button - button for specific parameter
         * @param {object} param - compressor parameter
         * ranges & defaults for each parameter:
         * threshold: [-100,0], -24
         * knee: [0, 40], 30
         * ratio: [1, 20], 12
         * attack: [0,1], 0.003
         * release: [0,1], 0.25
         * 
         */
        function updateParam(button, param) {
            const active = button.getAttribute("data-active");
            // only change param val if compressor is active
            if (compressButton.getAttribute("data-active") === "true") {
                if (active === "false") {
                    button.setAttribute("data-active", "true");
                    button.textContent = "Go to default";
                    param.setValueAtTime(0, context.currentTime);
                    console.log(param.value);
                } else if (active === "true") {
                    button.setAttribute("data-active", "false");
                    button.textContent = "Apply update";
                    param.setValueAtTime( 10, context.currentTime);
                    console.log(param.value);
                }
            } else {
                alert("Need to click 'enable compression' first!");
            }
        };
}
});