/**
 * visualization2.js - Category Breakdown Visualization
 * 
 * This file handles the functionality for the Category Breakdown visualization,
 * which shows government spending broken down by category.
 */

const defaultYear = "2023"; // Default selected year
const categoryColorMap = {
    "Medicare": "#1f77b4",
    "Social Security": "#ff7f0e",
    "National Defense": "#2ca02c",
    "Net Interest": "#d62728",
    "Income Security": "#9467bd",
    "Health": "#8c564b",
    "General Government": "#e377c2",
    "Transportation": "#7f7f7f",
    "Education, Training, Employment, and Social Services": "#bcbd22",
    "Veterans Benefits and Services": "#17becf",
    "International Affairs": "#aec7e8",
    "Administration of Justice": "#f7b6d2",
    "Commerce and Housing Credit": "#c5b0d5",
    "Community and Regional Development": "#8dd3c7",
    "Natural Resources and Environment": "#ffbb78",
    "Agriculture": "#b2df8a",
    "General Science, Space, and Technology": "#fb8072",
    "Energy": "#80b1d3",
    "Governmental Receipts": "#999999",
    "Total": "#eeeeee"
  };

// Object to manage the category breakdown visualization
const CategoryBreakdownViz = {
    // Reference to the iframe containing the visualization
    iframe: null,
    
    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Category Breakdown visualization");
        
        this.container = document.getElementById('categoryBreakdownViz');

        this.initializeVisualization();
        
        this.updateVisualization();

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
    
    updateVisualization: function() {
        console.log("Updating Category Breakdown Graph");
        this.updatePlot();
    },

    // Initialize Visualization
    initializeVisualization: function() {
        if (!processedYearlyFullData) {
            console.log("Missing data, exiting")
            return;
        }
        console.log("Initializing Category Breakdown Graph");
        this.updatePlot();
    },

    // Plot update function
    updatePlot: function() {
        const yearData = processedYearlyCategoryBreakdown[selectedYear];
        if (!yearData) {
            console.error("No data found for year:", selectedYear);
            return;
        }
    
        console.log("Loaded yearData:", yearData);
    
        const labels = yearData.labels;
        const values = yearData.values;
        const parents = yearData.parents;
        const percentages = yearData.percentages;

        const colors = labels.map((label, i) => {
            return label === "Total" ? "#eeeeee" : null; // null lets Plotly apply colorscale
          });

        var data = [{
            type: 'treemap',
            values: values,
            labels: labels,
            parents: parents,
            maxdepth: 2,
            customdata: percentages,
            marker: {
                colors: labels.map((label, i) => {
                    const parent = parents[i];
                    if (parent === "Total") {
                        return categoryColorMap[label] || '#cccccc';  // Top-level: assign unique color
                    } else {
                        // Subcategory: use faded version of parent color
                        const parentColor = categoryColorMap[parent] || '#cccccc';
                        return tinycolor(parentColor).lighten(20).desaturate(25).toString();
                    }
                }),
                line: {
                    width: 1,
                    color: 'white'
                }
            },
            texttemplate: '<b>%{label}</b><br>%{percentParent:.1%}',
            hovertemplate: '<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{percentParent:.1%}',
            textposition: "middle center",
            name: '', // <--- this is what removes the "trace 0" text
            pathbar: { visible: true },
            branchvalues: "total",
            root: { color: 'lightgrey' },
            tiling: {
              pad: 10,               // ⬅️ adds space between boxes
              squarify: false        // ⬅️ prevents tight square packing
            }
          }];

        const layout = {
            title: `U.S. Government Spending by Category (${selectedYear})`,
            margin: {t: 20, l: 100, r: 100, b: 60},
            height: 700,
            width: 1000,
            coloraxis: {showscale: false},
            pathbar: {
                visible: true,
                side: "top",
                thickness: 20
            }
        };

        console.log("Rendering treemap with:");
        console.log("Labels:", labels);
        console.log("Parents:", parents);
        console.log("Values:", values);
        Plotly.react('categoryBreakdownViz', data, layout);
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
