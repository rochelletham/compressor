// load the parameter correct ranges
const module = await import("./paramVals.json", {
    with: { type: "json" },
});;
const Mode = {
    YOURS: false,
    EXPECTED: true,
};
// by default, the expected params will be set. 
// when currMode = Yours, then switch compressor to use sliders' current vals
var currMode = Mode.EXPECTED;

// used for testing the checking system
let thrldAns = getRandVal(-100, -50);
let attackAns = getRandVal(0, 0.5);
let kneeAns  = getRandVal(10, 20);
let ratioAns = getRandVal(4, 13);
let releaseAns = getRandVal(0, 0.5);

const STEREO_CHANS = 2;
// default initial values for parameters
const THRESHVAL = -24;
const KNEEVAL = 30;
const RATIOVAL = 12;
const ATTACKVAL = 0.003;
const RELVAL = 0.25;

var thresholdVal = THRESHVAL; 
var kneeVal = KNEEVAL;
var ratioVal = RATIOVAL;
var attackVal = ATTACKVAL;
var releaseVal = RELVAL;

const THRESHOLD = "threshold";
const ATTACK = "attack";
const KNEE = "knee";
const RATIO = "ratio";
const RELEASE = "release";

var attackSlider = document.getElementById("attack");
var thresholdSlider = document.getElementById("threshold");
var kneeSlider = document.getElementById("knee");
var ratioSlider = document.getElementById("ratio");
var releaseSlider = document.getElementById("release");
var SLIDER_IDS = [thresholdSlider, attackSlider, kneeSlider, ratioSlider, releaseSlider];
var PARAM_NAMES = [THRESHOLD, ATTACK,, KNEE, RATIO, RELEASE];

var compressActive = "false";

let context;

const input = document.querySelector("audio");
const pre = document.querySelector("pre");
//  was used for inital testing
const compressButton = document.querySelector('#compressButton');
// UI
const effect_bk = document.getElementById("effect-bk");
const toggleSwitch = document.getElementById("toggleSwitch");
const toggleMode = document.getElementById("toggleMode");
toggleSwitch.style.filter = `brightness(0.5)`;
toggleMode.disabled = true;

//********* set up **********//
// for setting up the correct slider values
// There will be a correct answer for each slider, and a correct range [correct-range, correct+range]
// var range will decrease as difficulty increases
var answerkey;
function fetchParamData() {
    fetch("./paramVals.json").then((res) => {
        if (!res.ok) {
            throw new Error(`HTTP error, Status: ${res.status}`);
        }
        answerkey = res.json();
        return answerkey;
    })
    .catch((error) => {
        console.error("Couldn't get data:", error);
    })
}


hintButton.onclick = function(){
    alert("Clicked hint!");
};
checkButton.onclick = function(){
    if (compressActive === "true") {
        checkAnswer();
    } else {
        alert("Enable the compressor and do the exercise first before checking.");
    }
};

// Generates a random value for the parameter's slider. 
function getRandVal(min, max) {
    let val = (Math.random() * (max - min) + min).toFixed(2);
    return val;
}
// Checks if the user's answer is within the correct answer's range
// correctRange is a size 2 array [min,max]

function checkVal(slider, correctAns, correctRange) {
    var val = parseFloat(slider.value);
    var min = parseFloat(correctAns)+correctRange[0];
    var max = parseFloat(correctAns)+correctRange[1];
    console.log("user answer: " + val + "correct ans: " 
        + correctAns + " correct range: [" + min + ", " + max + "]");
    if ((val >= min) && (val <= max)) {
        console.log("Correct! " + slider.id + 'slider value within range');
        return true;
    } else {
        console.log(slider.id + 'slider val wrong, correct ans: '
            + val + " " + min + ','+ max);
        return false;
    }
}
    //  * knee: [0, 40], 30
    //  * ratio: [1, 20], 12
    //  * attack: [0,1], 0.05
    //  * release: [0,1], 0.25
    //  * 
// TODO: store correct ranges in var for easy access
function checkAnswer() {
    // drawCorrectAns(thresholdSlider);
    checkVal(thresholdSlider, thrldAns, module.default.paramCorrectRanges[THRESHOLD]["beginner"]);
    checkVal(attackSlider, attackAns, module.default.paramCorrectRanges[ATTACK]["beginner"]);
    // checkVal(kneeSlider, module.default.paramCorrectRanges[KNEE]["beginner"]);
    // checkVal(ratioSlider, module.default.paramCorrectRanges[RATIO]["beginner"]);
    // checkVal(releaseSlider, module.default.paramCorrectRanges[RELEASE]["beginner"]);
}


// only will run audio context code when input audio is in play state
// input.addEventListener("play", () => {
    // https://webaudio.github.io/web-audio-api/#DynamicsCompressorNode
    // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode/DynamicsCompressorNode
    // var thresholdVal = -24; 
    // var kneeVal = 30;
    // var ratioVal = 12;
    // var attckVal = 0.003;
    // var releaseVal = 0.25;

if (!context) {
    fetchParamData();
    context = new AudioContext();
    
    // setting the intial values
    attackSlider.innerHTML = attackVal;
    kneeSlider.innerHTML = kneeVal;
    thresholdSlider.innerHTML = thresholdVal;
    ratioSlider.innerHTML = ratioVal;
    releaseSlider.innerHTML = releaseVal;

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
    
    
    compressButton.onclick = () => {
        context.resume();
        if (compressActive === "false") {
            // UI handling
            effect_bk.style.filter = `brightness(1)`;
            toggleSwitch.style.filter = `brightness(1)`;
            toggleMode.disabled = false;

            console.log(toggleMode.disabled);
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
            compressActive = "true";
            compressButton.setAttribute("data-active", compressActive);
            
        } else if (compressActive === "true") {
            toggleMode.disabled = true;
            // UI handling
            effect_bk.style.filter = `brightness(0.5)`;
            toggleSwitch.style.filter = `brightness(0.5)`;
            
            if (outputLtMeter && outputRtMeter) {
                outputLtMeter.value = 0;
                outputRtMeter.value = 0;
            }
            
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
            compressActive = "false";
            compressButton.setAttribute("data-active", compressActive);
            
        }
    };
    toggleMode.onclick = function() {
        // play audio with expected params
        if (toggleMode.checked == Mode.EXPECTED) {
            console.log("setting compressor params to expected");
            compressor.threshold.setValueAtTime(thrldAns, context.currentTime);
            compressor.attack.setValueAtTime(ATTACKVAL, context.currentTime);
            compressor.knee.setValueAtTime(KNEEVAL, context.currentTime);
            compressor.ratio.setValueAtTime(RATIOVAL, context.currentTime);
            compressor.release.setValueAtTime(RELVAL, context.currentTime);   
        } 
        // play audio with user's current parameters shown by sliders
        else {
            compressor.threshold.setValueAtTime(thresholdSlider.value, context.currentTime);
            compressor.attack.setValueAtTime(attackSlider.value, context.currentTime);
            compressor.knee.setValueAtTime(kneeSlider.value, context.currentTime);
            compressor.ratio.setValueAtTime(ratioSlider.value, context.currentTime);
            compressor.release.setValueAtTime(releaseSlider.value, context.currentTime);  
        }
    };

    thresholdSlider.oninput = function() {
        updateParam(this.value, thresholdSlider, "Threshold", compressor.threshold);
    };
    
    attackSlider.oninput = function() {
        updateParam(this.value, attackSlider, "Attack", compressor.attack);
    };
    
    kneeSlider.oninput = function() {
        updateParam(this.value, kneeSlider, "Knee", compressor.knee);
    };

    ratioSlider.oninput = function() {
        updateParam(this.value, ratioSlider, "Ratio", compressor.ratio);
    };

    releaseSlider.oninput = function() {
        updateParam(this.value, releaseSlider, "Release", compressor.release);
    };

    /**
     * @param {float} val - the new value to be assigned to parameter
     * @param {object} slider_id - slider (id) for specific parameter
     * @param {object} paramName - parameter name (displayed in UI)
     * @param {object} param - compressor parameter
     * ranges & defaults for each parameter:
     * threshold: [-100,0], -24
     * knee: [0, 40], 30
     * ratio: [1, 20], 12
     * attack: [0,1], 0.003
     * release: [0,1], 0.25
     * 
     */
    function updateParam(val, slider, paramName, param) {
        // only change param val if compressor is active
        if (compressActive === "true") {
            document.getElementById(slider.id +'_val').textContent = val;
            param.setValueAtTime(val, context.currentTime);
            // console.log(slider.id, ": ", val);
        }
    };
}
// });
