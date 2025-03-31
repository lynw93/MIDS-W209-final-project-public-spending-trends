/**
 * visualization2.js - Category Breakdown Visualization
 * 
 * This file handles the functionality for the Category Breakdown visualization,
 * which shows government spending broken down by category.
 */

const defaultYear = "2023"; // Default selected year

// Object to manage the category breakdown visualization
const CategoryBreakdownViz = {
    // Reference to the iframe containing the visualization
    iframe: null,
    
    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Category Breakdown visualization");
        
        this.iframe = document.getElementById('categoryBreakdownViz');

        this.initializeVisualization();
        
        // Send initial data to the iframe once it's loaded
        this.iframe.addEventListener('load', () => {
            this.updateVisualization();
        });

        // Add change event listener to update visualization when selection changes
        const yearSelector = document.getElementById('budget_selector');
        if (yearSelector) {
            yearSelector.addEventListener('change', (event) => {
                selectedYear = event.target.value;

                // Update display
                document.querySelectorAll('.selected-display').forEach(display => {
                    display.textContent = selectedYear;
                });

                CategoryBreakdownViz.updateVisualization();
            });
}

    },
    
    // Update the visualization with current data and settings
    updateVisualization: function() {
        // Check if iframe is loaded
        if (!this.iframe) {
            console.warn("Category breakdown iframe not ready yet");
            return;
        }
        console.log("Updating Category Breakdown Graph");
        this.updatePlot();
    },

    // Initialize Visualization
    initializeVisualization: function() {
        if (!processedYearlyCategoryBreakdown) {
            console.log("Missing data, exiting")
            return;
        }
        console.log("Initializing Category Breakdown Graph");
        this.updatePlot();
    },

    // Plot update function
    updatePlot: function() {
        if (!processedYearlyCategoryBreakdown[selectedYear]) {
            console.log("Missing data for year: ", selectedYear);
            return;
        }

        const yearData = processedYearlyCategoryBreakdown[selectedYear];
        const labels = yearData.categories;
        const values = yearData.values;
        const parents = yearData.parents;
        const percentages = yearData.percentages;

        var data = [{
            type: 'treemap',
            values: values,
            labels: labels,
            parents: parents,
            customdata: percentages,
            maxdepth: 2,
            marker: {
                colors: values,
                colorscale: 'Earth'
            },
            texttemplate: '<b>%{label}</b><br>%{percentParent:.1%}',
            hovertemplate: '<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{percentParent:.1%}',
            textposition: "middle center",
            pathbar: {visible: false},
            branchvalues: "total",
        }];

        const layout = {
            title: `U.S. Government Spending by Category (${selectedYear})`,
            margin: {t: 20, l: 100, r: 100, b: 20},
            height: 600,
            width: 1000,
            coloraxis: {showscale: false}
        };

        Plotly.newPlot('categoryBreakdownViz', data, layout);
    },

}

// Add this visualization to the update function
const originalUpdateVisualizations2 = updateVisualizations;
updateVisualizations = function() {
    console.log("In the update visualizations function for budget categories", selectedYear);
    // Call original function
    originalUpdateVisualizations2();
    
    // Update this visualization
    if (selectedView === 'budgetCategories') {
        if (viewChanged) {
            budget_selector = document.getElementById('budget_selector');
            budget_selector.textContent = "Select Year: ";
    
            // Initialize year selector dropdown
            const yearSelector = document.getElementById('budget_selector');
            if (yearSelector) {
                // Clear existing options
                yearSelector.innerHTML = '';
    
                // Add options for each year (in reverse chronological order)
                const years = Object.keys(processedYearlyFullData).sort().reverse();
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelector.appendChild(option);
                });
    
                // Set default value
                yearSelector.value = defaultYear;
                selectedYear = defaultYear;
                document.querySelectorAll('.selected-display').forEach(display => {
                    display.textContent = selectedYear;
                });   
            }
        }

        CategoryBreakdownViz.updateVisualization();
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
        CategoryBreakdownViz.initialize();
    };
});
