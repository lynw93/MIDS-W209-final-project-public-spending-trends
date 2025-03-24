/**
 * visualization2.js - Category Breakdown Visualization
 * 
 * This file handles the functionality for the Category Breakdown visualization,
 * which shows government spending broken down by category.
 */

let selectedYear = "2023"; // Default selected year

// Object to manage the category breakdown visualization
const CategoryBreakdownViz = {
    // Reference to the iframe containing the visualization
    iframe: null,
    rawFullData: null,
    processedYearlyFullData: {},  // {year: category: {amount, subfunctions: {subCategory: subAmount}}, total}
    processedCategoryBreakdown: {},  // {year: categories, values, percentages, parents}
    
    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Category Breakdown visualization");
        
        this.iframe = document.getElementById('categoryBreakdownViz');

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
            console.warn("Category breakdown iframe not ready yet");
            return;
        }
        console.log("Updating Category Breakdown Graph");
        this.updatePlot();
    },

    // Function to load the JSON data
    loadFullData: async function() {
        try {
            const response = await fetch('../data/budget_func_subfunc.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            this.rawFullData = await response.json();
            console.log("Data loaded successfully");
            this.processFullData();
        } catch (error) {
            console.error('Error loading the data:', error);
            document.getElementById('loadingError').style.display = 'block';
            document.getElementById('loadingError').textContent = `Error loading data: ${error.message}`;
        }
    },

    // Function to process the raw data into usable formats
    processFullData: function () {
        console.log("Processing data...");

        // Process data for each quarter
        Object.keys(this.rawFullData).forEach(quarter => {
            // Extract year from quarter (e.g., "2018Q1" -> "2018")
            const year = quarter.substring(0, 4);

            // Initialize year data if not exists
            if (!this.processedYearlyFullData[year]) {
                this.processedYearlyFullData[year] = {};
            }
            
            // Process each category in the quarter
            this.rawFullData[quarter].forEach(item => {
                const category = item.name;

                // Skip unnessary data
                // if (category == 'Unreported Data' || category == 'Governmental Receipts')
                //     return;

                const amount = item.amount;

                // Aggregate to yearly data
                if (!('total' in this.processedYearlyFullData[year])) {
                    this.processedYearlyFullData[year]['total'] = 0;
                }
                this.processedYearlyFullData[year]['total'] += amount;

                if (!this.processedYearlyFullData[year][category]) {
                    this.processedYearlyFullData[year][category] = {};
                }
                if (!this.processedYearlyFullData[year][category]['amount']) {
                    this.processedYearlyFullData[year][category]['amount'] = 0;
                }
                this.processedYearlyFullData[year][category]['amount'] += amount;

                if (!this.processedYearlyFullData[year][category]['subfunctions']) {
                    this.processedYearlyFullData[year][category]['subfunctions'] = {};
                }
                if ('subfunctions' in item) {
                    item.subfunctions.forEach(subitem => {
                        const subCategory = subitem.name;
                        const subAmount = subitem.amount;

                        if (!this.processedYearlyFullData[year][category]['subfunctions'][subCategory]) {
                            this.processedYearlyFullData[year][category]['subfunctions'][subCategory] = 0;
                        } 
                        this.processedYearlyFullData[year][category]['subfunctions'][subCategory] += subAmount;
                    });
                }
            });
        });
        
        // Generate treemap needed data
        Object.keys(this.processedYearlyFullData).forEach(year => {
            if (!this.processedCategoryBreakdown[year]) {
                this.processedCategoryBreakdown[year] = {};
            }

            categories = [];
            values = [];
            percentages = [];
            parents = [];

            const totalAmount = this.processedYearlyFullData[year].total;

            // Top/total
            categories.push('All');
            values.push(totalAmount);
            percentages.push((100.0).toFixed(1));
            parents.push('');

            Object.keys(this.processedYearlyFullData[year]).filter(cat => 
                cat !== 'total'
            ).forEach(cat => {
                const catAmount = this.processedYearlyFullData[year][cat]['amount'];

                categories.push(cat);
                values.push(catAmount);
                if (totalAmount == 0) {
                    percentages.push((0.0).toFixed(1));
                } else {
                    percentages.push((catAmount / totalAmount * 100).toFixed(1));
                }
                parents.push('All');

                const subCatData = this.processedYearlyFullData[year][cat]['subfunctions'];

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

            this.processedCategoryBreakdown[year]['categories'] = categories;
            this.processedCategoryBreakdown[year]['values'] = values;
            this.processedCategoryBreakdown[year]['percentages'] = percentages;
            this.processedCategoryBreakdown[year]['parents'] = parents;
        });

        console.log("Data processing complete");
    },

    // Initialize Visualization
    initializeVisualization: async function() {
        if (!this.processedCategoryBreakdown) {
            console.log("Missing data, exiting")
            return;
        }
        console.log("Initializing Category Breakdown Graph");
        this.updatePlot();
    },

    // Plot update function
    updatePlot: function() {
        if (!this.processedCategoryBreakdown[selectedYear]) {
            console.log("Missing data for year: ", selectedYear);
            return;
        }

        const yearData = this.processedCategoryBreakdown[selectedYear];
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
            margin: {t: 80, l: 20, r: 20, b: 20},
            height: 800,
            width: 800,
            coloraxis: {showscale: false}
        };

        Plotly.newPlot('categoryBreakdownViz', data, layout);
    },

}

// Add this visualization to the update function
const originalUpdateVisualizations2 = updateVisualizations;
updateVisualizations = function() {
    console.log("Here here 2");
    // Call original function
    originalUpdateVisualizations2();
    
    // Update this visualization
    if (selectedView === 'budgetCategories') {
        selectorLabel = document.getElementById('selectorLabel');
        selectorLabel.textContent = "Select Year: ";

        // Initialize year selector dropdown
        const yearSelector = document.getElementById('selector');
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

        CategoryBreakdownViz.loadFullData();
        
        // Initialize this visualization
        CategoryBreakdownViz.initialize();
    };
});
