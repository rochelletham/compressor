const input = document.querySelector("audio");
const pre = document.querySelector("pre");
//  was used for inital testing
const compressButton = document.querySelector('#compressButton');

var inputLeftMeter = document.getElementById("input-vol-meter-left")
// var inputRtMeter = document.getElementById("input-vol-meter-rt")
var outputLeftMeter = document.getElementById("output-vol-meter-left")
// var outputRtMeter = document.getElementById("output-vol-meter-rt")

var attackSlider = document.getElementById("attack");
var thresholdSlider = document.getElementById("threshold");
var kneeSlider = document.getElementById("knee");
var ratioSlider = document.getElementById("ratio");
var releaseSlider = document.getElementById("release");

var thresholdVal = -24; 
var kneeVal = 30;
var ratioVal = 12;
var attackVal = 0.003;
var releaseVal = 0.25;
// setting the intial values
attackSlider.innerHTML = attackVal;
kneeSlider.innerHTML = kneeVal;
thresholdSlider.innerHTML = thresholdVal;
ratioSlider.innerHTML = ratioVal;
releaseSlider.innerHTML = releaseVal;


let context;

hintButton.onclick = function(){
    alert("Clicked hint!");
};
checkButton.onclick = function(){
    
    
};

// only will run audio context code when input audio is in play state
input.addEventListener("play", () => {
    // https://webaudio.github.io/web-audio-api/#DynamicsCompressorNode
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode/DynamicsCompressorNode
    // var thresholdVal = -24; 
    // var kneeVal = 30;
    // var ratioVal = 12;
    // var attckVal = 0.003;
    // var releaseVal = 0.25;
if (!context) {
   context = new AudioContext();

    // Create a MediaElementAudioSourceNode
    // Feed the HTMLMediaElement into it
    const source = context.createMediaElementSource(input);
    // used for analysing the input volume levels
    const inputAnalyser = context.createAnalyser();
    source.connect(inputAnalyser);

    // used for analysing the input volume levels
    // const outputAnalyser = context.createAnalyser();
    
    // https://jameshfisher.com/2021/01/18/measuring-audio-volume-in-javascript/
    inputLeftMeter = document.getElementById("input-vol-meter-left")
    const pcmData = new Float32Array(inputAnalyser.fftSize);
    const onInputFrame = () => {
        inputAnalyser.getFloatTimeDomainData(pcmData);
        let sumSquares = 0.0;
        for (const amplitude of pcmData) { 
            sumSquares += amplitude*amplitude; 
        }
        inputLeftMeter.value = Math.sqrt(sumSquares / pcmData.length) * 2;
        console.log(inputLeftMeter.value)
        window.requestAnimationFrame(onInputFrame);
    };
    window.requestAnimationFrame(onInputFrame);


    // Create a compressor node
    const compressor = new DynamicsCompressorNode(context, {
        threshold: thresholdVal,
        knee: kneeVal,
        ratio: ratioVal,
        attack: attackVal,
        release: releaseVal,
    });

    

    // connect the AudioBufferSourceNode to the destination
    inputAnalyser.connect(context.destination);   
    inputAnalyser.smoothingTimeConstant = 0.3;
    
    

    compressButton.onclick = () => {
        const active = compressButton.getAttribute("data-active");
        if (active === "false") {
            compressButton.setAttribute("data-active", "true");
            compressButton.textContent = "Remove compression";
            console.log("Added compressor node");
            // compressor node inside node chain
            inputAnalyser.disconnect(context.destination);
            inputAnalyser.connect(compressor);
            compressor.connect(context.destination);
            
        } else if (active === "true") {
            compressButton.setAttribute("data-active", "false");
            compressButton.textContent = "Enable compression";
            // compressor node taken out of node chain
            inputAnalyser.disconnect(compressor);
            compressor.disconnect(context.destination);
            inputAnalyser.connect(context.destination);
        }
    };
    
    
    attackSlider.oninput = function() {
        attackVal.innerHTML = this.value;
        updateParam(this.value, attackSlider, compressor.attack);
    };
    thresholdSlider.oninput = function() {
        thresholdVal.innerHTML = this.value;
        updateParam(this.value, thresholdSlider, compressor.threshold);
    };
    kneeSlider.oninput = function() {
        kneeVal.innerHTML = this.value;
        updateParam(this.value, kneeSlider, compressor.knee);
    };
    ratioSlider.oninput = function() {
        ratioVal.innerHTML = this.value;
        updateParam(this.value, ratioSlider, compressor.ratio);
    };
    releaseSlider.oninput = function() {
        releaseVal.innerHTML = this.value;
        updateParam(this.value, releaseSlider, compressor.release);
    };

        /**
         * @param {float} val - the new value to be assigned to parameter
         * @param {object} slider - slider for specific parameter
         * @param {object} param - compressor parameter
         * ranges & defaults for each parameter:
         * threshold: [-100,0], -24
         * knee: [0, 40], 30
         * ratio: [1, 20], 12
         * attack: [0,1], 0.003
         * release: [0,1], 0.25
         * 
         */
        function updateParam(val, slider, param) {
            // const active = button.getAttribute("data-active");
            // only change param val if compressor is active
            if (compressButton.getAttribute("data-active") === "true") {
                // param.setValueAtTime(button.innerHTML, context.currentTime);
                param.setValueAtTime(val, context.currentTime);
                console.log(slider.id, ": ", param.value);
                // }
            } else {
                alert("Need to click 'enable compression' first!");
            }
        };
        function meterParam(val, meter) {
            meter.setValueAtTime(val, context.currentTime);
        }
}
});