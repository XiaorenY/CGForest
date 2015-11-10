"use strict";

var canvas;
var gl;

var near = 0.1;
var far = 500.0;
var radius = 135.0;
var camTheta = 0.67;
var camPhi = 0.5;
var dr = 5.0 * Math.PI / 180.0;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix;
var modelViewLoc, projectionLoc;

// *****************************
// terrian 
var terrianPointsArray = [];
var terrianColorArray = [];
var terrianSide = 64;
var numTerrianVertex = 8188;
// grid is a two dimentional array
// x by z, value is the y
var grid = new Array(terrianSide);
for (var i = 0; i < terrianSide; i++) {
    grid[i] = new Array(terrianSide);
}

var eye;
const at = vec3(0.5 * terrianSide, 0.0, 0.5 * terrianSide);
const up = vec3(0.0, 1.0, 0.0);

var treeRadius = 0.125;

// ****************************
// sphere
var sphereIndex = 0;
var sphereNormalsArray = [];
var spherePointsArray = [];
var sphereColorsArray = [];
var sphereDivide = 2;

// ********************************
// cylinder
var cylinderIndex = 0;
var cylinderPointsArray = [];
var cylinderColorsArray = [];
var cylinderDivide = 4;

// ******************************
// polycylinder
var p1 = vec3(0.0, 0.0, 0.0);
var p2 = vec3(1.0, 0.0, 0.0);
var p3 = vec3(1.0, 1.0, 0.0);

// ******************************
// gloabl
var points = [];
var colors = [];
var NumVertices = 0;


// ***********************************
var LSystemFiles = [];
var numFiles = 0;
var TurtleList = [];
var vertexColor = [
        [0.0, 0.0, 0.0, 1.0],  // black
        [1.0, 0.0, 0.0, 1.0],  // red
        [1.0, 1.0, 0.0, 1.0],  // yellow
        [0.0, 1.0, 0.0, 1.0],  // green
        [0.0, 0.0, 1.0, 1.0],  // blue
        [1.0, 0.0, 1.0, 1.0],  // magenta
        [0.0, 1.0, 1.0, 1.0],  // cyan
        [1.0, 1.0, 1.0, 1.0]   // white
    ];

var treeNum = [];

// stack used to store the viewmatrix
// PushMatrix and PopMatrix is associated with it
var stack = [];     

window.onload = function init()
{
    inputFile();

    document.getElementById("clickToDraw").addEventListener("click", function () {
        points = [];
        colors = [];
        // test the expanded string
        //testRewrite();

        canvas = document.getElementById("gl-canvas");

        gl = WebGLUtils.setupWebGL(canvas);
        if (!gl) { alert("WebGL isn't available"); }

        //console.log("size of points " + points.length + " colors " + colors.length);

        vertexGenerate(points, colors);

        //console.log("size of points " + points.length + " colors " + colors.length);

        gl.viewport(0, 0, canvas.width, canvas.height);

        aspect = canvas.width / canvas.height;

        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        gl.enable(gl.DEPTH_TEST);

        //
        //  Load shaders and initialize attribute buffers
        //
        var program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        var vColor = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        modelViewLoc = gl.getUniformLocation(program, "modelView");
        projectionLoc = gl.getUniformLocation(program, "projection");

        render();
    });
    
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(camTheta) * Math.cos(camPhi),
                radius * Math.sin(camTheta) * Math.sin(camPhi),
                radius * Math.cos(camTheta));
    mvMatrix = lookAt(eye, at, up);

    pMatrix = perspective(fovy, aspect, near, far);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(pMatrix));


    // draw the terrian first
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, numTerrianVertex);

    var currentIndex = numTerrianVertex;
    var deltaIndex;

    for (var i = 0; i < treeNum.length; i++) {
        deltaIndex = renderLSystem(LSystemFiles[treeNum[i]], currentIndex);
        currentIndex += deltaIndex;
        //console.log("draw one tree and current index is " + currentIndex);
    }

    //window.requestAnimFrame(render);
}

// render one tree. 
// lsys contains the information about how the tree is generated
// start index shows the start point on the draw array
// the initial position of the tree is randomly placed on the terrian
function renderLSystem(lsys, startIndex) {
    var turtleString = lsys.finalString;
    // first draw a sphere at a random location in the terrian
    var xrad = getRandomInt(0, terrianSide);
    var zrad = getRandomInt(0, terrianSide);

    mvMatrix = lookAt(eye, at, up);

    // move to the random place and draw a sphere at there first
    var transMat = translate(xrad, grid[zrad][xrad], zrad);
    var rotateMat = rotate(-90.0, [1,0,0]);
    mvMatrix = mult(mvMatrix, transMat);
    mvMatrix = mult(mvMatrix, rotateMat);
    //console.log("render a tree, but first move the mvMatrix for the random location on the terrian, " + mvMatrix);
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.TRIANGLES, startIndex, sphereIndex);

    var currentIndex = startIndex + sphereIndex;

    // loop through the fianl string
    // different action depends on the character take in
    for (var i = 0; i < turtleString.length; i++) {
        if (turtleString[i] == 'F') {
            renderCylinderSphere(lsys, currentIndex);
            currentIndex += sphereIndex + cylinderIndex;
        }
        else if (turtleString[i] == 'f') {
            renderSphere(lsys, currentIndex);
            currentIndex += sphereIndex;
        }
        else if (turtleString[i] == '+') {
            rotateMat = rotate(lsys.rot[0], [1, 0, 0]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '-') {
            rotateMat = rotate(-lsys.rot[0], [1, 0, 0]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '&') {
            rotateMat = rotate(lsys.rot[1], [0, 1, 0]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '^') {
            rotateMat = rotate(-lsys.rot[1], [0, 1, 0]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString.charCodeAt(i) == 92) {
            rotateMat = rotate(lsys.rot[2], [0, 0, 1]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '/') {
            rotateMat = rotate(-lsys.rot[2], [0, 0, 1]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '|') {
            rotateMat = rotate(180.0, [1, 0, 0]);
            mvMatrix = mult(mvMatrix, rotateMat);
        }
        else if (turtleString[i] == '[') {
            PushMatrix(mvMatrix);
        }
        else if (turtleString[i] == ']') {                                      
            gl.drawArrays(gl.TRIANGLES, currentIndex, sphereIndex);
            currentIndex += sphereIndex;

            mvMatrix = PopMatrix();
        }
    }
    return currentIndex - startIndex;
}

// render a sphere after move certain distance
// Character is f
function renderSphere(lsys, indexStart) {
    var transMat = translate(0.0, 0.0, lsys.len);
    mvMatrix = mult(mvMatrix, transMat);

    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.TRIANGLES, indexStart, sphereIndex);

}

// render a cylinder and a sphere at the other end of the cylinder
// Character is F
function renderCylinderSphere(lsys, indexStart) {
    gl.uniformMatrix4fv(modelViewLoc, false, flatten(mvMatrix));
    gl.drawArrays(gl.TRIANGLES, indexStart, cylinderIndex);

    renderSphere(lsys, indexStart + cylinderIndex);
    
}


// use FileReader to read the input file
function inputFile() {
    // parse file 
    var fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', function (e) {

        var file = fileInput.files[0];
        var textType = /text.*/;

        numFiles += 1;

        try {
            if (file.type.match(textType)) {
                var reader = new FileReader();
                reader.readAsText(file);

                parseFile(reader);
            }
            else {
                throw "input file type is not acceptable";
            }
        }
        catch (err) {
            console.err(err);
        }
    });

}

// start to parse the file right after input it
// at the end, construct a LSystem object and push it to an array to store all LSystem
// the lengh and the radius of tree is some how depended on the number of iteration
function parseFile(reader) {
    var r;
    var len;
    var iter;
    var rot;
    var rep = [];
    var start;
    var grammar = new Grammar();

    reader.onload = function () {

        var lines = this.result.split('\n');
        for (var line = 0; line < lines.length; line++) {
            if (lines[line][0] != '#') {

                var res = lines[line].split(" ");
                if (res[0] == 'len:') {
                    len = res[1];
                }
                else if (res[0] == 'iter:') {
                    iter = res[1];
                }
                else if (res[0] == 'rot:') {
                    rot = vec3(res[1], res[2], res[3]);
                }
                else if(res[0]=='rep:'){
                    rep.push(res[1].split(','));
                }
                else if (res[0] == 'start:') {
                    start = res[1];
                }
                else {
                    if (res.length == 2) {
                        // Stochastic L-System 
                        if (res[0].indexOf('(') != -1) {
                            var temp = res[0].split('(');
                            var prop = res[0].substring(res[0].indexOf('(') + 1, res[0].indexOf(')'));
                            var temprule = new Rule(temp[0], res[1], prop);
                            grammar.addRule(temprule);

                        }
                        else {
                            var temp = res[0].split(':');
                            var temprule = new Rule(temp[0], res[1], '1');
                            grammar.addRule(temprule);
                        }
                    }
                }
            }
        }

        // the input file has bad format
        if (typeof len === 'undefined' || typeof iter == 'undefined' || typeof rot == 'undefined' || typeof start == 'undefined' || grammar.rules.length == 0) {
            throw "parse file no good";
        }
        else {
            // tapering effect to the tree, based on the number of iterations.
            if (iter > 5) {
                len *= 0.05;
                r = 3 * treeRadius;
            }
            else if (iter == 5) {
                len *= 0.1;
                r = 2.0 * treeRadius;
            }
            else if (iter == 4) {
                len *= 0.5;
                r = treeRadius;
            }
            else {
                r = 0.8 * treeRadius;
            }
            var tempLSystem = new LSystem(r, len, iter, rot, rep, start, grammar);

            LSystemFiles.push(tempLSystem);

            console.log(tempLSystem.toString());
            console.log("current number of file read is " + LSystemFiles.length);
            console.log("number of files is " + numFiles);
        }

    }
}

function PushMatrix(matrix) {
    stack.push(matrix);
    //console.log("push to the stack: " + matrix);
}

function PopMatrix() {
    try {
        if( stack.length > 0 ){
            var temp = stack.pop();
            //console.log("pop out from the stack: " + temp);
            return temp;
        }
        else {
            throw "Can't pop element from stack if it is null";
        }
    }
    catch (err) {
        console.error(err);
    }
    
}

//
// draw one tree
// push vertex to points array and colors array
// The end of the branch is actually a white sphere, not easy to see
function parseStringVertex(lsys, points, colors, randColor) {
    var turtleString = lsys.finalString;

    // generate one copy of vertex and color array for sphere and cylinder used for later
    sphere(lsys.radius, sphereDivide, randColor);
    cylinder(lsys.radius, cylinderDivide, lsys.len, randColor);

    //console.log("size of sphere array" + spherePointsArray.length + " color array" + sphereColorsArray.length);
    //console.log("size of cylinder array" + cylinderPointsArray.length + " color array" + cylinderColorsArray.length);

    var whiteSphere = [];
    for (var i = 0; i < spherePointsArray.length; i++) {
        whiteSphere.push(vertexColor[7]);
    }

    // first generate a sphere at the begining
    pushArray(points, spherePointsArray);
    pushArray(colors, sphereColorsArray);

    // go through every character of a string
    for (var i = 0; i < turtleString.length; i++) {
        if (turtleString[i] == 'F') {
            // push one cylinder and one sphere
            pushArray(points, cylinderPointsArray);
            pushArray(points, spherePointsArray);

            pushArray(colors, cylinderColorsArray);
            pushArray(colors, sphereColorsArray);
        }
        else if (turtleString[i] == 'f') {
            // push one sphere
            pushArray(points, spherePointsArray);
            pushArray(colors, sphereColorsArray);
        }
        else if (turtleString[i] == ']') {
            // push one white sphere
            pushArray(points, spherePointsArray);
            pushArray(colors, whiteSphere);
        }
    }
}

// generate the vertex of terrian by terrianVertex
// generate the vertex of one tree by one call of parseStringVertex
// the color is randomly choosen
function vertexGenerate(points, colors) {
    terrianVertex(points, colors);

    for (var i = 0; i < 20; i++) {
        var num = getRandomInt(0, LSystemFiles.length);
        var randColor = getRandomInt(0, 7);
        parseStringVertex(LSystemFiles[num], points, colors, randColor);
        treeNum.push(num);
    }

}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// push terrian vertex and color to array
function terrianVertex(points, colors) {
    terrian(terrianSide);

    pushArray(points, terrianPointsArray);
    pushArray(colors, terrianColorArray);
}

// helper routine to push array to another array
function pushArray(outList, inList) {
    for (var i = 0; i < inList.length; i++) {
        outList.push(inList[i]);
    }
}

