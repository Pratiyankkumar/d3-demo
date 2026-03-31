import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const PiecewiseGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear for replay

    // Mathematically verified scales
    const xScale = d3.scaleLinear().domain([-3, 4]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-1, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1000;
    const DELAY_STEP = 1200;

    // --- 2. Frame 1: Axes & Numbering ---
    const axisColor = "#94a3b8";
    
    // X-Axis
    g.append('line')
      .attr('x1', xScale(-3)).attr('y1', yScale(0))
      .attr('x2', xScale(4)).attr('y2', yScale(0))
      .attr('stroke', axisColor).attr('stroke-width', 2);
    // Y-Axis
    g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-1))
      .attr('x2', xScale(0)).attr('y2', yScale(8))
      .attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    const xTicks = [-2, -1, 1, 2, 3];
    g.selectAll(".x-tick").data(xTicks).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    const yTicks = [2, 4, 6];
    g.selectAll(".y-tick").data(yTicks).enter().append("text")
      .attr("x", xScale(0) - 10).attr("y", d => yScale(d) + 5).attr("text-anchor", "end")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    // --- 3. Part 1: The Parabola (x < 1) ---
    const parabolaData: [number, number][] = d3.range(-2.5, 1.01, 0.1).map(x => [x, x * x]);
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    const parabolaPath = g.append('path')
      .datum(parabolaData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3)
      .attr('d', lineGen);

    const pLength = parabolaPath.node()?.getTotalLength() || 0;
    parabolaPath.attr('stroke-dasharray', `${pLength} ${pLength}`)
      .attr('stroke-dashoffset', pLength)
      .transition().delay(500).duration(DUR * 1.5)
      .attr('stroke-dashoffset', 0);

    // Open Circle at (1, 1)
    const openCircle = g.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(1)).attr('r', 5)
      .attr('fill', 'white').attr('stroke', '#3b82f6').attr('stroke-width', 2).attr('opacity', 0);

    openCircle.transition().delay(DELAY_STEP * 2).duration(500).attr('opacity', 1);

    // --- 4. Part 2: The Linear Rule (x ≥ 1) ---
    const linearData: [number, number][] = d3.range(1, 3.2, 0.1).map(x => [x, 2 * x + 1]);
    
    const linearPath = g.append('path')
      .datum(linearData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3)
      .attr('d', lineGen);

    const lLength = linearPath.node()?.getTotalLength() || 0;
    linearPath.attr('stroke-dasharray', `${lLength} ${lLength}`)
      .attr('stroke-dashoffset', lLength)
      .transition().delay(DELAY_STEP * 3).duration(DUR)
      .attr('stroke-dashoffset', 0);

    // Closed Circle at (1, 3)
    const closedCircle = g.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(3)).attr('r', 6)
      .attr('fill', '#10b981').attr('opacity', 0);

    closedCircle.transition().delay(DELAY_STEP * 3).duration(500).attr('opacity', 1);

    // --- 5. Highlighting the Jump Discontinuity ---
    const jumpLine = g.append('line')
      .attr('x1', xScale(1)).attr('y1', yScale(1.2))
      .attr('x2', xScale(1)).attr('y2', yScale(2.8))
      .attr('stroke', '#f43f5e').attr('stroke-width', 2).attr('stroke-dasharray', '4,2').attr('opacity', 0);

    const jumpText = g.append('text')
      .attr('x', xScale(1.2)).attr('y', yScale(2))
      .attr('fill', '#e11d48').attr('font-weight', 'bold').attr('font-size', '14px').attr('opacity', 0)
      .text('Jump Discontinuity');

    jumpLine.transition().delay(DELAY_STEP * 4.5).duration(500).attr('opacity', 1);
    jumpText.transition().delay(DELAY_STEP * 4.5).duration(500).attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Piecewise Function Visualization</h2>
        <div className="mt-2 font-mono text-sm bg-slate-50 p-2 rounded border border-slate-100">
          f(x) = x² (x &lt; 1) <br />
          f(x) = 2x + 1 (x ≥ 1)
        </div>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="400" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-blue-500"></span>
          <span className="text-slate-600 tracking-tighter">RULE 1 (OPEN)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-600 tracking-tighter">RULE 2 (CLOSED)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-rose-500 border-t border-dashed"></span>
          <span className="text-slate-600 tracking-tighter">JUMP GAP</span>
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

export default PiecewiseGraph;