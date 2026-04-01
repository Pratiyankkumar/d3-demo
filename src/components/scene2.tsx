import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface HyperbolaPoint {
  x: number;
  y: number;
}

const AnimatedHyperbolaScene2: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (!svgRef.current) return;

    // --- 1. Setup ---
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    // Math Constants
    const a = 4, c = 6, b = Math.sqrt(20);
    const xScale = d3.scaleLinear().domain([-8, 8]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([-2, 8]).range([height - margin.bottom, margin.top]);

    const g = svg.append('g');

    // Animation Timing
    const DURATION = 800;
    const DELAY_STEP = 1000;

    // --- Background: Static Hyperbola & Axes ---
    const axisColor = "#e2e8f0";
    g.append('line').attr('x1', xScale(-8)).attr('y1', yScale(0)).attr('x2', xScale(8)).attr('y2', yScale(0)).attr('stroke', axisColor);
    g.append('line').attr('x1', xScale(0)).attr('y1', yScale(-2)).attr('x2', xScale(0)).attr('y2', yScale(8)).attr('stroke', axisColor);

    const lineGenerator = d3.line<HyperbolaPoint>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveBasis);
    const tRange = d3.range(-2, 2.1, 0.1);
    const rightBranch = tRange.map(t => ({ x: a * Math.cosh(t), y: b * Math.sinh(t) }));
    g.append('path').datum(rightBranch).attr('d', lineGenerator).attr('fill', 'none').attr('stroke', '#cbd5e1').attr('stroke-width', 1.5);

    // Points defined for the triangle
    const F1 = { x: -c, y: 0 };
    const F2 = { x: c, y: 0 };
    const A = { x: c, y: 5 };

    // --- Frame 2: Draw Segment F1-F2 (Base) ---
    const baseLine = g.append('line')
      .attr('x1', xScale(F1.x)).attr('y1', yScale(F1.y))
      .attr('x2', xScale(F1.x)).attr('y2', yScale(F1.y)) // Start at F1
      .attr('stroke', '#3b82f6').attr('stroke-width', 3);

    baseLine.transition().delay(500).duration(DURATION)
      .attr('x2', xScale(F2.x));

    g.append('text')
      .attr('x', xScale(0)).attr('y', yScale(-0.8))
      .attr('text-anchor', 'middle').attr('fill', '#3b82f6').attr('opacity', 0)
      .text('Base = 2c')
      .transition().delay(500 + DURATION).duration(500).attr('opacity', 1);

    // --- Frame 3: Draw Segment F2-A (Height) ---
    const heightLine = g.append('line')
      .attr('x1', xScale(F2.x)).attr('y1', yScale(F2.y))
      .attr('x2', xScale(F2.x)).attr('y2', yScale(F2.y)) // Start at F2
      .attr('stroke', '#3b82f6').attr('stroke-width', 3);

    heightLine.transition().delay(DELAY_STEP * 2).duration(DURATION)
      .attr('y2', yScale(A.y));

    g.append('text')
      .attr('x', xScale(F2.x) + 10).attr('y', yScale(2.5))
      .attr('fill', '#3b82f6').attr('opacity', 0)
      .text('Height = 5')
      .transition().delay(DELAY_STEP * 2 + DURATION).duration(500).attr('opacity', 1);

    // --- Frame 4: Draw Segment F1-A (Hypotenuse) ---
    const hypotenuse = g.append('line')
      .attr('x1', xScale(F1.x)).attr('y1', yScale(F1.y))
      .attr('x2', xScale(F1.x)).attr('y2', yScale(F1.y)) // Start at F1
      .attr('stroke', '#10b981').attr('stroke-width', 3);

    hypotenuse.transition().delay(DELAY_STEP * 3.5).duration(DURATION)
      .attr('x2', xScale(A.x)).attr('y2', yScale(A.y));

    g.append('text')
      .attr('x', xScale(0)).attr('y', yScale(3))
      .attr('text-anchor', 'end').attr('fill', '#10b981').attr('font-weight', 'bold').attr('opacity', 0)
      .text('13')
      .transition().delay(DELAY_STEP * 3.5 + DURATION).duration(500).attr('opacity', 1);

    // --- Frame 5: Mark Right Angle at F2 ---
    const s = 0.4; // Square size
    const rightAngle = g.append('path')
      .attr('d', `M ${xScale(c-s)} ${yScale(0)} L ${xScale(c-s)} ${yScale(s)} L ${xScale(c)} ${yScale(s)}`)
      .attr('fill', 'none').attr('stroke', '#1e40af').attr('stroke-width', 2)
      .attr('opacity', 0);

    rightAngle.transition().delay(DELAY_STEP * 5).duration(500).attr('opacity', 1);

    // --- Frame 6: Highlight Triangle Fill ---
    const trianglePath = `M ${xScale(F1.x)} ${yScale(F1.y)} L ${xScale(F2.x)} ${yScale(F2.y)} L ${xScale(A.x)} ${yScale(A.y)} Z`;
    
    g.append('path')
      .attr('d', trianglePath)
      .attr('fill', '#3b82f6')
      .attr('opacity', 0)
      .transition().delay(DELAY_STEP * 6).duration(DURATION)
      .attr('opacity', 0.15);

    // Foci dots
    const points = [F1, F2, A];
    g.selectAll('.dot')
      .data(points).enter().append('circle')
      .attr('cx', d => xScale(d.x)).attr('cy', d => yScale(d.y)).attr('r', 0)
      .attr('fill', (_d, i) => i === 2 ? '#334155' : '#ef4444')
      .transition().delay((_d, i) => DELAY_STEP * (i * 1.5)).duration(500)
      .attr('r', 5);

  }, [replayKey]);

  return (
    <div className="w-full flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-blue-800">Scene 2: The Right Triangle</h2>
        <p className="text-slate-500">Connecting F₁, F₂, and Point A to find the focal distance c.</p>
      </div>
      
      <div className="relative bg-slate-50 rounded-xl p-4 shadow-inner">
        <svg ref={svgRef} width="600" height="400"></svg>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">Base: 2c</div>
        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">Height: 5</div>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">Hypotenuse: 13</div>
      </div>

      <button 
        type="button"
        onClick={() => setReplayKey((k) => k + 1)} 
        className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all"
      >
        Replay Animation
      </button>
    </div>
  );
};

export default AnimatedHyperbolaScene2;