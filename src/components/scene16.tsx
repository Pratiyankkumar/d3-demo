import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ParabolicInequalityGraph: React.FC = () => {
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

    // Mathematically verified scales
    const xScale = d3.scaleLinear().domain([-3, 5]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-2, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1000;
    const DELAY = 1200;

    // --- 2. Frame 1: Axes & Numbering ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid Lines
    g.selectAll(".v-grid").data(d3.range(-3, 6)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);
    g.selectAll(".h-grid").data(d3.range(-2, 9)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X and Y Axis
    g.append('line').attr('x1', xScale(-3)).attr('y1', yScale(0)).attr('x2', xScale(5)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-2)).attr('x2', xScale(0)).attr('y2', yScale(8)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data(d3.range(-3, 6)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);
    g.selectAll(".y-label").data(d3.range(-2, 9, 2)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    // --- 3. Frame 2-4: Plotting Key Points ---
    const points = [
      { x: 1, y: 0, label: "V(1, 0)" }, // Vertex
      { x: 0, y: 1, label: "P(0, 1)" }, // Y-intercept
      { x: 2, y: 1, label: "Q(2, 1)" }  // Symmetric point
    ];

    const dots = g.selectAll(".dot").data(points).enter().append("g").attr("opacity", 0);
    dots.append("circle").attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y)).attr("r", 5).attr("fill", "#1e40af");
    dots.append("text").attr("x", d => xScale(d.x) + 8).attr("y", d => yScale(d.y) - 8).attr("font-size", "10px").attr("fill", "#1e40af").attr("font-weight", "bold").text(d => d.label);

    dots.transition().delay((_d, i) => 500 + i * 400).duration(500).attr("opacity", 1);

    // --- 4. Frame 5: Draw the Solid Parabola y = (x-1)^2 ---
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveMonotoneX);
    const parabolaData: [number, number][] = d3.range(-1.5, 3.6, 0.1).map(x => [x, Math.pow(x - 1, 2)]);

    const path = g.append('path')
      .datum(parabolaData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', lineGen);

    const length = path.node()?.getTotalLength() || 0;
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition().delay(DELAY * 2).duration(DUR)
      .attr('stroke-dashoffset', 0);

    // --- 5. Frame 2 (Test Points) ---
    const testPoints = g.append('g').attr('opacity', 0);
    // (0,0) is True
    testPoints.append('text').attr('x', xScale(0)).attr('y', yScale(-0.5)).attr('text-anchor', 'middle').attr('fill', '#10b981').attr('font-size', '20px').attr('font-weight', 'bold').text('✓');
    testPoints.append('text').attr('x', xScale(0)).attr('y', yScale(-1)).attr('text-anchor', 'middle').attr('fill', '#10b981').attr('font-size', '10px').text('(0,0) is TRUE');
    
    // (1,1) is False
    testPoints.append('text').attr('x', xScale(1)).attr('y', yScale(1)).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', '20px').attr('font-weight', 'bold').text('✗');
    testPoints.append('text').attr('x', xScale(1)).attr('y', yScale(0.6)).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', '10px').text('(1,1) is FALSE');

    testPoints.transition().delay(DELAY * 3.5).duration(800).attr('opacity', 1);

    // --- 6. Frame 3: Final Shading ---
    // Shading the region y <= (x-1)^2. This is the region "below" the parabola.
    const areaGen = d3.area<[number, number]>()
      .x(d => xScale(d[0]))
      .y0(height - margin.bottom) // Bottom of the chart
      .y1(d => yScale(d[1]))      // The parabola line
      .curve(d3.curveMonotoneX);

    const shading = g.append('path')
      .datum(parabolaData)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0)
      .attr('d', areaGen);

    shading.transition()
      .delay(DELAY * 5)
      .duration(1500)
      .attr('opacity', 0.2);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic tracking-tight">
          Graphing y ≤ x² - 2x + 1
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono">
          Vertex Form: y ≤ (x - 1)²
        </p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <div className="overflow-hidden">
          <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600">Solid Boundary (≤)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-100 opacity-50 border border-blue-400"></span>
          <span className="text-slate-600">Shaded Region (Test point passed)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-bold text-lg">✓</span>
          <span className="text-slate-600">True Solution Area</span>
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

export default ParabolicInequalityGraph;