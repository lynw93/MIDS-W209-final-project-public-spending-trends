
//Spending changes java script

async function renderSpendingChangeChart(beginYear, endYear) {
    const container = d3.select("#spendingChangeChart").html("");

    const data = await d3.json("/data/budget_by_function.json");

    const formatYear = year => `${year}Q1`;
    const beginKey = formatYear(beginYear);
    const endKey = formatYear(endYear);

    if (!data[beginKey] || !data[endKey]) {
        container.append("p").text("Data for the selected years is unavailable.");
        return;
    }

    const beginMap = new Map(data[beginKey].map(d => [d.name, d.amount]));
    const endMap = new Map(data[endKey].map(d => [d.name, d.amount]));

    const categories = Array.from(new Set([...beginMap.keys(), ...endMap.keys()]));

    const changes = categories.map(cat => {
        const begin = beginMap.get(cat) || 0;
        const end = endMap.get(cat) || 0;
        return {
            category: cat,
            change: end - begin,
            percent: begin ? ((end - begin) / begin) * 100 : 0
        };
    });

    const margin = { top: 100, right: 30, bottom: 130, left: 100 },
          width = 1000 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(changes.map(d => d.category))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain(d3.extent(changes, d => d.change)).nice()
        .range([height, 0]);

    const color = d3.scaleSequential()
        .domain(d3.extent(changes, d => d.percent).reverse())
        .interpolator(d3.interpolateRdBu);


    const yAxis = d3.axisLeft(y)
        .ticks(10)
        .tickFormat(d => `$${(d / 1_000_000_000).toFixed(0)}B`)  // Format as billions
    
    const yAxisGroup = svg.append("g").call(yAxis);
    
    // Style the Y-axis tick labels to match your other chart
    yAxisGroup.selectAll("text")
        .style("font-family", "Segoe UI, Tahoma, Geneva, sans-serif")
        .style("font-size", "12px")
        .style("fill", "#333");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Tooltip container
        const tooltip = container.append("div")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 10px")
    .style("font-size", "12px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
    .style("opacity", 0);

    svg.selectAll("rect")
    .data(changes)
    .join("rect")
    .attr("x", d => x(d.category))
    .attr("width", x.bandwidth())
    .attr("y", d => y(Math.max(0, d.change)))
    .attr("height", d => Math.abs(y(d.change) - y(0)))
    .attr("fill", d => color(d.percent))
    .on("mouseover", (event, d) => {
        tooltip
            .style("opacity", 1)
            .html(`<strong>${d.category}</strong><br>
                   Change: $${(d.change / 1e9).toFixed(2)}B<br>
                   Percent: ${d.percent.toFixed(1)}%`);
    })
    .on("mousemove", event => {
        tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("opacity", 0);
    });

    svg.selectAll("text.label")
    .data(changes)
    .join("text")
    .attr("class", "label")
    .attr("x", d => x(d.category) + x.bandwidth() / 2)
    .attr("y", d => {
        const zeroY = y(0);
        const barY = y(d.change);
        const offset = 10;
  
        // For positive: place above bar.
        // For negative: place below bar but ABOVE x-axis line (not under it).
        if (d.change >= 0) {
            return barY - offset;
        } else {
            const labelY = barY + offset;
            // Don't go beyond the x-axis line
            return Math.min(labelY, zeroY - 4); // ensures spacing, prevents bleed
        }
    })
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#333")
    .text(d => `${d.percent.toFixed(1)}%`);
  


    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(`Spending Changes from ${beginYear} to ${endYear}`);
}

// Listen for messages from the parent page
window.addEventListener("message", (event) => {
    if (event.data.type === "updateSpendingChange") {
        const { beginYear, endYear } = event.data;
        renderSpendingChangeChart(parseInt(beginYear), parseInt(endYear));
    }
});

