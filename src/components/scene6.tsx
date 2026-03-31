import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SquareRootRationalGraph: React.FC = () => {
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
    const xScale = d3.scaleLinear().domain([0, 10]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-8, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Time Constants
    const DUR = 1000;
    const DELAY = 1200;

    // --- 2. Frame 1: Axes ---
    const axisColor = "#94a3b8";
    g.append('line') // X-axis
      .attr('x1', xScale(0)).attr('y1', yScale(0))
      .attr('x2', xScale(10)).attr('y2', yScale(0))
      .attr('stroke', axisColor).attr('stroke-width', 1.5);
    g.append('line') // Y-axis
      .attr('x1', xScale(0)).attr('y1', yScale(-8))
      .attr('x2', xScale(0)).attr('y2', yScale(8))
      .attr('stroke', axisColor).attr('stroke-width', 1.5);

    // --- 3. Frame 2: The "Forbidden Zone" (x < 2) ---
    const forbidden = g.append('rect')
      .attr('x', xScale(0))
      .attr('y', yScale(8))
      .attr('width', xScale(2) - xScale(0))
      .attr('height', yScale(-8) - yScale(8))
      .attr('fill', '#f1f5f9')
      .attr('opacity', 0);

    forbidden.transition()
      .delay(500)
      .duration(DUR)
      .attr('opacity', 1);

    // Hatch pattern for forbidden zone
    g.append('text')
      .attr('x', xScale(1)).attr('y', yScale(4))
      .attr('text-anchor', 'middle').attr('fill', '#94a3b8').attr('font-size', '12px').attr('font-style', 'italic')
      .attr('opacity', 0)
      .text('Undefined (x < 2)')
      .transition().delay(500).duration(DUR).attr('opacity', 1);

    // --- 4. Frame 3: Vertical Asymptote (x = 3) ---
    const va = g.append('line')
      .attr('x1', xScale(3)).attr('y1', yScale(-8))
      .attr('x2', xScale(3)).attr('y2', yScale(8))
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0);

    va.transition().delay(DELAY).duration(DUR).attr('opacity', 0.6);

    g.append('text')
      .attr('x', xScale(3) + 5).attr('y', yScale(7))
      .attr('fill', '#ef4444').attr('font-size', '12px').attr('font-weight', 'bold').attr('opacity', 0)
      .text('x = 3')
      .transition().delay(DELAY).duration(DUR).attr('opacity', 1);

    // --- 5. Frame 4: X-intercept (2, 0) ---
    const intercept = g.append('circle')
      .attr('cx', xScale(2)).attr('cy', yScale(0))
      .attr('r', 5)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0);

    intercept.transition().delay(DELAY * 2).duration(500).attr('opacity', 1);
    
    g.append('text')
      .attr('x', xScale(2)).attr('y', yScale(0) - 10)
      .attr('text-anchor', 'middle').attr('fill', '#1e40af').attr('font-weight', 'bold').attr('opacity', 0)
      .text('(2, 0)')
      .transition().delay(DELAY * 2).duration(500).attr('opacity', 1);

    // --- 6. Frame 5 & 6: Drawing the Curves ---
    const f = (x: number) => Math.sqrt(x - 2) / (x - 3);
    const lineGenerator = d3.line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));

    // Branch 1: [2, 3)
    const branch1Data: [number, number][] = d3.range(2, 2.95, 0.02).map(x => [x, f(x)]);
    // Branch 2: (3, 10]
    const branch2Data: [number, number][] = d3.range(3.15, 10, 0.1).map(x => [x, f(x)]);

    const drawPath = (data: [number, number][], delay: number) => {
      const path = g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 3)
        .attr('d', lineGenerator);

      const length = path.node()?.getTotalLength() || 0;
      path.attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length)
        .transition().delay(delay).duration(DUR * 1.5)
        .attr('stroke-dashoffset', 0);
    };

    drawPath(branch1Data, DELAY * 3);
    drawPath(branch2Data, DELAY * 4.5);

  }, [animationKey]);

  return (
    <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 italic">y = √(x - 2) / (x - 3)</h2>
        <p className="text-sm text-slate-500 mt-2">Domain: [2, 3) ∪ (3, ∞)</p>
      </div>
      
      <div className="relative bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden">
        <svg ref={svgRef} width="600" height="450" className="overflow-hidden"></svg>
      </div>

      <div className="mt-6 flex gap-6 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-slate-100 border border-slate-200"></span>
          <span className="text-slate-600">Restricted Domain</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 border-t border-dashed"></span>
          <span className="text-slate-600">Asymptote (x=3)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-blue-600 rounded"></span>
          <span className="text-slate-600">Function</span>
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

export default SquareRootRationalGraph;