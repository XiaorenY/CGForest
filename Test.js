"use strict"

function testRewrite() {
    console.log("LSystemFiles has length "+LSystemFiles.length);
    if (LSystemFiles.length > 0) {
        console.log("Have load LSystem file. Start to test the rewrite");
        for (var i = 0; i < LSystemFiles.length; i++) {
            console.log("Test on No # " + i);
            console.log("Start: " + LSystemFiles[i].start + ", after " + LSystemFiles[i].iter + " iterations.");
            console.log("End: " + LSystemFiles[i].finalString);
        }
    }

}
