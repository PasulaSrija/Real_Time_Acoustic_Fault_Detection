
const API_BASE = "http://127.0.0.1:8000";

let monitoring = false;
let monitoringTimer = null;
let requestInProgress = false;
let latestData = null;


const COLORS = {
    grid: "#293e52",
    axis: "#d0deec",
    labels: "#ffffff",
    waveform: "#00e5ff",
    fft: "#ff8a00"
};


function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setConnection(connected) {
    const status = document.getElementById("connectionStatus");
    const dot = document.querySelector(".status-dot");

    if (status) {
        status.textContent = connected ? "BACKEND CONNECTED" : "BACKEND OFFLINE";
        status.style.color = connected ? "#59e0a1" : "#ff6675";
    }

    if (dot) {
        dot.classList.toggle("offline", !connected);
    }
}

function updateMonitoringButtons() {
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");

    if (startButton) {
        startButton.disabled = monitoring;
    }

    if (stopButton) {
        stopButton.disabled = !monitoring;
    }
}

function formatFault(fault) {
    return String(fault || "Unknown")
        .replaceAll("_", " ")
        .toUpperCase();
}

async function detectFault() {
    if (requestInProgress) {
        return;
    }

    const faultSelect = document.getElementById("fault");

    if (!faultSelect) {
        console.error("Fault selection element was not found.");
        return;
    }

    const fault = faultSelect.value;
    requestInProgress = true;

    try {
        const response = await fetch(
            `${API_BASE}/detect/${encodeURIComponent(fault)}`
        );

        if (!response.ok) {
            throw new Error(`Backend returned HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.sensor_rms) ||
            !Array.isArray(data.waveform) ||
            !Array.isArray(data.frequency) ||
            !Array.isArray(data.spectrum)) {
            throw new Error("Backend response is missing expected signal arrays.");
        }

        latestData = data;

        renderDetection(data);
        setConnection(true);

        setText(
            "lastUpdated",
            "Last analysis: " + new Date().toLocaleTimeString()
        );

    } catch (error) {
        console.error("Detection error:", error);
        setConnection(false);

        setText("lastUpdated", "Connection failed — check backend");

    } finally {
        requestInProgress = false;
    }
}

function renderDetection(data) {
    setText("faultResult", formatFault(data.fault));
    setText("confidence", data.confidence + "%");
    setText("location", data.location ?? "Not reported");
    setText("severity", data.severity ?? "Unknown");
    setText("status", data.status ?? "Unknown");

    for (let i = 0; i < 4; i++) {
        const value = Number(data.sensor_rms[i]);
        setText("sensor" + (i + 1), Number.isFinite(value) ? value.toFixed(4) : "--");
    }

    const rpm = document.getElementById("rpm");

    if (rpm) {
        rpm.textContent = data.rpm != null ? data.rpm + " RPM" : "--";
    }

    updateHealth(data.severity);
    updateStatusStyle(data.severity, data.status);
    highlightSensor(data.sensor_rms);

    drawWaveform(data.waveform);
    drawFFT(data.frequency, data.spectrum);

    addHistory(data);
    const confidenceValue = Number(data.confidence);
const confidenceBar = document.getElementById("confidenceBar");
const confidenceLabel = document.getElementById("confidenceLabel");

if (confidenceBar && Number.isFinite(confidenceValue)) {
    const percentage = Math.max(0, Math.min(100, confidenceValue));
    confidenceBar.style.width = percentage + "%";

    if (confidenceLabel) {
        confidenceLabel.textContent = percentage + "%";
    }
}

const rpmValue = Number(data.rpm);
const speedBar = document.getElementById("speedBar");
const speedMode = document.getElementById("speedMode");

if (speedBar && Number.isFinite(rpmValue)) {
    const percentage = Math.max(0, Math.min(100, rpmValue / 3000 * 100));
    speedBar.style.width = percentage + "%";
}

if (speedMode && Number.isFinite(rpmValue)) {
    speedMode.textContent =
        rpmValue >= 1450 && rpmValue <= 1550
            ? "Near nominal speed"
            : "Speed variation";
}
}

function updateHealth(severity) {
    let health = 100;

    if (severity === "Warning") {
        health = 70;
    } else if (severity === "Critical") {
        health = 30;
    }

    updateHealthGauge(health);
}

function updateHealthGauge(value) {
    const gauge = document.getElementById("healthGauge");
    const healthText = document.getElementById("health");
    const healthStatus = document.getElementById("healthStatus");

    if (!gauge || !healthText || !healthStatus) return;

    const parsedHealth = Number(value);
    const health = Number.isFinite(parsedHealth)
        ? Math.max(0, Math.min(100, parsedHealth))
        : 0;

    let color;
    let status;

    if (health >= 75) {
        color = "#00ff9c";
        status = "Healthy";
    } else if (health >= 40) {
        color = "#ffcc00";
        status = "Warning";
    } else {
        color = "#ff4057";
        status = "Critical";
    }

    gauge.style.setProperty("--health-angle", `${health * 3.6}deg`);
    gauge.style.setProperty("--health-color", color);

    healthText.textContent = `${Math.round(health)}%`;
    healthStatus.textContent = status;
    healthStatus.style.color = color;
}

function updateStatusStyle(severity, status) {
    const severityElement = document.getElementById("severity");
    const statusElement = document.getElementById("status");

    let color = "#59e0a1";

    if (severity === "Warning") {
        color = "#ffbd4a";
    } else if (severity === "Critical") {
        color = "#ff6675";
    }

    if (severityElement) {
        severityElement.style.color = color;
    }

    if (statusElement) {
        statusElement.style.color = color;
    }
}

function highlightSensor(sensorValues) {
    for (let i = 1; i <= 4; i++) {
        const card = document.getElementById("sensorCard" + i);

        if (card) {
            card.classList.remove("fault-sensor");
            card.classList.add("normal-sensor");
        }
    }

    if (!Array.isArray(sensorValues) || sensorValues.length === 0) {
        return;
    }

    const numbers = sensorValues.map(Number);
    const maxValue = Math.max(...numbers);

    if (!Number.isFinite(maxValue)) {
        return;
    }

    const strongestSensor = numbers.indexOf(maxValue) + 1;
    const selectedCard = document.getElementById("sensorCard" + strongestSensor);

    if (selectedCard) {
        selectedCard.classList.remove("normal-sensor");
        selectedCard.classList.add("fault-sensor");
    }
}

function prepareCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
        return null;
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    const ctx = canvas.getContext("2d");

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
        ctx,
        width: rect.width,
        height: rect.height
    };
}

function drawGrid(ctx, width, height, left, right, top, bottom, rows = 4, columns = 6) {
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    ctx.save();
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);

    for (let i = 0; i <= rows; i++) {
        const y = top + (plotHeight / rows) * i;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.stroke();
    }

    for (let i = 0; i <= columns; i++) {
        const x = left + (plotWidth / columns) * i;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, height - bottom);
        ctx.stroke();
    }

    ctx.restore();
}

function drawWaveform(waveform) {
    const canvas = document.getElementById("waveform");

    if (!canvas || !Array.isArray(waveform) || waveform.length === 0) {
        return;
    }

    const prepared = prepareCanvas(canvas);

    if (!prepared) {
        return;
    }

    const { ctx, width, height } = prepared;
    const left = 43;
    const right = 14;
    const top = 22;
    const bottom = 32;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const values = waveform.map(Number).filter(Number.isFinite);

    if (values.length < 2) {
        return;
    }

    const maxAbs = Math.max(...values.map(Math.abs)) || 1;
    const range = maxAbs * 1.15;

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, width, height, left, right, top, bottom, 4, 6);

    const zeroY = top + plotHeight / 2;

    ctx.save();
    ctx.strokeStyle = "#667c8f";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(left, zeroY);
    ctx.lineTo(width - right, zeroY);
    ctx.stroke();

    ctx.restore();

    // Axis labels
    ctx.fillStyle = COLORS.labels;
    ctx.font = "10px Segoe UI, Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.fillText(range.toFixed(3), left - 7, top + 4);
    ctx.fillText("0", left - 7, zeroY);
    ctx.fillText((-range).toFixed(3), left - 7, height - bottom);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("0", left, height - bottom + 9);

    ctx.textAlign = "right";
    ctx.fillText("Samples →", width - right, height - bottom + 9);

    // High-contrast waveform
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, plotWidth, plotHeight);
    ctx.clip();

    ctx.beginPath();

    values.forEach((value, i) => {
        const x = left + (i / (values.length - 1)) * plotWidth;
        const y = zeroY - (value / range) * (plotHeight / 2);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    // Dark outline keeps the bright trace distinct from the grid.
    ctx.strokeStyle = "#061017";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.strokeStyle = COLORS.waveform;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(57, 216, 255, 0.5)";
    ctx.shadowBlur = 5;
    ctx.stroke();

    ctx.restore();
}

function drawFFT(frequencies, spectrum) {
    const canvas = document.getElementById("fft");

    if (
        !canvas ||
        !Array.isArray(frequencies) ||
        !Array.isArray(spectrum) ||
        spectrum.length === 0
    ) {
        return;
    }

    const prepared = prepareCanvas(canvas);

    if (!prepared) {
        return;
    }

    const { ctx, width, height } = prepared;
    const left = 48;
    const right = 14;
    const top = 23;
    const bottom = 39;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const count = Math.min(frequencies.length, spectrum.length);

    const freq = frequencies.slice(0, count).map(Number);
    const magnitudes = spectrum.slice(0, count).map(Number);

    if (count < 2) {
        return;
    }

    const maxMagnitude = Math.max(...magnitudes.filter(Number.isFinite)) || 1;
    const maxFrequency = Math.max(...freq.filter(Number.isFinite)) || 1;

    ctx.clearRect(0, 0, width, height);

    drawGrid(ctx, width, height, left, right, top, bottom, 4, 6);

    // Axis lines
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, height - bottom);
    ctx.lineTo(width - right, height - bottom);
    ctx.stroke();

    ctx.restore();

    // Y-axis labels
    ctx.fillStyle = COLORS.labels;
    ctx.font = "10px Segoe UI, Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
        const magnitude = maxMagnitude * (1 - i / 4);
        const y = top + (plotHeight / 4) * i;

        ctx.fillText(magnitude.toFixed(3), left - 7, y);
    }

    // X-axis labels
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("0 Hz", left, height - bottom + 9);

    ctx.textAlign = "right";
    ctx.fillText(
        Math.round(maxFrequency) + " Hz",
        width - right,
        height - bottom + 9
    );

    // Frequency spectrum line
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, plotWidth, plotHeight);
    ctx.clip();

    ctx.beginPath();

    for (let i = 0; i < count; i++) {
        const x = left + (i / (count - 1)) * plotWidth;
        const magnitude = Number.isFinite(magnitudes[i]) ? magnitudes[i] : 0;
        const y = height - bottom - (magnitude / maxMagnitude) * plotHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    ctx.strokeStyle = "#0b0e12";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.strokeStyle = COLORS.fft;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 156, 85, 0.4)";
    ctx.shadowBlur = 5;
    ctx.stroke();

    ctx.restore();
}

function addHistory(data) {
    const historyBody = document.getElementById("historyBody");

    if (!historyBody) {
        return;
    }

    const emptyMessage = historyBody.querySelector(".empty-history");

    if (emptyMessage) {
        historyBody.innerHTML = "";
    }

    const row = document.createElement("tr");
    const values = [
        new Date().toLocaleTimeString(),
        formatFault(data.fault),
        data.confidence + "%",
        data.location ?? "Not reported",
        data.severity ?? "Unknown",
        data.status ?? "Unknown"
    ];

    values.forEach((value, index) => {
        const cell = document.createElement("td");
        cell.textContent = value;

        if (index === 4) {
            const severity = String(value).toLowerCase();

            if (severity === "critical") {
                cell.style.color = "#ff6675";
            } else if (severity === "warning") {
                cell.style.color = "#ffbd4a";
            } else {
                cell.style.color = "#59e0a1";
            }
        }

        row.appendChild(cell);
    });

    historyBody.prepend(row);

    while (historyBody.rows.length > 8) {
        historyBody.deleteRow(historyBody.rows.length - 1);
    }
}

function startMonitoring() {
    if (monitoring) {
        return;
    }

    monitoring = true;
    updateMonitoringButtons();

    // Run one analysis immediately, then repeat every two seconds.
    detectFault();

    monitoringTimer = setInterval(() => {
        detectFault();
    }, 2000);
}

function stopMonitoring() {
    monitoring = false;

    if (monitoringTimer !== null) {
        clearInterval(monitoringTimer);
        monitoringTimer = null;
    }

    updateMonitoringButtons();
}

function redrawGraphs() {
    if (!latestData) {
        return;
    }

    drawWaveform(latestData.waveform);
    drawFFT(latestData.frequency, latestData.spectrum);
}

window.addEventListener("resize", redrawGraphs);

document.addEventListener("DOMContentLoaded", () => {
    updateMonitoringButtons();

    // Show the first result without automatically starting continuous polling.
    detectFault();
});

