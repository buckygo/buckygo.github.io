/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import type { Category } from './state.js';
import { getEmotionColor, CATEGORY_CONFIG } from './state.js';

declare const d3: any;

export function renderStackedBarChart(container: HTMLElement, data: any[], keys: string[], category: Category) {
    if (!container.clientWidth || data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-sm py-8">此期間沒有資料可供分析。</p>`;
        return;
    }
    container.innerHTML = '';

    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("line-height", "1.4");

    const margin = { top: 20, right: 20, bottom: 80, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([0, width])
        .padding(0.3);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat((d: any) => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }))
        .selectAll("text")
        .attr("transform", "translate(-10,5)rotate(-45)")
        .style("text-anchor", "end");

    const yMax = d3.max(data, (d: { total: number }) => d.total) || 0;
    const y = d3.scaleLinear()
        .domain([0, yMax > 0 ? yMax : 1])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format('d')));

    const isMultiCategory = keys.length > 0 && keys.every(key => key in CATEGORY_CONFIG);

    // FIX: Change type to 'any' and remove type arguments from d3 calls to resolve TypeScript errors when d3 types are not fully available.
    let color: any;
    if (isMultiCategory) {
        color = d3.scaleOrdinal()
            .domain(keys)
            .range(keys.map(key => CATEGORY_CONFIG[key as Category].hexColor));
    } else if (category === '情緒') {
        color = d3.scaleOrdinal()
            .domain(keys)
            .range(keys.map(key => getEmotionColor(key)));
    } else {
        color = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);
    }


    const stackedData = d3.stack().keys(keys)(data);

    const groups = svg.append("g")
        .selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", (d: any) => color(d.key) as string);

    groups.selectAll("rect")
        .data((d: any) => d)
        .enter().append("rect")
        .attr("x", (d: any) => x(d.data.date)!)
        .attr("width", x.bandwidth())
        .attr("y", (d: any) => y(d[0]))
        .attr("height", 0)
        .on("mouseover", function (event: any, d: any) {
            const key = (d3.select(this.parentNode).datum() as any).key;
            const value = d.data[key];
            tooltip.style("visibility", "visible")
                .html(`日期: ${d.data.date}<br><b>${key}</b>: ${value} 次<br>當日總計: ${d.data.total} 次`);
        })
        .on("mousemove", (event: any) => tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"))
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .transition()
        .duration(800)
        .delay((d: any, i: number) => i * 50)
        .attr("y", (d: any) => y(d[1]))
        .attr("height", (d: any) => y(d[0]) - y(d[1]));

    const legendContainer = svg.append("g")
        .attr("transform", `translate(0, ${height + 40})`);

    let legendXOffset = 0;
    // Limit number of items in legend to prevent overflow
    const keysToShow = keys.length > 8 ? keys.slice(0, 8) : keys;
    if (keys.length > 8) {
        console.warn('Too many keys for legend, showing first 8.');
    }

    keysToShow.forEach((key) => {
        const legendItem = legendContainer.append("g")
            .attr("transform", `translate(${legendXOffset}, 0)`);

        legendItem.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(key) as string);

        const text = legendItem.append("text")
            .attr("x", 16)
            .attr("y", 10)
            .text(isMultiCategory ? key : (category === '情緒' ? key.split(' ')[0] : key))
            .style("font-size", "12px")
            .style("alignment-baseline", "middle");
        
        const textWidth = text.node()?.getBBox().width || 50;
        legendXOffset += textWidth + 16 + 10; // text width + rect + padding
    });
}

export function renderBarChart(container: HTMLElement, data: { date: string; value: number }[], category: Category) {
    if (!container.clientWidth || data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-sm py-8">此期間沒有資料可供顯示。</p>`;
        return;
    }
    container.innerHTML = '';
    const color = CATEGORY_CONFIG[category].hexColor;

    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px");

    const margin = { top: 30, right: 20, bottom: 80, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.date))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat((d: any) => {
             const date = new Date(d);
             return `${date.getMonth() + 1}/${date.getDate()}`;
        }))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    const yMax = d3.max(data, (d: {value: number}) => d.value) || 0;
    const y = d3.scaleLinear()
        .domain([0, yMax > 0 ? yMax * 1.15 : 1]) // Add headroom and prevent 0 domain
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y).ticks(Math.min(yMax, 5)).tickFormat(d3.format('d')));

    // Bars
    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d: {date: string}) => x(d.date)!)
        .attr("y", y(0))
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", color)
        .on("mouseover", function(event: any, d: {date: string, value: number}) {
            d3.select(this).style("opacity", 0.7);
            const date = new Date(d.date);
            const dateString = `${date.getMonth() + 1}月${date.getDate()}日`;
            return tooltip.style("visibility", "visible").text(`${dateString}: ${d.value} 次`);
        })
        .on("mousemove", function(event: any) {
            return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
        })
        .on("mouseout", function() {
            d3.select(this).style("opacity", 1);
            return tooltip.style("visibility", "hidden");
        });

    // Bar Animation
    svg.selectAll("rect")
      .transition()
      .duration(800)
      .attr("y", (d: {value: number}) => y(d.value))
      .attr("height", (d: {value: number}) => height - y(d.value))
      .delay((d: any, i: number) => i*50);
      
    // Labels on top of bars
    svg.selectAll(".bar-label")
       .data(data)
       .enter()
       .append("text")
       .attr("class", "bar-label")
       .attr("x", (d: {date: string}) => x(d.date)! + x.bandwidth() / 2)
       .attr("y", y(0))
       .attr("text-anchor", "middle")
       .text((d: {value: number}) => d.value)
       .style("font-size", "12px")
       .style("fill", "#4b5563")
       .attr("dy", "-0.35em")
       .style("opacity", 0)
       .transition()
       .duration(800)
       .attr("y", (d: {value: number}) => y(d.value))
       .style("opacity", 1)
       .delay((d: any, i: number) => i*50);
}


export function renderPieChart(container: HTMLElement, data: { name: string; value: number }[], category: Category) {
    if (!container.clientWidth || data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-sm py-8">此期間沒有資料可供顯示。</p>`;
        return;
    }
    container.innerHTML = '';
    
    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px");

    const width = container.clientWidth;
    const height = 300;
    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3.select(container)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = category === '情緒'
        ? d3.scaleOrdinal().domain(data.map(d => d.name)).range(data.map(d => getEmotionColor(d.name)))
        : d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3.pie()
      .value((d: any) => d.value)
      .sort(null);

    const data_ready = pie(data as any);
    const total = d3.sum(data, (d: any) => d.value);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const g = svg.selectAll('.arc-group')
      .data(data_ready)
      .enter()
      .append('g')
      .attr('class', 'arc-group');
      
    g.append('path')
      .attr('d', arc as any)
      .attr('fill', (d: any) => color(d.data.name) as string)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.9)
      .on("mouseover", function(event: any, d: any) {
            d3.select(this).style("opacity", 1);
            return tooltip.style("visibility", "visible").text(`${d.data.name}: ${d.data.value} 次`);
      })
      .on("mousemove", function(event: any) {
            return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
      })
      .on("mouseout", function() {
            d3.select(this).style("opacity", 0.9);
            return tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(800)
      .attrTween('d', function(d: any) {
          const i = d3.interpolate({startAngle: 0, endAngle: 0}, d);
          return function(t: any) { return arc(i(t)); };
      });

    g.append('text')
      .attr('transform', (d: any) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .each(function(d: any) {
          const percent = (d.data.value / total) * 100;
          if (percent < 4) return;
          
          const el = d3.select(this);
          el.append('tspan')
              .attr('x', 0)
              .attr('y', '-0.6em')
              .text(d.data.name);
          el.append('tspan')
              .attr('x', 0)
              .attr('y', '0.6em')
              .style('font-weight', 'bold')
              .text(`${percent.toFixed(1)}%`);
      })
      .transition()
      .duration(800)
      .delay(400)
      .style('opacity', 1);
}


export function renderComboChart(container: HTMLElement, data: { date: string; count: number; temp: number | null }[], category: Category) {
    if (!container.clientWidth || data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-sm py-8">此期間沒有資料可供顯示。</p>`;
        return;
    }
    container.innerHTML = '';
    const barColor = CATEGORY_CONFIG[category].hexColor;
    const lineColor = '#fb923c'; // orange-400

    const tooltip = d3.select("body").append("div")
        .attr("class", "d3-tooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("padding", "8px")
        .style("background", "rgba(0,0,0,0.8)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("line-height", "1.4");
    
    const margin = { top: 30, right: 50, bottom: 80, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // X axis
    const x = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([0, width])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat((d: any) => {
             const date = new Date(d);
             return `${date.getMonth() + 1}/${date.getDate()}`;
        }))
        .selectAll("text")
        .attr("transform", "translate(-10,5)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis 1 (left) for counts
    const y1Max = d3.max(data, (d: {count: number}) => d.count) || 0;
    const y1 = d3.scaleLinear()
        .domain([0, y1Max > 0 ? y1Max * 1.15 : 1])
        .range([height, 0]);
        
    svg.append("g")
        .call(d3.axisLeft(y1).ticks(Math.min(y1Max, 5)).tickFormat(d3.format('d')))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "-3em")
        .attr("text-anchor", "end")
        .text("次數");

    // Y axis 2 (right) for temperature
    const temps = data.map(d => d.temp).filter(t => t !== null) as number[];
    const y2Min = temps.length > 0 ? d3.min(temps)! - 5 : 0;
    const y2Max = temps.length > 0 ? d3.max(temps)! + 5 : 30;
    const y2 = d3.scaleLinear()
        .domain([y2Min, y2Max])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(y2).ticks(5))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", -12)
        .attr("dy", "3em")
        .attr("text-anchor", "end")
        .text("氣溫 (°C)");

    // Bars for counts
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d: {date: string}) => x(d.date)!)
        .attr("width", x.bandwidth())
        .attr("y", y1(0))
        .attr("height", 0)
        .attr("fill", barColor)
        .transition()
        .duration(800)
        .attr("y", (d: {count: number}) => y1(d.count))
        .attr("height", (d: {count: number}) => height - y1(d.count))
        .delay((d: any, i: number) => i * 50);
        
    // Line for temperature
    const line = d3.line()
        .defined((d: any) => d.temp !== null)
        .x((d: any) => x(d.date)! + x.bandwidth() / 2)
        .y((d: any) => y2(d.temp))
        .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2.5)
      .attr("d", line as any);
      
    // Circles for temperature points
    svg.selectAll(".dot")
       .data(data.filter(d => d.temp !== null))
       .enter().append("circle")
       .attr("class", "dot")
       .attr("cx", (d: any) => x(d.date)! + x.bandwidth() / 2)
       .attr("cy", (d: any) => y2(d.temp))
       .attr("r", 4)
       .attr("fill", lineColor);

    // Tooltip area
    svg.selectAll(".tooltip-area")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "tooltip-area")
        .attr("x", (d: {date: string}) => x(d.date)!)
        .attr("y", 0)
        .attr("width", x.bandwidth())
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", (event: any, d: {date: string, count: number, temp: number | null}) => {
            const date = new Date(d.date);
            const dateString = `${date.getMonth() + 1}月${date.getDate()}日`;
            const tempString = d.temp !== null ? `${d.temp.toFixed(1)}°C` : '無資料';
            tooltip.style("visibility", "visible")
                   .html(`<b>${dateString}</b><br>事件總次數: ${d.count}<br>平均氣温: ${tempString}`);
        })
        .on("mousemove", (event: any) => tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"))
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
}