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
const dspName = "rain";
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
rain.createDSP(audioContext, 1024)
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

let restMag = null;      // gravity value when the phone is still (learned automatically)
let rainLevel = 0;       // rain intensity 0 ~ 1
let rainRange = null;

let prevRot = null;      // previous frame's angles
let swingSpeed = 0;      // smoothed swing speed

let restMag = null;      // gravity value when the phone is still
let smoothDev = 0;       // smoothed movement amount
let bigFrames = 0;       // how many frames in a row had big movement
let rainLevel = 0;       // rain intensity 0 ~ 1
let rainRange = null;

function accelerationChange(accx, accy, accz) {
    const mag = Math.sqrt(accx * accx + accy * accy + accz * accz);
    if (restMag === null) {
        restMag = mag;
    }

    // how far from "still" (0 = not moving)
    const dev = Math.abs(mag - restMag) / restMag;

    // smoothing: vibrations last too briefly and get averaged away
    smoothDev = 0.9 * smoothDev + 0.1 * dev;

    if (smoothDev > 0.4) {
        bigFrames++;
    } else {
        bigFrames = 0;
        if (dev < 0.1) {
            restMag = 0.995 * restMag + 0.005 * mag;   // update gravity only when still
        }
    }

    if (bigFrames >= 10) {
        rainLevel = 1;               // big movement for a while → rain
    } else {
        rainLevel = rainLevel * 0.95;
        if (rainLevel < 0.02) {
            rainLevel = 0;           // low enough → fully silent
        }
    }

    playAudio(rainLevel);
}

function rotationChange(rotx, roty, rotz) {
    
}

function mousePressed() {
    playAudio(mouseX/windowWidth)
    // Use this for debugging from the desktop!
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
    // big movements are handled in accelerationChange
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
//==========================================================================================

function playAudio(level) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // level is 0~1, converted to the parameter's range (never goes past the max)
    if (!rainRange) {
        rainRange = getMinMaxParam("/rain/density");   // ← change to the name shown in the console
    }
    const [minR, maxR] = rainRange;
    dspNode.setParamValue("/rain/density", minR + level * (maxR - minR));
}

//==========================================================================================
// END
//==========================================================================================