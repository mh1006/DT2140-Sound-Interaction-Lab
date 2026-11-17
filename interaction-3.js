//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "bubble";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
bubble.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

let restMag = null;
let smoothDev = 0;
let smallFrames = 0;
let lastBig = 0;
let lastDrop = 0;

function accelerationChange(accx, accy, accz) {
    const mag = Math.sqrt(accx * accx + accy * accy + accz * accz);
    if (!isFinite(mag) || mag < 0.1) return;

    if (restMag === null) restMag = mag;
    const dev = Math.abs(mag - restMag) / restMag;
    smoothDev = 0.7 * smoothDev + 0.3 * dev;

    if (smoothDev > 0.12) {
        lastBig = millis();
        smallFrames = 0;
    } else if (smoothDev > 0.02) {
        smallFrames++;
    } else {
        smallFrames = 0;
        restMag = 0.99 * restMag + 0.01 * mag;
    }

    const now = millis();
    if (smallFrames >= 3 && now - lastBig > 300 && now - lastDrop > 120) {
        lastDrop = now;
        playAudio();
    }
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    playAudio();
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    //playAudio();
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

function playAudio() {
     if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    dspNode.setParamValue("/bubble/drop", 1)
    setTimeout(() => { dspNode.setParamValue("/bubble/drop", 0) }, 100);
}

//==========================================================================================
// END
//==========================================================================================