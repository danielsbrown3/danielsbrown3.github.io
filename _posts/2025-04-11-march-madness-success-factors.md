---
layout: post
title: "Analyzing March Madness Success Factors: An Interactive Data Exploration"
date: 2025-04-11
tags: [data-visualization, sports-analytics, machine-learning]
description: "An interactive exploration of factors that contribute to success in the NCAA March Madness tournament, using historical data and advanced analytics."
reading_time: 10
---

Every March, college basketball fans and analysts try to predict which teams will make deep runs in the NCAA tournament. While there's always an element of unpredictability (hence, "March Madness"), certain factors consistently correlate with tournament success. In this post, we'll explore these factors using interactive visualizations of historical tournament data.

![MIDS 207]({{ site.baseurl }}/assets/207team.png "MIDS 207 Team"){: width="400" height="300"}

Our team from the machine learning class, MIDS 207 at UC Berkeley, attempted to take on this problem. 

We initially started by exploring Kaggle datasets, provided from the annual Kaggle competition, which brought us about 60-67% accuracy. 

So we looked to popular models to see what type of data they were using to increase their performance.

If you watch college basketball, you definately have heard of Ken Pom. He is a statitician that is known for his popular college basketball rankings being very accurate every year based on synthetic features he derives himself.

Lets dive into his features together:

## Ken Pom Data

Below is an interactive visualization that allows you to explore relationships between these factors and tournament success. Use the controls to filter by year, adjust metrics, and highlight specific conferences or teams.

<div class="visualization-container">
    <div class="visualization-controls">
        <div class="viz-slider">
            <label for="year-slider">Select Year Range</label>
            <div class="slider-container">
                <input type="range" id="year-slider" min="2002" max="2024" value="2024">
                <span id="year-display">2024</span>
            </div>
        </div>
        <div class="metric-toggles">
            <button class="viz-button active" data-metric="offensive">Offense</button>
            <button class="viz-button" data-metric="defensive">Defense</button>
            <button class="viz-button" data-metric="tempo">Tempo</button>
            <button class="viz-button" data-metric="experience">Experience</button>
        </div>
    </div>
    <div id="success-factors-viz"></div>
</div>

<!-- Bar Chart Race Visualization -->
<div class="visualization-section">
    <h2>Tournament Performance Over Time</h2>
    <p>Watch how different teams' performance metrics have evolved over the years. Use the controls below to play through the years or select specific metrics to analyze.</p>
    
    <div class="visualization-container bar-chart-container">
        <div id="bar-chart-race-viz" style="width: 100%; height: 800px; position: relative;"></div>
    </div>
</div>

<style>
/* Essential styles for the bar chart race */
.visualization-section {
    margin: 2rem 0;
    width: 100%;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
}

.bar-chart-container {
    background: var(--background-color, white);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 100%;
    overflow: hidden;
    min-height: 800px;
}

.tournament-chart {
    background: var(--background-color, white);
    width: 100%;
    height: 100%;
}

.chart-title {
    font-size: 16px;
    font-weight: bold;
}

.chart-subtitle {
    font-size: 14px;
}

.bar {
    transition: width 0.5s ease;
}

.bar-label {
    font-size: 12px;
    fill: var(--text-color, black);
}

.seed-label {
    fill: var(--text-color, black);
}

.axis-label {
    font-size: 12px;
    fill: var(--text-color, black);
}

.x-axis text {
    fill: var(--text-color, black);
}

.x-axis line,
.x-axis path {
    stroke: var(--text-color, black);
}

/* Control styles */
.visualization-controls {
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--background-color, white);
    border-radius: 4px;
}

.control-group {
    margin-bottom: 0.5rem;
}

.viz-button {
    padding: 0.5rem 1rem;
    margin: 0 0.25rem;
    border: none;
    border-radius: 4px;
    background: var(--accent-color, #4299e1);
    color: white;
    cursor: pointer;
}

.viz-button:hover {
    opacity: 0.9;
}

.viz-select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-color, #e2e8f0);
}

.year-display {
    font-size: 14px;
    margin-bottom: 0.5rem;
}
</style>

<script>
// Load D3.js first
const d3Script = document.createElement('script');
d3Script.src = "https://d3js.org/d3.v7.min.js";
d3Script.onload = function() {
    console.log("D3.js loaded successfully");
    
    // Create a global namespace for shared data and functions
    if (!window.marchMadness) {
        window.marchMadness = {
            state: {
                data: null,
                classificationData: null,
                selectedYear: 2024,
                initialized: false
            }
        };
    }

    // Only set up initialization if not already done
    if (!window.marchMadness.initialized) {
        window.marchMadness.initialized = true;
        
        // Load visualization scripts
        const mainScript = document.createElement('script');
        mainScript.src = "{{ '/assets/js/visualizations/march-madness.js' | relative_url }}";
        
        const barChartScript = document.createElement('script');
        barChartScript.src = "{{ '/assets/js/visualizations/d3-tournament-bar-chart-race.js' | relative_url }}";
        
        // Track loaded state
        let mainScriptLoaded = false;
        let barChartScriptLoaded = false;
        let dataLoaded = false;
        
        function checkInitialization() {
            if (mainScriptLoaded && barChartScriptLoaded && dataLoaded) {
                console.log("All dependencies loaded, initializing visualizations");
                if (window.marchMadness.tournamentBarChartRace && 
                    typeof window.marchMadness.tournamentBarChartRace.init === 'function') {
                    console.log("Initializing bar chart race");
                    window.marchMadness.tournamentBarChartRace.init();
                }
            }
        }
        
        mainScript.onload = function() {
            console.log("Main visualization script loaded");
            mainScriptLoaded = true;
            
            // Set up callback for when data is ready
            if (!window.marchMadness.onDataReady) {
                window.marchMadness.onDataReady = function() {
                    console.log("Data loaded");
                    dataLoaded = true;
                    checkInitialization();
                };
            }
        };
        
        barChartScript.onload = function() {
            console.log("Bar chart race script loaded");
            barChartScriptLoaded = true;
            checkInitialization();
        };
        
        // Only append scripts if they haven't been added yet
        if (!document.querySelector('script[src*="march-madness.js"]')) {
            document.body.appendChild(mainScript);
        }
        if (!document.querySelector('script[src*="d3-tournament-bar-chart-race.js"]')) {
            document.body.appendChild(barChartScript);
        }
    }
};
document.head.appendChild(d3Script);
</script>

## Key Findings

1. **Offensive Efficiency**: 

2. **Defensive Balance**: 

3. **Experience Matters**: 

4. **Tempo Isn't Everything**: 

5. **

6. **

7. **
