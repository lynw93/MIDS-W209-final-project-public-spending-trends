// mandatory_discretionary.js

const spendingTypeMap = {
    "Social Security": "mandatory",
    "Medicare": "mandatory",
    "Medicaid": "mandatory",
    "Net Interest": "mandatory",
    "Veterans Benefits and Services": "mandatory",

    // Discretionary examples
    "National Defense": "discretionary",
    "Transportation": "discretionary",
    "Education, Training, Employment, and Social Services": "discretionary",
    "International Affairs": "discretionary",
    "General Science, Space, and Technology": "discretionary",
    "Natural Resources and Environment": "discretionary",
    "Community and Regional Development": "discretionary",
    "Administration of Justice": "discretionary",
    "Commerce and Housing Credit": "discretionary",
    "General Government": "discretionary",
    "Energy": "discretionary"
};

async function drawPieChart(year) {
    const rawData = await d3.json("/data/budget_by_function.json");
    const yearKey = `${year}Q1`;
    const data = rawData[yearKey];

    if (!data) {
        d3.select("#spendingTypeChart").html(`<p>Data unavailable for ${year}</p>`);
        return;
    }

    // Sum spending by type
    let totals = { discretionary: 0, mandatory: 0 };

    data.forEach(d => {
        const type = spendingTypeMap[d.name];
        if (type === "mandatory") {
            totals.mandatory += d.amount;
        } else if (type === "discretionary") {
            totals.discretionary += d.amount;
        }
    });

    // Detailed breakdown by category
    const mandatoryDetails = data
        .filter(d => spendingTypeMap[d.name] === "mandatory")
        .map(d => ({ category: d.name, amount: d.amount }));

    const discretionaryDetails = data
        .filter(d => spendingTypeMap[d.name] === "discretionary")
        .map(d => ({ category: d.name, amount: d.amount }));

    const pieData = [
        { type: "Mandatory", value: totals.mandatory, details: mandatoryDetails },
        { type: "Discretionary", value: totals.discretionary, details: discretionaryDetails }
    ];

    const color = d3.scaleOrdinal()
    .domain(["Mandatory", "Discretionary"])
    .range(["#74c476", "#6baed6"]);  // soft green and soft blue

    // Clear previous chart
    d3.select("#spendingTypeChart").html("");

    // Legend container
    const legend = d3.select("#spendingTypeChart")
        .append("div")
        .attr("class", "legend")
        .style("position", "absolute")
        .style("top", "40px")   // original vertical position
        .style("right", "300px")
        .style("background-color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
        .style("font-size", "13px");

    // Add legend items
    legend.selectAll("div.legend-item")
        .data(pieData)
        .join("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-bottom", "4px")
        .html(d => `
            <span style="
                width: 12px; 
                height: 12px; 
                background: ${color(d.type)}; 
                display:inline-block; 
                margin-right: 6px;
                border-radius: 3px;">
            </span>
            ${d.type} Spending
        `);

    const width = 600, height = 400, margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select("#spendingTypeChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
        .value(d => d.value);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

        const tooltip = d3.select("#tooltip");

        svg.selectAll('path')
            .data(pie(pieData))
            .join('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.type))
            .style("stroke", "#fff")
            .style("stroke-width", "2px")
            .on("mouseover", (event, d) => {
                let tooltipHtml = `<strong>${d.data.type} Spending: $${(d.data.value/1e9).toFixed(0)}B</strong><br/><ul style="padding-left:15px; margin:5px 0;">`;
                d.data.details.forEach(cat => {
                    tooltipHtml += `<li>${cat.category}: $${(cat.amount/1e9).toFixed(1)}B</li>`;
                });
                tooltipHtml += "</ul>";
        
                tooltip.style("opacity", 1)
                       .style("background-color", color(d.data.type)) // ✅ Sets background to match slice
                       .style("color", "#000")  // Ensures text is readable on colored background
                       .html(tooltipHtml);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY + 15) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });
        
        svg.selectAll('text')
        .data(pie(pieData))
        .join('text')
        .text(d => {
            const billions = (d.data.value / 1e9).toFixed(0);
            return `${d.data.type}: $${billions}B`;
        })
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("fill", "#000");

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -height / 2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`Spending Split for ${year}`);
}

// Listen for dropdown change
document.getElementById("yearSelect").addEventListener("change", (e) => {
    drawPieChart(e.target.value);
});

// Initial draw
drawPieChart(document.getElementById("yearSelect").value);

