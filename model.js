"use strict";

class Rule {
    constructor(lhs,rhs, prob) {
        this.lhs = lhs;
        this.rhs = rhs;
        this.prob = prob;
        this.multi = [];
        if (prob != 1) {
            var temp = { rhs: rhs, prob: prob };
            this.multi.push(temp);
        }
    }

    toString() {
        var str = this.lhs + ": " + this.rhs;
        console.log(this.multi);
        return str;
    }
}

class Grammar {
    
    constructor() {
        this.rules = [];
    }

    // add rule to grammar
    // if the lhs already exist, push rhs to multi of that rule
    addRule(rule) {
        if (rule.prob == 1) {
            this.rules.push(rule);
        }
        else {
            var isExist = false;
            this.rules.forEach(function (element, index, array){
                if (element.lhs == rule.lhs) {
                    isExist = true;
                    var newRule = { rhs: rule.rhs, prob: rule.prob };
                    element.multi.push(newRule);

                }
            });
            if (!isExist) {
                this.rules.push(rule);
            }
        }
    }

    // return the rhs based on the lhs
    // if this lhs has multiple rhs, return rhs based on probability
    // the way to implements it is set the threshold from 0 to 1
    // for example, F(0.33) = F, F(0.33) = F + F, F(0.34) = F - F;
    // random generate a float range from 0 to 1,
    // if < 0.33, return F
    // if <0.66 & >= 0.33, return F + F
    // if >= 0.66, return F - F
    getRhs(lhs) {

        for (var i = 0; i < this.rules.length; i++) {
            var elements = this.rules[i];
            if (elements.lhs == lhs) {
                if (elements.multi.length == 0) {
                    return elements.rhs;
                }
                else {
                    // first generate the threshold float number
                    var threshold = [];
                    for (var i = 0; i < elements.multi.length; i++) {
                        if (i == 0) {
                            threshold.push(elements.multi[i].prob);
                        }
                        else {
                            threshold.push(parseFloat(threshold[i - 1]) + parseFloat(elements.multi[i].prob));
                        }
                    }

                    // random number from 0 to 1
                    // based on the threshold, generate rhs
                    var ran = Math.random();

                    for (var i = 0; i < threshold.length; i++) {
                        if (ran < threshold[i]) {
                            //console.log("return a rhs based on stochastic, " + elements.multi[i].rhs);
                            return elements.multi[i].rhs;
                        }
                    }
                }
            }

        }
    }

    // takes in the number of iterations, start string and replacement policy, 
    // and returns a new string after rewrite  
    rewrite(iterations, start, rep) {
        var res = start;
        var temp = "";

        var replaceflag = false;

        // iterative expanding the string
        for (var i = 0; i < iterations; i++) {
            // go through the string
            for (var j = 0; j < res.length; j++) {
                replaceflag = false;
                // check every rules
                for (var k = 0; k < this.rules.length; k++) {
                    if (res[j] == this.rules[k].lhs) {
                        replaceflag = true;
                        var replace = this.getRhs(res[j]);
                        temp = temp + replace;
                    }
                }
                if (!replaceflag) {
                    temp = temp + res[j];
                }
            }
            res = temp;
            temp = "";
        }

        // replace certain string if needed
        if (rep.length > 0) {
            var repres = res;
            temp = "";
            replaceflag = false;

            for(var i = 0; i < repres.length; i++){
                
                replaceflag = false;
                for (var j = 0; j < rep.length; j++) {
                    if (repres[i] == rep[j][0]) {
                        replaceflag = true;
                        temp = temp + rep[j][1];
                    }
                }
                if (!replaceflag) {
                    temp = temp + repres[i];
                }
            }
            return temp;
        }
        else {
            return res;
        }

    }

    toString() {
        var str = "";
        for (var i = 0; i < this.rules.length; i++) {
            str = str + this.rules[i].toString() + "\n";
        }
        return str;
    }
}

// Class to store all the information of a input L System file
class LSystem {
    constructor(radius, len, iter, rot, rep, start, grammar) {
        this.radius = radius;
        this.len = len;
        this.iter = iter;
        this.rot = rot;
        this.rep = rep;                                 // remember to check the size of each element, if 1 omit that 
        this.start = start;
        this.grammar = grammar;
        this.finalString = "";

        this.rewrite();                                 // rewrite immediately after LSystem is construct
    }

    rewrite() {
        this.finalString = this.grammar.rewrite(this.iter, this.start, this.rep);
    }

    toString() {
        var str = "radius: " +this.radius+"; \nlen: " + this.len + "; \niter: " + this.iter + "; \nrot: " + this.rot + "; \nrep: " + this.rep + "; \nstart: " + this.start + "; \ngrammar: " + this.grammar.toString();
        console.log("final string is " + this.finalString);
        return str;
    }
}