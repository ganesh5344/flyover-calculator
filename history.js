(() => {
const formulas = window.FlyoverFormulas;
const historyStorageKey = "spanlab-calculation-history";
const historyTableBody = document.getElementById("historyTableBody");
const historyCount = document.getElementById("historyCount");
const historySearch = document.getElementById("historySearch");
const historyFilter = document.getElementById("historyFilter");
const historyMessage = document.getElementById("historyMessage");
const historyEmpty = document.getElementById("historyEmpty");
const historyEmptyTitle = document.getElementById("historyEmptyTitle");
const historyEmptyDescription = document.getElementById("historyEmptyDescription");
const emptyHistoryAction = historyEmpty.querySelector(".empty-action");
const exportCalculationsButton = document.getElementById("exportCalculationsButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
let historyItems = loadHistory();

function loadHistory() {
    try {
        const saved = localStorage.getItem(historyStorageKey);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed.filter((item) => item && formulas[item.formulaId]) : [];
    } catch (error) {
        console.warn("Calculation history could not be loaded.", error);
        historyMessage.textContent = "Could not read saved history in this browser.";
        return [];
    }
}

function formatInputs(item) {
    if (!Array.isArray(item.inputs) || item.inputs.length === 0) {
        return "Not recorded";
    }
    return item.inputs
        .map((input) => `${input.label}: ${input.value} ${input.unit}`)
        .join(" · ");
}

function renderHistory() {
    const searchTerm = historySearch.value.trim().toLowerCase();
    const selectedFormula = historyFilter.value;
    const filteredItems = historyItems.filter((item) => {
        const formula = formulas[item.formulaId];
        const searchableText = [
            formula.name,
            formula.equation,
            item.output,
            item.value,
            item.unit,
            formatInputs(item)
        ].join(" ").toLowerCase();
        return (!selectedFormula || item.formulaId === selectedFormula) &&
            (!searchTerm || searchableText.includes(searchTerm));
    });

    historyTableBody.replaceChildren();
    filteredItems.forEach((item) => {
        const formula = formulas[item.formulaId];
        const row = document.createElement("tr");
        const dateCell = document.createElement("td");
        const date = document.createElement("time");
        const parsedDate = new Date(item.timestamp);
        if (!Number.isNaN(parsedDate.getTime())) {
            date.dateTime = parsedDate.toISOString();
            date.textContent = parsedDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
        } else {
            date.textContent = "Date unavailable";
        }
        dateCell.append(date);

        const calculationCell = document.createElement("td");
        const calculationName = document.createElement("strong");
        calculationName.className = "table-calculation-name";
        calculationName.textContent = item.output || formula.output;
        const equation = document.createElement("span");
        equation.className = "table-equation";
        equation.textContent = `${formula.name} · ${formula.equation}`;
        calculationCell.append(calculationName, equation);

        const inputsCell = document.createElement("td");
        inputsCell.className = "table-inputs";
        inputsCell.textContent = formatInputs(item);

        const resultCell = document.createElement("td");
        resultCell.className = "table-result";
        resultCell.textContent = `${item.value} ${item.unit || formula.unit}`;

        row.append(dateCell, calculationCell, inputsCell, resultCell);
        historyTableBody.append(row);
    });

    historyCount.textContent = String(historyItems.length);
    historyEmpty.hidden = filteredItems.length > 0;
    emptyHistoryAction.hidden = historyItems.length > 0;
    clearHistoryButton.disabled = historyItems.length === 0;

    if (historyItems.length === 0) {
        historyEmptyTitle.textContent = "No calculations yet";
        historyEmptyDescription.textContent = "Run a calculation to start building your history.";
        historyMessage.textContent = "";
    } else if (filteredItems.length === 0) {
        historyEmptyTitle.textContent = "No matching calculations";
        historyEmptyDescription.textContent = "Try another search term or formula filter.";
    }
}

function csvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

function exportCalculations() {
    if (historyItems.length === 0) {
        historyMessage.textContent = "There are no calculations to export yet. Run a calculation first.";
        return;
    }

    const rows = [
        ["Calculated at", "Calculation", "Formula", "Inputs", "Result", "Unit"],
        ...historyItems.map((item) => {
            const formula = formulas[item.formulaId];
            return [
                item.timestamp,
                item.output || formula.output,
                formula.equation,
                formatInputs(item),
                item.value,
                item.unit || formula.unit
            ];
        })
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const filename = `flyover-calculations-${new Date().toISOString().slice(0, 10)}.csv`;
    const downloadUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);

    try {
        link.click();
        historyMessage.textContent = `CSV download started: ${filename}`;
    } catch (error) {
        console.error("Calculation export failed.", error);
        historyMessage.textContent = "Could not start the CSV download. Check browser download permissions.";
    } finally {
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    }
}

Object.entries(formulas).forEach(([id, formula]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = formula.name;
    historyFilter.append(option);
});

historySearch.addEventListener("input", renderHistory);
historyFilter.addEventListener("change", renderHistory);
exportCalculationsButton.addEventListener("click", exportCalculations);
clearHistoryButton.addEventListener("click", () => {
    try {
        localStorage.removeItem(historyStorageKey);
        historyItems = [];
        renderHistory();
        historyMessage.textContent = "Calculation history cleared.";
    } catch (error) {
        console.error("Calculation history could not be cleared.", error);
        historyMessage.textContent = "Could not clear saved history in this browser.";
    }
});

renderHistory();
})();
