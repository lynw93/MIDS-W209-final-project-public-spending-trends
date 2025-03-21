/**
 * visualization3.js - Spending Change Visualization
 *
 * This file handles the functionality for the Spending Change visualization,
 * which shows year-over-year changes in government spending by category.
 */

// Object to manage the spending change visualization
const SpendingChangeViz = {
    // Reference to the iframe containing the visualization
    iframe: null,

    // Initialize the visualization
    initialize: function() {
        console.log("Initializing Spending Change visualization");

        this.iframe = document.getElementById('spendingChangeViz');

        // Add event listener for iframe messages
        window.addEventListener('message', (event) => {
            // Ensure the message is from our iframe
            if (event.source === this.iframe.contentWindow) {
                this.handleIframeMessage(event.data);
            }
        });

        // Send initial data to the iframe once it's loaded
        this.iframe.addEventListener('load', () => {
            console.log("Spending change iframe loaded");
            this.updateVisualization();
        });
    },

    // Update the visualization with current data and settings
    updateVisualization: function() {
        // Check if iframe is loaded
        if (!this.iframe || !this.iframe.contentWindow) {
            console.warn("Spending change iframe not ready yet");
            return;
        }

        console.log("Updating Spending Change visualization with:", {
            selectedYear: selectedYear,
            selectedCategory: selectedCategory
        });

        // Calculate year-over-year changes
        const changeData = this.calculateChanges();

        // Prepare data to send to the iframe
        const dataToSend = {
            type: 'updateVisualization',
            changeData: changeData,
            selectedYear: selectedYear,
            selectedCategory: selectedCategory,
            categories: categories.filter(c =>
                c !== 'Unreported Data' &&
                c !== 'Governmental Receipts' &&
                c !== 'Total'
            )
        };

        // Send message to iframe
        this.iframe.contentWindow.postMessage(dataToSend, '*');
    },

    // Calculate year-over-year changes for all categories
    calculateChanges: function() {
        const years = Object.keys(processedYearlyData).sort();
        const changeData = {};

        // For each year (except the first one)
        for (let i = 1; i < years.length; i++) {
            const currentYear = years[i];
            const previousYear = years[i-1];

            changeData[currentYear] = {
                previousYear: previousYear,
                categories: {}
            };

            // Calculate changes for each category
            categories.filter(c => c !== 'Unreported Data' && c !== 'Governmental Receipts' && c !== 'Total')
                .forEach(category => {
                    const currentAmount = processedYearlyData[currentYear][category] || 0;
                    const previousAmount = processedYearlyData[previousYear][category] || 0;

                    // Always store the change, even if previous amount is 0
                    changeData[currentYear].categories[category] = {
                        absoluteChange: currentAmount - previousAmount,
                        percentageChange: previousAmount > 0 ?
                            ((currentAmount - previousAmount) / previousAmount) * 100 :
                            currentAmount > 0 ? 100 : 0
                    };
                });

            // Also calculate total change
            const currentTotal = processedYearlyData[currentYear].Total || 0;
            const previousTotal = processedYearlyData[previousYear].Total || 0;

            changeData[currentYear].total = {
                absoluteChange: currentTotal - previousTotal,
                percentageChange: previousTotal > 0 ?
                    ((currentTotal - previousTotal) / previousTotal) * 100 : 0
            };
        }

        console.log("Calculated change data:", changeData);
        return changeData;
    },

    // Handle messages from the iframe
    handleIframeMessage: function(data) {
        console.log("Message from Spending Change visualization:", data);

        if (data.type === 'visualizationEvent') {
            // Handle different types of events
            switch (data.action) {
                case 'yearPairSelected':
                    // Update the year to the end year of the pair
                    selectedYear = data.year;

                    // Update UI elements
                    document.getElementById('yearSelector').value = selectedYear;
                    document.querySelectorAll('.selected-year-display').forEach(el => {
                        el.textContent = selectedYear;
                    });

                    // Update visualizations
                    updateVisualizations();
                    break;

                case 'categorySelected':
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

                case 'visualizationLoaded':
                    // Visualization has loaded, update it with current data
                    this.updateVisualization();
                    break;

                default:
                    console.log("Unknown event from Spending Change visualization");
            }
        }
    }
};

// Add this visualization to the update function
const originalUpdateVisualizations3 = updateVisualizations;
updateVisualizations = function() {
    // Call original function
    originalUpdateVisualizations3();

    // Update this visualization
    if (selectedView === 'spendingChanges') {
        SpendingChangeViz.updateVisualization();
    }
};

// Initialize the visualization when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after main data is loaded
    const originalInitializeApplication3 = initializeApplication;
    initializeApplication = function() {
        // Call original function
        originalInitializeApplication3();

        // Initialize this visualization
        SpendingChangeViz.initialize();
    };
});
