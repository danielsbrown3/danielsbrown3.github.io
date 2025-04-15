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
  let successLabels;
  let bars;
  let barLabels;
  let yearDisplay;
  let yearSlider;
  let metricSelector;
  let playButton;
  
  // Colors for tournament success levels
  const successColors = {
    'Champion': '#FFD700', // Gold for champion
    'Final Four': '#C0C0C0', // Silver for final four
    'Elite Eight': '#CD7F32', // Bronze for elite eight
    'Sweet Sixteen': '#4CAF50', // Green for sweet sixteen
    'Round of 32': '#2196F3', // Blue for round of 32
    'First Round': '#9E9E9E'  // Gray for first round
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
      .text('NCAA Basketball Tournament Performance by Success Level');
    
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
    console.log("Processing data for visualization");
    
    // Group data by year and tournament success level
    const groupedData = d3.group(rawData, d => d.Year, d => {
      if (d.TournamentResult === 'Champion') return 'Champion';
      if (d.TournamentResult === 'Final Four') return 'Final Four';
      if (d.TournamentResult === 'Elite Eight') return 'Elite Eight';
      if (d.TournamentResult === 'Sweet Sixteen') return 'Sweet Sixteen';
      if (d.TournamentResult === 'Round of 32') return 'Round of 32';
      return 'First Round';
    });
    
    // Calculate average metrics for each success level per year
    const processedData = Array.from(groupedData, ([year, successGroups]) => {
      return Array.from(successGroups, ([success, teams]) => {
        const avgMetrics = {
          'Net Rating': d3.mean(teams, d => d.NetRating),
          'Offensive Rating': d3.mean(teams, d => d.OffensiveRating),
          'Defensive Rating': d3.mean(teams, d => d.DefensiveRating),
          'Tempo': d3.mean(teams, d => d.Tempo),
          'Experience': d3.mean(teams, d => d.Experience)
        };
        
        return {
          year: +year,
          success: success,
          count: teams.length,
          ...avgMetrics
        };
      });
    }).flat();
    
    // Sort data by year and success level
    processedData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const successOrder = ['Champion', 'Final Four', 'Elite Eight', 'Sweet Sixteen', 'Round of 32', 'First Round'];
      return successOrder.indexOf(a.success) - successOrder.indexOf(b.success);
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
    
    // Sort data based on success level
    currentData.sort((a, b) => a.success.localeCompare(b.success));
    
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
      if (d[selectedMetric] && !isNaN(d[selectedMetric])) {
        maxValue = Math.max(maxValue, d[selectedMetric]);
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
      .text(`NCAA Tournament Teams by Success Level (${years[currentYearIndex]})`);
    
    // Add subtitle with selected metric
    svg.append('text')
      .attr('class', 'chart-subtitle')
      .attr('x', config.width / 2)
      .attr('y', 50)
      .attr('text-anchor', 'middle')
      .text(`Showing ${getMetricLabel(selectedMetric)} by Success Level`);
    
    // Create group for bars and labels
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`);
    
    // Add success level labels
    successLabels = chartGroup.selectAll('.success-label')
      .data(currentData)
      .enter()
      .append('text')
      .attr('class', 'success-label')
      .attr('x', 0)
      .attr('y', (d, i) => i * (config.barHeight + config.barPadding) + config.barHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(d => d.success);
    
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
        return xScale(d[selectedMetric]);
      })
      .attr('height', config.barHeight)
      .attr('fill', d => successColors[d.success] || '#ccc')
      .attr('opacity', 0.8)
      .transition()
      .duration(config.transitionDuration)
      .attr('width', d => {
        if (!d[selectedMetric]) return 0;
        return xScale(d[selectedMetric]);
      });
    
    // Add bar labels (metric values)
    barLabels = chartGroup.selectAll('.bar-label')
      .data(currentData)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => {
        if (!d[selectedMetric]) return 15;
        return xScale(d[selectedMetric]) + 15;
      })
      .attr('y', (d, i) => i * (config.barHeight + config.barPadding) + config.barHeight / 2)
      .attr('dy', '0.35em')
      .text(d => {
        if (!d[selectedMetric]) return 'No data';
        return `${d[selectedMetric].toFixed(1)}`;
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
  
  // Return public API
  return {
    init: init,
    updateVisualization: updateVisualization,
    processData: processData
  };
})();

// Initialize when the module loads if data is ready
if (window.marchMadness && window.marchMadness.state && window.marchMadness.state.data) {
    console.log("Data already available, initializing bar chart race");
    window.marchMadness.tournamentBarChartRace.init();
}
