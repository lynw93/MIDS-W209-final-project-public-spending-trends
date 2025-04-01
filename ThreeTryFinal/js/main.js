/**
 * main.js - Core functionality for U.S. Government Spending Visualization
 *
 * This file handles:
 * - Loading and processing the data
 * - Managing the state of the application
 * - Coordinating interactions between visualizations
 */

// Global variables
let rawData; // Will hold the original JSON data
let processedYearlyData = {}; // Will hold yearly aggregated data
let processedQuarterlyData = {}; // Will hold quarterly data
let categories = []; // Will hold the list of budget function categories
let selectedYear = "2023"; // Default selected year
let selectedView = "totalSpending"; // Default view

// Function to load the JSON data
async function loadData() {
    try {
        const response = await fetch('data/budget_by_function.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        rawData = await response.json();
        console.log("Data loaded successfully");
        processData();
        initializeApplication();
    } catch (error) {
        console.error('Error loading the data:', error);
        document.getElementById('loadingError').style.display = 'block';
        document.getElementById('loadingError').textContent = `Error loading data: ${error.message}`;
    }
}

// Function to process the raw data into usable formats
function processData() {
    console.log("Processing data...");

    // Extract unique categories and years
    const categoriesSet = new Set();
    const yearsSet = new Set();

    // Process data for each quarter
    Object.keys(rawData).forEach(quarter => {
        // Extract year from quarter (e.g., "2018Q1" -> "2018")
        const year = quarter.substring(0, 4);
        yearsSet.add(year);

        // Initialize year data if not exists
        if (!processedYearlyData[year]) {
            processedYearlyData[year] = {};
        }

        // Store quarterly data
        processedQuarterlyData[quarter] = {};

        // Process each category in the quarter
        rawData[quarter].forEach(item => {
            const category = item.name;
            const amount = item.amount;

            categoriesSet.add(category);

            // Add to quarterly data
            processedQuarterlyData[quarter][category] = amount;

            // Aggregate to yearly data
            if (!processedYearlyData[year][category]) {
                processedYearlyData[year][category] = 0;
            }
            processedYearlyData[year][category] += amount;
        });
    });

    // Convert the set to array
    categories = Array.from(categoriesSet);

    // Calculate yearly totals
    Object.keys(processedYearlyData).forEach(year => {
        let yearTotal = 0;
        Object.entries(processedYearlyData[year]).forEach(([category, amount]) => {
            // Exclude certain categories from total
            if (category !== 'Unreported Data' && category !== 'Governmental Receipts') {
                yearTotal += amount;
            }
        });
        processedYearlyData[year].Total = yearTotal;
    });

    console.log("Data processing complete");
}

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

// Function to initialize the application
function initializeApplication() {
    console.log("Initializing application...");

    // Hide loading indicator
    document.getElementById('loadingIndicator').style.display = 'none';

    // Initialize event listeners for navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-view');
            setActiveView(view);
        });
    });

    // Initialize with total spending view
    setActiveView('totalSpending');

    // Initialize year selector dropdown
    const yearSelector = document.getElementById('yearSelector');
    if (yearSelector) {
        // Clear existing options
        yearSelector.innerHTML = '';

        // Add options for each year (in reverse chronological order)
        const years = Object.keys(processedYearlyData).sort().reverse();
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        });

        // Set default value
        yearSelector.value = selectedYear;

        // Add event listener
        yearSelector.addEventListener('change', (event) => {
            selectedYear = event.target.value;
            if (selectedView === "impactfulEvents") {
                setupImpactfulEventsTab(); // Call your custom function
            } else {
                updateVisualizations(); // Call normal visualizations for other tabs
            }

            // Update year display
            document.querySelectorAll('.selected-year-display').forEach(display => {
                display.textContent = selectedYear;
            });
        });
    }

    // Add event listeners to embedded visualizations
    addVisualizationEventListeners();
}

// Function to set the active view
function setActiveView(view) {
    console.log(`Setting active view to: ${view}`);
    selectedView = view;

    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');

        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        }
    });

    // Show/hide corresponding content
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(`${view}Content`).style.display = 'block';

    // Hide year selector only on impactfulEvents tab
    const yearSelectorContainer = document.querySelector('.year-selector-container');
    if (yearSelectorContainer) {
        if (view === 'impactfulEvents') {
            yearSelectorContainer.style.display = 'none';

            // ✅ Add this line right here
            setupImpactfulEventsTab();
        } else {
            yearSelectorContainer.style.display = 'block';
        }
    }

    // Update visualizations
    updateVisualizations();
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


// Function to update visualizations based on current selections
function updateVisualizations() {
    // For now, just log that we would update visualizations
    console.log(`Updating visualizations for view: ${selectedView}, year: ${selectedYear}`);

    // This function will be extended by Person 1 and Person 2
    // to update their respective visualizations
}

// Function to add event listeners to embedded visualizations
function addVisualizationEventListeners() {
    console.log("Adding visualization event listeners");

    // This will be implemented by Person 1 and Person 2
    // to add event listeners to their visualizations

    // Example: Listen for messages from embedded visualizations
    window.addEventListener('message', (event) => {
        // Ensure the message is from our visualizations
        if (event.data && event.data.type === 'visualizationEvent') {
            handleVisualizationEvent(event.data);
        }
    });
}

// Function to handle events from visualizations
function handleVisualizationEvent(eventData) {
    console.log("Visualization event received:", eventData);

    // Handle different types of events
    switch (eventData.action) {
        case 'yearSelected':
            // Update selected year
            selectedYear = eventData.year;

            // Update year selector dropdown
            const yearSelector = document.getElementById('yearSelector');
            if (yearSelector) {
                yearSelector.value = selectedYear;
            }

            // Update visualizations
            updateVisualizations();
            break;

        case 'categorySelected':
            // Handle category selection
            // This will be implemented by Person 2
            break;

        default:
            console.log("Unknown visualization event action");
    }
}

// Initialize the application when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document loaded, initializing application...");
    loadData();

    // Handle Spending Changes dropdowns (outside iframe)
    const beginYearSelector = document.getElementById('beginYearSelector');
    const endYearSelector = document.getElementById('endYearSelector');
    const spendingIframe = document.getElementById('spendingChangeViz');

    if (beginYearSelector && endYearSelector && spendingIframe) {
        function postSpendingChangeMessage() {
            const beginYear = beginYearSelector.value;
            const endYear = endYearSelector.value;

            if (parseInt(beginYear) >= parseInt(endYear)) {
                console.warn("Begin year must be less than end year.");
                return;
            }

            spendingIframe.contentWindow.postMessage({
                type: 'updateSpendingChange',
                beginYear,
                endYear
            }, '*');
        }

        function updateEndYearOptions(beginYear) {
            const currentEndYear = parseInt(endYearSelector.value);
            const validYears = [2019, 2020, 2021, 2022, 2023, 2024];
            endYearSelector.innerHTML = "";

            validYears.forEach(year => {
                if (year > parseInt(beginYear)) {
                    const option = document.createElement("option");
                    option.value = year;
                    option.textContent = year;
                    if (year === currentEndYear) {
                        option.selected = true;
                    }
                    endYearSelector.appendChild(option);
                }
            });
        }

        beginYearSelector.addEventListener('change', () => {
            updateEndYearOptions(beginYearSelector.value);
            postSpendingChangeMessage();
        });

        endYearSelector.addEventListener('change', postSpendingChangeMessage);

        // ⬇️ New: Wait until iframe loads before posting message
        spendingIframe.addEventListener('load', () => {
            updateEndYearOptions(beginYearSelector.value);
            postSpendingChangeMessage();
        });
    } else {
        console.warn("Spending changes year selectors or iframe not found in DOM.");
    }

    // Support for other single-year selectors (e.g., Total Spending tab)
    const singleYearSelector = document.getElementById('yearSelector');
    const viz1Iframe = document.getElementById('totalSpendingViz');

    if (singleYearSelector && viz1Iframe) {
        singleYearSelector.addEventListener('change', function () {
            viz1Iframe.contentWindow.postMessage({
                type: 'updateYear',
                year: this.value
            }, '*');
        });
    }
});

// Run setup once the tab is clicked
const impactfulTab = document.querySelector("#impactful-tab");
if (impactfulTab) {
    impactfulTab.addEventListener("click", () => {
        setupImpactfulEventsTab();
    });
}
