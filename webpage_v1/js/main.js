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
        const response = await fetch('../data/budget_by_function.json');
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
    
    ;

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
            updateVisualizations();

            // Update year display
            document.querySelectorAll('.selected-year-display').forEach(display => {
                display.textContent = selectedYear;
            });
        });
    }

    // Initialize year display to default year
    document.querySelectorAll('.selected-year-display').forEach(display => {
        display.textContent = selectedYear;
    });

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

    // Update visualizations
    updateVisualizations();
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
});
