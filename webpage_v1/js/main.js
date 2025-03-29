/**
 * main.js - Core functionality for U.S. Government Spending Visualization
 *
 * This file handles:
 * - Loading and processing the data
 * - Managing the state of the application
 * - Coordinating interactions between visualizations
 */

// Global variables
let rawFullData = null;
let processedYearlyFullData = {};
let processedYearlyCategoryBreakdown = {};
let processedCategoryData = {};
let categories = []; // Will hold the list of budget function categories
let selectedVal = ""; // Selected value from selector
let viewChanged = true;
let selectedView = "";

// Function to load the JSON data
async function loadData() {
    try {
        const response = await fetch('../data/budget_func_subfunc.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        rawFullData = await response.json();
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

    // Process data for each quarter
    Object.keys(rawFullData).forEach(quarter => {
        // Extract year from quarter (e.g., "2018Q1" -> "2018")
        const year = quarter.substring(0, 4);

        // Initialize year data if not exists
        if (!processedYearlyFullData[year]) {
            processedYearlyFullData[year] = {};
        }
        
        // Process each category in the quarter
        rawFullData[quarter].forEach(item => {
            const category = item.name;

            // Skip unnessary data
            // if (category == 'Unreported Data' || category == 'Governmental Receipts')
            //     return;

            const amount = item.amount;

            // Aggregate to yearly data
            if (!('total' in processedYearlyFullData[year])) {
                processedYearlyFullData[year]['total'] = 0;
            }
            processedYearlyFullData[year]['total'] += amount;

            if (!processedYearlyFullData[year][category]) {
                processedYearlyFullData[year][category] = {};
            }
            if (!processedYearlyFullData[year][category]['amount']) {
                processedYearlyFullData[year][category]['amount'] = 0;
            }
            processedYearlyFullData[year][category]['amount'] += amount;

            if (!processedYearlyFullData[year][category]['subfunctions']) {
                processedYearlyFullData[year][category]['subfunctions'] = {};
            }
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
    
    // TODO: Move to specific page
    // Generate barchart needed data
    Object.keys(processedYearlyFullData).forEach(year => {
        // Total
        if (!processedCategoryData['Total']) {
            processedCategoryData['Total'] = {};
        }
        processedCategoryData['Total'][year] = processedYearlyFullData[year].total

        Object.keys(processedYearlyFullData[year]).filter(cat => 
            cat !== 'total'
        ).forEach(cat => {
            if (!processedCategoryData[cat]) {
                processedCategoryData[cat] = {};
            }
            processedCategoryData[cat][year] = processedYearlyFullData[year][cat]['amount'];
        });
    });

    // Generate treemap needed data
    Object.keys(processedYearlyFullData).forEach(year => {
        if (!processedYearlyCategoryBreakdown[year]) {
            processedYearlyCategoryBreakdown[year] = {};
        }

        categories = [];
        values = [];
        percentages = [];
        parents = [];

        const totalAmount = processedYearlyFullData[year].total;

        // Top/total
        categories.push('Total');
        values.push(totalAmount);
        percentages.push((100.0).toFixed(1));
        parents.push('');

        Object.keys(processedYearlyFullData[year]).filter(cat => 
            cat !== 'total'
        ).forEach(cat => {
            const catAmount = processedYearlyFullData[year][cat]['amount'];

            categories.push(cat);
            values.push(catAmount);
            if (totalAmount == 0) {
                percentages.push((0.0).toFixed(1));
            } else {
                percentages.push((catAmount / totalAmount * 100).toFixed(1));
            }
            parents.push('Total');

            const subCatData = processedYearlyFullData[year][cat]['subfunctions'];

            Object.keys(subCatData).forEach(subCat => {
                // Specially handling subcategory equals to parent
                // e.g. Medicare
                if (subCat == cat) {
                    categories.push(subCat.toLowerCase());
                } else {
                    categories.push(subCat);
                }
                values.push(subCatData[subCat]);
                if (catAmount == 0) {
                    percentages.push((0.0).toFixed(1));
                } else {
                    percentages.push((subCatData[subCat] / catAmount * 100).toFixed(1));
                }
                parents.push(cat);
            });
        });

        processedYearlyCategoryBreakdown[year]['categories'] = categories;
        processedYearlyCategoryBreakdown[year]['values'] = values;
        processedYearlyCategoryBreakdown[year]['percentages'] = percentages;
        processedYearlyCategoryBreakdown[year]['parents'] = parents;
    });

    console.log("Data processing complete", processedYearlyCategoryBreakdown);
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

    // Add event listeners to embedded visualizations
    // addVisualizationEventListeners();
}

// Function to set the active view
function setActiveView(view) {
    console.log(`Setting active view to: ${view}`);
    viewChanged = true;
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

    // Update visualizations
    updateVisualizations();

    viewChanged = false;
}

// Function to update visualizations based on current selections
function updateVisualizations() {
    // For now, just log that we would update visualizations
    console.log(`Updating visualizations for view: ${selectedView}`);
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
}

// Initialize the application when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document loaded, initializing application...");
    loadData();

    // Add event listener
    const selector = document.getElementById('selector');
    if (selector) {
        selector.addEventListener('change', (event) => {
            selectedVal = event.target.value;
            
            // Update year display
            document.querySelectorAll('.selected-display').forEach(display => {
                display.textContent = selectedVal;
            });

            updateVisualizations();
        });
    }
});
