import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CuspFunctionGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear for replay

    // Mathematically verified scales
    // x range to include (-8, 4) and (8, 4)
    const xScale = d3.scaleLinear().domain([-10, 10]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-1, 6]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1500;
    const DELAY = 1000;

    // --- 2. Axes and Grid ---
    const axisColor = "#94a3b8";

    // X and Y Axis
    g.append('line').attr('x1', xScale(-10)).attr('y1', yScale(0)).attr('x2', xScale(10)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-1)).attr('x2', xScale(0)).attr('y2', yScale(6)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    const xTicks = [-8, -4, 4, 8];
    g.selectAll(".x-tick").data(xTicks).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    const yTicks = [2, 4];
    g.selectAll(".y-tick").data(yTicks).enter().append("text")
      .attr("x", xScale(0) - 10).attr("y", d => yScale(d) + 5).attr("text-anchor", "end")
      .attr("font-size", "12px").attr("fill", "#64748b").text(d => d);

    // --- 3. Symmetry Indicator (Frame 3) ---
    const symmetryLine = g.append('line')
      .attr('x1', xScale(0)).attr('y1', yScale(-1))
      .attr('x2', xScale(0)).attr('y2', yScale(6))
      .attr('stroke', '#6366f1').attr('stroke-width', 3).attr('stroke-dasharray', '10,5').attr('opacity', 0);

    symmetryLine.transition().delay(500).duration(DUR).attr('opacity', 0.3);

    // --- 4. Plotting Key Points (Frame 2) ---
    const pts = [
      {x: 0, y: 0, label: "(0,0)"},
      {x: 1, y: 1, label: "(1,1)"},
      {x: -1, y: 1, label: "(-1,1)"},
      {x: 8, y: 4, label: "(8,4)"},
      {x: -8, y: 4, label: "(-8,4)"}
    ];

    g.selectAll(".dot")
      .data(pts).enter().append("circle")
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y)).attr("r", 4).attr("fill", "#1e40af").attr("opacity", 0)
      .transition().delay((_d, i) => 800 + i * 200).duration(500).attr("opacity", 1);

    // --- 5. Drawing the Curve Branches (Frame 4) ---
    const f = (x: number) => Math.pow(Math.abs(x), 2/3);
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    // Generate points with higher density near 0 to show the cusp
    const generateBranch = (start: number, end: number) => {
      const data: [number, number][] = [];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Use a power transform to cluster points near 0
        const x = start + (end - start) * Math.pow(t, 2); 
        data.push([x, f(x)]);
      }
      return data;
    };

    const rightBranchData = generateBranch(0, 10);
    const leftBranchData = generateBranch(0, -10);

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
        .transition().delay(delay).duration(DUR).ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    };

    drawCurve(rightBranchData, DELAY * 2);
    drawCurve(leftBranchData, DELAY * 3);

    // --- 6. Cusp Highlighting (Frame 5) ---
    const cuspHighlight = g.append('g').attr('opacity', 0);
    
    cuspHighlight.append('path')
      .attr('d', `M ${xScale(0)} ${yScale(-1)} L ${xScale(0)} ${yScale(-0.2)}`)
      .attr('stroke', '#e11d48').attr('stroke-width', 2).attr('marker-end', 'url(#arrow)');

    cuspHighlight.append('text')
      .attr('x', xScale(0)).attr('y', yScale(-1.2))
      .attr('text-anchor', 'middle').attr('fill', '#e11d48').attr('font-weight', 'bold').attr('font-size', '14px')
      .text('CUSP (Slope = ±∞)');

    cuspHighlight.transition().delay(DELAY * 4.5).duration(1000).attr('opacity', 1);

    // Arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 0 10 10').attr('refX', 5).attr('refY', 5)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#e11d48');

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic tracking-tight">
          Symmetry & The Cusp: y = |x|²ᐟ³
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono max-w-lg">
          The function is symmetric about the y-axis. At x=0, the derivative approaches ±∞, creating a sharp "cusp" point.
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600">Power Rule (2/3 &lt; 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-indigo-400 border-t border-dashed"></span>
          <span className="text-slate-600">Y-Axis Symmetry</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600"></span>
          <span className="text-slate-600">Vertical Tangent (Cusp)</span>
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

export default CuspFunctionGraph;