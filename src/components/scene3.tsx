import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphWithHole: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [key, setKey] = useState(0); // For the replay functionality

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear for replay

    // Scales: Centering the view around the hole (1, 2)
    const xScale = d3.scaleLinear().domain([-3, 4]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-1, 5]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Timing Constants
    const DURATION = 800;
    const DELAY_STEP = 1000;

    // --- Frame 1: Coordinate Plane ---
    const axisColor = "#94a3b8";
    // X-Axis
    g.append('line')
      .attr('x1', xScale(-3)).attr('y1', yScale(0))
      .attr('x2', xScale(4)).attr('y2', yScale(0))
      .attr('stroke', axisColor).attr('stroke-width', 1);
    // Y-Axis
    g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-1))
      .attr('x2', xScale(0)).attr('y2', yScale(5))
      .attr('stroke', axisColor).attr('stroke-width', 1);

    // --- Frame 2: Plot Points P(0,1) and Q(-1,0) ---
    const points = [
      { x: 0, y: 1, label: 'P(0, 1)' },
      { x: -1, y: 0, label: 'Q(-1, 0)' }
    ];

    const dots = g.selectAll('.key-point')
      .data(points)
      .enter()
      .append('g')
      .attr('opacity', 0);

    dots.append('circle')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', '#6366f1');

    dots.append('text')
      .attr('x', d => xScale(d.x) + 8)
      .attr('y', d => yScale(d.y) - 8)
      .attr('font-size', '12px')
      .attr('fill', '#475569')
      .text(d => d.label);

    dots.transition()
      .delay((d, i) => DELAY_STEP + i * 500)
      .duration(DURATION)
      .attr('opacity', 1);

    // --- Frame 3: Draw Line y = x + 1 ---
    const line = g.append('line')
      .attr('x1', xScale(-2)).attr('y1', yScale(-1))
      .attr('x2', xScale(-2)).attr('y2', yScale(-1)) // Start point for animation
      .attr('stroke', '#475569')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round');

    line.transition()
      .delay(DELAY_STEP * 2.5)
      .duration(DURATION * 1.5)
      .attr('x2', xScale(3.5))
      .attr('y2', yScale(4.5));

    // --- Frame 4: Draw Open Circle (The Hole) at (1, 2) ---
    const holeGroup = g.append('g').attr('opacity', 0);

    // White background to "erase" the line segment behind the hole
    holeGroup.append('circle')
      .attr('cx', xScale(1))
      .attr('cy', yScale(2))
      .attr('r', 6)
      .attr('fill', 'white');

    // The actual open circle

    holeGroup.transition()
      .delay(DELAY_STEP * 4.5)
      .duration(DURATION)
      .attr('opacity', 1);

    // --- Frame 5: Highlight/Label the Hole ---
    const highlight = g.append('g').attr('opacity', 0);

    highlight.append('text')
      .attr('x', xScale(1) + 15)
      .attr('y', yScale(2) - 15)
      .attr('fill', '#e11d48')
      .attr('font-weight', 'bold')
      .text('Hole at (1, 2)');

    // Pulsing effect for the highlight
    highlight.transition()
      .delay(DELAY_STEP * 5.5)
      .duration(DURATION)
      .attr('opacity', 1)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(1000)
          .attr('transform', 'scale(1.05)')
          .attr('transform-origin', `${xScale(1)}px ${yScale(2)}px`)
          .transition()
          .duration(1000)
          .attr('transform', 'scale(1)')
          .on('end', repeat);
      });

  }, [key]);

  return (
    <div className="w-full flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="max-w-xl text-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
          Graphing the Line with a Hole
        </h2>
        <p className="text-slate-600 leading-relaxed">
          We graph the simplified function <code className="bg-slate-100 px-1 rounded text-indigo-600 font-bold">y = x + 1</code>. 
          The original constraint <code className="bg-slate-100 px-1 rounded text-red-600 font-bold">x ≠ 1</code> creates a removable discontinuity.
        </p>
      </div>

      {/* Drawing Canvas */}
      <div className="relative bg-slate-50 rounded-xl p-4 shadow-inner border border-slate-100">
        <svg ref={svgRef} width="600" height="400" className="overflow-visible"></svg>
      </div>

      {/* Logic Summary */}
      <div className="mt-8 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-slate-700">Intercepts: (0,1) & (-1,0)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-rose-500"></div>
          <span className="text-slate-700 font-bold">Hole: x = 1</span>
        </div>
      </div>

      {/* Replay Button */}
      <button 
        onClick={() => setKey(prev => prev + 1)} 
        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all"
      >
        Replay Animation
      </button>
    </div>
  );
};

export default GraphWithHole;