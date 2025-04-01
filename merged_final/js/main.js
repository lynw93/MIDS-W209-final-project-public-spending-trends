// Global variables
let rawData; // Will hold the original JSON data
let processedYearlyData = {}; // Will hold yearly aggregated data
let processedQuarterlyData = {}; // Will hold quarterly data
let categories = []; // Will hold the list of budget function categories
let selectedYear = "2023"; // Default selected year
let selectedView = "totalSpending"; // Default view
let viewChanged = true;
let rawFullData = null;
let processedYearlyFullData = {};
let processedYearlyCategoryBreakdown = {};
let processedCategoryData = {};
let selectedCategory = "Total"; // for total_spending

// Function to format large numbers in a more readable way
function formatAmount(amount) {
    if (amount >= 1e12) {
        return `$${(amount / 1e12).toFixed(1)}T`;
    } else if (amount >= 1e9) {
        return `$${(amount / 1e9).toFixed(1)}B`;
    } else if (amount >= 1e6) {
        return `$${(amount / 1e6).toFixed(1)}M`;
    } else {
        return `$${amount.toFixed(0)}`;
    }
}

// Function to calculate the percentage change between two values
function calculatePercentChange(oldValue, newValue) {
    return oldValue === 0 ? 0 : ((newValue - oldValue) / oldValue) * 100;
}

// Load data and initialize app
async function loadData() {
    try {
        // const response = await fetch("data/budget_by_function.json");
        const response = await fetch("data/budget_by_function.json");

        const jsonData = await response.json();

        // Store the data in both variables for compatibility
        rawData = jsonData;
        rawFullData = jsonData;

        processData();  // the unified version we discussed
        initializeApplication();
    } catch (error) {
        console.error("Failed to load data:", error);
        const errorElement = document.getElementById("loadingError");
        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.textContent = `Error loading data: ${error.message}`;
        }
    }
}

function processData() {
    console.log("Processing data...");

    // For visualizations 1 and 2 (full nested structure)
    Object.keys(rawFullData).forEach(quarter => {
        const year = quarter.substring(0, 4);

        if (!processedYearlyFullData[year]) {
            processedYearlyFullData[year] = {};
        }

        rawFullData[quarter].forEach(item => {
            const category = item.name;
            const amount = item.amount;

            if (!('total' in processedYearlyFullData[year])) {
                processedYearlyFullData[year]['total'] = 0;
            }
            processedYearlyFullData[year]['total'] += amount;

            if (!processedYearlyFullData[year][category]) {
                processedYearlyFullData[year][category] = { amount: 0, subfunctions: {} };
            }
            processedYearlyFullData[year][category]['amount'] += amount;

            if ('subfunctions' in item) {
                item.subfunctions.forEach(subitem => {
                    const subCategory = subitem.name;
                    const subAmount = subitem.amount;

                    if (!processedYearlyFullData[year][category]['subfunctions'][subCategory]) {
                        processedYearlyFullData[year][category]['subfunctions'][subCategory] = 0;
                    }
                    processedYearlyFullData[year][category]['subfunctions'][subCategory] += subAmount;
                });
            }
        });
    });

    // Bar chart support
    Object.keys(processedYearlyFullData).forEach(year => {
        if (!processedCategoryData['Total']) {
            processedCategoryData['Total'] = {};
        }
        processedCategoryData['Total'][year] = processedYearlyFullData[year].total;

        Object.keys(processedYearlyFullData[year]).filter(cat => cat !== 'total').forEach(cat => {
            if (!processedCategoryData[cat]) {
                processedCategoryData[cat] = {};
            }
            processedCategoryData[cat][year] = processedYearlyFullData[year][cat]['amount'];
        });
    });

    // Treemap support
    Object.keys(processedYearlyFullData).forEach(year => {
        if (!processedYearlyCategoryBreakdown[year]) {
            processedYearlyCategoryBreakdown[year] = {};
        }

        let categories = [];
        let values = [];
        let percentages = [];
        let parents = [];

        const totalAmount = processedYearlyFullData[year].total;

        categories.push('Total');
        values.push(totalAmount);
        percentages.push("100.0");
        parents.push('');

        Object.keys(processedYearlyFullData[year]).filter(cat => cat !== 'total').forEach(cat => {
            const catAmount = processedYearlyFullData[year][cat]['amount'];
            categories.push(cat);
            values.push(catAmount);
            percentages.push((catAmount / totalAmount * 100).toFixed(1));
            parents.push('Total');

            const subCatData = processedYearlyFullData[year][cat]['subfunctions'];
            Object.keys(subCatData).forEach(subCat => {
                categories.push(subCat);
                values.push(subCatData[subCat]);
                percentages.push((subCatData[subCat] / catAmount * 100).toFixed(1));
                parents.push(cat);
            });
        });

        processedYearlyCategoryBreakdown[year] = {
            categories, values, percentages, parents
        };
    });

    // 💡 ALSO: Build your original processedYearlyData for visualization 3 & 4
    for (const [quarter, items] of Object.entries(rawData)) {
        const year = quarter.slice(0, 4);
        if (!processedYearlyData[year]) processedYearlyData[year] = {};
        items.forEach(item => {
            if (!processedYearlyData[year][item.name]) {
                processedYearlyData[year][item.name] = 0;
            }
            processedYearlyData[year][item.name] += item.amount;
        });
    }

    console.log("Data processing complete.");
}

// Render charts for visualizations 1 and 2 (embedded)
function updateVisualizations() {

    if (selectedView === "totalSpending" && typeof renderTotalSpendingChart === "function") {
        console.log(`Updating visualizations for ${selectedView}, year ${selectedCategory}`);
        renderTotalSpendingChart(selectedCategory);
    }

    if (selectedView === "budgetCategories" && typeof renderCategoryBreakdownChart === "function") {
        console.log(`Updating visualizations for ${selectedView}, year ${selectedYear}`);
        renderCategoryBreakdownChart(selectedYear);
    }
}

// Initialize application
function initializeApplication() {
    console.log("Initializing application...");
    document.getElementById('loadingIndicator').style.display = 'none';

    // Tab switching logic
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            const view = tab.getAttribute("data-view");
            setActiveView(view);
        });
    });

    // Setup year selector dropdown (for Viz 1 & 2)
    const yearSelector = document.getElementById("yearSelector");
    if (yearSelector) {
        yearSelector.innerHTML = "";
        const years = Object.keys(processedYearlyData).sort().reverse();
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        });

        yearSelector.value = selectedYear;
        yearSelector.addEventListener("change", (event) => {
            selectedYear = event.target.value;
            if (selectedView === "impactfulEvents") {
                setupImpactfulEventsTab();
            } else {
                updateVisualizations();
            }

            // Update text for selected year display
            document.querySelectorAll('.selected-year-display').forEach(el => {
                el.textContent = selectedYear;
            });
        });
    }

    // Handle category selection for Total Spending tab
    const categorySelector = document.getElementById('total_selector');
    if (categorySelector) {
        categorySelector.addEventListener('change', (event) => {
            selectedCategory = event.target.value;
            const totalSpendingIframe = document.getElementById('totalSpendingViz');

            if (totalSpendingIframe && totalSpendingIframe.contentWindow) {
                totalSpendingIframe.contentWindow.postMessage({
                    type: 'updateCategory',
                    category: selectedCategory
                }, '*');
            }
        });
}

    // Setup Spending Changes dropdowns (messaging into iframe)
    const beginYearSelector = document.getElementById("beginYearSelector");
    const endYearSelector = document.getElementById("endYearSelector");
    const spendingIframe = document.getElementById("spendingChangeViz");

    if (beginYearSelector && endYearSelector && spendingIframe) {
        function postSpendingChangeMessage() {
            const beginYear = beginYearSelector.value;
            const endYear = endYearSelector.value;

            if (parseInt(beginYear) >= parseInt(endYear)) {
                console.warn("Begin year must be less than end year.");
                return;
            }

            spendingIframe.contentWindow.postMessage({
                type: "updateSpendingChange",
                beginYear,
                endYear
            }, "*");
        }

        function updateEndYearOptions(beginYear) {
            const validYears = [2019, 2020, 2021, 2022, 2023, 2024];
            const currentEndYear = parseInt(endYearSelector.value);
            endYearSelector.innerHTML = "";

            validYears.forEach(year => {
                if (year > parseInt(beginYear)) {
                    const option = document.createElement("option");
                    option.value = year;
                    option.textContent = year;
                    if (year === currentEndYear) option.selected = true;
                    endYearSelector.appendChild(option);
                }
            });
        }

        beginYearSelector.addEventListener("change", () => {
            updateEndYearOptions(beginYearSelector.value);
            postSpendingChangeMessage();
        });
        endYearSelector.addEventListener("change", postSpendingChangeMessage);

        // Trigger once at startup
        updateEndYearOptions(beginYearSelector.value);
        postSpendingChangeMessage();
    }

    setActiveView("totalSpending");
}

// Show/hide content sections based on active tab
function setActiveView(view) {
    selectedView = view;

    // Hide all sections and remove active tabs
    document.querySelectorAll(".content-section").forEach(section => {
        section.style.display = "none";
    });
    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    // Show selected section and activate tab
    document.getElementById(`${view}Content`).style.display = "block";
    document.querySelector(`.nav-tab[data-view="${view}"]`).classList.add("active");

    // Show/hide year selector container based on view
    const yearSelectorContainer = document.querySelector(".year-selector-container");
    if (yearSelectorContainer) {
        if (view === "spendingChanges") {
            yearSelectorContainer.style.display = "block";
        } else {
            yearSelectorContainer.style.display = "none";
        }
    }

    // Handle which visualization logic to call
    if (view === "impactfulEvents") {
        setupImpactfulEventsTab();
    } else {
        updateVisualizations();
    }
}


// === Impactful Events: Setup & Update ===

function setupImpactfulEventsTab() {
    // Hide year selector
    const yearSelectorContainer = document.querySelector(".year-selector-container");
    if (yearSelectorContainer) {
        yearSelectorContainer.style.display = "none";
    }

    // Set up checkbox listeners
    ["covid", "ukraine", "inflation", "all"].forEach(id => {
        const checkbox = document.querySelector(`input[value="${id}"]`);
        if (checkbox) {
            checkbox.addEventListener("change", updateImpactfulEventsVisualization);
        }
    });

    // Initial render
    updateImpactfulEventsVisualization();
}

async function updateImpactfulEventsVisualization() {
    const covid = document.querySelector(`input[value="covid"]`).checked;
    const ukraine = document.querySelector(`input[value="ukraine"]`).checked;
    const inflation = document.querySelector(`input[value="inflation"]`).checked;
    const all = document.querySelector(`input[value="all"]`).checked;

    const container = d3.select("#eventsVisualizationContainer");
    container.selectAll("*").remove();

    if (!covid && !ukraine && !inflation && !all) {
        container.append("p").text("Select one or more events to explore their impact.");
        return;
    }

    await renderImpactfulChart(container, {
        data: rawData,
        selectedEvents: { covid, ukraine, inflation, all }
    });
}

// Function to handle events from visualizations
function handleVisualizationEvent(eventData) {
    console.log("Visualization event received:", eventData);
}

// Initialize the application when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document loaded, initializing application...");
    loadData();
});

window.updateVisualizations = updateVisualizations;
