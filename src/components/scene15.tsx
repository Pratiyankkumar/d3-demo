/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CardioidGraph: React.FC = () => {
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

    // Scales: r goes from 0 to 2, so x/y range roughly [-1, 2.5]
    const xScale = d3.scaleLinear().domain([-1.5, 2.5]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-2, 2]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 2500;
    const DELAY = 1000;

    // --- 2. Frame 1 & 2: Polar Grid (Concentric Circles) ---
    const gridColor = "#e2e8f0";
    const radii = [0.5, 1, 1.5, 2];
    
    // Draw concentric circles
    g.selectAll(".polar-circle")
      .data(radii).enter().append("circle")
      .attr("cx", xScale(0)).attr("cy", yScale(0))
      .attr("r", d => xScale(d) - xScale(0))
      .attr("fill", "none")
      .attr("stroke", gridColor)
      .attr("stroke-width", 1);

    // Draw angular grid lines (every 45 degrees)
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    g.selectAll(".polar-line")
      .data(angles).enter().append("line")
      .attr("x1", xScale(0)).attr("y1", yScale(0))
      .attr("x2", d => xScale(2.2 * Math.cos(d * Math.PI / 180)))
      .attr("y2", d => yScale(2.2 * Math.sin(d * Math.PI / 180)))
      .attr("stroke", gridColor)
      .attr("stroke-width", 1);

    // Axes
    const axisColor = "#94a3b8";
    g.append('line').attr('x1', xScale(-1.5)).attr('y1', yScale(0)).attr('x2', xScale(2.5)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-2)).attr('x2', xScale(0)).attr('y2', yScale(2)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Numbering
    g.selectAll(".x-label").data([-1, 1, 2]).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);

    // --- 3. Frame 3-6: Key Points (r, θ) ---
    // Points in Cartesian: x = r cosθ, y = r sinθ
    const keyPoints = [
      { r: 2, theta: 0, label: "(2, 0°)" },
      { r: 1, theta: Math.PI / 2, label: "(1, 90°)" },
      { r: 0, theta: Math.PI, label: "(0, 180°)" },
      { r: 1, theta: 3 * Math.PI / 2, label: "(1, 270°)" }
    ];

    const dots = g.selectAll(".dot")
      .data(keyPoints).enter().append("g").attr("opacity", 0);

    dots.append("circle")
      .attr("cx", d => xScale(d.r * Math.cos(d.theta)))
      .attr("cy", d => yScale(d.r * Math.sin(d.theta)))
      .attr("r", 5).attr("fill", "#ef4444");

    dots.append("text")
      .attr("x", d => xScale(d.r * Math.cos(d.theta)) + 8)
      .attr("y", d => yScale(d.r * Math.sin(d.theta)) - 8)
      .attr("font-size", "10px").attr("fill", "#dc2626").attr("font-weight", "bold")
      .text(d => d.label);

    dots.transition().delay((d, i) => 500 + i * 400).duration(500).attr("opacity", 1);

    // --- 4. Frame 2 & 3: Drawing the Cardioid Curve ---
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveCardinalClosed);
    
    // Generate high-resolution points for r = 1 + cos(θ)
    const cardioidData: [number, number][] = d3.range(0, 2 * Math.PI + 0.1, 0.05).map(theta => {
      const r = 1 + Math.cos(theta);
      return [r * Math.cos(theta), r * Math.sin(theta)];
    });

    const path = g.append('path')
      .datum(cardioidData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 4)
      .attr('d', lineGen);

    const length = path.node()?.getTotalLength() || 0;
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition().delay(DELAY * 2).duration(DUR).ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);

    // --- 5. Final Highlight & Cusp (Frame 5) ---
    const cuspHighlight = g.append('g').attr('opacity', 0);
    
    cuspHighlight.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(0)).attr('r', 8)
      .attr('fill', 'none').attr('stroke', '#f43f5e').attr('stroke-width', 2).attr('stroke-dasharray', '2,2');

    cuspHighlight.append('text')
      .attr('x', xScale(0) - 10).attr('y', yScale(0) - 15)
      .attr('text-anchor', 'end').attr('fill', '#e11d48').attr('font-weight', 'bold').attr('font-size', '14px')
      .text('Cusp at Origin');

    cuspHighlight.transition().delay(DELAY * 2 + DUR).duration(1000).attr('opacity', 1);

    // Dynamic θ Indicator
    const angleArc = g.append('path')
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.2)
      .attr('d', d3.arc()({
        innerRadius: 0,
        outerRadius: 40,
        startAngle: Math.PI / 2, // D3 arc starts from y-axis
        endAngle: Math.PI / 2 - (Math.PI / 2) // Animates to 90 deg
      } as any))
      .attr('transform', `translate(${xScale(0)}, ${yScale(0)})`)
      .attr('opacity', 0);

    angleArc.transition().delay(DELAY).duration(1000).attr('opacity', 0.3);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic tracking-tight underline decoration-blue-500 underline-offset-8">
          Polar Cardioid: r = 1 + cos(θ)
        </h2>
        <p className="text-sm text-slate-500 mt-4 font-mono max-w-lg">
          The name comes from the Greek 'kardia' (heart). Notice how r shrinks to 0 at θ = 180°.
        </p>
      </div>
      
      <div className="relative bg-slate-50 rounded-xl p-4 shadow-inner border border-slate-100">
        <div className="overflow-hidden">
           <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600 tracking-widest">Cardioid Curve</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-600 tracking-widest">Key (r, θ) points</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-rose-500 border-dashed"></span>
          <span className="text-slate-600 tracking-widest">Origin Cusp</span>
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

export default CardioidGraph;