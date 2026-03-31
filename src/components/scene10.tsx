import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const EssentialDiscontinuityGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear for replay

    // Mathematically verified scales
    const xScale = d3.scaleLinear().domain([-1, 1]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-1.5, 1.5]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 2000;
    const DELAY = 1000;

    // --- 2. Frame 1 & Axes Numbering ---
    const axisColor = "#94a3b8";
    
    // X and Y Axis
    g.append('line').attr('x1', xScale(-1)).attr('y1', yScale(0)).attr('x2', xScale(1)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-1.5)).attr('x2', xScale(0)).attr('y2', yScale(1.5)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    const xTicks = [-1, -0.5, 0.5, 1];
    g.selectAll(".x-tick").data(xTicks).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    const yTicks = [-1, 1];
    g.selectAll(".y-tick").data(yTicks).enter().append("text")
      .attr("x", xScale(0) - 10).attr("y", d => yScale(d) + 5).attr("text-anchor", "end")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    // --- 3. Frame 2: Boundaries (y = 1, y = -1) ---
    const drawBoundary = (val: number) => {
      g.append('line')
        .attr('x1', xScale(-1)).attr('y1', yScale(val))
        .attr('x2', xScale(1)).attr('y2', yScale(val))
        .attr('stroke', '#cbd5e1').attr('stroke-width', 1).attr('stroke-dasharray', '4,4')
        .attr('opacity', 0)
        .transition().duration(800).attr('opacity', 1);
    };
    drawBoundary(1);
    drawBoundary(-1);

    // --- 4. Frame 3 & 4: Drawing Sine Waves (x approaching 0) ---
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    // Generate points for y = sin(1/x)
    // We stop at 0.02 to prevent infinite calculation, 
    // Frame 5 will handle the "dense block" visual.
    const generatePoints = (start: number, end: number, steps: number) => {
      const data: [number, number][] = [];
      const stepSize = (end - start) / steps;
      for (let i = 0; i <= steps; i++) {
        const x = start + i * stepSize;
        if (x === 0) continue;
        data.push([x, Math.sin(1 / x)]);
      }
      return data;
    };

    const rightBranch = generatePoints(1, 0.02, 1000);
    const leftBranch = generatePoints(-1, -0.02, 1000);

    const drawCurve = (data: [number, number][], delay: number) => {
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 1.5)
        .attr('d', lineGen);

      const length = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition().delay(delay).duration(DUR).ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    };

    drawCurve(rightBranch, DELAY);
    drawCurve(leftBranch, DELAY);

    // --- 5. Frame 4: The "Infinite" Oscillation Block ---
    // Visual trick: A dense set of vertical lines between -0.02 and 0.02
    const blockG = g.append('g').attr('opacity', 0);
    const blockDensity = 40;
    const blockWidth = xScale(0.02) - xScale(-0.02);
    
    for (let i = 0; i < blockDensity; i++) {
      const xPos = xScale(-0.02) + (Math.random() * blockWidth);
      blockG.append('line')
        .attr('x1', xPos).attr('y1', yScale(-1))
        .attr('x2', xPos).attr('y2', yScale(1))
        .attr('stroke', '#3b82f6').attr('stroke-width', 0.5);
    }

    blockG.transition().delay(DELAY + DUR).duration(1000).attr('opacity', 1);

    // --- 6. Frame 5: Undefined at origin (Open Circle) ---
    const hole = g.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(0)).attr('r', 6)
      .attr('fill', 'white').attr('stroke', '#f43f5e').attr('stroke-width', 2).attr('opacity', 0);

    hole.transition().delay(DELAY + DUR + 1000).duration(500).attr('opacity', 1);

    const labelText = g.append('text')
      .attr('x', xScale(0) + 15).attr('y', yScale(1.2))
      .attr('fill', '#e11d48').attr('font-weight', 'bold').attr('font-size', '14px').attr('opacity', 0)
      .text('Essential Discontinuity (x=0)');

    labelText.transition().delay(DELAY + DUR + 1200).duration(800).attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic tracking-tight">
          Visualizing Oscillatory Discontinuity: y = sin(1/x)
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono max-w-lg">
          As x → 0, the frequency 1/x → ∞. The function oscillates between -1 and 1 infinitely often, so no limit exists.
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-500 rounded"></span>
          <span className="text-slate-600">Increasing Frequency</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-100 border border-blue-400 opacity-60"></span>
          <span className="text-slate-600">Infinite Oscillation Block</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-rose-500 bg-white"></span>
          <span className="text-slate-600">Undefined at x=0</span>
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

export default EssentialDiscontinuityGraph;