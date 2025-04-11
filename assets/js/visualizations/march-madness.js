// Configuration
const config = {
    width: 800,
    height: 500,
    margin: { top: 40, right: 80, bottom: 60, left: 80 },
    transitionDuration: 750,
    yearRange: {
        min: 2008,
        max: 2024
    },
    colors: {
        tournament: {
            Winner: "#FFD700",      // Gold
            Final_Four: "#4169E1",  // Royal Blue
            Sweet_Sixteen: "#2E8B57", // Sea Green
            Other: "#808080"        // Gray
        },
        light: {
            background: "#ffffff",
            text: "#2d3748",
            grid: "rgba(0,0,0,0.1)"
        },
        dark: {
            background: "#1a202c",
            text: "#e2e8f0",
            grid: "rgba(255,255,255,0.1)"
        }
    }
};

// State management
let state = {
    data: null,
    classificationData: null,
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
        
        // Load both datasets in parallel
        const [mainData, classificationData] = await Promise.all([
            d3.csv("/assets/data/march_madness.csv", d => ({
                ...d,
                Season: +d.Season,
                "Net Rating": +d["Net Rating"],
                "Adjusted Offensive Efficiency": +d["Adjusted Offensive Efficiency"],
                "Adjusted Defensive Efficiency": +d["Adjusted Defensive Efficiency"],
                "Adjusted Tempo": +d["Adjusted Temo"],
                Experience: +d.Experience,
                Seed: d.Seed === "Not In a Post-Season Tournament" ? null : +d.Seed,
                TeamName: d["Full Team Name"]
            })),
            d3.csv("/assets/data/classification.csv")
        ]);
        
        console.log("Data loaded:", mainData.length, "main rows,", classificationData.length, "classification rows");
        console.log("Sample main data:", mainData[0]);
        console.log("Sample classification data:", classificationData[0]);
        
        state.data = mainData;
        state.classificationData = classificationData;

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

    // Update slider range
    yearSlider.min = config.yearRange.min;
    yearSlider.max = config.yearRange.max;
    yearSlider.value = state.selectedYear;
    yearDisplay.textContent = state.selectedYear;

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
        "Net Rating": d3.extent(filteredData, d => +d["Net Rating"])
    };

    console.log("Filtered data:", filteredData.length, "rows");
    console.log("Metrics ranges:", metrics);

    const themeColors = state.isDarkMode ? config.colors.dark : config.colors.light;

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
                field: "Classification",
                type: "nominal",
                scale: {
                    domain: ["Winner", "Final_Four", "Sweet_Sixteen", "Other"],
                    range: [
                        config.colors.tournament.Winner,
                        config.colors.tournament.Final_Four,
                        config.colors.tournament.Sweet_Sixteen,
                        config.colors.tournament.Other
                    ]
                },
                legend: {
                    title: "Tournament Performance",
                    orient: "bottom",
                    labelLimit: 150
                }
            },
            tooltip: [
                { field: "Full Team Name", type: "nominal", title: "Team" },
                { field: "Classification", type: "nominal", title: "Tournament Result" },
                { field: "Seed", type: "quantitative", title: "Seed" },
                { field: getMetricField(), type: "quantitative", title: getMetricTitle(), format: ".1f" },
                { field: "Net Rating", type: "quantitative", title: "Net Rating", format: ".1f" },
                { field: "Current Coach", type: "nominal", title: "Coach" }
            ]
        },
        mark: {
            type: "circle",
            size: 100,
            opacity: 0.8,
            stroke: themeColors.text,
            strokeWidth: 1
        },
        config: {
            background: themeColors.background,
            axis: {
                labelColor: themeColors.text,
                titleColor: themeColors.text,
                gridColor: themeColors.grid
            },
            legend: {
                labelColor: themeColors.text,
                titleColor: themeColors.text
            },
            view: {
                stroke: null
            }
        }
    };

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
    if (!state.data || !state.classificationData) {
        console.error("Data not loaded");
        return [];
    }
    
    // Filter main data for the selected year
    const yearData = state.data.filter(d => {
        const validNumber = (val) => !isNaN(val) && val !== null && val !== undefined && val !== "";
        return d.Season === state.selectedYear && 
               validNumber(d["Net Rating"]) &&
               validNumber(d[getMetricField()]) &&
               d.TeamName;
    });

    // Get classification data for the selected year
    const yearClassification = state.classificationData.filter(d => +d.Year === state.selectedYear);
    
    // Join the datasets
    const joinedData = yearData.map(team => {
        const classification = yearClassification.find(c => c.Team === team.TeamName);
        return {
            ...team,
            Classification: classification ? classification.Classification : "Other"
        };
    });

    console.log(`Filtered data for year ${state.selectedYear}:`, joinedData.length, "rows");
    console.log("Sample joined data:", joinedData[0]);
    return joinedData;
}

function getMetricField() {
    const metricMap = {
        offensive: "Adjusted Offensive Efficiency",
        defensive: "Adjusted Defensive Efficiency",
        tempo: "Adjusted Temo",
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