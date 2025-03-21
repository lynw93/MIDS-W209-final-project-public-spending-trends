<div>
    <script type="text/javascript">window.PlotlyConfig = {MathJaxConfig: 'local'};</script>
    <script charset="utf-8" src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>
    <div id="ccea4114-7e39-4de0-a48c-ca24adb18de3" class="plotly-graph-div" style="height:600px; width:100%;"></div>
    <script type="text/javascript">
        window.PLOTLYENV=window.PLOTLYENV || {};

        // Variables to store data received from the parent window
        let chartData = null;
        let selectedYear = "2024";
        let selectedCategory = "Total";
        let categoriesList = [];

        // Initial categories (fallback if message not received)
        const defaultCategories = [
            "Medicare", "Social Security", "National Defense",
            "Income Security", "Health", "Net Interest",
            "General Government", "Veterans Benefits and Services",
            "Education, Training, Employment, and Social Services",
            "Commerce and Housing Credit"
        ];

        // Listen for messages from the parent window
        window.addEventListener('message', function(event) {
            console.log("Message received in category_breakdown.html:", event.data);

            // Process data from parent window
            if (event.data && event.data.type === 'updateVisualization') {
                // Store data
                chartData = event.data.yearlyData;
                selectedYear = event.data.selectedYear || selectedYear;
                selectedCategory = event.data.selectedCategory || selectedCategory;
                categoriesList = event.data.categories || [];

                console.log("Updated data in category_breakdown:", {
                    chartDataKeys: chartData ? Object.keys(chartData) : 'No data',
                    selectedYear,
                    selectedCategory,
                    categories: categoriesList
                });

                // Update visualization
                updateChart();
            }
        });

        // Function to update the chart based on the current data and selections
        function updateChart() {
            console.log("Updating category breakdown chart");

            // Use default data if no data received from parent
            if (!chartData || !chartData[selectedYear]) {
                console.log("No data received from parent, loading directly");
                loadDataDirectly();
                return;
            }

            // Use received categories or fallback to default
            let displayCategories = categoriesList.length > 0 ? categoriesList : defaultCategories;

            // Filter categories based on the selected category if needed
            if (selectedCategory !== "Total" && displayCategories.includes(selectedCategory)) {
                // Show only the selected category for highlighting/focus
                displayCategories = [selectedCategory];
            }

            // Extract values for the selected year
            const values = displayCategories.map(category =>
                chartData[selectedYear][category] || 0
            );

            // Calculate percentages
            const totalSpending = chartData[selectedYear].Total ||
                displayCategories.reduce((sum, category) =>
                    sum + (chartData[selectedYear][category] || 0), 0);

            const customdata = displayCategories.map(category => {
                const value = chartData[selectedYear][category] || 0;
                const percentage = (value / totalSpending) * 100;
                return [percentage.toFixed(1), value];
            });

            // Create the trace for the treemap
            const trace = {
                type: 'treemap',
                labels: displayCategories,
                parents: displayCategories.map(() => ""),
                values: values,
                branchvalues: 'total',
                texttemplate: "<b>%{label}</b><br>%{value:$,.0f}",
                hovertemplate: "<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{customdata[0]:.1f}%",
                customdata: customdata,
                marker: {
                    coloraxis: 'coloraxis'
                }
            };

            // Create the layout
            const layout = {
                title: {
                    text: `U.S. Government Spending by Category (${selectedYear})`,
                },
                font: {
                    family: 'Arial, sans-serif',
                    size: 14
                },
                margin: {
                    t: 80,
                    b: 20,
                    l: 20,
                    r: 20
                },
                coloraxis: {
                    colorbar: {
                        title: {
                            text: 'Amount'
                        }
                    },
                    colorscale: [
                        [0, "#440154"], [0.1111111111111111, "#482878"],
                        [0.2222222222222222, "#3e4989"], [0.3333333333333333, "#31688e"],
                        [0.4444444444444444, "#26828e"], [0.5555555555555556, "#1f9e89"],
                        [0.6666666666666666, "#35b779"], [0.7777777777777778, "#6ece58"],
                        [0.8888888888888888, "#b5de2b"], [1, "#fde725"]
                    ]
                },
                height: 600
            };

            console.log("Rendering treemap with data:", {
                categories: displayCategories,
                values: values
            });

            // Create the chart
            Plotly.newPlot(
                "ccea4114-7e39-4de0-a48c-ca24adb18de3",
                [trace],
                layout,
                {responsive: true}
            );

            // Add click event to treemap segments
            document.getElementById('ccea4114-7e39-4de0-a48c-ca24adb18de3').on('plotly_click', function(data) {
                const clickedCategory = data.points[0].label;
                console.log("Category clicked:", clickedCategory);

                // Notify parent window of the category click
                window.parent.postMessage({
                    type: 'visualizationEvent',
                    action: 'categoryClicked',
                    category: clickedCategory
                }, '*');
            });

            // Also let parent window know the visualization is loaded
            window.parent.postMessage({
                type: 'visualizationEvent',
                action: 'visualizationLoaded',
                view: 'categoryBreakdown'
            }, '*');
        }

        // Fallback function to load data directly if messaging fails
        async function loadDataDirectly() {
            try {
                console.log("Attempting to load JSON data directly");
                const response = await fetch('../data/budget_by_function.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const jsonData = await response.json();
                console.log("JSON data loaded directly:", jsonData);

                // Process the data
                const processedData = {};
                Object.keys(jsonData).forEach(quarter => {
                    const year = quarter.substring(0, 4);
                    if (!processedData[year]) {
                        processedData[year] = {};
                    }

                    jsonData[quarter].forEach(item => {
                        const category = item.name;
                        const amount = item.amount;

                        if (!processedData[year][category]) {
                            processedData[year][category] = 0;
                        }
                        processedData[year][category] += amount;
                    });
                });

                // Calculate totals
                Object.keys(processedData).forEach(year => {
                    let total = 0;
                    Object.entries(processedData[year]).forEach(([category, amount]) => {
                        if (category !== 'Unreported Data' && category !== 'Governmental Receipts') {
                            total += amount;
                        }
                    });
                    processedData[year].Total = total;
                });

                // Extract categories
                const catSet = new Set();
                Object.values(jsonData).forEach(quarterData => {
                    quarterData.forEach(item => {
                        catSet.add(item.name);
                    });
                });
                const catList = Array.from(catSet).filter(c =>
                    c !== 'Unreported Data' && c !== 'Governmental Receipts'
                );

                // Update variables
                chartData = processedData;
                categoriesList = catList;

                // Update the chart
                updateChart();
            } catch (error) {
                console.error("Error loading data directly:", error);
                // Fall back to static visualization
                renderStaticVisualization();
            }
        }

        // Function to render static visualization if all else fails
        function renderStaticVisualization() {
            console.log("Rendering static visualization");

            // Use the preloaded data from the original working version
            const staticData = {
                "Medicare": 3746371870806.59,
                "Social Security": 3828244351566.41,
                "National Defense": 3251581307766.79,
                "Income Security": 1693761688776.58,
                "Health": 2493710377312.02,
                "Net Interest": 2854313707034.06,
                "General Government": 1147602126968.25,
                "Veterans Benefits and Services": 892977673082.0701,
                "Education, Training, Employment, and Social Services": 517684566049.61,
                "Commerce and Housing Credit": 470718921719.33997
            };

            // Use all categories or just the selected one
            let displayCategories = defaultCategories;
            if (selectedCategory !== "Total" && defaultCategories.includes(selectedCategory)) {
                displayCategories = [selectedCategory];
            }

            // Extract values
            const values = displayCategories.map(category => staticData[category] || 0);

            // Calculate total
            const totalSpending = Object.values(staticData).reduce((sum, val) => sum + val, 0);

            // Create customdata
            const customdata = displayCategories.map(category => {
                const value = staticData[category] || 0;
                const percentage = (value / totalSpending) * 100;
                return [percentage.toFixed(1), value];
            });

            // Create the trace
            const trace = {
                type: 'treemap',
                labels: displayCategories,
                parents: displayCategories.map(() => ""),
                values: values,
                branchvalues: 'total',
                texttemplate: "<b>%{label}</b><br>%{value:$,.0f}",
                hovertemplate: "<b>%{label}</b><br>Amount: %{value:$,.0f}<br>Percentage: %{customdata[0]:.1f}%",
                customdata: customdata,
                marker: {
                    coloraxis: 'coloraxis'
                }
            };

            // Create the layout
            const layout = {
                title: {
                    text: `U.S. Government Spending by Category (2024)`,
                },
                font: {
                    family: 'Arial, sans-serif',
                    size: 14
                },
                margin: {
                    t: 80,
                    b: 20,
                    l: 20,
                    r: 20
                },
                coloraxis: {
                    colorbar: {
                        title: {
                            text: 'Amount'
                        }
                    },
                    colorscale: [
                        [0, "#440154"], [0.1111111111111111, "#482878"],
                        [0.2222222222222222, "#3e4989"], [0.3333333333333333, "#31688e"],
                        [0.4444444444444444, "#26828e"], [0.5555555555555556, "#1f9e89"],
                        [0.6666666666666666, "#35b779"], [0.7777777777777778, "#6ece58"],
                        [0.8888888888888888, "#b5de2b"], [1, "#fde725"]
                    ]
                },
                height: 600
            };

            // Create the chart
            Plotly.newPlot(
                "ccea4114-7e39-4de0-a48c-ca24adb18de3",
                [trace],
                layout,
                {responsive: true}
            );

            // Add click event to treemap segments
            document.getElementById('ccea4114-7e39-4de0-a48c-ca24adb18de3').on('plotly_click', function(data) {
                const clickedCategory = data.points[0].label;

                // Notify parent window of the category click
                window.parent.postMessage({
                    type: 'visualizationEvent',
                    action: 'categoryClicked',
                    category: clickedCategory
                }, '*');
            });
        }

        // Initialize the chart when the document is loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log("DOM content loaded in category_breakdown.html");

            // Try to show something immediately
            renderStaticVisualization();

            // Then try to load data directly as a fallback
            setTimeout(loadDataDirectly, 1000);
        });
    </script>
</div>
