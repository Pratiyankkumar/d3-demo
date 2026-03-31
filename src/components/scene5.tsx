import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TangentGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 50, bottom: 50, left: 50 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Mathematically verified scales
    // We show from -4π to 4π to capture multiple periods
    const xScale = d3.scaleLinear()
      .domain([-4 * Math.PI, 4 * Math.PI])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([-4, 4])
      .range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1000;
    const DELAY = 800;

    // --- 2. Draw Coordinate Plane (Scene 1) ---
    const axisColor = "#94a3b8";
    
    // X-Axis
    g.append('line')
      .attr('x1', margin.left).attr('y1', yScale(0))
      .attr('x2', width - margin.right).attr('y2', yScale(0))
      .attr('stroke', axisColor).attr('stroke-width', 1);

    // Y-Axis
    g.append('line')
      .attr('x1', xScale(0)).attr('y1', margin.top)
      .attr('x2', xScale(0)).attr('y2', height - margin.bottom)
      .attr('stroke', axisColor).attr('stroke-width', 1);

    // X-Axis Ticks (Multiples of PI)
    const ticks = [-3 * Math.PI, -2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI, 3 * Math.PI];
    const tickLabels = ["-3π", "-2π", "-π", "0", "π", "2π", "3π"];
    
    g.selectAll(".tick")
      .data(ticks)
      .enter()
      .append("text")
      .attr("x", d => xScale(d))
      .attr("y", yScale(0) + 20)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#64748b")
      .text((d, i) => tickLabels[i]);

    // --- 3. Vertical Asymptotes (Scene 1 & 4) ---
    const asymptoteX = [-3 * Math.PI, -Math.PI, Math.PI, 3 * Math.PI];
    
    asymptoteX.forEach((xPos, i) => {
      const line = g.append('line')
        .attr('x1', xScale(xPos)).attr('y1', yScale(-4))
        .attr('x2', xScale(xPos)).attr('y2', yScale(4))
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4')
        .attr('opacity', 0);

      line.transition()
        .delay(DELAY + (i * 300))
        .duration(DUR)
        .attr('opacity', 0.6);

      g.append('text')
        .attr('x', xScale(xPos)).attr('y', margin.top - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ef4444')
        .attr('font-size', '10px')
        .attr('opacity', 0)
        .text(`x=${tickLabels[ticks.indexOf(xPos)]}`)
        .transition()
        .delay(DELAY + (i * 300))
        .duration(DUR)
        .attr('opacity', 1);
    });

    // --- 4. Draw Tangent Branches (Scene 3 & 4) ---
    const lineGenerator = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Helper to generate branch points without connecting across asymptotes
    const createBranch = (center: number) => {
      return d3.range(center - Math.PI + 0.2, center + Math.PI - 0.2, 0.1)
        .map(x => [x, Math.tan(x / 2)] as [number, number]);
    };

    const branches = [
      { data: createBranch(0), delay: DELAY * 3, label: "(0,0)" },      // Central
      { data: createBranch(2 * Math.PI), delay: DELAY * 4.5, label: "(2π, 0)" }, // Right
      { data: createBranch(-2 * Math.PI), delay: DELAY * 4.5, label: "(-2π, 0)" } // Left
    ];

    branches.forEach((branch) => {
      const path = g.append('path')
        .datum(branch.data)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);

      const length = path.node()?.getTotalLength() || 0;

      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition()
        .delay(branch.delay)
        .duration(DUR * 1.5)
        .attr('stroke-dashoffset', 0);

      // Add intercept dots
      const centerX = branch.data[Math.floor(branch.data.length / 2)][0];
      g.append('circle')
        .attr('cx', xScale(centerX))
        .attr('cy', yScale(0))
        .attr('r', 4)
        .attr('fill', '#1e40af')
        .attr('opacity', 0)
        .transition()
        .delay(branch.delay + DUR)
        .attr('opacity', 1);
    });

  }, [animationKey]);

  return (
    <div className="flex  flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-2 italic">Graphing y = tan(x/2)</h2>
      <p className="text-slate-500 text-sm mb-6">Vertical Asymptotes at x = ±π, ±3π | Period = 2π</p>
      
      <div className="bg-slate-50 overflow-hidden rounded-xl p-4 shadow-inner">
        <svg ref={svgRef} width="600" height="400" className="overflow-visible"></svg>
      </div>

      <button 
        onClick={() => setAnimationKey(prev => prev + 1)}
        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all"
      >
        Replay Animation
      </button>
    </div>
  );
};

export default TangentGraph;