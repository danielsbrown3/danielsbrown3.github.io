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
    // Load D3.js first
    var d3Script = document.createElement('script');
    d3Script.src = "https://d3js.org/d3.v7.min.js";
    
    d3Script.onload = function() {
        // After D3 loads, load the main visualization script
        var mainScript = document.createElement('script');
        mainScript.src = "{{ '/assets/js/visualizations/march-madness.js' | relative_url }}";
        mainScript.onload = function() {
            // Initialize the main visualization
            if (typeof initVisualization === 'function') {
                initVisualization();
            }
        };
        document.body.appendChild(mainScript);
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
