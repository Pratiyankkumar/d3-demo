import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ExponentialDecayGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup Dimensions ---
    const width = 600;
    const height = 450;
    const margin = { top: 40, right: 40, bottom: 40, left: 50 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Mathematically verified scales
    const xScale = d3.scaleLinear().domain([-3, 5]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-1, 9]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1500;
    const DELAY = 1000;

    // --- 2. Axes & Grid ---
    const axisColor = "#94a3b8";
    const gridColor = "#f1f5f9";

    // Grid Lines
    g.selectAll(".v-grid").data(d3.range(-3, 6)).enter().append("line")
      .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
      .attr("y1", margin.top).attr("y2", height - margin.bottom)
      .attr("stroke", gridColor);
    g.selectAll(".h-grid").data(d3.range(-1, 10)).enter().append("line")
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("x1", margin.left).attr("x2", width - margin.right)
      .attr("stroke", gridColor);

    // X and Y Axis with numbers
    g.append('line').attr('x1', xScale(-3)).attr('y1', yScale(0)).attr('x2', xScale(5)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-1)).attr('x2', xScale(0)).attr('y2', yScale(9)).attr('stroke', axisColor).attr('stroke-width', 2);

    g.selectAll(".x-label").data(d3.range(-3, 6)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);
    g.selectAll(".y-label").data(d3.range(-1, 10, 2)).enter().append("text")
      .attr("x", xScale(0) - 12).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "11px").attr("fill", "#64748b").text(d => d);

    // --- 3. Parent Function: y = e^-x (Frame 1 & 2) ---
    const lineGen = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1])).curve(d3.curveMonotoneX);
    const data: [number, number][] = d3.range(-2, 5.2, 0.2).map(x => [x, Math.exp(-x)]);

    const parentPath = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', lineGen)
      .attr('opacity', 0);

    parentPath.transition().delay(500).duration(DUR).attr('opacity', 0.5);

    // Original Asymptote y=0
    const oldAsymptote = g.append('line')
      .attr('x1', xScale(-3)).attr('y1', yScale(0)).attr('x2', xScale(5)).attr('y2', yScale(0))
      .attr('stroke', '#cbd5e1').attr('stroke-width', 1).attr('stroke-dasharray', '4,4').attr('opacity', 0);
    
    oldAsymptote.transition().delay(500).duration(DUR).attr('opacity', 1);

    // --- 4. Transformed Function: y = e^-x + 2 (Frame 3 & 4) ---
    const transformedData: [number, number][] = d3.range(-2, 5.2, 0.2).map(x => [x, Math.exp(-x) + 2]);
    
    const mainPath = g.append('path')
      .datum(transformedData)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 3)
      .attr('d', lineGen);

    const length = mainPath.node()?.getTotalLength() || 0;
    mainPath.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition().delay(DELAY * 2).duration(DUR)
      .attr('stroke-dashoffset', 0);

    // --- 5. New Horizontal Asymptote: y = 2 ---
    const newAsymptote = g.append('line')
      .attr('x1', xScale(-3)).attr('y1', yScale(2))
      .attr('x2', xScale(5)).attr('y2', yScale(2))
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0);

    newAsymptote.transition().delay(DELAY * 3).duration(DUR).attr('opacity', 0.8);

    // --- 6. Intercept Marker (0, 3) ---
    const intercept = g.append('g').attr('opacity', 0);
    intercept.append('circle')
      .attr('cx', xScale(0)).attr('cy', yScale(3)).attr('r', 5).attr('fill', '#1e40af');
    intercept.append('text')
      .attr('x', xScale(0) + 10).attr('y', yScale(3) - 10).attr('fill', '#1e40af').attr('font-weight', 'bold').attr('font-size', '12px').text('(0, 3)');

    intercept.transition().delay(DELAY * 4).duration(DUR).attr('opacity', 1);

    // Labels
    g.append('text').attr('x', xScale(3)).attr('y', yScale(2.5)).attr('fill', '#ef4444').attr('font-size', '12px').attr('font-weight', 'bold').attr('opacity', 0)
      .text('y = 2 (Asymptote)').transition().delay(DELAY * 3).duration(DUR).attr('opacity', 1);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic">Graphing Exponential Decay</h2>
        <p className="text-lg font-mono text-blue-600 mt-2 font-bold underline">y = e⁻ˣ + 2</p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold uppercase tracking-tighter">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-slate-300 border-t border-dashed"></span>
          <span className="text-slate-500 italic">Parent: e⁻ˣ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600">Transformed Function</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600">Asymptote (y = 2)</span>
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

export default ExponentialDecayGraph;