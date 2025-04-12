// Configuration
const heatmapConfig = {
    width: 800,
    height: 600,  // Increased height for the larger correlation matrix
    margin: { top: 60, right: 100, bottom: 60, left: 150 },  // Reduced top margin
    transitionDuration: 750,
    colors: {
        heatmap: d3.interpolateRdBu,  // Changed to Red-Blue scale
        champion: "#FFD700"
    }
};

// State management for heatmaps
let heatmapState = {
    selectedYear: 2024,
    isDarkMode: false
};

// Get computed styles for theme colors
function getHeatmapThemeColors() {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
        background: computedStyle.getPropertyValue('--background-color').trim(),
        text: computedStyle.getPropertyValue('--text-color').trim(),
        grid: document.body.classList.contains('dark-theme') ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
    };
}

// Process data for heatmaps
function processHeatmapData() {
    if (!window.marchMadness?.state?.data || !window.marchMadness?.state?.classificationData) {
        console.error('Data not available for heatmaps');
        return [];
    }

    const validNumber = (val) => !isNaN(val) && val !== null && val !== undefined && val !== "";
    
    // Filter data for the selected year
    const yearData = window.marchMadness.state.data.filter(d => {
        return d.Season === window.marchMadness.state.selectedYear &&
               validNumber(d.Seed) &&
               validNumber(d["Net Rating"]) &&
               validNumber(d["Adjusted Offensive Efficiency"]) &&
               validNumber(d["Adjusted Defensive Efficiency"]) &&
               validNumber(d.Experience);
    });

    // Get classification data for the year
    const yearClassification = window.marchMadness.state.classificationData.filter(
        d => +d.Year === window.marchMadness.state.selectedYear
    );

    // Join the datasets
    return yearData.map(team => ({
        ...team,
        Classification: yearClassification.find(c => c.Team === team["Full Team Name"])?.Classification || "Other"
    }));
}

// Create heatmap visualization
function createHeatmap(containerId, data) {
    console.log(`Creating correlation matrix with ${data.length} data points`);
    
    const container = d3.select(containerId);
    if (!container.node()) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    const containerWidth = container.node().getBoundingClientRect().width;
    const width = Math.min(containerWidth, heatmapConfig.width);
    const height = heatmapConfig.height;
    const margin = heatmapConfig.margin;
    
    // Clear existing content
    container.selectAll("*").remove();
    
    // Define metrics and their display names
    const metrics = [
        { key: "Adjusted Offensive Efficiency", label: "Off. Efficiency" },
        { key: "Adjusted Defensive Efficiency", label: "Def. Efficiency" },
        { key: "Adjusted Temo", label: "Tempo" },
        { key: "Experience", label: "Experience" },
        { key: "Net Rating", label: "Net Rating" },
        { key: "Seed", label: "Seed" }
    ];

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("aria-label", "Correlation matrix of basketball metrics");
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate correlation matrix
    const correlationMatrix = [];
    metrics.forEach((metric1, i) => {
        correlationMatrix[i] = [];
        metrics.forEach((metric2, j) => {
            if (i === j) {
                correlationMatrix[i][j] = 1;
            } else {
                const correlation = calculateCorrelation(data, metric1.key, metric2.key);
                correlationMatrix[i][j] = correlation;
            }
        });
    });

    // Create scales
    const cellSize = Math.min(
        (width - margin.left - margin.right) / metrics.length,
        (height - margin.top - margin.bottom) / metrics.length
    );

    // Color scale for correlation values
    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdPu)
        .domain([-1, 1]);

    // Create grid cells
    const cells = g.selectAll("g.row")
        .data(correlationMatrix)
        .enter()
        .append("g")
        .attr("class", "row")
        .attr("transform", (d, i) => `translate(0,${i * cellSize})`);

    cells.selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("fill", d => colorScale(d))
        .attr("stroke", "white")
        .attr("stroke-width", 1);

    // Add correlation values
    cells.selectAll(".correlation-text")
        .data(d => d)
        .enter()
        .append("text")
        .attr("class", "correlation-text")
        .attr("x", (d, i) => i * cellSize + cellSize / 2)
        .attr("y", cellSize / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", d => Math.abs(d) > 0.5 ? "white" : "black")
        .attr("font-size", "12px")
        .text(d => d.toFixed(2));

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)  // Moved up from 30 to 20
        .attr("text-anchor", "middle")
        .attr("class", "heatmap-title")
        .attr("fill", getHeatmapThemeColors().text)
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text("Correlation Matrix of Basketball Metrics");

    // Add column labels
    g.append("g")
        .attr("class", "column-labels")
        .selectAll("text")
        .data(metrics)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * cellSize + cellSize / 2)
        .attr("y", -35)  // Moved up from -25 to -35
        .attr("transform", (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -35)`)  // Updated rotation point
        .attr("text-anchor", "end")
        .attr("fill", getHeatmapThemeColors().text)
        .attr("font-size", "12px")
        .text(d => d.label);

    // Add row labels
    g.append("g")
        .attr("class", "row-labels")
        .selectAll("text")
        .data(metrics)
        .enter()
        .append("text")
        .attr("x", -10)
        .attr("y", (d, i) => i * cellSize + cellSize / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", getHeatmapThemeColors().text)
        .attr("font-size", "12px")
        .text(d => d.label);

    // Add color legend
    const legendWidth = 20;
    const legendHeight = height - margin.top - margin.bottom;
    
    // Create gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", `correlation-gradient-${containerId.replace("#", "")}`)
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    gradient.selectAll("stop")
        .data(d3.range(0, 1.1, 0.1))
        .enter()
        .append("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => colorScale(d * 2 - 1));

    // Add legend rectangle
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);

    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#correlation-gradient-${containerId.replace("#", "")})`);

    // Add legend axis
    const legendScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".1f"));

    legend.append("g")
        .attr("transform", `translate(${legendWidth},0)`)
        .call(legendAxis)
        .selectAll("text")
        .attr("fill", getHeatmapThemeColors().text);
}

// Calculate correlation between two metrics
function calculateCorrelation(data, metric1, metric2) {
    const values1 = data.map(d => +d[metric1]);
    const values2 = data.map(d => +d[metric2]);
    
    const mean1 = d3.mean(values1);
    const mean2 = d3.mean(values2);
    
    const deviation1 = values1.map(v => v - mean1);
    const deviation2 = values2.map(v => v - mean2);
    
    const sum_deviation = deviation1.reduce((acc, v, i) => acc + v * deviation2[i], 0);
    
    const squared_deviation1 = deviation1.reduce((acc, v) => acc + v * v, 0);
    const squared_deviation2 = deviation2.reduce((acc, v) => acc + v * v, 0);
    
    return sum_deviation / Math.sqrt(squared_deviation1 * squared_deviation2);
}

// Tooltip functions
function showTooltip(event, d, xMetric, yMetric) {
    const tooltip = d3.select("#heatmap-tooltip");
    tooltip.style("display", "block")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .html(`
            <strong>${d["Full Team Name"]}</strong><br>
            ${xMetric}: ${d[xMetric].toFixed(1)}<br>
            ${yMetric}: ${d[yMetric].toFixed(1)}<br>
            Seed: ${d.Seed}<br>
            Result: ${d.Classification}
        `);
}

function hideTooltip() {
    d3.select("#heatmap-tooltip").style("display", "none");
}

// Initialize heatmap visualizations
function initHeatmaps() {
    try {
        console.log('Initializing correlation matrix...');
        
        // Show loading state
        d3.selectAll(".heatmap-container").html('<div class="visualization-loading">Loading correlation matrix...</div>');
        
        // Process data
        const processedData = processHeatmapData();
        console.log(`Processed ${processedData.length} data points for correlation matrix`);
        
        if (processedData.length === 0) {
            throw new Error('No data available for correlation matrix');
        }

        // Create single correlation matrix
        createHeatmap("#correlation-matrix", processedData);
            
    } catch (error) {
        console.error("Error initializing correlation matrix:", error);
        showHeatmapError("Failed to load correlation matrix. Please try again later.");
    }
}

// Show error message
function showHeatmapError(message) {
    d3.selectAll(".heatmap-container").html(`
        <div class="visualization-error">
            <p>${message}</p>
        </div>
    `);
}

// Initialize when the window object is ready
function waitForData() {
    console.log("Waiting for data...");
    if (window.marchMadness?.state?.initialized) {
        console.log("Data is ready, initializing heatmaps...");
        initHeatmaps();
    } else {
        console.log("Data not ready yet, waiting...");
        setTimeout(waitForData, 100);
    }
}

// Start waiting for data
waitForData();

// Listen for year changes
document.getElementById('year-slider')?.addEventListener('input', (e) => {
    if (window.marchMadness?.state) {
        window.marchMadness.state.selectedYear = parseInt(e.target.value);
        initHeatmaps();
    }
}); 