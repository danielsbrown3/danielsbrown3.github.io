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
    data: null,
    classificationData: null,
    selectedYear: 2024,
    isDarkMode: false
};

// Get computed styles for theme colors
function getHeatmapThemeColors() {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
        background: computedStyle.getPropertyValue('--background-color').trim(),
        text: computedStyle.getPropertyValue('--text-color').trim(),
        grid: heatmapState.isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
    };
}

// Create heatmap visualization
function createHeatmap(containerId, data, xMetric, yMetric, title) {
    const container = d3.select(containerId);
    const width = container.node().getBoundingClientRect().width;
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
        .range([0, width - margin.left - margin.right]);
        
    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d[yMetric]))
        .range([height - margin.top - margin.bottom, 0]);
    
    // Create bins
    const bins = d3.bin()
        .domain(x.domain())
        .thresholds(20);
        
    // Calculate density
    const density = d3.contourDensity()
        .x(d => x(d[xMetric]))
        .y(d => y(d[yMetric]))
        .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
        .bandwidth(30)
        (data);
    
    // Color scale for density
    const colorScale = d3.scaleSequential(heatmapConfig.colors.heatmap)
        .domain([0, d3.max(density, d => d.value)]);
    
    // Draw contours
    g.append("g")
        .selectAll("path")
        .data(density)
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
        .attr("r", 3)
        .attr("fill", d => d.Classification === "Winner" ? heatmapConfig.colors.champion : "white")
        .attr("stroke", d => d.Classification === "Winner" ? "black" : "none")
        .attr("stroke-width", 1)
        .attr("opacity", 0.7)
        .on("mouseover", function(event, d) {
            showTooltip(event, d, xMetric, yMetric);
        })
        .on("mouseout", hideTooltip);
    
    // Add axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);
    
    g.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(xAxis);
        
    g.append("g")
        .call(yAxis);
    
    // Add labels
    g.append("text")
        .attr("x", (width - margin.left - margin.right) / 2)
        .attr("y", height - margin.top)
        .attr("text-anchor", "middle")
        .text(xMetric);
        
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height - margin.top - margin.bottom) / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .text(yMetric);
        
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "heatmap-title")
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
async function initHeatmaps() {
    try {
        // Show loading state
        d3.selectAll(".heatmap-container").html('<div class="visualization-loading">Loading heatmaps...</div>');
        
        // Load data if not already loaded
        if (!heatmapState.data) {
            [heatmapState.data, heatmapState.classificationData] = await Promise.all([
                d3.csv("/assets/data/march_madness.csv", d => ({
                    ...d,
                    Season: +d.Season,
                    "Net Rating": +d["Net Rating"],
                    "Adjusted Offensive Efficiency": +d["Adjusted Offensive Efficiency"],
                    "Adjusted Defensive Efficiency": +d["Adjusted Defensive Efficiency"],
                    Experience: +d.Experience,
                    Seed: d.Seed === "Not In a Post-Season Tournament" ? null : +d.Seed
                })),
                d3.csv("/assets/data/classification.csv")
            ]);
        }
        
        // Filter and process data
        const yearData = filterHeatmapData();
        
        // Create heatmaps
        createHeatmap("#offensive-defensive-heatmap", yearData,
            "Adjusted Offensive Efficiency", "Adjusted Defensive Efficiency",
            "Offensive vs Defensive Efficiency");
            
        createHeatmap("#rating-experience-heatmap", yearData,
            "Net Rating", "Experience",
            "Net Rating vs Experience");
            
        createHeatmap("#seed-performance-heatmap", yearData,
            "Seed", "Classification",
            "Seed vs Tournament Performance");
            
        // Remove loading state
        d3.selectAll(".visualization-loading").remove();
        
    } catch (error) {
        console.error("Error initializing heatmaps:", error);
        showHeatmapError("Failed to load heatmaps. Please try again later.");
    }
}

// Filter data for heatmaps
function filterHeatmapData() {
    if (!heatmapState.data || !heatmapState.classificationData) {
        return [];
    }
    
    const yearData = heatmapState.data.filter(d => {
        const validNumber = (val) => !isNaN(val) && val !== null && val !== undefined && val !== "";
        return d.Season === heatmapState.selectedYear &&
               validNumber(d.Seed) &&
               validNumber(d["Net Rating"]) &&
               validNumber(d["Adjusted Offensive Efficiency"]) &&
               validNumber(d["Adjusted Defensive Efficiency"]) &&
               validNumber(d.Experience);
    });
    
    const yearClassification = heatmapState.classificationData.filter(d => +d.Year === heatmapState.selectedYear);
    
    return yearData.map(team => ({
        ...team,
        Classification: yearClassification.find(c => c.Team === team["Full Team Name"])?.Classification || "Other"
    }));
}

// Show error message
function showHeatmapError(message) {
    d3.selectAll(".heatmap-container").html(`
        <div class="visualization-error">
            <p>${message}</p>
        </div>
    `);
}

// Update heatmaps when year changes
function updateHeatmaps(year) {
    heatmapState.selectedYear = year;
    initHeatmaps();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    // Check if dark mode is active
    heatmapState.isDarkMode = document.body.classList.contains('dark-theme');
    
    // Initialize heatmaps
    initHeatmaps();
    
    // Listen for year changes from the existing slider
    const yearSlider = document.getElementById("year-slider");
    if (yearSlider) {
        yearSlider.addEventListener("input", (e) => {
            updateHeatmaps(parseInt(e.target.value));
        });
    }
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
                heatmapState.isDarkMode = document.body.classList.contains('dark-theme');
                initHeatmaps();
            }
        });
    });
    
    observer.observe(document.body, {
        attributes: true
    });
}); 