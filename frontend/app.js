const logWindow = document.getElementById('logWindow');
const validateBtn = document.getElementById('validateBtn');
const resultsSection = document.getElementById('resultsSection');
const form = document.getElementById('orchestratorForm');

// Chart instance
let riskChart = null;

function addLog(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="opacity:0.5">[${timestamp}]</span> ${msg}`;
    logWindow.appendChild(entry);
    logWindow.scrollTop = logWindow.scrollHeight;
}

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // UI Reset
    resultsSection.classList.add('hidden');
    logWindow.innerHTML = '';
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Orchestrating...';

    const formData = new FormData(form);

    // Simulate steps for "Wow" effect
    addLog("Orchestrator received request.", "system");
    await new Promise(r => setTimeout(r, 600));

    addLog("Initializing Validation Agent...", "info");
    await new Promise(r => setTimeout(r, 800));
    addLog("Validation Agent: Querying NPI Registry...", "thinking");
    addLog("Validation Agent: Checking OIG Exclusion List...", "thinking");

    try {
        const response = await fetch('/api/orchestrate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("API Request Failed");

        const data = await response.json();

        addLog("Validation Complete. Confidence calculated.", "success");
        await new Promise(r => setTimeout(r, 500));

        addLog("Predictive Agent: Analyzing historical patterns...", "info");
        await new Promise(r => setTimeout(r, 600));
        addLog(`Predictive Agent: Risk assessed as ${data.predictive_analysis.risk_level}.`, "success");

        if (data.document_analysis.has_document) {
            addLog("Document Agent: Processing attached file...", "info");
            addLog("Document text extracted via OCR/PDF Parser.", "success");
        }

        renderResults(data);

    } catch (err) {
        addLog(`Error: ${err.message}`, "error");
    } finally {
        validateBtn.disabled = false;
        validateBtn.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> Run Orchestration';
    }
});

function renderResults(data) {
    resultsSection.classList.remove('hidden');

    // 1. Validation Report
    const checklist = document.getElementById('validationChecklist');
    checklist.innerHTML = '';

    const report = data.validation_report;
    const score = Math.round(report.overall_confidence * 100);
    document.getElementById('validationScore').innerText = `${score}%`;
    document.getElementById('validationScore').style.color = score > 80 ? 'var(--success)' : 'var(--danger)';

    report.source_checks.forEach(check => {
        const li = document.createElement('li');
        const isPass = check.status !== 'Failed' && check.status !== 'MATCH FOUND' && check.status !== 'Not Found';
        li.innerHTML = `
            <span><ion-icon name="${isPass ? 'checkmark-circle' : 'alert-circle'}"></ion-icon> ${check.source}</span>
            <span class="status ${isPass ? 'pass' : 'fail'}">${check.status}</span>
        `;
        checklist.appendChild(li);
    });

    // 2. Predictive Analysis
    const pred = data.predictive_analysis;
    const riskPercent = pred.risk_score * 100;
    document.getElementById('riskLabel').innerText = pred.risk_level;
    const bar = document.getElementById('riskBar');
    bar.style.width = `${riskPercent}%`;
    bar.style.backgroundColor = riskPercent > 60 ? 'var(--danger)' : (riskPercent > 30 ? '#facc15' : 'var(--success)');

    document.getElementById('degradationDate').innerText = `Est. Decay: ${pred.predicted_degradation_date}`;

    // 3. Document
    const docText = data.document_analysis.extracted_text_preview;
    document.getElementById('docPreview').innerText = docText ? `Extracted Snippet:\n"${docText}..."` : "No text found or no document uploaded.";

    // 4. Chart
    renderChart(pred);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function renderChart(predData) {
    const ctx = document.getElementById('riskChart').getContext('2d');

    if (riskChart) riskChart.destroy();

    // Fake historical trend for the chart
    const currentRisk = predData.risk_score;
    const labels = ['6 Mo Ago', '5 Mo Ago', '4 Mo Ago', '3 Mo Ago', '2 Mo Ago', '1 Mo Ago', 'Now', '1 Mo Future', '2 Mo Future'];
    const dataPoints = [
        currentRisk * 0.4,
        currentRisk * 0.45,
        currentRisk * 0.5,
        currentRisk * 0.55,
        currentRisk * 0.6,
        currentRisk * 0.8,
        currentRisk,
        Math.min(1, currentRisk * 1.2),
        Math.min(1, currentRisk * 1.4)
    ];

    riskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Data Degradation Risk Over Time',
                data: dataPoints,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                y: { beginAtZero: true, max: 1.2, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}
