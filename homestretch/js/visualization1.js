/**
 * visualization1.js - Total Spending Visualization
 * 
 * This file handles the functionality for the Total Spending visualization,
 * which shows the total government spending over time.
 */

selectedCategory = "Total";

// Object to manage the total spending visualization
const TotalSpendingViz = {
    // Reference to the iframe containing the visualization
    iframe: null,

    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Total Spending visualization");

        this.iframe = document.getElementById('totalSpendingViz');

        this.initializeVisualization();

        // Update on iframe load
        this.iframe.addEventListener('load', () => {
            this.updateVisualization(selectedCategory);
        });

        // Handle category dropdown inside iframe (optional for internal use)
        const categorySelector = document.getElementById('total_selector');
        if (categorySelector) {
            categorySelector.addEventListener('change', (event) => {
                selectedCategory = event.target.value;

                // Update visible display
                document.querySelectorAll('.selected-display').forEach(display => {
                    display.textContent = selectedCategory;
                });

                this.updateVisualization(selectedCategory);
            });
        }
    },

    // Update the visualization with a specific category
    updateVisualization: function(category = "Total") {
        if (!this.iframe) {
            console.warn("Total spending iframe not ready yet");
            return;
        }

        selectedCategory = category; // Update global/shared state
        console.log("Updating Total Spending visualization for category:", selectedCategory);
        this.updatePlot();
    },

    // Initialize Visualization once data is ready
    initializeVisualization: function() {
        if (!processedCategoryData) {
            console.log("Missing data, exiting");
            return;
        }
        console.log("Initializing Total Spending Graph");
        this.updatePlot();
    },

    // Plot update function
    updatePlot: function() {
        if (!processedCategoryData[selectedCategory]) {
            console.log("Missing data for category: ", selectedCategory);
            return;
        }

        const years = Object.keys(processedCategoryData[selectedCategory]).sort().reverse();
        const values = years.map(year => processedCategoryData[selectedCategory][year]);

        const data = [{
            x: years,
            y: values,
            type: 'bar',
            hovertemplate: 'Amount: %{y:$,.0f}<extra></extra>',
            marker: {
                color: 'steelblue'
            }
        }];

        const layout = {
            margin: { t: 20, l: 100, r: 100, b: 20 },
            height: 500,
            width: 1000,
            coloraxis: { showscale: false },
            yaxis: {
                tickprefix: "$",
                tickformat: "~s" // uses SI notation like B for billions
            }
        };

        Plotly.newPlot('totalSpendingViz', data, layout);
    },
};

// Message listener from main.js (via iframe postMessage)
window.addEventListener('message', (event) => {
    const data = event.data;
    if (data?.type === 'updateCategory' && data.category) {
        console.log("Received message to update category:", data.category);
        TotalSpendingViz.updateVisualization(data.category);
    }
});

// Patch into global updateVisualizations flow
const originalUpdateVisualizations = updateVisualizations;
updateVisualizations = function() {
    console.log("In the update visualizations function for total spend:", selectedCategory);
    originalUpdateVisualizations();

    if (selectedView === 'totalSpending') {
        if (viewChanged) {
            const selectorLabel = document.getElementById('total_selector');
            selectorLabel.textContent = "Select Category: ";

            const categorySelector = document.getElementById('total_selector');
            if (categorySelector) {
                categorySelector.innerHTML = '';
                // Separate and sort categories with "Total" on top
                let categories = Object.keys(processedCategoryData);
                const totalIndex = categories.indexOf("Total");
                if (totalIndex > -1) categories.splice(totalIndex, 1); // Remove "Total" temporarily
                categories.sort((a, b) => a.localeCompare(b)); // Alphabetize others

                // Add "Total" back to the top
                const totalOption = document.createElement('option');
                totalOption.value = "Total";
                totalOption.textContent = "Total Spending (All Categories)";
                categorySelector.appendChild(totalOption);

                // Add a visual divider
                const divider = document.createElement('option');
                divider.disabled = true;
                divider.textContent = "────────────";
                categorySelector.appendChild(divider);

                // Add remaining categories
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelector.appendChild(option);
                });

                categorySelector.value = selectedCategory;
                document.querySelectorAll('.selected-display').forEach(display => {
                    display.textContent = selectedCategory;
                });
            }
        }

        TotalSpendingViz.updateVisualization(selectedCategory);
    }
};

// Hook into application init
document.addEventListener('DOMContentLoaded', () => {
    const originalInitializeApplication = initializeApplication;
    initializeApplication = function() {
        originalInitializeApplication();
        TotalSpendingViz.initialize();
    };
});
