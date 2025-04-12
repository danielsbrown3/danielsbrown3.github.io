// NCAA Tournament Performance Bar Chart Race
// Uses D3.js v7

// Initialize the visualization namespace if it doesn't exist
window.marchMadness = window.marchMadness || {};

// Main visualization function
window.marchMadness.tournamentBarChartRace = (function() {
  // Configuration variables
  const config = {
    container: '#bar-chart-race-viz',
    dataFile: 'march_madness.csv',
    width: 900,
    height: 600,
    margin: { top: 50, right: 200, bottom: 80, left: 80 },
    barHeight: 25,
    barPadding: 10,
    transitionDuration: 1000,
    skipYears: [2020, 2025], // Skip 2020 (COVID) and 2025
    defaultMetric: 'Net Rating'
  };

  // State variables
  let data = null;
  let years = [];
  let currentYearIndex = 0;
  let selectedMetric = config.defaultMetric;
  let isPlaying = false;
  let playInterval = null;
  
  // DOM elements
  let svg;
  let xScale;
  let seedLabels;
  let bars;
  let barLabels;
  let yearDisplay;
  let yearSlider;
  let metricSelector;
  let playButton;
  
  // Colors for seeds
  const seedColors = {
    1: '#1e40af', // dark blue
    2: '#3b82f6', // blue
    3: '#60a5fa', // light blue
    4: '#93c5fd', // lighter blue
    5: '#15803d', // dark green
    6: '#22c55e', // green
    7: '#4ade80', // light green
    8: '#86efac', // lighter green
    9: '#a16207', // dark yellow
    10: '#ca8a04', // yellow
    11: '#eab308', // light yellow
    12: '#fde047', // lighter yellow
    13: '#9f1239', // dark red
    14: '#dc2626', // red
    15: '#ef4444', // light red
    16: '#fca5a5'  // lighter red
  };
  
  // Initialize the visualization
  function init() {
    console.log("Initializing bar chart race visualization");
    
    // Wait for container to be available
    const container = document.querySelector(config.container);
    if (!container) {
        console.error(`Container ${config.container} not found`);
        return;
    }
    
    // Create DOM elements
    createControlElements();
    
    // Set up SVG
    svg = d3.select(config.container)
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('class', 'tournament-chart');
    
    console.log("Created SVG container");
    
    // Load data
    loadData();
    
    // Add event listeners
    setupEventListeners();
    console.log("Bar chart race initialization complete");
  }
  
  // Create control elements for the visualization
  function createControlElements() {
    const container = d3.select(config.container);
    
    // Add title
    container.append('h2')
      .attr('class', 'visualization-title')
      .text('NCAA Basketball Tournament Performance by Seed');
    
    // Controls container
    const controls = container.append('div')
      .attr('class', 'visualization-controls');
    
    // Metric selector
    const metricControl = controls.append('div')
      .attr('class', 'control-group');
    
    metricControl.append('label')
      .attr('for', 'metric-selector')
      .text('Metric: ');
    
    metricSelector = metricControl.append('select')
      .attr('id', 'metric-selector')
      .attr('class', 'viz-select');
    
    metricSelector.selectAll('option')
      .data([
        { value: 'Net Rating', label: 'Net Rating' },
        { value: 'AdjOE', label: 'Adjusted Offensive Efficiency' },
        { value: 'AdjDE', label: 'Adjusted Defensive Efficiency' },
        { value: 'AdjTempo', label: 'Adjusted Tempo' }
      ])
      .enter()
      .append('option')
      .attr('value', d => d.value)
      .text(d => d.label)
      .property('selected', d => d.value === selectedMetric);
    
    // Play/pause button
    const buttonGroup = controls.append('div')
      .attr('class', 'control-group');
    
    playButton = buttonGroup.append('button')
      .attr('id', 'play-button')
      .attr('class', 'viz-button')
      .text('Play');
    
    buttonGroup.append('button')
      .attr('id', 'reset-button')
      .attr('class', 'viz-button')
      .text('Reset');
    
    // Year slider and label
    const sliderGroup = controls.append('div')
      .attr('class', 'control-group slider-group');
    
    yearDisplay = sliderGroup.append('div')
      .attr('id', 'year-display')
      .attr('class', 'year-display');
    
    yearSlider = sliderGroup.append('input')
      .attr('id', 'year-slider')
      .attr('class', 'viz-slider')
      .attr('type', 'range')
      .attr('min', 0)
      .attr('max', 0) // Will be updated when data is loaded
      .attr('value', 0);
    
    // Add footnote
    container.append('div')
      .attr('class', 'visualization-footnote')
      .html('Note: Shows the team with the highest metric value for each tournament seed. ' +
            'The 2020 season is excluded since the NCAA tournament was cancelled due to COVID-19. ' +
            'The 2025 season is also excluded from this visualization.');
  }
  
  // Load data from CSV file
  function loadData() {
    console.log("Loading data for bar chart race");
    // Use the data already loaded in window.marchMadness.state
    if (window.marchMadness && window.marchMadness.state && window.marchMadness.state.data) {
      console.log("Found data in window.marchMadness.state");
      // Process data
      data = processData(window.marchMadness.state.data);
      console.log("Processed data:", data);
      
      // Update years available in slider
      yearSlider.attr('max', years.length - 1);
      
      // Initial render
      updateVisualization();
    } else {
      console.error('No data available in window.marchMadness.state');
      d3.select(config.container)
        .append('div')
        .attr('class', 'error-message')
        .text('Error loading data. Please try again later.');
    }
  }
  
  // Process raw CSV data
  function processData(rawData) {
    // Extract all unique years and filter out skipped years
    years = [...new Set(rawData.map(d => +d.Season))]
      .filter(year => !config.skipYears.includes(year))
      .sort((a, b) => a - b);
    
    // Process data for tournament teams by seed
    const processedData = {};
    
    years.forEach(year => {
      // Get teams that were in the tournament this year
      const tournamentTeams = rawData.filter(d => 
        +d.Season === year && 
        (d['Post-Season Tournament'] === 'March Madness' || 
         d['Post-Season Tournament'] === 'NCAA Tournament') &&
        d.Seed !== null && 
        d.Seed !== "Not In a Post-Season Tournament"
      );
      
      // Process each seed (1-16)
      const teamsBySeed = {};
      
      for (let seed = 1; seed <= 16; seed++) {
        const teamsWithThisSeed = tournamentTeams.filter(d => {
          const teamSeed = parseInt(d.Seed, 10);
          return teamSeed === seed;
        });
        
        if (teamsWithThisSeed.length > 0) {
          // For each metric, find the best team
          const metrics = ['Net Rating', 'AdjOE', 'AdjDE', 'AdjTempo'];
          
          metrics.forEach(metric => {
            // Find best team for this metric
            let bestTeam = null;
            
            if (metric === 'AdjDE') {
              // For defensive efficiency, lower is better
              bestTeam = teamsWithThisSeed.reduce((best, current) => {
                const currentValue = parseFloat(current[metric]);
                if (isNaN(currentValue)) return best;
                
                if (!best || currentValue < parseFloat(best[metric])) {
                  return current;
                }
                return best;
              }, null);
            } else {
              // For other metrics, higher is better
              bestTeam = teamsWithThisSeed.reduce((best, current) => {
                const currentValue = parseFloat(current[metric]);
                if (isNaN(currentValue)) return best;
                
                if (!best || currentValue > parseFloat(best[metric])) {
                  return current;
                }
                return best;
              }, null);
            }
            
            if (bestTeam) {
              if (!teamsBySeed[seed]) {
                teamsBySeed[seed] = { seed };
              }
              
              teamsBySeed[seed][metric] = {
                value: parseFloat(bestTeam[metric]),
                team: bestTeam['Full Team Name'],
                conference: bestTeam['Short Conference Name']
              };
            }
          });
        }
      }
      
      processedData[year] = Object.values(teamsBySeed);
    });
    
    return processedData;
  }
  
  // Set up event listeners for interactive controls
  function setupEventListeners() {
    // Metric selector
    metricSelector.on('change', function() {
      selectedMetric = this.value;
      updateVisualization();
    });
    
    // Play/pause button
    playButton.on('click', togglePlay);
    
    // Reset button
    d3.select('#reset-button').on('click', resetVisualization);
    
    // Year slider
    yearSlider.on('input', function() {
      stopPlayback();
      currentYearIndex = +this.value;
      updateVisualization();
    });
    
    // Window resize
    window.addEventListener('resize', debounce(resize, 250));
  }
  
  // Toggle play/pause state
  function togglePlay() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }
  
  // Start playback animation
  function startPlayback() {
    if (isPlaying) return;
    
    isPlaying = true;
    playButton.text('Pause');
    
    // Advance to next year every 1.5 seconds
    playInterval = setInterval(() => {
      currentYearIndex++;
      
      if (currentYearIndex >= years.length) {
        stopPlayback();
        currentYearIndex = years.length - 1;
      }
      
      yearSlider.property('value', currentYearIndex);
      updateVisualization();
    }, 1500);
  }
  
  // Stop playback animation
  function stopPlayback() {
    if (!isPlaying) return;
    
    isPlaying = false;
    playButton.text('Play');
    
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
  }
  
  // Reset visualization to initial state
  function resetVisualization() {
    stopPlayback();
    currentYearIndex = 0;
    yearSlider.property('value', currentYearIndex);
    updateVisualization();
  }
  
  // Update visualization based on current state
  function updateVisualization() {
    if (!data || years.length === 0) return;
    
    const currentYear = years[currentYearIndex];
    const currentData = data[currentYear] || [];
    
    // Sort data based on seed value
    currentData.sort((a, b) => a.seed - b.seed);
    
    // Update year display
    yearDisplay.text(`Season: ${currentYear - 1}-${currentYear}`);
    
    // Set up scales for the visualization
    setupScales(currentData);
    
    // Update SVG elements
    updateSvgElements(currentData);
  }
  
  // Set up scales based on current data
  function setupScales(currentData) {
    // Calculate max value for scaling
    let maxValue = 0;
    
    currentData.forEach(d => {
      if (d[selectedMetric] && !isNaN(d[selectedMetric].value)) {
        maxValue = Math.max(maxValue, d[selectedMetric].value);
      }
    });
    
    // Add 10% buffer to max value
    maxValue *= 1.1;
    
    // Create x-scale for bars
    xScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, config.width - config.margin.left - config.margin.right]);
  }
  
  // Update SVG elements with new data
  function updateSvgElements(currentData) {
    // Clear existing elements
    svg.selectAll('*').remove();
    
    // Create title
    svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', config.width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text(`NCAA Tournament Teams by Seed (${years[currentYearIndex]})`);
    
    // Add subtitle with selected metric
    svg.append('text')
      .attr('class', 'chart-subtitle')
      .attr('x', config.width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .text(`Showing ${getMetricLabel(selectedMetric)} by Seed`);
    
    // Create group for bars and labels
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
    
    // Add seed labels
    seedLabels = chartGroup.selectAll('.seed-label')
      .data(currentData)
      .enter()
      .append('text')
      .attr('class', 'seed-label')
      .attr('x', 0)
      .attr('y', (d, i) => i * (config.barHeight + config.barPadding) + config.barHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(d => `Seed ${d.seed}`);
    
    // Add bars
    bars = chartGroup.selectAll('.bar')
      .data(currentData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 10)
      .attr('y', (d, i) => i * (config.barHeight + config.barPadding))
      .attr('width', d => {
        if (!d[selectedMetric]) return 0;
        return xScale(d[selectedMetric].value);
      })
      .attr('height', config.barHeight)
      .attr('fill', d => seedColors[d.seed] || '#ccc')
      .attr('opacity', 0.8)
      .transition()
      .duration(config.transitionDuration)
      .attr('width', d => {
        if (!d[selectedMetric]) return 0;
        return xScale(d[selectedMetric].value);
      });
    
    // Add bar labels (team names and values)
    barLabels = chartGroup.selectAll('.bar-label')
      .data(currentData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => {
        if (!d[selectedMetric]) return 15;
        return xScale(d[selectedMetric].value) + 15;
      })
      .attr('y', (d, i) => i * (config.barHeight + config.barPadding) + config.barHeight / 2)
      .attr('dy', '0.35em')
      .text(d => {
        if (!d[selectedMetric]) return 'No data';
        return `${d[selectedMetric].value.toFixed(1)} - ${d[selectedMetric].team}`;
      });
    
    // Add x-axis (optional)
    const xAxis = d3.axisBottom(xScale);
    chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(10, ${currentData.length * (config.barHeight + config.barPadding) + 10})`)
      .call(xAxis);
    
    // Add x-axis label
    chartGroup.append('text')
      .attr('class', 'axis-label')
      .attr('x', (config.width - config.margin.left - config.margin.right) / 2)
      .attr('y', currentData.length * (config.barHeight + config.barPadding) + 50)
      .attr('text-anchor', 'middle')
      .text(getMetricLabel(selectedMetric));
  }
  
  // Helper function to get formatted metric label
  function getMetricLabel(metric) {
    switch (metric) {
      case 'Net Rating': return 'Net Rating';
      case 'AdjOE': return 'Adjusted Offensive Efficiency';
      case 'AdjDE': return 'Adjusted Defensive Efficiency';
      case 'AdjTempo': return 'Adjusted Tempo (possessions per 40 minutes)';
      default: return metric;
    }
  }
  
  // Resize visualization on window resize
  function resize() {
    // Get container width
    const containerWidth = d3.select(config.container).node().getBoundingClientRect().width;
    
    // Update config dimensions
    config.width = containerWidth;
    
    // Update SVG dimensions
    svg.attr('width', config.width);
    
    // Re-render visualization
    updateVisualization();
  }
  
  // Debounce function for handling resize events
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Public API
  return {
    init: init
  };
})();

// Remove the automatic initialization
// The visualization will be initialized through window.marchMadness.onDataReady callback
