// Configuration
const config = {
    width: 800,
    height: 500,
    margin: { top: 40, right: 80, bottom: 60, left: 80 },
    transitionDuration: 750,
    colors: {
        light: {
            primary: "#4299e1",
            secondary: "#48bb78",
            highlight: "#ed64a6",
            background: "#ffffff",
            text: "#2d3748"
        },
        dark: {
            primary: "#90cdf4",
            secondary: "#9ae6b4",
            highlight: "#f687b3",
            background: "#1a202c",
            text: "#e2e8f0"
        }
    }
};

// State management
let state = {
    data: null,
    selectedYear: 2024,
    selectedMetric: "offensive",
    isDarkMode: document.body.classList.contains('dark-theme')
};

// Initialize visualization
async function initVisualization() {
    try {
        // Show loading state
        const container = d3.select("#success-factors-viz");
        container.html('<div class="visualization-loading">Loading visualization...</div>');

        console.log("Loading data...");
        // Load data
        const data = await d3.csv("/assets/data/march_madness.csv", d => {
            return {
                ...d,
                Season: +d.Season,
                "Net Rating": +d["Net Rating"],
                "Adjusted Offensive Efficiency": +d["Adjusted Offensive Efficiency"],
                "Adjusted Defensive Efficiency": +d["Adjusted Defensive Efficiency"],
                "Adjusted Tempo": +d["Adjusted Tempo"],
                Experience: +d.Experience,
                Seed: d.Seed === "Not In a Post-Season Tournament" ? null : +d.Seed
            };
        });
        
        console.log("Data loaded:", data.length, "rows");
        state.data = data;

        // Initialize components
        setupControls();
        createVegaLiteSpec();
        
        // Remove loading state
        container.select(".visualization-loading").remove();
    } catch (error) {
        console.error("Error initializing visualization:", error);
        showError("Failed to load visualization. Please try again later.");
    }
}

// Setup control event listeners
function setupControls() {
    console.log("Setting up controls...");
    // Year slider
    const yearSlider = document.getElementById("year-slider");
    const yearDisplay = document.getElementById("year-display");
    
    if (!yearSlider || !yearDisplay) {
        console.error("Could not find year slider or display elements");
        return;
    }

    yearSlider.addEventListener("input", (e) => {
        console.log("Year changed:", e.target.value);
        state.selectedYear = parseInt(e.target.value);
        yearDisplay.textContent = state.selectedYear;
        updateVisualization();
    });

    // Metric toggles
    const metricButtons = document.querySelectorAll(".metric-toggles .viz-button");
    metricButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            console.log("Metric changed:", button.dataset.metric);
            // Update active state
            metricButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            
            // Update visualization
            state.selectedMetric = button.dataset.metric;
            updateVisualization();
        });
    });

    // Theme change listener
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === "class") {
                state.isDarkMode = document.body.classList.contains('dark-theme');
                updateVisualization();
            }
        });
    });

    observer.observe(document.body, {
        attributes: true
    });
}

// Create Vega-Lite specification
function createVegaLiteSpec() {
    // Filter and process data first
    const filteredData = filterData();
    
    // Calculate domains for scales
    const metrics = {
        "Adjusted Offensive Efficiency": d3.extent(filteredData, d => +d["Adjusted Offensive Efficiency"]),
        "Adjusted Defensive Efficiency": d3.extent(filteredData, d => +d["Adjusted Defensive Efficiency"]),
        "Adjusted Tempo": d3.extent(filteredData, d => +d["Adjusted Tempo"]),
        "Experience": d3.extent(filteredData, d => +d["Experience"]),
        "Net Rating": d3.extent(filteredData, d => +d["Net Rating"]),
        "Seed": [1, 16]
    };

    // Get unique conferences for legend
    const conferences = [...new Set(filteredData.map(d => d["Mapped Conference Name"]))].sort();
    
    console.log("Filtered data:", filteredData.length, "rows");
    console.log("Metrics ranges:", metrics);
    console.log("Conferences:", conferences.length, "unique conferences");

    const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: filteredData },
        width: "container",
        height: 400,
        encoding: {
            x: {
                field: getMetricField(),
                type: "quantitative",
                title: getMetricTitle(),
                scale: {
                    domain: metrics[getMetricField()] || [0, 100],
                    nice: true,
                    padding: 10
                }
            },
            y: {
                field: "Net Rating",
                type: "quantitative",
                title: "Net Rating",
                scale: {
                    domain: metrics["Net Rating"] || [-30, 30],
                    nice: true,
                    padding: 10
                }
            },
            color: {
                field: "Mapped Conference Name",
                type: "nominal",
                scale: {
                    scheme: state.isDarkMode ? "tableau20" : "tableau20"
                },
                legend: {
                    title: "Conference",
                    orient: "bottom",
                    columns: Math.min(3, Math.ceil(conferences.length / 4)),
                    symbolLimit: 50,
                    labelLimit: 200
                }
            },
            size: {
                field: "Seed",
                type: "quantitative",
                scale: {
                    domain: [16, 1],
                    range: [50, 250]
                },
                legend: {
                    title: "Tournament Seed",
                    orient: "right",
                    symbolLimit: 16
                }
            },
            tooltip: [
                { field: "Full Team Name", type: "nominal", title: "Team" },
                { field: "Mapped Conference Name", type: "nominal", title: "Conference" },
                { field: "Seed", type: "quantitative", title: "Seed" },
                { field: getMetricField(), type: "quantitative", title: getMetricTitle(), format: ".1f" },
                { field: "Net Rating", type: "quantitative", title: "Net Rating", format: ".1f" },
                { field: "Current Coach", type: "nominal", title: "Coach" }
            ]
        },
        mark: {
            type: "circle",
            opacity: 0.8,
            stroke: state.isDarkMode ? "white" : "black",
            strokeWidth: 1
        },
        config: {
            background: state.isDarkMode ? config.colors.dark.background : config.colors.light.background,
            axis: {
                labelColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                titleColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                gridColor: state.isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
            },
            legend: {
                labelColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                titleColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                labelLimit: 150,
                symbolLimit: 50
            },
            view: {
                stroke: null
            }
        }
    };

    console.log("Creating visualization with spec:", spec);
    vegaEmbed("#success-factors-viz", spec, { 
        actions: false,
        renderer: "svg",
        downloadFileName: "march-madness-visualization"
    }).then(result => {
        console.log("Visualization created successfully");
    }).catch(error => {
        console.error("Error creating visualization:", error);
        showError("Failed to create visualization. Please try again later.");
    });
}

// Helper functions
function filterData() {
    if (!state.data) {
        console.error("No data loaded");
        return [];
    }
    
    const filtered = state.data.filter(d => {
        const validNumber = (val) => !isNaN(val) && val !== null && val !== undefined && val !== "";
        return d.Season === state.selectedYear && 
               validNumber(d.Seed) &&
               validNumber(d["Net Rating"]) &&
               validNumber(d[getMetricField()]) &&
               d["Mapped Conference Name"] &&
               d["Full Team Name"];
    });
    
    console.log(`Filtered data for year ${state.selectedYear}:`, filtered.length, "rows");
    return filtered;
}

function getMetricField() {
    const metricMap = {
        offensive: "Adjusted Offensive Efficiency",
        defensive: "Adjusted Defensive Efficiency",
        tempo: "Adjusted Tempo",
        experience: "Experience"
    };
    return metricMap[state.selectedMetric];
}

function getMetricTitle() {
    const titleMap = {
        offensive: "Adjusted Offensive Efficiency",
        defensive: "Adjusted Defensive Efficiency",
        tempo: "Adjusted Tempo",
        experience: "Experience"
    };
    return titleMap[state.selectedMetric];
}

function showError(message) {
    const container = d3.select("#success-factors-viz");
    container.html(`
        <div class="visualization-error">
            <p>${message}</p>
        </div>
    `);
}

// Update visualization when state changes
function updateVisualization() {
    createVegaLiteSpec();
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", initVisualization); 