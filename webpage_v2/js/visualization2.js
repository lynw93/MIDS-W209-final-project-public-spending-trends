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
        window.addEventListener('message', (event) => {
            // Ensure the message is from our iframe
            if (event.source === this.iframe.contentWindow) {
                this.handleIframeMessage(event.data);
            }
        });

        // Send initial data to the iframe once it's loaded
        this.iframe.addEventListener('load', () => {
            console.log("Category breakdown iframe loaded");
            this.updateVisualization();
        });
    },

    // Update the visualization with current data and settings
    updateVisualization: function() {
        // Check if iframe is loaded
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn("Category breakdown iframe not ready yet");
            return;
        }

        console.log("Updating Category Breakdown visualization with:", {
            selectedYear: selectedYear,
            selectedCategory: selectedCategory,
            categoriesCount: categories.length
        });

        // Prepare data to send to the iframe
        const dataToSend = {
            type: 'updateVisualization',
            yearlyData: processedYearlyData,
            selectedYear: selectedYear,
            selectedCategory: selectedCategory,
            categories: categories.filter(c => c !== 'Unreported Data' && c !== 'Governmental Receipts')
        };

        // Send message to iframe
        this.iframe.contentWindow.postMessage(dataToSend, '*');
    },

    // Handle messages from the iframe
    handleIframeMessage: function(data) {
        console.log("Message from Category Breakdown visualization:", data);

        if (data.type === 'visualizationEvent') {
            // Handle different types of events
            switch (data.action) {
                case 'categoryClicked':
                    // Update selected category
                    selectedCategory = data.category;

                    // Update UI elements
                    document.getElementById('categorySelect').value = selectedCategory;
                    document.querySelectorAll('.selected-category-display').forEach(el => {
                        el.textContent = selectedCategory;
                    });

                    // Update visualizations
                    updateVisualizations();
                    break;

                case 'yearChanged':
                    // Update selected year
                    selectedYear = data.year;

                    // Update UI elements
                    document.getElementById('yearSelector').value = selectedYear;
                    document.querySelectorAll('.selected-year-display').forEach(el => {
                        el.textContent = selectedYear;
                    });

                    // Update other visualizations
                    updateVisualizations();
                    break;

                case 'visualizationLoaded':
                    // Visualization has loaded, update it with current data
                    this.updateVisualization();
                    break;

                default:
                    console.log("Unknown event from Category Breakdown visualization");
            }
        }
    }
};

// Add this visualization to the update function
const originalUpdateVisualizations2 = updateVisualizations;
updateVisualizations = function() {
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
    const originalInitializeApplication2 = initializeApplication;
    initializeApplication = function() {
        // Call original function
        originalInitializeApplication2();

        // Initialize this visualization
        CategoryBreakdownViz.initialize();
    };
});
