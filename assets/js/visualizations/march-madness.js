// Configuration
const config = {
    yearRange: {
        min: 2008,
        max: 2024
    }
};

// State management
let state = {
    data: null,
    classificationData: null,
    selectedYear: 2024,
    isDarkMode: false
};

// Initialize window.marchMadness if it doesn't exist
window.marchMadness = window.marchMadness || {
    state: {
        data: null,
        classificationData: null,
        selectedYear: 2024
    }
};

// Initialize data loading
async function initVisualization() {
    try {
        // Ensure required libraries are loaded
        if (!window.d3) {
            throw new Error("Required libraries not loaded");
        }

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
        
        // Update both local and global state
        state.data = mainData;
        state.classificationData = classificationData;
        window.marchMadness.state.data = mainData;
        window.marchMadness.state.classificationData = classificationData;
        window.marchMadness.state.initialized = true;

        // Check if dark mode is active
        state.isDarkMode = document.body.classList.contains('dark-theme');

        // Signal that data is ready
        if (window.marchMadness.onDataReady) {
            window.marchMadness.onDataReady();
        }

    } catch (error) {
        console.error("Error initializing visualization:", error);
        console.error("Failed to load data. Please try again later.");
    }
}

// Wait for both DOM and required libraries
function checkAndInitialize() {
    if (document.readyState === "complete" && window.d3) {
        initVisualization();
    } else {
        setTimeout(checkAndInitialize, 100);
    }
}

// Start checking when document is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndInitialize);
} else {
    checkAndInitialize();
} 