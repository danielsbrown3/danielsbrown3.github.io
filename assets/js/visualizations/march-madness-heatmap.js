// Configuration
const heatmapConfig = {
    width: 800,
    height: 300,
    margin: { top: 40, right: 100, bottom: 60, left: 80 },
    transitionDuration: 750,
    colors: {
        heatmap: d3.interpolateRdPu,  // Changed to Red-Purple scale
        champion: "#FFD700"  // Gold for champions
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
function createHeatmap(containerId, data, xMetric, yMetric, title) {
    console.log(`Creating heatmap for ${containerId} with ${data.length} data points`);
    
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
    
    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("aria-label", `Correlation heatmap of ${title}`);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate correlation matrix
    const metrics = [xMetric, yMetric];
    const correlationMatrix = [];
    
    metrics.forEach((metric1, i) => {
        correlationMatrix[i] = [];
        metrics.forEach((metric2, j) => {
            if (i === j) {
                correlationMatrix[i][j] = 1;
            } else {
                const correlation = calculateCorrelation(data, metric1, metric2);
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
    const cells = g.selectAll("g")
        .data(correlationMatrix)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0,${i * cellSize})`)
        .selectAll("rect")
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
    g.selectAll(".correlation-text")
        .data(correlationMatrix.flat())
        .enter()
        .append("text")
        .attr("class", "correlation-text")
        .attr("x", (d, i) => (i % metrics.length) * cellSize + cellSize / 2)
        .attr("y", (d, i) => Math.floor(i / metrics.length) * cellSize + cellSize / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", d => Math.abs(d) > 0.5 ? "white" : "black")
        .attr("font-size", "12px")
        .text(d => d.toFixed(2));

    // Add axis labels
    // X axis
    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${metrics.length * cellSize})`)
        .selectAll("text")
        .data(metrics)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * cellSize + cellSize / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", getHeatmapThemeColors().text)
        .text(d => d);

    // Y axis
    g.append("g")
        .attr("class", "axis")
        .selectAll("text")
        .data(metrics)
        .enter()
        .append("text")
        .attr("x", -10)
        .attr("y", (d, i) => i * cellSize + cellSize / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", getHeatmapThemeColors().text)
        .text(d => d);

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

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "heatmap-title")
        .attr("fill", getHeatmapThemeColors().text)
        .text(title);
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
        console.log('Initializing heatmaps...');
        
        // Show loading state
        d3.selectAll(".heatmap-container").html('<div class="visualization-loading">Loading heatmaps...</div>');
        
        // Process data
        const processedData = processHeatmapData();
        console.log(`Processed ${processedData.length} data points for heatmaps`);
        
        if (processedData.length === 0) {
            throw new Error('No data available for heatmaps');
        }

        // Create heatmaps
        createHeatmap("#offensive-defensive-heatmap", processedData,
            "Adjusted Offensive Efficiency", "Adjusted Defensive Efficiency",
            "Offensive vs Defensive Efficiency");
            
        createHeatmap("#rating-experience-heatmap", processedData,
            "Net Rating", "Experience",
            "Net Rating vs Experience");
            
        createHeatmap("#seed-performance-heatmap", processedData,
            "Seed", "Classification",
            "Seed vs Tournament Performance");
            
    } catch (error) {
        console.error("Error initializing heatmaps:", error);
        showHeatmapError("Failed to load heatmaps. Please try again later.");
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