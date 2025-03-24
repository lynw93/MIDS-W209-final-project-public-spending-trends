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
        
        // Add event listener for iframe messages
        // window.addEventListener('message', (event) => {
        //     // Ensure the message is from our iframe
        //     if (event.source === this.iframe.contentWindow) {
        //         this.handleIframeMessage(event.data);
        //     }
        // });
        
        // Send initial data to the iframe once it's loaded
        this.iframe.addEventListener('load', () => {
            this.updateVisualization();
        });
    },
    
    // Update the visualization with current data and settings
    updateVisualization: function() {
        // Check if iframe is loaded
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn("Total spending iframe not ready yet");
            return;
        }
        
        console.log("Updating Total Spending visualization");
        
        // Prepare data to send to the iframe
        // const dataToSend = {
        //     type: 'updateVisualization',
        //     yearlyData: processedYearlyData,
        //     // selectedYear: selectedYear
        // };
        
        // // Send message to iframe
        // this.iframe.contentWindow.postMessage(dataToSend, '*');
    },
    
    // Handle messages from the iframe
    // handleIframeMessage: function(data) {
    //     console.log("Message from Total Spending visualization:", data);
        
    //     if (data.type === 'visualizationEvent') {
    //         // Handle different types of events
    //         switch (data.action) {
    //             case 'yearClicked':
    //                 // Update selected year
    //                 selectedYear = data.year;
                    
    //                 // Update UI elements
    //                 document.getElementById('yearSelector').value = 
    // 
    // 
    // ;
    //                 document.querySelectorAll('.selected-year-display').forEach(el => {
    //                     el.textContent = selectedYear;
    //                 });
                    
    //                 // Update other visualizations
    //                 updateVisualizations();
    //                 break;
                    
    //             default:
    //                 console.log("Unknown event from Total Spending visualization");
    //         }
    //     }
    // }
};

// Add this visualization to the update function
const originalUpdateVisualizations = updateVisualizations;
updateVisualizations = function() {
    console.log("Here here 1");
    // Call original function
    originalUpdateVisualizations();
    
    // Update this visualization
    if (selectedView === 'totalSpending') {
        if (viewChanged) {
            selectorLabel = document.getElementById('selectorLabel');
            selectorLabel.textContent = "Category: ";

            // Initialize selector dropdown
            const categorySelector = document.getElementById('selector');
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
