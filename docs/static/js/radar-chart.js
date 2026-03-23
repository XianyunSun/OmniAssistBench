// Radar chart
document.addEventListener("DOMContentLoaded", function() {
  const chartDom = document.getElementById('radar-chart');
  if (!chartDom) return;
  const myChart = echarts.init(chartDom);

  // --- 0. ADJUSTABLE CHART PARAMETERS ---
  const RADAR_RADIUS = '75%';               // Radius of the inner grid
  const LABEL_DISTANCE = 20;                // Pushes labels outward
  const RING_INNER_RADIUS = '75%';          // Inner edge of the color ring
  const RING_OUTER_RADIUS = '85%';          // Outer edge of the color ring
  const RING_GAP_SIZE = 8;                  // Margin size between the three ring parts
  // --------------------------------------

  // 1. Model Colors
  const colors = {
    'Gemini-3-Pro': '#5A7B7D',
    'Gemini-2.5-Pro': '#82A2A4',
    'MiMo-V2-Omni':'#AAC9CB',
    'MiniCPM-o-4.5': '#A05A58',
    'Baichuan-Omni-1.5': '#B87572',
    'Qwen2.5-Omni': '#CE8F8C',
    'MiniCPM-o-2.6': '#DFABA8',
    'Qwen3-Omni-Instruct': '#EBC5C3',
    'VITA-1.5': '#F5DFDD'
  };

  // 2. Default Checkbox State (Checked Models)
  let userLegendState = {
    'Gemini-3-Pro': true,
    'Qwen3-Omni-Instruct': true,
    'MiMo-V2-Omni': true,
    'MiniCPM-o-4.5': true,
    'Gemini-2.5-Pro': false,
    'Baichuan-Omni-1.5': false,
    'Qwen2.5-Omni': false,
    'MiniCPM-o-2.6': false,
    'VITA-1.5': false
  };

  // 3. Define original indicators (clockwise from top)
  const originalIndicators =['II', 'AI', 'CE', 'ER', 'AO', 'DC', 'AR', 'LR', 'GPF', 'OPF', 'CR', 'SER', 'MER', 'ST', 'CT', 'MT', 'RC'];
  
  // Map index to force ECharts to draw clockwise
  const cwIndices =[0, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const indicatorNames = cwIndices.map(i => originalIndicators[i]);

  // 4. Raw data for models (in original clockwise order)
  const rawData =[
    { name: 'Gemini-3-Pro', value:[3.59, 3.14, 3.31, 3.06, 3.73, 2.63, 3.63, 3.32, 2.75, 3.33, 3.80, 3.39, 2.42, 3.59, 3.75, 3.51, 3.40] },
    { name: 'Gemini-2.5-Pro', value:[3.86, 2.95, 3.48, 3.13, 3.60, 2.75, 3.70, 3.91, 2.74, 3.27, 3.70, 3.06, 2.39, 3.39, 4.11, 3.47, 2.24] },
    { name: 'MiMo-V2-Omni', value:[3.33, 2.80, 3.20, 2.50, 3.87, 3.00, 3.38, 2.82, 1.36, 3.13, 3.90, 1.97, 2.33, 2.84, 3.08, 3.15, 2.05] },
    { name: 'MiniCPM-o-4.5', value:[3.14, 2.67, 2.54, 1.88, 3.27, 2.19, 3.00, 2.64, 1.23, 1.20, 3.15, 2.66, 2.65, 2.23, 2.30, 2.01, 1.89] },
    { name: 'Baichuan-Omni-1.5', value:[2.18, 2.00, 2.35, 2.19, 2.47, 2.00, 2.52, 2.23, 2.16, 2.60, 1.75, 2.84, 2.42, 1.60, 2.02, 2.03, 2.24] },
    { name: 'Qwen2.5-Omni', value:[1.45, 2.14, 2.42, 2.44, 2.60, 2.13, 2.44, 2.00, 1.08, 1.20, 2.25, 2.36, 2.77, 2.55, 1.64, 2.22, 2.26] },
    { name: 'MiniCPM-o-2.6', value:[2.73, 2.33, 2.23, 1.75, 2.33, 1.94, 2.37, 2.55, 1.69, 1.27, 1.95, 2.10, 1.63, 2.16, 2.19, 1.88, 1.56] },
    { name: 'Qwen3-Omni-Instruct', value:[1.50, 0.62, 2.00, 1.13, 1.53, 0.80, 1.89, 1.00, 1.08, 3.33, 1.05, 1.51, 1.97, 2.76, 1.20, 1.26, 1.76] },
    { name: 'VITA-1.5', value:[1.09, 1.14, 1.00, 1.25, 1.40, 1.33, 1.59, 0.73, 1.31, 1.47, 0.65, 1.19, 1.72, 1.71, 0.80, 0.91, 0.73] }
  ];

  const echartsRadarData = rawData.map(d => ({
    name: d.name,
    value: cwIndices.map(i => d.value[i]), 
    itemStyle: { color: colors[d.name], opacity: 1 },
    lineStyle: { color: colors[d.name], width: 2, opacity: 1 },
    symbol: 'circle', 
    symbolSize: 6
  }));

  // 5. Track mouse angle for the tooltip
  let hoveredAxisIndex = 0;
  myChart.getZr().on('mousemove', function (params) {
    let width = myChart.getWidth();
    let height = myChart.getHeight();
    let cx = width * 0.30; // Shifted center X to 40%
    let cy = height * 0.50; // Shifted center Y to 50%
    
    let dx = params.offsetX - cx;
    let dy = params.offsetY - cy;
    
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    let sliceAngle = (2 * Math.PI) / 17;
    hoveredAxisIndex = Math.round((2 * Math.PI - angle) / sliceAngle) % 17;
  });

  // 6. Build ECharts configuration
  const option = {
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: function(params) {
        if (Array.isArray(params.value)) {
          let idx = hoveredAxisIndex || 0;
          let val = params.value[idx];
          return `<div style="text-align:center;"><strong>${params.name}</strong><br/>${indicatorNames[idx]}: <span style="font-weight:bold; color:${params.color}">${val}</span></div>`;
        }
        return params.name;
      }
    },
    legend: {
      orient: 'vertical',
      right: '18%',                // Placed on the right side
      top: 'middle',              // Centered vertically
      icon: 'circle',             // Makes it look like round checkboxes
      itemGap: 15,
      textStyle: { fontSize: 13, color: '#333' },
      data: Object.keys(colors),
      selected: userLegendState   // Uses our default checked states
    },
    radar: {
      z:3,
      radius: RADAR_RADIUS,              
      center:['30%', '50%'],      // Shifted left to make room for legend
      splitNumber: 5,
      shape: 'polygon',
      nameGap: LABEL_DISTANCE,           
      axisName: { color: '#2c3e50', fontWeight: 'bold', fontSize: 13 },
      splitArea: { areaStyle: { color:['#fefefe'] } },
      splitLine: { lineStyle: { color: '#ccc', type: 'dashed' } },
      axisLine: { lineStyle: { color: '#ccc', type: 'dashed' } },
      indicator: indicatorNames.map(name => ({ name: name, max: 5, axisLabel: { show: name === 'II', color: '#888', fontSize: 11 } }))
    },
    series:[
      { // The outer color rings
        type: 'pie',
        z:1,
        radius:[RING_INNER_RADIUS, RING_OUTER_RADIUS], 
        center:['30%', '50%'],   // Shifted left to match radar
        startAngle: 100.588,
        silent: true,
        label: { show: false },
        itemStyle: { 
          borderColor: '#ffffff', 
          borderWidth: RING_GAP_SIZE 
        },
        data:[
          { value: 10, itemStyle: { color: '#E4F3DD' }, name: 'Basic Tier' },
          { value: 6, itemStyle: { color: '#E0EDF5' }, name: 'Advanced Tier' },
          { value: 1, itemStyle: { color: '#FCE2D1' }, name: 'Real World Cases' }
        ]
      },
      { // The Radar Lines
        type: 'radar',
        z: 5,
        data: echartsRadarData,
        emphasis: { disabled: true } 
      }
    ]
  };
  myChart.setOption(option);

  // 7. Track User's Legend Clicks
  let isHoveringTable = false;
  myChart.on('legendselectchanged', function(params) {
    // Only save state if the user actually clicked the checkbox manually
    if (!isHoveringTable) {
      userLegendState = { ...params.selected };
    }
  });

  // 8. Shared Functions to Highlight / Restore Models
  let currentHighlight = null; 
  const allModels = Object.keys(colors);

  function highlightModel(modelName) {
    if (currentHighlight === modelName) return; 
    currentHighlight = modelName;
    
    const hoveredData = echartsRadarData.map(d => {
      if (d.name === modelName) {
        return { 
          ...d, 
          lineStyle: { color: colors[d.name], width: 4, opacity: 1 }, 
          itemStyle: { color: colors[d.name], opacity: 1 } 
        };
      } else {
        return { 
          ...d, 
          lineStyle: { color: colors[d.name], width: 2, opacity: 0.15 }, 
          itemStyle: { color: colors[d.name], opacity: 0.15 } 
        };
      }
    });
    myChart.setOption({ series:[ {}, { data: hoveredData } ] }); 
  }

  function restoreModels() {
    if (!currentHighlight) return;
    currentHighlight = null;
    myChart.setOption({ series:[ {}, { data: echartsRadarData } ] });
  }

  // 9. Chart Mouse Hover
  myChart.on('mouseover', function(params) {
    if (allModels.includes(params.name)) highlightModel(params.name);
  });
  myChart.on('mouseout', function(params) {
    if (allModels.includes(params.name)) restoreModels();
  });

  // 10. Robust Table Hover Link 
  document.querySelectorAll('table tbody tr').forEach(tr => {
    const rowText = tr.textContent; 
    const matchedModel = allModels.find(m => rowText.includes(m));

    if (matchedModel) {
      tr.addEventListener('mouseenter', () => {
        isHoveringTable = true;
        // Temporarily check the box if the user had it unchecked
        if (!userLegendState[matchedModel]) {
          myChart.dispatchAction({ type: 'legendSelect', name: matchedModel });
        }
        highlightModel(matchedModel);
      });
      
      tr.addEventListener('mouseleave', () => {
        restoreModels();
        // Uncheck the box again if it was originally unchecked by the user
        if (!userLegendState[matchedModel]) {
          myChart.dispatchAction({ type: 'legendUnSelect', name: matchedModel });
        }
        isHoveringTable = false;
      });
    }
  });
  
  window.addEventListener('resize', () => myChart.resize());
});