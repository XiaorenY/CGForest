"use strict";

// draw a cylinder 
// divide into multiple subset. Subset contains one quad and two triangle
function cylinder(radius, numTimesToSubdivide, len, randColor) {
    cylinderPointsArray = [];
    cylinderColorsArray = [];
    cylinderIndex = 0;

    var cyldelta = 2*Math.PI / numTimesToSubdivide;
    var cyltheta = 0;
    var a, b, c, d;
    // divide cylinder into numTimesToSubdivide subset
    // each subset contains one quad and two tri
    for (var i = 0; i < numTimesToSubdivide; i++) {
        
        a = vec4(radius * Math.cos(cyltheta), radius * Math.sin(cyltheta), 0.0, 1.0);
        b = vec4(radius * Math.cos(cyltheta + cyldelta), radius * Math.sin(cyltheta + cyldelta), 0.0, 1.0);
        d = vec4(radius * Math.cos(cyltheta), radius * Math.sin(cyltheta), len, 1.0);
        c = vec4(radius * Math.cos(cyltheta + cyldelta), radius * Math.sin(cyltheta + cyldelta), len, 1.0);

        subset(a, b, c, d, len, randColor);

        cyltheta += cyldelta;
    }
}
function subset(a, b, c, d, len, color) {
    quad(a, b, c, d, color, cylinderPointsArray, cylinderColorsArray);
    cylinderIndex += 6;

    var origin = vec4(0.0, 0.0, 0.0, 1.0);
    var to = vec4(0.0, 0.0, len, 1.0);
    tri(a, b, origin, color);
    tri(d, c, to, color);
}
function tri(a, b, c, color) {
    cylinderPointsArray.push(a);
    cylinderPointsArray.push(b);
    cylinderPointsArray.push(c);

    cylinderColorsArray.push(vertexColor[color % 7]);
    cylinderColorsArray.push(vertexColor[color % 7]);
    cylinderColorsArray.push(vertexColor[color % 7]);

    cylinderIndex += 3;

}

// draw a sphere
// The way mesh the top and down is different from the way on the body
function sphere(radius, numTimesToSubdivide, randColor) {
    spherePointsArray = [];
    sphereColorsArray = [];
    sphereIndex = 0;

    var sphdelta = Math.PI / numTimesToSubdivide;
    var sphphi = sphdelta;
    
    topdown(radius, sphdelta, 2 * numTimesToSubdivide, true, randColor);

    for (var i = 1; i < numTimesToSubdivide - 1; i++) {
        ring(radius, sphphi, sphdelta, 2 * numTimesToSubdivide, randColor);
        sphphi += sphdelta;
    }

    topdown(radius, sphphi - sphdelta, 2 * numTimesToSubdivide, false, randColor);

}
//  top and down are composed of triangle 
function topdown(radius, sphphi, numTimesToSubdivide, istop, randColor) {
    var top = vec4(0.0, 0.0, radius, 1.0);
    var down = vec4(0.0, 0.0, -radius, 1.0);
    var left, right;
    var theta = 0;
    var delta = 2 * Math.PI / numTimesToSubdivide;

    for (var i = 0; i < numTimesToSubdivide; i++) {
        right = vec4(radius * Math.sin(sphphi) * Math.cos(theta), radius * Math.sin(sphphi) * Math.sin(theta), radius * Math.cos(sphphi), 1.0);
        left = vec4(radius * Math.sin(sphphi) * Math.cos(theta + delta), radius * Math.sin(sphphi) * Math.sin(theta + delta), radius * Math.cos(sphphi), 1.0);

        if (istop == true) {
            spherePointsArray.push(top);
        }
        else {
            spherePointsArray.push(down);
        }
        spherePointsArray.push(right);
        spherePointsArray.push(left);

        sphereColorsArray.push(vertexColor[randColor]);
        sphereColorsArray.push(vertexColor[randColor]);
        sphereColorsArray.push(vertexColor[randColor]);

        sphereIndex += 3;

        theta += delta;
    }

}
// ring are composed of multiple quad
function ring(radius, sphphi, sphdelta, numTimesToSubdivide, randColor) {
    var theta = 0;
    var delta = 2 * Math.PI / numTimesToSubdivide;
    var a, b, c, d;

    for (var i = 0; i < numTimesToSubdivide; i++) {
        a = vec4(radius * Math.sin(sphphi) * Math.cos(theta), radius * Math.sin(sphphi) * Math.sin(theta), radius * Math.cos(sphphi), 1.0);
        b = vec4(radius * Math.sin(sphphi) * Math.cos(theta + delta), radius * Math.sin(sphphi) * Math.sin(theta + delta), radius * Math.cos(sphphi), 1.0);
        d = vec4(radius * Math.sin(sphphi) * Math.cos(theta), radius * Math.sin(sphphi) * Math.sin(theta), radius * Math.cos(sphphi +sphdelta), 1.0);
        c = vec4(radius * Math.sin(sphphi) * Math.cos(theta + delta), radius * Math.sin(sphphi) * Math.sin(theta + delta), radius * Math.cos(sphphi + sphdelta), 1.0);

        quad(a, b, c, d, randColor, spherePointsArray, sphereColorsArray);
        sphereIndex += 6;

        theta += delta;
    }
}
function quad(a, b, c, d, color, outPtList, outColList) {
    outPtList.push(a);
    outPtList.push(b);
    outPtList.push(c);
    outPtList.push(a);
    outPtList.push(c);
    outPtList.push(d);

    outColList.push(vertexColor[color % 7]);
    outColList.push(vertexColor[color % 7]);
    outColList.push(vertexColor[color % 7]);
    outColList.push(vertexColor[color % 7]);
    outColList.push(vertexColor[color % 7]);
    outColList.push(vertexColor[color % 7]);

}


// generate the terrian vertex
// Y-value is y = 3 * sin(0.2*x) * sin(0.2*z);
function terrian(terrianSide) {
    var vertexPoint = [];
    for (var i = 0; i < terrianSide; i++) {         // z value
        for (var j = 0; j < terrianSide; j++) {     // x value
            grid[i][j] = 3 * Math.sin(0.2 * i) * Math.sin(0.2 * j);
            vertexPoint.push(new vec4(j, grid[i][j], i, 1.0));
        }
    }
    var trianglestrip = initializeGrid(terrianSide, terrianSide);

    for (var i = 0; i < trianglestrip.length; i++) {
        terrianPointsArray.push(vertexPoint[trianglestrip[i] - 1]);
        terrianColorArray.push(vertexColor[i % 4 + 2]);
    }
}

// generate the triangle_strip array for this grid
function initializeGrid(cols, rows) {
    var RCvertices = 2 * cols * (rows - 1);
    var TSvertices = 2 * cols * (rows - 1) + 2 * (rows - 2);
    //numVertices = TSvertices;
    var j = 0;

    var trianglestrip = [];

    for (var i = 1; i <= RCvertices; i += 2) {
        trianglestrip[j] = (1 + i) / 2;
        trianglestrip[j + 1] = (cols * 2 + i + 1) / 2;
        if (trianglestrip[j + 1] % cols == 0) {
            if (trianglestrip[j + 1] != cols && trianglestrip[j + 1] != cols * rows) {
                trianglestrip[j + 2] = trianglestrip[j + 1];
                trianglestrip[j + 3] = (1 + i + 2) / 2;
                j += 2;
            }
        }
        j += 2;
    }

    return trianglestrip;
}



