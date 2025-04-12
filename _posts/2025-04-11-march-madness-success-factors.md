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

Below is an interactive visualization that allows you to explore relationships between these factors and tournament success. The bar chart race shows how different teams performed across various metrics throughout the years. Use the controls to select different metrics and watch how team performances changed over time.

<style>
/* Essential styles for the bar chart race */
.tournament-chart {
    background: var(--background-color, white);
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

<div class="visualization-container">
    <div class="visualization-controls">
        <div class="metric-selector">
            <label for="metric-select">Metric:</label>
            <select id="metric-select" class="viz-select">
                <option value="Net Rating">Net Rating</option>
                <option value="Adjusted Offensive Efficiency">Adjusted Offensive Efficiency</option>
                <option value="Adjusted Defensive Efficiency">Adjusted Defensive Efficiency</option>
                <option value="Adjusted Tempo">Adjusted Tempo</option>
            </select>
        </div>
        <div class="playback-controls">
            <button id="play-button" class="viz-button">Play</button>
            <button id="reset-button" class="viz-button">Reset</button>
        </div>
        <div class="year-display">Season: <span id="current-year">2001-2002</span></div>
    </div>
    <div id="bar-chart-race-viz"></div>
</div>

<script>
// Create a global namespace for shared data and functions
window.marchMadness = {
    state: {
        data: null,
        classificationData: null,
        selectedYear: 2024,
        initialized: false
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    
    // Load D3.js first
    var d3Script = document.createElement('script');
    d3Script.src = "https://d3js.org/d3.v7.min.js";
    d3Script.crossOrigin = "anonymous";
    
    d3Script.onload = function() {
        console.log("D3.js loaded successfully");
        
        // Load bar chart race script
        var barChartScript = document.createElement('script');
        barChartScript.src = "{{ '/assets/js/visualizations/d3-tournament-bar-chart-race.js' | relative_url }}";
        
        barChartScript.onload = function() {
            console.log("Bar chart race script loaded");
            
            // Load data script
            var dataScript = document.createElement('script');
            dataScript.src = "{{ '/assets/js/visualizations/march-madness.js' | relative_url }}";
            
            dataScript.onload = function() {
                console.log("Data script loaded");
                if (typeof initVisualization === 'function') {
                    initVisualization();
                }
            };
            
            document.body.appendChild(dataScript);
        };
        
        document.body.appendChild(barChartScript);
    };
    
    document.body.appendChild(d3Script);
});
</script>

## Key Findings

1. **Offensive Efficiency**: 

2. **Defensive Balance**: 

3. **Experience Matters**: 

4. **Tempo Isn't Everything**: 

5. **

6. **

7. **
