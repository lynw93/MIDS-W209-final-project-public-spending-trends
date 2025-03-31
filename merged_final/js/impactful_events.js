// impactful_events.js (radio-button style selection)

async function renderImpactfulChart(container, { data, selectedEvents }) {
    container.selectAll("svg").remove();
    const parseTime = d3.timeParse("%YQ%q");
    
    // helper to load & draw inflation
    async function renderInflationLine(g, x, height) {
        const cpiData = await d3.csv("/data/quarterly_cpi.csv", d => ({
            date: parseTime(d.quarter),
            value: +d.CPIAUCSL
        }));

        const yCPI = d3.scaleLinear()
            .domain(d3.extent(cpiData, d => d.value))
            .range([height, 0]);

        const cpiLine = d3.line()
            .x(d => x(d.date))
            .y(d => yCPI(d.value));
    
        g.append("path")
            .datum(cpiData)
            .attr("class", "inflation-line")
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "5,5")
            .attr("d", cpiLine);
    
        const last = cpiData[cpiData.length - 1];
        g.append("text")
            .attr("class", "inflation-label")
            .attr("x", x(last.date) + 5)
            .attr("y", yCPI(last.value))
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("fill", "black")
            .style("font-weight", "bold")
            .text("Inflation");
    }

    const categories = {};
    Object.entries(data).forEach(([quarter, items]) => {
        const date = parseTime(quarter);
        items.forEach(d => {
            if (!categories[d.name]) categories[d.name] = [];
            categories[d.name].push({ date, amount: d.amount });
        });
    });

    const selectedCategories = [
        "National Defense",
        "Health",
        "Income Security",
        "International Affairs",
        "Education, Training, Employment, and Social Services",
        "Transportation",
        "Agriculture",
        "Net Interest"
    ];

    const svg = container.append("svg")
        .attr("width", 900)
        .attr("height", 500);

    svg.style("overflow", "visible");

    function renderLegend(svg, options) {
        svg.selectAll(".legend-group").remove(); // clear old
    
        const entries = [];
    
        if (options.covid || options.all) {
            entries.push({ color: "#900", label: "COVID-19 Peak" });       // exact red from circles
        }
        if (options.ukraine || options.all) {
            entries.push({ color: "#004080", label: "Ukraine War Peak" });     // exact blue from circles
        }
        if (options.inflation || options.all) {
            entries.push({ color: "black", label: "Overall Peak" });       // exact black from circles
        }
    
        if (entries.length === 0) return;
    
        const padding = 10;
        const entryHeight = 22;
        const boxWidth = 165;
        const boxHeight = (entries.length * entryHeight) + padding * 2;
    
        // ➤ Push farther to the right by adjusting legendX:
        const legendX = +svg.attr("width") - margin.right + 120;
        const legendY = 30; // 10px from top
    
        const legend = svg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${legendX}, ${legendY})`);
    
        // Box
        legend.append("rect")
            .attr("width", boxWidth)
            .attr("height", boxHeight)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("rx", 8)
            .attr("ry", 8)
            .style("filter", "drop-shadow(0 1px 3px rgba(0,0,0,0.1))");
    
        // Title
        legend.append("text")
            .text("Spend per Category")
            .attr("x", padding)
            .attr("y", padding + 2)
            .style("font-size", "13px")
            .style("font-weight", "bold");
    
        // Entries
        entries.forEach((entry, i) => {
            const y = padding + 18 + i * entryHeight;
    
            legend.append("circle")
                .attr("cx", padding + 4)
                .attr("cy", y)
                .attr("r", 6) // exact same radius as chart
                .attr("fill", entry.color);
    
            legend.append("text")
                .attr("x", padding + 16)
                .attr("y", y)
                .attr("dy", "0.35em")
                .text(entry.label)
                .style("font-size", "12px")
                .style("fill", "#333");
        });
    }    

    const margin = { top: 50, right: 150, bottom: 50, left: 180 },
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(Object.keys(data), d => parseTime(d)))
        .range([0, width]);

    const maxAmount = d3.max(
        selectedCategories.flatMap(cat => categories[cat]?.map(d => d.amount) || [])
    );
          
    const y = d3.scaleLinear()
        .domain([0, maxAmount * 1.05]) // add 5% headroom to show top tick
        .range([height, 0]);
          

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(selectedCategories);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.amount));

    const tooltip = d3.select("body").selectAll("div.tooltip").data([null]).join("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 3px 6px rgba(0,0,0,0.1)")
        .style("visibility", "hidden");

    selectedCategories.forEach(cat => {
        g.append("path")
            .datum(categories[cat])
            .attr("class", "category-line")
            .attr("fill", "none")
            .attr("stroke", color(cat))
            .attr("stroke-width", 2)
            .attr("d", line);

        const last = categories[cat][categories[cat].length - 1];
        g.append("text")
            .attr("class", "category-label")
            .attr("x", x(last.date) + 5)
            .attr("y", y(last.amount))
            .attr("dy", "0.35em")
            .style("font-size", "12px")
            .style("fill", color(cat))
            .text("\u00A0\u00A0" + cat); 
    });

    const covidStart = parseTime("2020Q1");
    const covidEnd = parseTime("2023Q2");
    const ukraineStart = parseTime("2022Q1");
    const ukraineEnd = parseTime("2024Q4");

    // Add overlays based on selection
    if (selectedEvents.covid) {
        g.selectAll("rect").remove();
        g.selectAll("text.event-label").remove();
        renderLegend(svg, selectedEvents);

        g.append("rect")
            .attr("x", x(covidStart))
            .attr("width", x(covidEnd) - x(covidStart))
            .attr("y", 0)
            .attr("height", height)
            .attr("fill", "#f99")
            .attr("opacity", 0.2);

        g.append("text")
            .attr("class", "event-label")
            .attr("x", x(covidStart) + 5)
            .attr("y", 15)
            .text("COVID-19 Pandemic")
            .style("fill", "#900")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        selectedCategories.forEach(cat => {
            const periodData = categories[cat].filter(d => d.date >= covidStart && d.date <= covidEnd);
            const peak = d3.max(periodData, d => d.amount);
            const pre = categories[cat].find(d => d.date.getTime() === covidStart.getTime()).amount;
            const peakPoint = periodData.find(d => d.amount === peak);

            g.append("circle")
                .attr("class", "tooltip-circle")
                .attr("cx", x(peakPoint.date))
                .attr("cy", y(peakPoint.amount))
                .attr("r", 6)
                .attr("fill", "#900")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${cat}</strong><br>Peak COVID Spending: $${peak.toLocaleString()}<br>Pre-COVID Spending: $${pre.toLocaleString()}<br>Change: ${(((peak - pre)/pre)*100).toFixed(2)}%`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        });
    }

    if (selectedEvents.ukraine) {
        g.selectAll("rect").remove();
        g.selectAll("text.event-label").remove();
        renderLegend(svg, selectedEvents);

        g.append("rect")
            .attr("x", x(ukraineStart))
            .attr("width", x(ukraineEnd) - x(ukraineStart))
            .attr("y", 0)
            .attr("height", height)
            .attr("fill", "#89CFF0")
            .attr("opacity", 0.2);

        g.append("text")
            .attr("class", "event-label")
            .attr("x", x(ukraineStart) + 5)
            .attr("y", 15)
            .text("Ukraine War")
            .style("fill", "#004080") // deep blue
            .style("font-size", "14px")
            .style("font-weight", "bold");

            selectedCategories.forEach(cat => {
                const periodData = categories[cat].filter(d => d.date >= ukraineStart && d.date <= ukraineEnd);
                const peak = d3.max(periodData, d => d.amount);
                const pre = categories[cat].find(d => d.date.getTime() === ukraineStart.getTime()).amount;
                const peakPoint = periodData.find(d => d.amount === peak);
    
                g.append("circle")
                    .attr("class", "tooltip-circle")
                    .attr("cx", x(peakPoint.date))
                    .attr("cy", y(peakPoint.amount))
                    .attr("r", 6)
                    .attr("fill", "#004080")
                    .attr("opacity", 0.7)
                    .on("mouseover", function(event) {
                        tooltip.style("visibility", "visible")
                            .html(`<strong>${cat}</strong><br>Peak Ukraine Spending: $${peak.toLocaleString()}<br>Pre-Ukraine Spending: $${pre.toLocaleString()}<br>Change: ${(((peak - pre)/pre)*100).toFixed(2)}%`);
                    })
                    .on("mousemove", function(event) {
                        tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", function() {
                        tooltip.style("visibility", "hidden");
                    });
            });
    }

    if (selectedEvents.inflation) {
        g.selectAll("rect").remove();
        g.selectAll("text.event-label").remove();
        renderLegend(svg, selectedEvents);
    
        // Await the async helper to draw the inflation line and label
        await renderInflationLine(g, x, height);
    
        // Add peak spending tooltips for each category (entire graph)
        selectedCategories.forEach(cat => {
            const peak = d3.max(categories[cat], d => d.amount);
            const peakPoint = categories[cat].find(d => d.amount === peak);
    
            g.append("circle")
                .attr("class", "tooltip-circle")
                .attr("cx", x(peakPoint.date))
                .attr("cy", y(peakPoint.amount))
                .attr("r", 6)
                .attr("fill", "black")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${cat}</strong><br>Peak Spending: $${peak.toLocaleString()}<br>Date: ${peakPoint.date.toLocaleDateString()}`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                           .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        });
    }   

    if (selectedEvents.all) {
        g.selectAll("rect").remove(); // Removes COVID/Ukraine overlays
        g.selectAll("text.event-label").remove(); // Removes overlay labels
        g.selectAll(".tooltip-circle").remove(); // Removes tooltip circles from previous state
        g.selectAll(".inflation-line").remove(); // Removes inflation dashed line
        renderLegend(svg, selectedEvents);
    
        // --- Draw overlays for COVID + Ukraine ---
        g.append("rect")
            .attr("class", "covid-rect")
            .attr("x", x(covidStart))
            .attr("width", x(covidEnd) - x(covidStart))
            .attr("y", 0)
            .attr("height", height)
            .attr("fill", "#f99")
            .attr("opacity", 0.2);
    
        g.append("text")
            .attr("class", "covidevent-label")
            .attr("x", x(covidStart) + 5)
            .attr("y", 15)
            .text("COVID-19 Pandemic")
            .style("fill", "#900")
            .style("font-size", "14px")
            .style("font-weight", "bold");
    
        g.append("rect")
        .attr("class", "ukraine-rect")
            .attr("x", x(ukraineStart))
            .attr("width", x(ukraineEnd) - x(ukraineStart))
            .attr("y", 0)
            .attr("height", height)
            .attr("fill", "#89CFF0")
            .attr("opacity", 0.2);
    
        g.append("text")
            .attr("class", "ukraineevent-label")
            .attr("x", x(ukraineStart) + 118)
            .attr("y", 15)
            .text("Ukraine War")
            .style("fill", "#004080")
            .style("font-size", "14px")
            .style("font-weight", "bold");

            g.append("text")
            .attr("class", "union-label")
            .attr("x", x(ukraineStart) + 5)
            .attr("y", 15)
            .text("Union")
            .style("fill", "#5c2b37")
            .style("font-size", "14px")
            .style("font-weight", "bold");
    
        // --- Tooltip circles for COVID & Ukraine ---   
        selectedCategories.forEach(cat => {
            const covidPeriod = categories[cat].filter(d => d.date >= covidStart && d.date <= covidEnd);
            const ukrainePeriod = categories[cat].filter(d => d.date >= ukraineStart && d.date <= ukraineEnd);
        
            const covidPeak = d3.max(covidPeriod, d => d.amount);
            const ukrainePeak = d3.max(ukrainePeriod, d => d.amount);
        
            const covidPoint = covidPeriod.find(d => d.amount === covidPeak);
            const ukrainePoint = ukrainePeriod.find(d => d.amount === ukrainePeak);
        
            const covidPre = categories[cat].find(d => d.date.getTime() === covidStart.getTime())?.amount ?? 0;
            const ukrainePre = categories[cat].find(d => d.date.getTime() === ukraineStart.getTime())?.amount ?? 0;
        
            const sameDate = covidPoint?.date.getTime() === ukrainePoint?.date.getTime();
        
            const isEndOfLine = (point) => {
                const allDates = categories[cat].map(d => d.date.getTime());
                return point?.date.getTime() === Math.max(...allDates);
            };
        
            const isCovidEnd = isEndOfLine(covidPoint);
            const isUkraineEnd = isEndOfLine(ukrainePoint);
        
            // --- Tooltip x positions
            let covidCx;
            if (isCovidEnd) {
                covidCx = sameDate ? x(covidPoint.date) - 24 : x(covidPoint.date) - 12;
            } else {
                covidCx = sameDate ? x(covidPoint.date) - 12 : x(covidPoint.date);
            }
        
            const ukraineCx = isUkraineEnd ? x(ukrainePoint.date) - 12 : x(ukrainePoint.date);
        
            // --- Draw RED (COVID) Circle
            g.append("circle")
                .attr("class", "tooltip-circle covid")
                .attr("cx", covidCx)
                .attr("cy", y(covidPoint.amount))
                .attr("r", 6)
                .attr("fill", "#900")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${cat}</strong><br>Peak COVID Spending: $${covidPeak.toLocaleString()}<br>Pre-COVID Spending: $${covidPre.toLocaleString()}<br>Change: ${(((covidPeak - covidPre)/covidPre)*100).toFixed(2)}%`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                           .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        
            // --- Draw BLUE (Ukraine) Circle
            g.append("circle")
                .attr("class", "tooltip-circle ukraine")
                .attr("cx", ukraineCx)
                .attr("cy", y(ukrainePoint.amount))
                .attr("r", 6)
                .attr("fill", "#004080")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${cat}</strong><br>Peak Ukraine Spending: $${ukrainePeak.toLocaleString()}<br>Pre-Ukraine Spending: $${ukrainePre.toLocaleString()}<br>Change: ${(((ukrainePeak - ukrainePre)/ukrainePre)*100).toFixed(2)}%`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                           .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        });
    
        // ✅ Use async inflation helper
        await renderInflationLine(g, x, height);
    
        // --- Peak spending tooltips (full graph, black) ---
        selectedCategories.forEach(cat => {
            const peak = d3.max(categories[cat], d => d.amount);
            const peakPoint = categories[cat].find(d => d.amount === peak);
        
            const allDates = categories[cat].map(d => d.date.getTime());
            const isInflationEnd = peakPoint.date.getTime() === Math.max(...allDates);
            const inflationCx = isInflationEnd ? x(peakPoint.date) : x(peakPoint.date) + 12;
        
            g.append("circle")
                .attr("class", "tooltip-circle3")
                .attr("cx", inflationCx)
                .attr("cy", y(peakPoint.amount))
                .attr("r", 6)
                .attr("fill", "black")
                .attr("opacity", 0.7)
                .on("mouseover", function(event) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${cat}</strong><br>Overall Peak: $${peak.toLocaleString()}<br>Date: ${peakPoint.date.toLocaleDateString()}`);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", (event.pageY - 10) + "px")
                           .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });
        });
    }        

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));

    // 1. Create the axis generator with formatting
    const yAxisGenerator = d3.axisLeft(y)
        .tickFormat(d => `$${(d / 1_000_000_000).toFixed(0)}B`)

    // 2. Append it to the chart
        const yAxisGroup = g.append("g").call(yAxisGenerator);

    // 3. Style the tick labels
    yAxisGroup.selectAll("text")
        .style("font-family", "Segoe UI, Tahoma, Geneva, sans-serif")
        .style("font-size", "12px")
        .style("fill", "black");

}

window.setupImpactfulEventsTab = setupImpactfulEventsTab;