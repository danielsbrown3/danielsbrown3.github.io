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
        container.html('<div class="visualization-loading">Loading...</div>');

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
    // Year slider
    const yearSlider = document.getElementById("year-slider");
    const yearDisplay = document.getElementById("year-display");
    
    yearSlider.addEventListener("input", (e) => {
        state.selectedYear = parseInt(e.target.value);
        yearDisplay.textContent = state.selectedYear;
        updateVisualization();
    });

    // Metric toggles
    const metricButtons = document.querySelectorAll(".metric-toggles .viz-button");
    metricButtons.forEach(button => {
        button.addEventListener("click", (e) => {
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
    const spec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        data: { values: filterData() },
        width: "container",
        height: 400,
        encoding: {
            x: {
                field: getMetricField(),
                type: "quantitative",
                title: getMetricTitle()
            },
            y: {
                field: "Net Rating",
                type: "quantitative",
                title: "Net Rating"
            },
            color: {
                field: "Mapped Conference Name",
                type: "nominal",
                scale: {
                    scheme: state.isDarkMode ? "dark2" : "category10"
                }
            },
            size: {
                field: "Seed",
                type: "quantitative",
                scale: {
                    range: [50, 250]
                },
                legend: {
                    title: "Seed"
                }
            },
            tooltip: [
                { field: "Full Team Name", type: "nominal", title: "Team" },
                { field: "Mapped Conference Name", type: "nominal", title: "Conference" },
                { field: "Seed", type: "quantitative", title: "Seed" },
                { field: getMetricField(), type: "quantitative", title: getMetricTitle() },
                { field: "Net Rating", type: "quantitative", title: "Net Rating" },
                { field: "Current Coach", type: "nominal", title: "Coach" }
            ]
        },
        mark: {
            type: "circle",
            opacity: 0.7
        },
        config: {
            background: state.isDarkMode ? config.colors.dark.background : config.colors.light.background,
            axis: {
                labelColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                titleColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text
            },
            legend: {
                labelColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text,
                titleColor: state.isDarkMode ? config.colors.dark.text : config.colors.light.text
            }
        }
    };

    vegaEmbed("#success-factors-viz", spec, { actions: false });
}

// Helper functions
function filterData() {
    return state.data.filter(d => d.Season === state.selectedYear && d.Seed != null);
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