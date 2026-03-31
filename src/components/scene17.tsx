/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const AbsoluteRationalGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Mathematically verified scales
    const xScale = d3.scaleLinear().domain([-10, 10]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-6, 6]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1200;
    const DELAY = 1000;

    // --- 2. Axes, Grid & Numbering ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid
    g.selectAll(".v-grid").data(d3.range(-10, 11, 2)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);
    g.selectAll(".h-grid").data(d3.range(-6, 7, 2)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X and Y Axis
    g.append('line').attr('x1', xScale(-10)).attr('y1', yScale(0)).attr('x2', xScale(10)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-6)).attr('x2', xScale(0)).attr('y2', yScale(6)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data(d3.range(-10, 11, 2)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);
    g.selectAll(".y-label").data(d3.range(-6, 7, 2)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    // --- 3. Step 1: Vertical Asymptote (x = -2) ---
    const va = g.append('line')
      .attr('x1', xScale(-2)).attr('y1', yScale(-6)).attr('x2', xScale(-2)).attr('y2', yScale(6))
      .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    va.transition().delay(500).duration(DUR).attr('opacity', 0.7);
    g.append('text').attr('x', xScale(-2) + 10).attr('y', yScale(5)).attr('fill', '#dc2626').attr('font-weight', 'bold').attr('font-size', '12px').attr('opacity', 0)
      .text('VA: x = -2').transition().delay(500).duration(DUR).attr('opacity', 1);

    // --- 4. Step 3: Horizontal Asymptotes (y = 1 and y = -1) ---
    const haRight = g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(1)).attr('x2', xScale(10)).attr('y2', yScale(1))
      .attr('stroke', '#10b981').attr('stroke-width', 2).attr('stroke-dasharray', '8,4').attr('opacity', 0);
    
    const haLeft = g.append('line')
      .attr('x1', xScale(-10)).attr('y1', yScale(-1)).attr('x2', xScale(-2)).attr('y2', yScale(-1))
      .attr('stroke', '#10b981').attr('stroke-width', 2).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    haRight.transition().delay(DELAY).duration(DUR).attr('opacity', 0.7);
    haLeft.transition().delay(DELAY).duration(DUR).attr('opacity', 0.7);

    // --- 5. Critical Points: Corner (1, 0) and Intercept (0, 0.5) ---
    const points = [{x: 1, y: 0, label: "Corner (1, 0)"}, {x: 0, y: 0.5, label: "(0, 0.5)"}];
    g.selectAll(".dot").data(points).enter().append("g").attr("opacity", 0)
      .each(function(d, i) {
        d3.select(this).append("circle").attr("cx", xScale(d.x)).attr("cy", yScale(d.y)).attr("r", 5).attr("fill", "#1e40af");
        d3.select(this).append("text").attr("x", xScale(d.x) + 8).attr("y", yScale(d.y) - 8).attr("font-size", "10px").attr("fill", "#1e40af").attr("font-weight", "bold").text(d.label);
      })
      .transition().delay((d, i) => DELAY * 2 + i * 400).duration(500).attr("opacity", 1);

    // --- 6. Step 4: Graphing the Three Branches ---
    const f = (x: number) => Math.abs(x - 1) / (x + 2);
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    const branch1Data: [number, number][] = d3.range(1, 10.2, 0.2).map(x => [x, f(x)]); // Right: x >= 1
    const branch2Data: [number, number][] = d3.range(-1.8, 1.05, 0.05).map(x => [x, f(x)]); // Mid: -2 < x < 1
    const branch3Data: [number, number][] = d3.range(-10, -2.2, 0.1).map(x => [x, f(x)]); // Left: x < -2

    const drawCurve = (data: [number, number][], delay: number) => {
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 3)
        .attr('d', lineGen);

      const length = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition().delay(delay).duration(DUR).ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    };

    drawCurve(branch1Data, DELAY * 3);
    drawCurve(branch2Data, DELAY * 4);
    drawCurve(branch3Data, DELAY * 5);

    // Highlight Corner
    g.append('circle')
      .attr('cx', xScale(1)).attr('cy', yScale(0)).attr('r', 10)
      .attr('fill', 'none').attr('stroke', '#f59e0b').attr('stroke-width', 2).attr('stroke-dasharray', '2,2').attr('opacity', 0)
      .transition().delay(DELAY * 6).duration(800).attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic">
          Graphing y = |x - 1| / (x + 2)
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono max-w-lg">
          The absolute value creates a sharp corner at x=1 and flips the horizontal asymptote logic for x &lt; 1.
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <div className="overflow-hidden">
          <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600 tracking-widest">V.A. (x = -2)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-500 border-t border-dashed"></span>
          <span className="text-slate-600 tracking-widest">H.A. (y = ±1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500 border-dashed"></span>
          <span className="text-slate-600 tracking-widest">Corner at x=1</span>
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

export default AbsoluteRationalGraph;