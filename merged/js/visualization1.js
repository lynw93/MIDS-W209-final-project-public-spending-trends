/**
 * visualization1.js - Total Spending Visualization
 * 
 * This file handles the functionality for the Total Spending visualization,
 * which shows the total government spending over time.
 */

const defaulCategory = "Total"; // Default selected category

// Object to manage the total spending visualization
const TotalSpendingViz = {
    // Reference to the iframe containing the visualization
    iframe: null,
    
    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Total Spending visualization");
        
        this.iframe = document.getElementById('totalSpendingViz');
        
        this.initializeVisualization();
        
        // Send initial data to the iframe once it's loaded
        this.iframe.addEventListener('load', () => {
            this.updateVisualization();
        });
    },
    
    // Update the visualization with current data and settings
    updateVisualization: function() {
        // Check if iframe is loaded
        if (!this.iframe) {
            console.warn("Total spending iframe not ready yet");
            return;
        }
        
        console.log("Updating Total Spending visualization");
        
        this.updatePlot();
    },

    // Initialize Visualization
    initializeVisualization: function() {
        if (!processedCategoryData) {
            console.log("Missing data, exiting")
            return;
        }
        console.log("Initializing Total Saving Graph");
        this.updatePlot();
    },

    // Plot update function
    updatePlot: function() {
        if (!processedCategoryData[selectedVal]) {
            console.log("Missing data for category: ", selectedVal);
            return;
        }

        years = Object.keys(processedCategoryData[selectedVal]).sort().reverse();
        values = []

        years.forEach(year => {
            values.push(processedCategoryData[selectedVal][year]);
        });

        var data = [{
            x: years,
            y: values,
            type: 'bar'
        }];

        const layout = {
            margin: {t: 20, l: 100, r: 100, b: 20},
            height: 500,
            width: 1000,
            coloraxis: {showscale: false}
        };
          
        Plotly.newPlot('totalSpendingViz', data, layout);
    },
};

// Add this visualization to the update function
const originalUpdateVisualizations = updateVisualizations;
updateVisualizations = function() {
    console.log("In the update visualizations function for total spend");
    // Call original function
    originalUpdateVisualizations();
    
    // Update this visualization
    if (selectedView === 'totalSpending') {
        if (viewChanged) {
            total_selector = document.getElementById('total_selector');
            total_selector.textContent = "Select Category: ";

            // Initialize selector dropdown
            const categorySelector = document.getElementById('total_selector');
            if (categorySelector) {
                // Clear existing options
                categorySelector.innerHTML = '';

                // Add options for categories (in reverse chronological order)
                const categories = Object.keys(processedCategoryData).sort().reverse();
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelector.appendChild(option);
                });

                // Set default value
                categorySelector.value = defaulCategory;
                selectedVal = defaulCategory;
                document.querySelectorAll('.selected-display').forEach(display => {
                    display.textContent = selectedVal;
                });
            }
        }

        TotalSpendingViz.updateVisualization();
    }
};

// Initialize the visualization when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after main data is loaded
    const originalInitializeApplication = initializeApplication;
    initializeApplication = function() {
        // Call original function
        originalInitializeApplication();
        
        // Initialize this visualization
        TotalSpendingViz.initialize();
    };
});
