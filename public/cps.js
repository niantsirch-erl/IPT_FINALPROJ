let clicks = 0;
let startTime = null;
let endTime = null;

document.addEventListener("click", () => {
    clicks++;
    if (!startTime) startTime = performance.now();
    endTime = performance.now();
});

setInterval(() => {
    if (startTime && endTime) {
        const elapsedTimeInSeconds = (endTime - startTime) / 1000;
        const cps = clicks / elapsedTimeInSeconds;
        document.getElementById("cpsCounter").innerText = cps.toFixed(2) + " CPS";
        clicks = 0;
        startTime = null;
        endTime = null;
    }
}, 1000);

console.log(clicks);