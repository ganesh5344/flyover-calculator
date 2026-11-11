const formulas = {
    wind: {
        name: "Wind load",
        equation: "P = 0.6 × V²",
        note: "Approximate pressure based on wind speed.",
        output: "Wind pressure",
        unit: "N/m²",
        precision: 2,
        inputs: [
            { id: "windSpeed", label: "Wind speed (V)", unit: "m/s" }
        ],
        calculate: ({ windSpeed }) => 0.6 * windSpeed ** 2
    },
    cable: {
        name: "Cable tension",
        equation: "H = (w × L²) / (8 × d)",
        note: "Uses a parabolic cable approximation under uniform load.",
        output: "Horizontal cable force",
        unit: "kN",
        precision: 2,
        positive: ["sag"],
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" },
            { id: "sag", label: "Sag depth (d)", unit: "m" }
        ],
        calculate: ({ load, span, sag }) => (load * span ** 2) / (8 * sag)
    },
    bending: {
        name: "Bending moment",
        equation: "M = (w × L²) / 8",
        note: "Simply supported beam with a uniformly distributed load.",
        output: "Maximum bending moment",
        unit: "kN·m",
        precision: 2,
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" }
        ],
        calculate: ({ load, span }) => (load * span ** 2) / 8
    },
    shear: {
        name: "Shear force",
        equation: "V = (w × L) / 2",
        note: "Support reaction for a simply supported beam under uniform load.",
        output: "Maximum shear force",
        unit: "kN",
        precision: 2,
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" }
        ],
        calculate: ({ load, span }) => (load * span) / 2
    },
    stress: {
        name: "Normal stress",
        equation: "σ = P / A",
        note: "Average normal stress over a uniform cross-sectional area.",
        output: "Normal stress",
        unit: "kN/m²",
        precision: 2,
        positive: ["area"],
        inputs: [
            { id: "force", label: "Axial load (P)", unit: "kN" },
            { id: "area", label: "Cross-sectional area (A)", unit: "m²" }
        ],
        calculate: ({ force, area }) => force / area
    },
    deadload: {
        name: "Dead load",
        equation: "DL = γ × V",
        note: "Self-weight calculated from unit weight and volume.",
        output: "Dead load",
        unit: "kN",
        precision: 2,
        inputs: [
            { id: "unitWeight", label: "Unit weight (γ)", unit: "kN/m³" },
            { id: "volume", label: "Volume (V)", unit: "m³" }
        ],
        calculate: ({ unitWeight, volume }) => unitWeight * volume
    },
    deflection: {
        name: "Beam deflection",
        equation: "δ = (5 × w × L⁴) / (384 × E × I)",
        note: "Simply supported beam with a uniformly distributed load.",
        output: "Maximum deflection",
        unit: "m",
        precision: 5,
        positive: ["elasticity", "inertia"],
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" },
            { id: "elasticity", label: "Young's modulus (E)", unit: "kN/m²" },
            { id: "inertia", label: "Second moment of area (I)", unit: "m⁴" }
        ],
        calculate: ({ load, span, elasticity, inertia }) =>
            (5 * load * span ** 4) / (384 * elasticity * inertia)
    }
};

const historyStorageKey = "spanlab-calculation-history";
const themeStorageKey = "spanlab-theme";
const projectStorageKey = "spanlab-project-brief";
const checklistStorageKey = "spanlab-project-checklist";
const maxHistoryItems = 8;
const defaultProject = {
    name: "Cable-Stayed Flyover Study",
    location: "",
    structure: "Cable-stayed flyover",
    stage: "concept",
    span: "",
    notes: ""
};
const projectSteps = ["scope", "site", "loads", "checks", "review"];
const stageLabels = {
    concept: "Concept study",
    preliminary: "Preliminary design",
    detailed: "Detailed design",
    review: "Review / submission"
};

const formulaSelect = document.getElementById("formulaSelect");
const inputArea = document.getElementById("inputArea");
const formulaText = document.getElementById("formulaText");
const calculationForm = document.getElementById("calculationForm");
const formMessage = document.getElementById("formMessage");
const resultCard = document.getElementById("result");
const resultName = document.getElementById("resultName");
const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");
const resultDetail = document.getElementById("resultDetail");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const historyCount = document.getElementById("historyCount");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

let historyItems = loadHistory();
let latestResult = "";
let projectData = loadProject();
let checklistState = loadChecklist();

function showFormula() {
    const formula = formulas[formulaSelect.value];
    inputArea.replaceChildren();
    resultCard.hidden = true;
    clearMessage();

    if (!formula) {
        formulaText.innerHTML = `
            <span class="formula-icon" aria-hidden="true">ƒx</span>
            <div>
                <p class="formula-title">Your formula will appear here</p>
                <p class="formula-equation">Choose a calculation to get started</p>
            </div>`;
        return;
    }

    formulaText.innerHTML = `
        <span class="formula-icon" aria-hidden="true">ƒx</span>
        <div>
            <p class="formula-title">${formula.note}</p>
            <p class="formula-equation">${formula.equation}</p>
        </div>`;

    formula.inputs.forEach((field) => {
        const wrapper = document.createElement("div");
        wrapper.className = "field-group";

        const label = document.createElement("label");
        label.htmlFor = field.id;
        label.textContent = field.label;

        const inputWrap = document.createElement("div");
        inputWrap.className = "input-wrap";

        const input = document.createElement("input");
        input.id = field.id;
        input.name = field.id;
        input.type = "number";
        input.step = "any";
        input.min = "0";
        input.required = true;
        input.inputMode = "decimal";
        input.placeholder = "0.00";
        input.setAttribute("aria-describedby", "formMessage");

        const unit = document.createElement("span");
        unit.className = "input-unit";
        unit.textContent = field.unit;

        inputWrap.append(input, unit);
        wrapper.append(label, inputWrap);
        inputArea.append(wrapper);
    });
}

function calculate(event) {
    event.preventDefault();
    const formulaId = formulaSelect.value;
    const formula = formulas[formulaId];

    if (!formula) {
        showMessage("Choose a formula before calculating.");
        return;
    }

    const values = {};
    for (const field of formula.inputs) {
        const input = document.getElementById(field.id);
        const value = input.value.trim() === "" ? NaN : Number(input.value);

        if (!Number.isFinite(value) || value < 0) {
            showMessage(`Enter a valid, non-negative value for ${field.label.toLowerCase()}.`);
            input.focus();
            return;
        }
        if (formula.positive && formula.positive.includes(field.id) && value === 0) {
            showMessage(`${field.label} must be greater than zero.`);
            input.focus();
            return;
        }
        values[field.id] = value;
    }

    const value = formula.calculate(values);
    if (!Number.isFinite(value)) {
        showMessage("These values are outside the range this calculator can process.");
        return;
    }

    const formattedValue = formatNumber(value, formula.precision);
    latestResult = `${formula.output}: ${formattedValue} ${formula.unit}`;
    resultName.textContent = formula.output;
    resultValue.textContent = formattedValue;
    resultUnit.textContent = formula.unit;
    resultDetail.textContent = `${formula.equation} · ${formula.name}`;
    resultCard.hidden = false;
    clearMessage();

    historyItems.unshift({
        formulaId,
        output: formula.output,
        value: formattedValue,
        unit: formula.unit,
        timestamp: new Date().toISOString()
    });
    historyItems = historyItems.slice(0, maxHistoryItems);
    saveHistory();
    renderHistory();
}

function formatNumber(value, precision) {
    return value.toFixed(precision).replace(/\.?0+$/, "");
}

function showMessage(message) {
    formMessage.textContent = message;
    formMessage.hidden = false;
}

function clearMessage() {
    formMessage.textContent = "";
    formMessage.hidden = true;
}

function loadHistory() {
    try {
        const saved = localStorage.getItem(historyStorageKey);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed.slice(0, maxHistoryItems) : [];
    } catch (error) {
        console.warn("Calculation history could not be loaded.", error);
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(historyStorageKey, JSON.stringify(historyItems));
    } catch (error) {
        console.warn("Calculation history could not be saved.", error);
        showMessage("Calculation completed, but this browser could not save your history.");
    }
}

function renderHistory() {
    historyList.replaceChildren();
    historyItems.forEach((item) => {
        const formula = formulas[item.formulaId];
        if (!formula) {
            return;
        }

        const entry = document.createElement("article");
        entry.className = "history-item";

        const meta = document.createElement("div");
        meta.className = "history-meta";

        const title = document.createElement("span");
        title.textContent = formula.name;

        const date = document.createElement("time");
        date.dateTime = item.timestamp;
        const parsedDate = new Date(item.timestamp);
        date.textContent = Number.isNaN(parsedDate.getTime())
            ? ""
            : parsedDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

        const value = document.createElement("p");
        value.className = "history-value";
        value.textContent = `${item.value} ${item.unit}`;

        meta.append(title, date);
        entry.append(meta, value);
        historyList.append(entry);
    });

    historyCount.textContent = String(historyList.childElementCount);
    historyEmpty.hidden = historyList.childElementCount > 0;
    clearHistoryButton.hidden = historyList.childElementCount === 0;
}

function loadProject() {
    try {
        const saved = localStorage.getItem(projectStorageKey);
        if (!saved) {
            return { ...defaultProject };
        }

        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object") {
            return { ...defaultProject };
        }

        return {
            name: typeof parsed.name === "string" ? parsed.name : defaultProject.name,
            location: typeof parsed.location === "string" ? parsed.location : "",
            structure: typeof parsed.structure === "string" ? parsed.structure : defaultProject.structure,
            stage: Object.prototype.hasOwnProperty.call(stageLabels, parsed.stage) ? parsed.stage : defaultProject.stage,
            span: typeof parsed.span === "string" ? parsed.span : "",
            notes: typeof parsed.notes === "string" ? parsed.notes : ""
        };
    } catch (error) {
        console.warn("The saved project brief could not be loaded.", error);
        return { ...defaultProject };
    }
}

function loadChecklist() {
    try {
        const saved = localStorage.getItem(checklistStorageKey);
        const parsed = saved ? JSON.parse(saved) : {};
        return Object.fromEntries(projectSteps.map((step) => [step, Boolean(parsed && parsed[step])]));
    } catch (error) {
        console.warn("The saved project checklist could not be loaded.", error);
        return Object.fromEntries(projectSteps.map((step) => [step, false]));
    }
}

function showProjectMessage(message, isError) {
    const projectMessage = document.getElementById("projectMessage");
    projectMessage.textContent = message;
    projectMessage.dataset.error = isError ? "true" : "false";
}

function updateProjectSummary() {
    document.getElementById("summaryName").textContent = projectData.name || defaultProject.name;
    document.getElementById("summaryStage").textContent = stageLabels[projectData.stage] || stageLabels.concept;
    document.getElementById("summaryStructure").textContent = projectData.structure || "Not specified";
    document.getElementById("summaryLocation").textContent = projectData.location || "Not specified";

    const span = Number(projectData.span);
    document.getElementById("summarySpan").textContent = projectData.span && Number.isFinite(span)
        ? `${span.toLocaleString(undefined, { maximumFractionDigits: 2 })} m`
        : "Not entered";
}

function populateProjectForm() {
    document.getElementById("projectName").value = projectData.name;
    document.getElementById("projectLocation").value = projectData.location;
    document.getElementById("structureType").value = projectData.structure;
    document.getElementById("projectStage").value = projectData.stage;
    document.getElementById("mainSpan").value = projectData.span;
    document.getElementById("projectNotes").value = projectData.notes;
    document.querySelectorAll("[data-project-step]").forEach((input) => {
        input.checked = checklistState[input.dataset.projectStep];
    });
    updateProjectSummary();
    updateChecklistProgress();
}

function saveProject(event) {
    event.preventDefault();
    const name = document.getElementById("projectName").value.trim();
    const structure = document.getElementById("structureType").value.trim();
    const spanInput = document.getElementById("mainSpan");
    const spanText = spanInput.value.trim();

    if (!name || !structure) {
        showProjectMessage("Enter a project name and structure type.", true);
        document.getElementById(!name ? "projectName" : "structureType").focus();
        return;
    }

    if (spanText && (!Number.isFinite(Number(spanText)) || Number(spanText) <= 0)) {
        showProjectMessage("Main span must be greater than zero, or left blank.", true);
        spanInput.focus();
        return;
    }

    projectData = {
        name,
        location: document.getElementById("projectLocation").value.trim(),
        structure,
        stage: document.getElementById("projectStage").value,
        span: spanText,
        notes: document.getElementById("projectNotes").value.trim()
    };

    try {
        localStorage.setItem(projectStorageKey, JSON.stringify(projectData));
        showProjectMessage("Project brief saved in this browser.", false);
    } catch (error) {
        console.warn("The project brief could not be saved.", error);
        showProjectMessage("The brief is shown here, but this browser could not save it.", true);
    }
    updateProjectSummary();
}

function updateChecklistProgress() {
    const completed = projectSteps.filter((step) => checklistState[step]).length;
    const progressTrack = document.querySelector(".progress-track");
    document.getElementById("progressLabel").textContent = `${completed} of ${projectSteps.length} complete`;
    document.getElementById("progressBar").style.width = `${(completed / projectSteps.length) * 100}%`;
    progressTrack.setAttribute("aria-valuenow", String(completed));
}

function updateChecklist(input) {
    const step = input.dataset.projectStep;
    if (!projectSteps.includes(step)) {
        return;
    }

    checklistState[step] = input.checked;
    updateChecklistProgress();
    try {
        localStorage.setItem(checklistStorageKey, JSON.stringify(checklistState));
        showProjectMessage("Checklist progress saved.", false);
    } catch (error) {
        console.warn("The checklist progress could not be saved.", error);
        showProjectMessage("Progress updated, but this browser could not save it.", true);
    }
}

function exportProject() {
    const report = {
        exportedAt: new Date().toISOString(),
        project: projectData,
        checklist: projectSteps.map((step) => ({
            step,
            complete: checklistState[step]
        })),
        recentCalculations: historyItems
    };
    const filename = (projectData.name || "flyover-project")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "flyover-project";
    const file = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${filename}-project-brief.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeLabel.textContent = dark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}

document.getElementById("calculationForm").addEventListener("submit", calculate);
formulaSelect.addEventListener("change", showFormula);
document.getElementById("projectForm").addEventListener("submit", saveProject);
document.querySelectorAll("[data-project-step]").forEach((input) => {
    input.addEventListener("change", () => updateChecklist(input));
});
document.getElementById("exportProjectButton").addEventListener("click", exportProject);
document.getElementById("printProjectButton").addEventListener("click", () => window.print());

document.getElementById("resetButton").addEventListener("click", () => {
    calculationForm.reset();
    resultCard.hidden = true;
    clearMessage();
    const firstInput = inputArea.querySelector("input");
    if (firstInput) {
        firstInput.focus();
    }
});

document.getElementById("copyButton").addEventListener("click", async () => {
    if (!navigator.clipboard) {
        showMessage("Clipboard access is unavailable here. You can select and copy the result.");
        return;
    }

    try {
        await navigator.clipboard.writeText(latestResult);
        document.getElementById("copyButton").textContent = "Copied!";
        window.setTimeout(() => {
            document.getElementById("copyButton").textContent = "Copy result";
        }, 1600);
    } catch (error) {
        console.warn("The result could not be copied.", error);
        showMessage("The result could not be copied. Please select and copy it instead.");
    }
});

clearHistoryButton.addEventListener("click", () => {
    historyItems = [];
    try {
        localStorage.removeItem(historyStorageKey);
    } catch (error) {
        console.warn("Saved calculation history could not be cleared.", error);
        showMessage("History could not be cleared from this browser.");
    }
    renderHistory();
});

themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
        localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
        console.warn("The selected theme could not be saved.", error);
    }
});

try {
    applyTheme(localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light");
} catch (error) {
    console.warn("The saved theme could not be loaded.", error);
    applyTheme("light");
}
populateProjectForm();
renderHistory();
