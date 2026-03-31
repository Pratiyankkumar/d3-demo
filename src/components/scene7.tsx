import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RationalFunctionHoleGraph: React.FC = () => {
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
    const xScale = d3.scaleLinear().domain([-8, 8]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-6, 6]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1200;
    const DELAY = 1000;

    // --- 2. Frame 1: Axes with Numbering ---
    const axisColor = "#94a3b8";
    
    // Grid Lines
    g.append('g').attr('class', 'grid')
      .selectAll('line')
      .data(d3.range(-8, 9))
      .enter().append('line')
      .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
      .attr('y1', margin.top).attr('y2', height - margin.bottom)
      .attr('stroke', '#f1f5f9').attr('stroke-width', 1);

    g.append('g').attr('class', 'grid')
      .selectAll('line')
      .data(d3.range(-6, 7))
      .enter().append('line')
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('x1', margin.left).attr('x2', width - margin.right)
      .attr('stroke', '#f1f5f9').attr('stroke-width', 1);

    // X and Y Axis Lines
    g.append('line').attr('x1', xScale(-8)).attr('y1', yScale(0)).attr('x2', xScale(8)).attr('y2', yScale(0)).attr('stroke', axisColor).attr('stroke-width', 2);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-6)).attr('x2', xScale(0)).attr('y2', yScale(6)).attr('stroke', axisColor).attr('stroke-width', 2);

    // Axis Numbering
    g.selectAll(".x-label").data(d3.range(-8, 9, 2)).enter().append("text")
      .attr("x", d => xScale(d)).attr("y", yScale(0) + 20).attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    g.selectAll(".y-label").data(d3.range(-6, 7, 2)).enter().append("text")
      .attr("x", xScale(0) - 15).attr("y", d => yScale(d) + 4).attr("text-anchor", "end").attr("font-size", "10px").attr("fill", "#64748b").text(d => d !== 0 ? d : "");

    // --- 3. Frame 2: Asymptotes (VA: x=-1, HA: y=1) ---
    const va = g.append('line')
      .attr('x1', xScale(-1)).attr('y1', yScale(-6)).attr('x2', xScale(-1)).attr('y2', yScale(6))
      .attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    const ha = g.append('line')
      .attr('x1', xScale(-8)).attr('y1', yScale(1)).attr('x2', xScale(8)).attr('y2', yScale(1))
      .attr('stroke', '#10b981').attr('stroke-width', 2).attr('stroke-dasharray', '8,4').attr('opacity', 0);

    va.transition().delay(DELAY).duration(DUR).attr('opacity', 0.7);
    ha.transition().delay(DELAY + 300).duration(DUR).attr('opacity', 0.7);

    // --- 4. Frame 3: Intercepts ---
    const points = [
      { x: -2, y: 0, label: '(-2, 0)' },
      { x: 0, y: 2, label: '(0, 2)' }
    ];

    g.selectAll(".intercept")
      .data(points).enter().append("circle")
      .attr("cx", d => xScale(d.x)).attr("cy", d => yScale(d.y)).attr("r", 5).attr("fill", "#3b82f6").attr("opacity", 0)
      .transition().delay(DELAY * 2).duration(DUR).attr("opacity", 1);

    // --- 5. Frame 4: The Hole at (2, 1.33) ---
    const holeX = 2;
    const holeY = 4/3;
    const holeGroup = g.append('g').attr('opacity', 0);
    
    holeGroup.append('circle').attr('cx', xScale(holeX)).attr('cy', yScale(holeY)).attr('r', 6).attr('fill', 'white').attr('stroke', '#f59e0b').attr('stroke-width', 2);
    holeGroup.append('text').attr('x', xScale(holeX) + 10).attr('y', yScale(holeY) - 10).attr('fill', '#d97706').attr('font-weight', 'bold').attr('font-size', '12px').text(`Hole (2, 4/3)`);

    holeGroup.transition().delay(DELAY * 3).duration(DUR).attr('opacity', 1);

    // --- 6. Frame 5 & 6: Curve Branches ---
    const f = (x: number) => (x + 2) / (x + 1);
    const lineGenerator = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    // Branch 1: x < -1
    const branch1Data: [number, number][] = d3.range(-8, -1.1, 0.1).map(x => [x, f(x)]);
    // Branch 2: x > -1 (Split into segments to accommodate the hole)
    const branch2Part1: [number, number][] = d3.range(-0.85, 1.9, 0.05).map(x => [x, f(x)]);
    const branch2Part2: [number, number][] = d3.range(2.1, 8.1, 0.1).map(x => [x, f(x)]);

    const drawBranch = (data: [number, number][], delay: number) => {
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);

      const length = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition().delay(delay).duration(DUR * 1.5).ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    };

    drawBranch(branch1Data, DELAY * 4);
    drawBranch(branch2Part1, DELAY * 5.5);
    drawBranch(branch2Part2, DELAY * 6.5);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic underline decoration-blue-500 underline-offset-4">
          Graphing y = (x² - 4) / (x² - x - 2)
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-mono">Simplified: y = (x + 2) / (x + 1), x ≠ 2</p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600 uppercase tracking-tighter">V.A. (x = -1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-emerald-500 border-t border-dashed"></span>
          <span className="text-slate-600 uppercase tracking-tighter">H.A. (y = 1)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-amber-500"></span>
          <span className="text-slate-600 uppercase tracking-tighter">Hole (2, 1.33)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600 uppercase tracking-tighter">Function Curve</span>
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

export default RationalFunctionHoleGraph;