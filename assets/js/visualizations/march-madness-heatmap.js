// Configuration
const heatmapConfig = {
    width: 800,
    height: 300,
    margin: { top: 40, right: 80, bottom: 60, left: 80 },
    transitionDuration: 750,
    colors: {
        heatmap: d3.interpolateRdBu,
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
        .attr("aria-label", `Heatmap of ${title}`);
        
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xMetric]))
        .range([0, width - margin.left - margin.right])
        .nice();
        
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yMetric]))
        .range([height - margin.top - margin.bottom, 0])
        .nice();
    
    // Calculate density
    const densityData = d3.contourDensity()
        .x(d => x(d[xMetric]))
        .y(d => y(d[yMetric]))
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .bandwidth(30)
        .thresholds(20)
        (data);
    
    // Color scale for density
    const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateRdBu)
        .domain([d3.max(densityData, d => d.value), 0]);
    
    // Draw contours
    g.append("g")
        .selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", d => colorScale(d.value))
        .attr("opacity", 0.7);
    
    // Add points for teams
    g.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => x(d[xMetric]))
        .attr("cy", d => y(d[yMetric]))
        .attr("r", 4)
        .attr("fill", d => d.Classification === "Winner" ? heatmapConfig.colors.champion : "white")
        .attr("stroke", d => d.Classification === "Winner" ? "black" : "none")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8)
        .on("mouseover", function(event, d) {
            showTooltip(event, d, xMetric, yMetric);
        })
        .on("mouseout", hideTooltip);
    
    // Add axes with grid lines
    const xAxis = d3.axisBottom(x)
        .ticks(5)
        .tickSize(-height + margin.top + margin.bottom);
    
    const yAxis = d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width + margin.left + margin.right);
    
    // Add grid lines
    g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(xAxis)
        .call(g => g.selectAll(".tick line")
            .attr("stroke", getHeatmapThemeColors().grid)
            .attr("stroke-opacity", 0.5));
        
    g.append("g")
        .attr("class", "grid")
        .call(yAxis)
        .call(g => g.selectAll(".tick line")
            .attr("stroke", getHeatmapThemeColors().grid)
            .attr("stroke-opacity", 0.5));
    
    // Style axis lines and text
    g.selectAll(".grid path")
        .attr("stroke", "none");
    
    g.selectAll(".grid text")
        .attr("fill", getHeatmapThemeColors().text)
        .attr("font-size", "10px");
    
    // Add labels
    g.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height - margin.top + 40)
        .attr("text-anchor", "middle")
        .attr("fill", getHeatmapThemeColors().text)
        .text(xMetric);
        
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.top - margin.bottom) / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .attr("fill", getHeatmapThemeColors().text)
        .text(yMetric);
        
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "heatmap-title")
        .attr("fill", getHeatmapThemeColors().text)
        .text(title);
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
if (window.marchMadness) {
    initHeatmaps();
} else {
    // Wait for the window object to be ready
    const checkInterval = setInterval(() => {
        if (window.marchMadness) {
            clearInterval(checkInterval);
            initHeatmaps();
        }
    }, 100);
    
    // Clear interval after 10 seconds to prevent infinite checking
    setTimeout(() => clearInterval(checkInterval), 10000);
}

// Listen for year changes
document.getElementById('year-slider')?.addEventListener('input', (e) => {
    window.marchMadness.state.selectedYear = parseInt(e.target.value);
    initHeatmaps();
}); 