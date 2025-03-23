/**
 * visualization2.js - Category Breakdown Visualization
 * 
 * This file handles the functionality for the Category Breakdown visualization,
 * which shows government spending broken down by category.
 */

// Object to manage the category breakdown visualization
const CategoryBreakdownViz = {
    // Reference to the iframe containing the visualization
    iframe: null,
    
    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Category Breakdown visualization");
        
        this.iframe = document.getElementById('categoryBreakdownViz');
        
        // Add event listener for iframe messages
        // window.addEventListener('message', (event) => {
        //     // Ensure the message is from our iframe
        //     if (event.source === this.iframe.contentWindow) {
        //         this.handleIframeMessage(event.data);
        //     }
        // });

        initializeVisualization();
        
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

        updatePlot();
    }
}

    // TODO: Update plotly here

    // Those are duplicated from main.js
    // Not needed at all!!!!

    // // Step 1: Fetch data from GitHub
    // async function loadData2() {
    //     try {
    //         const response = await fetch('https://raw.githubusercontent.com/lynw93/MIDS-W209-final-project-public-spending-trends/refs/heads/main/webpage_v1/data/budget_by_function.json');
    //         const rawData = await response.json();
    //         return processData2(rawData);
    //     } catch (error) {
    //         console.error('Error loading data:', error);
    //         return null;
    //     }
    // }

    // // Step 2: Process data similar to Python code
    // function processData2(rawData) {
    //     const years = Object.keys(rawData).sort();
    //     const categories = new Set();
    //     const processedData = {};

    //     // First pass to get all categories
    //     years.forEach(year => {
    //         Object.keys(rawData[year]).forEach(category => {
    //             if (category !== 'Total') categories.add(category);
    //         });
    //     });

    //     // Second pass to create structured data
    //     years.forEach(year => {
    //         processedData[year] = [];
    //         const yearTotal = rawData[year].Total;
            
    //         categories.forEach(category => {
    //             if (rawData[year][category]) {
    //                 processedData[year].push({
    //                     Category: category,
    //                     Amount: rawData[year][category],
    //                     Percentage: (rawData[year][category] / yearTotal * 100)
    //                 });
    //             }
    //         });
    //     });

    //     return {
    //         years: years,
    //         categories: Array.from(categories),
    //         data: processedData
    //     };
    // }

    // Step 3/4: Initialize visualization
    async function initializeVisualization() {
        if (!processedYearlyData) {
            console.log("Missing data, exiting")
            return;
        }
        console.log("Initializing Category Breakdown Graph");
        updatePlot();
    }


    // // Plot update function
    function updatePlot() {
        if (!processedYearlyData[selectedYear]) {
            console.log("Missing data for year: ", selectedYear);
            return;
        }

        const yearData = processedYearlyData[selectedYear];
        const yearTotal = yearData.Total
        const labels = Object.keys(yearData).filter(category => 
            category !== 'Unreported Data' && 
            category !== 'Governmental Receipts' &&
            category !== 'Total'
        );
        const values = labels.map(category => yearData[category]);
        const parents = categories.map(() => "");
        const percentages = values.map(category => [
            (yearData[category] / yearTotal * 100).toFixed(1)]);


        console.log(labels);
        console.log(values);
        console.log(yearData);
        console.log(percentages);

        var data = [{
            type: 'treemap',
            values: values,
            labels: labels,
            parents: parents,
            customdata: percentages,
            marker: {
                colors: values,
                colorscale: 'Viridis'
            },
            // textinfo: "label + percent{parent}",
            hoverinfo: 'label+value+percent',
            texttemplate: '<b>%{label}</b><br>%{percentParent:.1%}',
            hovertemplate: '<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{percentParent:.1%}',
            textposition: "middle center",
            pathbar: {visible: false}
        }];

        const layout = {
            title: `U.S. Government Spending by Category (${selectedYear})`,
            margin: {t: 80, l: 20, r: 20, b: 20},
            height: 600,
            width: 800,
            // coloraxis: {showscale: false}
        };

        console.log("Plotting", data);

        Plotly.newPlot('categoryBreakdownViz', data, layout);
    }


        // Prepare data to send to the iframe
        // const dataToSend = {
        //     type: 'updateVisualization',
        //     yearlyData: processedYearlyData,
        //     selectedYear: selectedYear,
        //     categories: categories.filter(c => c !== 'Unreported Data' && c !== 'Governmental Receipts')
        // };
        
        // // Send message to iframe
        // this.iframe.contentWindow.postMessage(dataToSend, '*');
    // },
    
    // Handle messages from the iframe
    // handleIframeMessage: function(data) {
    //     console.log("Message from Category Breakdown visualization:", data);
        
    //     if (data.type === 'visualizationEvent') {
    //         // Handle different types of events
    //         switch (data.action) {
    //             case 'categoryClicked':
    //                 // Trigger event to show category details
    //                 const event = new CustomEvent('categorySelected', {
    //                     detail: {
    //                         category: data.category,
    //                         year: selectedYear
    //                     }
    //                 });
    //                 document.dispatchEvent(event);
    //                 break;
                    
    //             case 'yearChanged':
    //                 console.log("year changed");
    //                 // Update selected year
    //                 selectedYear = data.year;
                    
    //                 // Update UI elements
    //                 document.getElementById('yearSelector').value = selectedYear;
    //                 document.querySelectorAll('.selected-year-display').forEach(el => {
    //                     el.textContent = selectedYear;
    //                 });
                    
    //                 // Update other visualizations
    //                 updateVisualizations();
    //                 break;
                    
    //             default:
    //                 console.log("Unknown event from Category Breakdown visualization");
    //         }
    //     }
    // }

// Add this visualization to the update function
const originalUpdateVisualizations2 = updateVisualizations;
updateVisualizations = function() {
    console.log("Here here 2");
    // Call original function
    originalUpdateVisualizations2();
    
    // Update this visualization
    if (selectedView === 'budgetCategories') {
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
