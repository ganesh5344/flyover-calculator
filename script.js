(() => {
const formulas = window.FlyoverFormulas;
const historyStorageKey = "spanlab-calculation-history";
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
let historyItems = loadHistory();
let latestResult = "";

function showFormula() {
    const formula = formulas[formulaSelect.value];
    inputArea.replaceChildren();
    resultCard.hidden = true;
    clearMessage();

    if (!formula) {
        formulaText.innerHTML = `
            <span class="formula-icon" aria-hidden="true">ƒx</span>
            <div>
                <p class="formula-title">Select a formula to see its assumptions</p>
                <p class="formula-equation">Your formula appears here</p>
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
        timestamp: new Date().toISOString(),
        inputs: formula.inputs.map((field) => ({
            label: field.label,
            value: values[field.id],
            unit: field.unit
        }))
    });

    try {
        localStorage.setItem(historyStorageKey, JSON.stringify(historyItems));
    } catch (error) {
        console.error("Calculation history could not be saved.", error);
        showMessage("Calculation completed, but its result could not be saved in this browser.");
    }
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
        return Array.isArray(parsed) ? parsed.filter((item) => item && formulas[item.formulaId]) : [];
    } catch (error) {
        console.warn("Calculation history could not be loaded.", error);
        return [];
    }
}

document.getElementById("calculationForm").addEventListener("submit", calculate);
formulaSelect.addEventListener("change", showFormula);

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
})();
