import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SlantAsymptoteGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 500;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Mathematically verified scales to show the intersection of asymptotes (1, 2)
    const xScale = d3.scaleLinear().domain([-6, 8]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-6, 10]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1200;
    const DELAY = 1000;

    // --- 2. Axes & Grid ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid Lines
    g.selectAll(".v-grid").data(d3.range(-6, 9)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);
    g.selectAll(".h-grid").data(d3.range(-6, 11)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X and Y Axis
    g.append('line').attr('x1', xScale(-6)).attr('y1', yScale(0)).attr('x2', xScale(8)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-6)).attr('x2', xScale(0)).attr('y2', yScale(10)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data(d3.range(-6, 9, 2)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);
    g.selectAll(".y-label").data(d3.range(-6, 11, 2)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    // --- 3. Vertical Asymptote (x = 1) ---
    const va = g.append('line')
      .attr('x1', xScale(1)).attr('y1', yScale(-6)).attr('x2', xScale(1)).attr('y2', yScale(10))
      .attr('stroke', '#ef4444').attr('stroke-width', 2.5).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    va.transition().delay(DELAY).duration(DUR).attr('opacity', 0.7);
    g.append('text').attr('x', xScale(1) + 8).attr('y', yScale(9)).attr('fill', '#dc2626').attr('font-weight', 'bold').attr('font-size', '12px').attr('opacity', 0)
      .text('x = 1').transition().delay(DELAY).duration(DUR).attr('opacity', 1);

    // --- 4. Slant Asymptote (y = x + 1) ---
    const sa = g.append('line')
      .attr('x1', xScale(-6)).attr('y1', yScale(-5))
      .attr('x2', xScale(8)).attr('y2', yScale(9))
      .attr('stroke', '#10b981').attr('stroke-width', 2.5).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    sa.transition().delay(DELAY * 2).duration(DUR).attr('opacity', 0.7);
    g.append('text').attr('x', xScale(6)).attr('y', yScale(7.5)).attr('fill', '#059669').attr('font-weight', 'bold').attr('font-size', '12px').attr('opacity', 0)
      .text('y = x + 1').transition().delay(DELAY * 2).duration(DUR).attr('opacity', 1);

    // --- 5. Key Points ---
    const pts = [{x: 0, y: -1, label: "(0, -1)"}, {x: 2, y: 5, label: "(2, 5)"}];
    g.selectAll(".dot").data(pts).enter().append("circle")
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y)).attr("r", 5).attr("fill", "#1e40af").attr("opacity", 0)
      .transition().delay((_d, i) => DELAY * 3 + i * 500).duration(500).attr("opacity", 1);

    // --- 6. Curve Branches ---
    const f = (x: number) => (x * x + 1) / (x - 1);
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    const leftBranchData: [number, number][] = d3.range(-6, 0.85, 0.05).map(x => [x, f(x)]);
    const rightBranchData: [number, number][] = d3.range(1.15, 8.1, 0.05).map(x => [x, f(x)]);

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
        .transition().delay(delay).duration(DUR * 1.5).ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    };

    drawCurve(leftBranchData, DELAY * 4);
    drawCurve(rightBranchData, DELAY * 5);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic decoration-emerald-500 underline underline-offset-8">
          y = (x² + 1) / (x - 1)
        </h2>
        <p className="text-sm text-slate-500 mt-4 font-mono">
          Long Division Result: y = x + 1 + 2/(x - 1)
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="500" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600">Vertical Asymptote (x=1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-500 border-t border-dashed"></span>
          <span className="text-slate-600">Slant Asymptote (y=x+1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600">Function Curve</span>
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

export default SlantAsymptoteGraph;