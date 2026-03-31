import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const FloorFunctionGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Mathematically verified scales: -4 to 4 range
    const xScale = d3.scaleLinear().domain([-4, 4]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-4, 4]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const STEP_DURATION = 600;
    const START_DELAY = 500;

    // --- 2. Grid & Axes ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid
    g.selectAll(".v-grid").data(d3.range(-4, 5)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);

    g.selectAll(".h-grid").data(d3.range(-4, 5)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X-Axis
    g.append('line')
      .attr('x1', xScale(-4)).attr('y1', yScale(0))
      .attr('x2', xScale(4)).attr('y2', yScale(0))
      .attr('stroke', axisColor).attr('stroke-width', 2);
    // Y-Axis
    g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-4))
      .attr('x2', xScale(0)).attr('y2', yScale(4))
      .attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data(d3.range(-4, 5)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    g.selectAll(".y-label").data(d3.range(-4, 5)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 5).attr("text-anchor", "end")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    // --- 3. Animation Logic: Drawing the Staircase Steps ---
    // Steps from x = -3 to x = 3
    const steps = d3.range(-3, 4);

    steps.forEach((i, index) => {
      const stepGroup = g.append('g').attr('opacity', 0);
      const delay = START_DELAY + (index * STEP_DURATION);

      // Horizontal Segment (y = i)
      stepGroup.append('line')
        .attr('x1', xScale(i))
        .attr('y1', yScale(i))
        .attr('x2', xScale(i + 1))
        .attr('y2', yScale(i))
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 4);

      // Solid Dot (Left Side) - Inclusive
      stepGroup.append('circle')
        .attr('cx', xScale(i))
        .attr('cy', yScale(i))
        .attr('r', 5)
        .attr('fill', '#1d4ed8');

      // Open Circle (Right Side) - Exclusive
      stepGroup.append('circle')
        .attr('cx', xScale(i + 1))
        .attr('cy', yScale(i))
        .attr('r', 5)
        .attr('fill', 'white')
        .attr('stroke', '#1d4ed8')
        .attr('stroke-width', 2);

      // Animate Step Appearance
      stepGroup.transition()
        .delay(delay)
        .duration(STEP_DURATION)
        .attr('opacity', 1);
      
      // Highlight Label for central steps
      if (i === 0) {
        stepGroup.append('text')
          .attr('x', xScale(0.5))
          .attr('y', yScale(0) - 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1d4ed8')
          .text("y = 0");
      }
    });

    // --- 4. Highlighting Jump Discontinuity at an Integer ---
    const highlightX = 1;
    const highlightG = g.append('g').attr('opacity', 0);

    highlightG.append('line')
      .attr('x1', xScale(highlightX)).attr('y1', yScale(0.1))
      .attr('x2', xScale(highlightX)).attr('y2', yScale(0.9))
      .attr('stroke', '#f43f5e').attr('stroke-width', 2).attr('stroke-dasharray', '4,2');

    highlightG.append('text')
      .attr('x', xScale(highlightX) + 10).attr('y', yScale(0.5))
      .attr('fill', '#e11d48').attr('font-size', '12px').attr('font-weight', 'bold')
      .text('Jump Discontinuity');

    highlightG.transition()
      .delay(START_DELAY + (steps.length * STEP_DURATION) + 500)
      .duration(1000)
      .attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">
          The Floor Function: y = ⌊x⌋
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono">
          f(x) = max {"{ n ∈ ℤ | n ≤ x }"}
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-8 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-700"></span>
          <span className="text-slate-600 uppercase tracking-widest">Inclusive (Solid)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-blue-700 bg-white"></span>
          <span className="text-slate-600 uppercase tracking-widest">Exclusive (Open)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-rose-500 border-t border-dashed"></span>
          <span className="text-slate-600 uppercase tracking-widest">Jump Discontinuity</span>
        </div>
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

export default FloorFunctionGraph;