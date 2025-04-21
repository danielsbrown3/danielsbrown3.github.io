document.addEventListener('DOMContentLoaded', function() {
    const width = 800;
    const height = 400;
    const container = d3.select('#collision-container');
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', '#f8f9fa');

    // Create simulation
    const simulation = d3.forceSimulation()
        .alphaTarget(0.3)
        .velocityDecay(0.1)
        .force('x', d3.forceX(width / 2).strength(0.01))
        .force('y', d3.forceY(height / 2).strength(0.01))
        .force('collide', d3.forceCollide().radius(d => d.r + 1).iterations(3))
        .force('charge', d3.forceManyBody().strength(-1));  // Equal repulsion for all circles

    // Generate random circles
    const k = width / 200;
    const r = d3.randomUniform(k, k * 4);
    const n = 4;
    const nodes = Array.from({length: 100}, (_, i) => ({
        r: r(),
        group: i && (i % n + 1)
    }));

    // Add circles to SVG
    const circles = svg.selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('r', d => d.r)
        .style('fill', '#000000')
        .style('stroke', '#ffffff')
        .style('stroke-width', 1);

    // Update simulation
    simulation.nodes(nodes)
        .on('tick', () => {
            circles
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

    // Add mouse interaction
    svg.on('mousemove', function(event) {
        const [x, y] = d3.pointer(event);
        nodes.forEach(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const force = -1000 / (distance * distance);
            node.vx += force * dx / distance;
            node.vy += force * dy / distance;
        });
        simulation.alpha(0.3).restart();
    });

    // Reset on mouse leave
    svg.on('mouseleave', function() {
        simulation.alpha(0.3).restart();
    });
}); 