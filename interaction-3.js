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


function rotationChange(rotx, roty, rotz) {
    function angleDiff(a, b) {
        let d = a - b;
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        return Math.abs(d);
    }

    if (prevRot === null) {
        prevRot = [rotx, roty, rotz];
        return;
    }

    // how many degrees it turned since the last frame (largest of the three axes)
    const speed = Math.max(
        angleDiff(rotx, prevRot[0]),
        angleDiff(roty, prevRot[1]),
        angleDiff(rotz, prevRot[2])
    );
    prevRot = [rotx, roty, rotz];

    // smoothing: brief vibrations get averaged out
    swingSpeed = 0.85 * swingSpeed + 0.15 * speed;

    if (swingSpeed > 2.5) {
        rainLevel = 1;                  // big swing → rain
    } else {
        rainLevel = rainLevel * 0.7;   // not swinging → rain slowly fades
    }

    playAudio(rainLevel);
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