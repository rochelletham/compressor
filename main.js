const STEREO_CHANS = 2;
// default initial values for parameters
const THRESHVAL = -24;
const KNEEVAL = 30;
const RATIOVAL = 12;
const ATTACKVAL = 0.003;
const RELVAL = 0.25;

const input = document.querySelector("audio");
const pre = document.querySelector("pre");
//  was used for inital testing
const compressButton = document.querySelector('#compressButton');

const attackSlider = document.getElementById("attack");
const thresholdSlider = document.getElementById("threshold");
const kneeSlider = document.getElementById("knee");
const ratioSlider = document.getElementById("ratio");
const releaseSlider = document.getElementById("release");
const SLIDER_IDS = [attackSlider, thresholdSlider, kneeSlider, ratioSlider, releaseSlider];

var thresholdVal = THRESHVAL; 
var kneeVal = KNEEVAL;
var ratioVal = RATIOVAL;
var attackVal = ATTACKVAL;
var releaseVal = RELVAL;

// setting the intial values
attackSlider.innerHTML = attackVal;
kneeSlider.innerHTML = kneeVal;
thresholdSlider.innerHTML = thresholdVal;
ratioSlider.innerHTML = ratioVal;
releaseSlider.innerHTML = releaseVal;

// SLIDER_IDS.forEach(slider_id => {   
//     if (slider_id) {
//         slider_id.disabled = true;
//     }
// });

let context;

hintButton.onclick = function(){
    alert("Clicked hint!");
};
checkButton.onclick = function(){
    alert("clicked check!");
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
    const inputLtAnalyser = context.createAnalyser();
    const inputRtAnalyser = context.createAnalyser();
    inputLtAnalyser.fftSize = 2048;
    inputRtAnalyser.fftSize = 2048;

    // used for analysing the output volume levels (after compressor)
    const outputLtAnalyser = context.createAnalyser();
    const outputRtAnalyser = context.createAnalyser();
    outputLtAnalyser.fftSize = 2048;
    outputRtAnalyser.fftSize = 2048;
    
    // channel splitting node for input
    const inputSplitter = context.createChannelSplitter(STEREO_CHANS);
    source.connect(inputSplitter);
    // connecting the left channel of splitter to left channel of input analyser
    inputSplitter.connect(inputLtAnalyser, 0);
    inputSplitter.connect(inputRtAnalyser, 1);
    
    // after compressor, channel splitting node for output
    const outputSplitter = context.createChannelSplitter(STEREO_CHANS);
    
    // connecting the left channel of splitter to left channel of output analyser
    outputSplitter.connect(outputLtAnalyser, 0);
    outputSplitter.connect(outputRtAnalyser, 1);

    // connect to destination by default without compressor
    inputLtAnalyser.connect(context.destination);
    inputRtAnalyser.connect(context.destination);
    
    
    // extracting audio data
    const ltBufferLen = inputLtAnalyser.frequencyBinCount;
    const rtBufferLen = inputRtAnalyser.frequencyBinCount;
    const ltData = new Float32Array(ltBufferLen);
    const rtData = new Float32Array(rtBufferLen);

    const ltOutBufferLen = outputLtAnalyser.frequencyBinCount;
    const rtOutBufferLen = outputRtAnalyser.frequencyBinCount;
    const ltOutData = new Float32Array(ltOutBufferLen);
    const rtOutData = new Float32Array(rtOutBufferLen);
    
    const inputLtMeter = document.getElementById("input-vol-meter-lt");
    const inputRtMeter = document.getElementById("input-vol-meter-rt");
    const outputLtMeter = document.getElementById("output-vol-meter-lt");
    const outputRtMeter = document.getElementById("output-vol-meter-rt");

    const onInputFrame = () => {
        
        inputLtAnalyser.getFloatTimeDomainData(ltData);
        inputRtAnalyser.getFloatTimeDomainData(rtData);
        let ltSumSquares = 0.0;
        let rtSumSquares = 0.0;
        for (const amplitude of ltData) { 
            ltSumSquares += Math.pow(amplitude,2); 
        }
        for (const amplitude of rtData) { 
            rtSumSquares += Math.pow(amplitude,2); 
        }
        if (ltSumSquares > 0) {
            inputLtMeter.value = Math.sqrt(ltSumSquares / ltData.length) * 3; // * 2
            inputRtMeter.value = Math.sqrt(rtSumSquares / rtData.length) * 3; // * 2
        }
        if (compressActive === "true") {
            outputLtAnalyser.getFloatTimeDomainData(ltOutData);
            outputRtAnalyser.getFloatTimeDomainData(rtOutData);
            let ltOutSumSquares = 0.0;
            let rtOutSumSquares = 0.0;
            
            for (const amplitude of ltOutData) { 
                ltOutSumSquares += Math.pow(amplitude,2); 
            }
            for (const amplitude of rtOutData) { 
                rtOutSumSquares += Math.pow(amplitude,2); 
            }
            if (outputLtMeter && outputRtMeter) {
                outputLtMeter.value = Math.sqrt(ltOutSumSquares / ltOutData.length) * 3; // * 2
                outputRtMeter.value = Math.sqrt(rtOutSumSquares / rtOutData.length) * 3; // * 2
            }
        }
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

    compressor.connect(outputSplitter);

    // connect output analyser to the destination
    outputLtAnalyser.connect(context.destination);   
    outputLtAnalyser.smoothingTimeConstant = 0.3;
    outputRtAnalyser.connect(context.destination);   
    outputRtAnalyser.smoothingTimeConstant = 0.3;
    
    // connecting the left channel of splitter to left channel of output analyser
    outputSplitter.connect(outputLtAnalyser, 0);
    outputSplitter.connect(outputRtAnalyser, 1);
    
    const effect_bk = document.getElementById("effect-bk");
    var compressActive = compressButton.getAttribute("data-active");

    compressButton.onclick = () => {
        if (compressActive === "false") {
            // UI handling
            effect_bk.style.filter = `brightness(1)`;

            compressActive = "true";
            compressButton.setAttribute("data-active", compressActive);
            SLIDER_IDS.forEach(slider_id => {   
                if (slider_id) {
                    slider_id.disabled = false;
                }
            });
            compressButton.textContent = "Remove compression";
            console.log("Added compressor node");
            // compressor node inside node chain
            inputLtAnalyser.disconnect(context.destination);
            inputLtAnalyser.connect(compressor);
            inputRtAnalyser.disconnect(context.destination);
            inputRtAnalyser.connect(compressor);
            outputSplitter.connect(outputLtAnalyser,0);
            outputSplitter.connect(outputRtAnalyser,1);
            outputLtAnalyser.connect(context.destination);
            outputRtAnalyser.connect(context.destination);
            
        } else if (compressActive === "true") {
            // UI handling
            effect_bk.style.filter = `brightness(0.5)`;
            if (outputLtMeter && outputRtMeter) {
                outputLtMeter.value = 0;
                outputRtMeter.value = 0;
            }
            
            compressActive = "false";
            compressButton.setAttribute("data-active", compressActive);
            SLIDER_IDS.forEach(slider_id => {   
                if (slider_id) {
                    slider_id.disabled = true;
                }
            });
            compressButton.textContent = "Enable compression";
            // compressor node taken out of node chain
            inputLtAnalyser.disconnect(compressor);
            inputRtAnalyser.disconnect(compressor);
            outputLtAnalyser.disconnect(context.destination);
            outputRtAnalyser.disconnect(context.destination);
            inputLtAnalyser.connect(context.destination);
            inputRtAnalyser.connect(context.destination);
        }
    };
    
    // sliderChangeVal(paramName, val) {

    // }
    

    thresholdSlider.oninput = function() {
        if (compressActive === "true") {
            thresholdVal.innerHTML = this.value;
            document.getElementById("threshold_val").innerHTML = "<b>Threshold</b> <br> "+this.value;
            updateParam(this.value, thresholdSlider, compressor.threshold); 
        }
    };
    
    attackSlider.oninput = function() {
        if (compressActive === "true") {
            attackVal.innerHTML = this.value;
            document.getElementById("attack_val").innerHTML = "<b>Attack</b> <br> "+this.value;
            updateParam(this.value, attackSlider, compressor.attack); 
        }
    };
    
    kneeSlider.oninput = function() {
        if (compressActive === "true") {
            kneeVal.innerHTML = this.value;
            document.getElementById("knee_val").innerHTML = "<b>Knee</b> <br> "+this.value;
            updateParam(this.value, kneeSlider, compressor.knee);
        }
    };
    ratioSlider.oninput = function() {
        if (compressActive === "true") {
            ratioVal.innerHTML = this.value;
            document.getElementById("ratio_val").innerHTML = "<b>Ratio</b> <br> "+this.value;
        updateParam(this.value, ratioSlider, compressor.ratio);
        }
    };
    releaseSlider.oninput = function() {
        if (compressActive === "true") {
            releaseVal.innerHTML = this.value;
            document.getElementById("release_val").innerHTML = "<b>Release</b> <br> "+this.value;
            updateParam(this.value, releaseSlider, compressor.release);
        }
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
            if (compressActive === "true") {
                // param.setValueAtTime(button.innerHTML, context.currentTime);
                param.setValueAtTime(val, context.currentTime);
                console.log(slider.id, ": ", param.value);
                // }
            }
        };
        function meterParam(val, meter) {
            meter.setValueAtTime(val, context.currentTime);
        }
}
});