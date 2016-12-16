//test1.js
// constants
var age0 = 20;
var salary0 = 300000;
var expMultAtRetirement = 0.5; // reduce lifestyle at retirement by this factor
var inflationMult = 1.075;
var loanMult = 1.10;
var agePt = [40, 60, 85];
var salMult = [1.15, (inflationMult -0.025), 0];
var expMult = [salMult[0], inflationMult, inflationMult];
// parameters
var expRate = 0.70;
var nRuns = 60;
// current state
var currAge, currSal, currExp, currWorth, currRealWorth, currScore;
var score = 0;
var scorestats = Array(3);
// histogram of scores
var histScore = [];
// portfolio [FD, Debt, Equity]
var invAlloc = [1, 0, 0]; 
var avgYield = [inflationMult - 0.020, 1.08, 1.15]
var profitMult = [0, 0, 0];
var lossMult = [avgYield[0], 0.9, 0.70];
var lossProb = [0, 0.10, 0.25];

// generate stats from histScore
var do_stats = function() {
    var sum = 0;
    var hmin = 3e6; // very large value
    var hmax = -3e6; // very low value 
    var n = histScore.length;
    for(var k = 0; k < n; k++) {
        var t = histScore[k];
        sum += t;
        if (t < hmin) { hmin = t}
        else if (t > hmax){ hmax = t}
    }
    if (n > 0) {
        scorestats[0] = sum / n;
        scorestats[1] = hmin;
        scorestats[2] = hmax;
    }
}
// functions
var dump_state =  function() {
    console.log("curr state: %4.0d %12.0d %10.0d %10.0d %10.0d %10.0d ", currAge, currSal, currExp, currWorth, currRealWorth, currScore);

}
var dump_alloc = function() {
    console.log("invAlloc: ", invAlloc, "lossProb: ", lossProb);
    console.log("profitMult: ", profitMult);
}
/** normalize_alloc
    scale invAlloc to sum to 1.0
**/
var normalize_alloc = function() {
    var sum = 0;
    for(var k = 0; k < 3; k++){
        sum += invAlloc[k];
    }
    for(var k = 0; k < 3; k++){
        invAlloc[k] /= sum;
    }
}
/** init_profits
    compute profitMult based on avgYield, lossMult, lossProb
**/
var init_profit_mult = function() {
    for(var k = 0; k < 3; k++) {
        profitMult[k] = (avgYield[k] - lossProb[k]*lossMult[k])/(1-lossProb[k])
    }
}

var rg_read_nruns = function() {
    nRuns = Number(document.getElementById("idNRuns").value);
}

/** rg_read_fields
    set up expRate, invAlloc
**/
var rg_read_fields = function() {
    expRate = Number(document.getElementById("idExpRate").value) / 100;
    //console.log("fields: ", expRate); 
    invAlloc[0] = Number(document.getElementById("idFDPc").value);
    invAlloc[1] = Number(document.getElementById("idDebtPc").value);
    invAlloc[2] = Number(document.getElementById("idEquityPc").value);
    lossProb[0] = 0; // never any risk with FDs
    lossProb[1] = Number(document.getElementById("idDebtLoss").value) / 100;
    lossProb[2] = Number(document.getElementById("idEquityLoss").value) / 100;
}
/** rg_set_fields
    update invAlloc
**/
var rg_set_fields = function() {
    document.getElementById("idFDPc").value = (100 * invAlloc[0]).toFixed(1);
    document.getElementById("idDebtPc").value = (100 * invAlloc[1]).toFixed(1);
    document.getElementById("idEquityPc").value = (100 * invAlloc[2]).toFixed(1);
}

var rg_init = function() {
    init_profit_mult();
    normalize_alloc();
}

var rg_init_run = function() {
    currAge = age0;
    currSal = salary0;
    currExp = salary0 * expRate;
    currWorth = 0;
    currRealWorth = 0;
}

/** setExpenses:
    increase expenses based on multiplier but reset to starting exp
    inflation adjusted at age 60.
**/
var set_expenses = function() {
    if (currAge < agePt[0]) {
        currExp *= expMult[0];
        return;
    }
    if (currAge < agePt[1]) {
        currExp *= expMult[1];
        return;
    }
    if (currAge == agePt[1]) {
        //switch to life style at age0
        //currExp = salary0 * expRate * Math.pow(inflationMult, currAge - age0);
        // reduce lifestyle when retirement hits
        currExp *= expMultAtRetirement;
        return;
    }
    currExp *= expMult[2];
}

/** set_salary:
    give salary increment based on age and salMult
**/
var set_salary = function() {
    for(var i = 0; i < 3; i++) {
        if(currAge < agePt[i]) {
            currSal *= salMult[i];
            return;
        }
    }
    currSal = -1; // should be a NOTREACHED assert.
}

/** elem_gains
    random choice of loss or gain based on loss probability
    return growth multplier for ith asset type
**/
var elem_gains = function(k) {
    return invAlloc[k] * (
        Math.random() < lossProb[k] ? lossMult[k] : profitMult[k]);
}

var loan_growth = function() {
    return loanMult;
}

/** invest_gains
    compute gains for each allocation
    return consolidate growth multiplier
**/
var invest_gains = function() {
    var nv = 0;
    for(var i = 0; i < 3; i++) {
        nv += elem_gains(i);
    }
    return nv;
}

/** rg_step
    advance simultation by one year
    affects state variables.
**/
var rg_step = function() {
    if (currWorth > 0) {
        currWorth *= invest_gains();
    } else {
        currWorth *= loan_growth();
    }
    set_salary();
    set_expenses();
    currWorth += currSal - currExp;
    currAge++;
    currRealWorth = currWorth * Math.pow(inflationMult, age0 - currAge);
    currScore = currRealWorth / salary0;
}

var set_score = function() {
    score = (currWorth / salary0) * 
            Math.pow(inflationMult, age0 - currAge);
}
var fn_run_once = function() {
    rg_init_run();
    for(var j = 0; j < agePt[2] - age0; j++) {
        rg_step();
        //dump_state();
    }
    set_score(); 
}

var fn_run = function() {
    rg_read_fields();
    rg_read_nruns();
    rg_init();
    rg_set_fields();
    //dump_alloc();
    histScore = [];
    for(var k = 0; k < nRuns; k++) {
        fn_run_once();
        //console.log("score: ", score.toFixed(0));
        histScore.push(score);
    }
    var data = [
    {
        x: histScore,
        type: 'histogram',
        marker: {
          color: 'rgba(100,250,100,0.7)',
	    },
    }
    ];
    var layout = {
        title: "Histogram of all Runs",
        xaxis: {
           title: "Score",
        },
        yaxis: {
           title: "Number of runs",
        },
    
    }
    Plotly.newPlot('idHistScore', data, layout);
    do_stats();
    //update stats on page:
    var t = document.getElementById("idStats");
    t.innerHTML = "<b>SCORE STATS </b><br>Mean:   " + scorestats[0].toFixed(1) + ",<br>Min:     " + scorestats[1].toFixed(0) + ",<br>Max:    " +scorestats[2].toFixed(0)
}