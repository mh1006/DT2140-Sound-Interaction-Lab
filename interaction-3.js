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

let restMag = null;      // gravity value when the phone is still (learned automatically)
let smoothDev = 0;       // smoothed movement amount
let bigFrames = 0;       // how many frames in a row had big movement
let lastDrop = 0;        // time of the last bubble

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

    // big movement for about 0.15 s → keep swinging = one bubble every 0.15 s
    if (bigFrames >= 10 && millis() - lastDrop > 150) {
        lastDrop = millis();
        playAudio();
    }
}


function mousePressed() {
    // playAudio()
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
    // drop is a trigger: 0 → 1 → 0 = one bubble
    dspNode.setParamValue("/bubble/drop", 1)
    setTimeout(() => { dspNode.setParamValue("/bubble/drop", 0) }, 50);
}

//==========================================================================================
// END
//==========================================================================================