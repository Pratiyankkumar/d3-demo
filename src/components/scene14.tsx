import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ParametricCuspGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 60 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Scales: x is always positive (0 to 10), y goes both ways (-10 to 10)
    const xScale = d3.scaleLinear().domain([-2, 10]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-10, 10]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 2000;
    const DELAY = 800;

    // --- 2. Axes & Grid ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid Lines
    g.selectAll(".v-grid").data(d3.range(-2, 11)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);
    g.selectAll(".h-grid").data(d3.range(-10, 11, 2)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X and Y Axis
    g.append('line').attr('x1', xScale(-2)).attr('y1', yScale(0)).attr('x2', xScale(10)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-10)).attr('x2', xScale(0)).attr('y2', yScale(10)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data(d3.range(0, 11, 2)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);
    g.selectAll(".y-label").data(d3.range(-10, 11, 4)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);

    // --- 3. Plotting Points based on t (Frame 2) ---
    const tValues = [-2, -1, 0, 1, 2];
    const pts = tValues.map(t => ({ t, x: t*t, y: Math.pow(t, 3) }));

    const dots = g.selectAll(".dot").data(pts).enter().append("g").attr("opacity", 0);
    
    dots.append("circle")
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y)).attr("r", 5).attr("fill", "#1e40af");
    
    dots.append("text")
      .attr("x", d => xScale(d.x) + 8).attr("y", d => yScale(d.y) + 5)
      .attr("font-size", "10px").attr("fill", "#1e40af").attr("font-weight", "bold")
      .text(d => `t=${d.t}`);

    dots.transition().delay((_d, i) => 500 + i * 300).duration(500).attr("opacity", 1);

    // --- 4. Drawing the Curve (Frame 3 & 4) ---
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveCardinal);
    
    // Generate many points for t from -2.2 to 2.2
    const curveData: [number, number][] = d3.range(-2.2, 2.25, 0.1).map(t => [t*t, Math.pow(t, 3)]);

    const path = g.append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', lineGen);

    const length = path.node()?.getTotalLength() || 0;
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition().delay(DELAY * 3).duration(DUR).ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // --- 5. Parameter Flow Arrows (Frame 3) ---
    svg.append('defs').append('marker')
      .attr('id', 'flow-arrow').attr('viewBox', '0 0 10 10').attr('refX', 5).attr('refY', 5)
      .attr('markerWidth', 4).attr('markerHeight', 4).attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M 0 0 L 10 5 L 0 10 z').attr('fill', '#10b981');

    const arrowPoints = [-1.5, 1.5]; // t values for flow markers
    arrowPoints.forEach(t => {
      const x = t*t;
      const y = Math.pow(t, 3);
      // Tangent direction: dx/dt = 2t, dy/dt = 3t^2
      const angle = Math.atan2(3*t*t, 2*t) * (180 / Math.PI);

      g.append('path')
        .attr('d', 'M -5 0 L 5 0')
        .attr('stroke', '#10b981').attr('stroke-width', 3).attr('marker-end', 'url(#flow-arrow)')
        .attr('opacity', 0)
        .attr('transform', `translate(${xScale(x)}, ${yScale(y)}) rotate(${angle})`)
        .transition().delay(DELAY * 4).duration(1000).attr('opacity', 1);
    });

    // --- 6. The Cusp Highlighting (Frame 5) ---
    const cusp = g.append('g').attr('opacity', 0);
    cusp.append('circle').attr('cx', xScale(0)).attr('cy', yScale(0)).attr('r', 8).attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '2,2');
    cusp.append('text').attr('x', xScale(0.5)).attr('y', yScale(-1.5)).attr('fill', '#ef4444').attr('font-weight', 'bold').attr('font-size', '14px').text('Cusp (0,0)');

    cusp.transition().delay(DELAY * 5).duration(1000).attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic tracking-tight">
          Parametric Equations: x = t², y = t³
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono max-w-lg">
          Cartesian Form: y² = x³. Notice how the path flows from the bottom-right to the top-right as 't' increases.
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600 tracking-widest">Trajectory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-500 border-t border-solid"></span>
          <span className="text-slate-600 tracking-widest">Parameter Flow (t ↑)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-rose-500 border-dashed"></span>
          <span className="text-slate-600 tracking-widest">Sharp Cusp</span>
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

export default ParametricCuspGraph;