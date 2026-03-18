document.addEventListener("DOMContentLoaded", function() {
  // 1. Initialize ECharts instances
  const sunburstChart = echarts.init(document.getElementById('sunburst-chart-interactive'));
  const barChartTasks = echarts.init(document.getElementById('bar-chart-tasks'));
  const barChartDuration = echarts.init(document.getElementById('bar-chart-duration'));

  // 2. Data Mappings for Linkage
  // Maps the data-task ID to the Sunburst node name and Bar Chart Data Index
  const taskMap = {
    'ER':  { barIdx: 0,  sunburst: 'ER' },
    'DC':  { barIdx: 1,  sunburst: 'DC' },
    'AO':  { barIdx: 2,  sunburst: 'AO' },
    'II':  { barIdx: 3,  sunburst: 'II' },
    'CE':  { barIdx: 4,  sunburst: 'CE' },
    'AI':  { barIdx: 5,  sunburst: 'AI' },
    'LR':  { barIdx: 6,  sunburst: 'LR' },
    'AR':  { barIdx: 7,  sunburst: 'AR' },
    'OPF': { barIdx: 8,  sunburst: 'OPF' },
    'GPF': { barIdx: 9,  sunburst: 'GPF' },
    'ST':  { barIdx: 10, sunburst: 'ST' },
    'MT':  { barIdx: 11, sunburst: 'MT' },
    'CT':  { barIdx: 12, sunburst: 'CT' },
    'SER': { barIdx: 13, sunburst: 'SER' },
    'MER': { barIdx: 14, sunburst: 'MER' },
    'CR':  { barIdx: 15, sunburst: 'CR' },
    'RC':  { barIdx: 16, sunburst: 'Real World\nCases' }, 
    'Ms':  { barIdx: 16, sunburst: 'Ms' }, // Maps RC sub-tasks to the single RC bar
    'Ba':  { barIdx: 16, sunburst: 'Ba' },
    'Ht':  { barIdx: 16, sunburst: 'Ht' }
  };

  // 3. Sunburst Chart Configuration (4 Rings)
  // Here is where you change the words (the "name" properties). 
  // The depth of the "children" determines which ring it appears in.
  const sunburstData =[
    {
      name: 'Basic Interactive\nUnderstanding', itemStyle: { color: '#8DC766' },
      children:[
        {
          name: 'Non-audio\nPrompt', itemStyle: { color: '#A9D18E' },
          children:[
            { name: 'OCR-based\nPrompt', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'OPF', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Gesture-based\nPrompt', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'GPF', value: 1, itemStyle: { color: '#E2F0D9' } }] }
          ]
        },
        {
          name: 'Referential\nPerception', itemStyle: { color: '#A9D18E' },
          children:[
            { name: 'Action\nReference', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'AR', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Linguistic\nReference', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'LR', value: 1, itemStyle: { color: '#E2F0D9' } }] }
          ]
        },
        {
          name: 'Social\nPerception', itemStyle: { color: '#A9D18E' },
          children:[
            { name: 'Addressee\nIdent.', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'AI', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Complex\nEmotion', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'CE', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Identity\nIdent.', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'II', value: 1, itemStyle: { color: '#E2F0D9' } }] }
          ]
        },
        {
          name: 'Temporal\nPerception', itemStyle: { color: '#A9D18E' },
          children:[
            { name: 'Appearance\nOrder', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'AO', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Dynamic\nCounting', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'DC', value: 1, itemStyle: { color: '#E2F0D9' } }] },
            { name: 'Event\nRetrieval', itemStyle: { color: '#C5E0B4' }, children:[{ name: 'ER', value: 1, itemStyle: { color: '#E2F0D9' } }] }
          ]
        }
      ]
    },
    {
      name: 'Advanced Interactive\nUnderstanding', itemStyle: { color: '#78B4E2', borderWidth: 2 },
      children:[
        {
          name: 'Process\nTracking', itemStyle: { color: '#9BC2E6' },
          children:[
            { name: 'Step Tracking', itemStyle: { color: '#BDD7EE' }, children:[{ name: 'ST', value: 1, itemStyle: { color: '#DEEBF7' } }] },
            { name: 'Multitask\nTracking', itemStyle: { color: '#BDD7EE' }, children:[{ name: 'MT', value: 1, itemStyle: { color: '#DEEBF7' } }] },
            { name: 'Checklist\nTracking', itemStyle: { color: '#BDD7EE' }, children:[{ name: 'CT', value: 1, itemStyle: { color: '#DEEBF7' } }] }
          ]
        },
        {
          name: 'Proactive\nResponse', itemStyle: { color: '#9BC2E6' },
          children:[
            { name: 'Single\nEvent', itemStyle: { color: '#BDD7EE' }, children:[{ name: 'SER', value: 1, itemStyle: { color: '#DEEBF7' } }] },
            { name: 'Multi\nEvent', itemStyle: { color: '#BDD7EE' }, children:[{ name: 'MER', value: 1, itemStyle: { color: '#DEEBF7' } }] }
          ]
        },
        
        {
          name: '', itemStyle: { color: '#9BC2E6', borderWidth: 0},
          children:[
            { name: 'Context-aware\nResponse', itemStyle: { color: '#9BC2E6', borderWidth: 0}, children:[{ name: 'CR', value: 1, itemStyle: { color: '#DEEBF7' } }] }
          ]
        }
      
      ]
    },
    {
      name: 'Real World\nCases', itemStyle: { color: '#F7B064' },
      children:[
        {
          name: '', itemStyle: { color: '#FAD0A1', borderWidth: 0 },
          children:[
            { name: 'Meeting\nSimulation', itemStyle: { color: '#FAD0A1', borderWidth: 0 }, children:[{ name: 'Ms', value: 1, itemStyle: { color: '#FCE4CC' } }] }
          ]
        },
        {
          name: '', itemStyle: { color: '#FAD0A1', borderWidth: 0 },
          children:[
            { name: 'Blind\nAssistance', itemStyle: { color: '#FAD0A1', borderWidth: 0 }, children:[{ name: 'Ba', value: 1, itemStyle: { color: '#FCE4CC' } }] }
          ]
        },
        {
          name: '', itemStyle: { color: '#FAD0A1', borderWidth: 0 },
          children:[
            { name: 'Handcraft\nProcess', itemStyle: { color: '#FAD0A1', borderWidth: 0 }, children:[{ name: 'Ht', value: 1, itemStyle: { color: '#FCE4CC' } }] }
          ]
        }
      ]
    }
  ];

  const sunburstOption = {
    series: [
      {
      type: 'sunburst',
      data: sunburstData,
      radius: ['0%', '100%'], // Uses 100% of the container div
      nodeClick: false,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      emphasis: { focus: 'ancestor' },
      
      // HERE IS WHERE YOU CHANGE WIDTHS AND ROTATION!
      levels:[
        {}, // Level 0: The blank center hole
        {   // Level 1: Tier (Basic/Adv/RC)
          r0: '13%', r: '30%', // r0 is inner radius, r is outer radius
          label: { rotate: 'tangential', fontSize: 10, fontWeight: 'bold', color: '#333' }
        },
        {   // Level 2: Major Task (Social/Process...)
          r0: '30%', r: '50%', 
          label: { rotate: 'tangential', fontSize: 10, color: '#333' }
        },
        {   // Level 3: Sub Task Full Name
          r0: '50%', r: '85%', 
          label: { rotate: 'radial', fontSize: 10, color: '#333' }
        },
        {   // Level 4: Abbreviation (II, AI...)
          r0: '85%', r: '100%', 
          label: { rotate: 'radial', fontSize: 10, fontWeight: 'bold', color: '#333' }
        }
      ]
    },
      // --- THE OVERLAY TRICK ---
      // A transparent Pie chart placed exactly over Level 1 to draw the borders "on top"
      {
        type: 'pie',
        radius: ['13%', '30%'], // Exactly matches Level 1 radii
        silent: true,           // Ignores mouse hover so it doesn't break the sunburst interactivity
        label: { show: false }, // Hides pie labels
        animation: false,       // Prevents double-animation on load
        nodeClick: false,
        data:[
          // 10, 6, and 3 are the exact total mathematical values of the 3 main branches.
          // This ensures the overlay lines up perfectly with the Sunburst angles.
          { value: 10, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Basic
          { value: 6, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } },  // Advanced
          { value: 3, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }   // Real World
        ]
      },
      {
        type: 'pie',
        radius: ['30%', '85%'], // Spans from the 1&2 boundary to the 3&4 boundary
        silent: true,
        label: { show: false },
        animation: false,
        nodeClick: false,
        data:[
          // Basic Interactive Understanding (10)
          { value: 3, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Social
          { value: 3, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Temporal
          { value: 2, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Non-audio 
          { value: 2, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Referential
          
          // Advanced Interactive Understanding (6)
          { value: 3, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Process
          { value: 2, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Proactive
          { value: 1, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Context-aware
          
          // Real World Cases (3)
          { value: 1, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Ms
          { value: 1, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }, // Ba
          { value: 1, itemStyle: { color: 'transparent', borderColor: '#fff', borderWidth: 2 } }  // Ht
        ]
      }
  ]
  };

  
  sunburstChart.setOption(sunburstOption);

  // 4. Top-Right Bar Chart (Task Counts) Configuration
  const barTasksOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data:['ER','DC','AO','II','CE','AI','LR','AR','OPF','GPF','ST','MT','CT','SER','MER','CR','RC'],
      axisLabel: { interval: 0, rotate: 30, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '# Videos', nameTextStyle: { fontSize: 10 } },
    series:[
      {
        type: 'bar',
        emphasis: { focus: 'self' }, // Dims other bars
        label: { show: true, position: 'top', fontSize: 10, color: '#555' },
        data:[
          { value: 12, itemStyle: { color: '#8DC766' }, name: 'ER' },
          { value: 15, itemStyle: { color: '#8DC766' }, name: 'DC' },
          { value: 14, itemStyle: { color: '#8DC766' }, name: 'AO' },
          { value: 19, itemStyle: { color: '#8DC766' }, name: 'II' },
          { value: 26, itemStyle: { color: '#8DC766' }, name: 'CE' },
          { value: 16, itemStyle: { color: '#8DC766' }, name: 'AI' },
          { value: 18, itemStyle: { color: '#8DC766' }, name: 'LR' },
          { value: 15, itemStyle: { color: '#8DC766' }, name: 'AR' },
          { value: 15, itemStyle: { color: '#8DC766' }, name: 'OPF' },
          { value: 15, itemStyle: { color: '#8DC766' }, name: 'GPF' },
          { value: 20, itemStyle: { color: '#78B4E2' }, name: 'ST' },
          { value: 16, itemStyle: { color: '#78B4E2' }, name: 'MT' },
          { value: 16, itemStyle: { color: '#78B4E2' }, name: 'CT' },
          { value: 16, itemStyle: { color: '#78B4E2' }, name: 'SER' },
          { value: 16, itemStyle: { color: '#78B4E2' }, name: 'MER' },
          { value: 14, itemStyle: { color: '#78B4E2' }, name: 'CR' },
          { value: 3,  itemStyle: { color: '#F7B064' }, name: 'RC' }
        ]
      }
    ]
  };
  barChartTasks.setOption(barTasksOption);

  // 5. Bottom-Right Bar Chart (Durations) Configuration
  const barDurationOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Single-turn', 'Multi-turn'], top: 0, right: 0, itemWidth: 14, textStyle: { fontSize: 11 } },
    grid: { left: '5%', right: '5%', bottom: '15%', top: '25%', containLabel: true },
    xAxis: {
      type: 'category',
      data:['0-15s', '15-30s', '30-45s', '45-60s', '60-90s', '90-120s', '120-150s', '150-180s', '180-360s', '300-420s', '>420s'],
      axisLabel: { interval: 0, fontSize: 9 }
    },
    yAxis: { type: 'value', name: '# Videos', nameTextStyle: { fontSize: 10 } },
    series:[
      {
        name: 'Single-turn', type: 'bar', itemStyle: { color: '#A9D18E' },
        data:[4, 29, 44, 39, 41, 28, 10, 9, 11, 2, 0],
        label: { show: true, position: 'top', formatter: (p) => p.value > 0 ? p.value : '', fontSize: 9 }
      },
      {
        name: 'Multi-turn', type: 'bar', itemStyle: { color: '#9BC2E6' },
        data:[0, 2, 1, 3, 10, 9, 11, 13, 29, 14, 14],
        label: { show: true, position: 'top', formatter: (p) => p.value > 0 ? p.value : '', fontSize: 9 }
      }
    ]
  };
  barChartDuration.setOption(barDurationOption);

  // 6. Interaction / Highlighting Logic
  const taskRows = document.querySelectorAll('tr[data-task]');

  function crossHighlight(taskId) {
    if (!taskId || !taskMap[taskId]) return;
    const mapInfo = taskMap[taskId];

    // Highlight Table Row
    taskRows.forEach(el => {
      if (el.getAttribute('data-task') === taskId) el.classList.add('row-highlight');
      else el.classList.remove('row-highlight');
    });

    // Highlight Sunburst Slice (this automatically highlights ancestors due to focus: 'ancestor')
    sunburstChart.dispatchAction({ type: 'highlight', name: mapInfo.sunburst });

    // Highlight Top-Right Bar
    barChartTasks.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: mapInfo.barIdx });
  }

  function crossDownplay() {
    taskRows.forEach(el => el.classList.remove('row-highlight'));
    sunburstChart.dispatchAction({ type: 'downplay' });
    barChartTasks.dispatchAction({ type: 'downplay' });
  }

  // Bind to Table Rows
  taskRows.forEach(el => {
    el.addEventListener('mouseenter', () => crossHighlight(el.getAttribute('data-task')));
    el.addEventListener('mouseleave', crossDownplay);
  });

  // Bind to Sunburst Chart
  sunburstChart.on('mouseover', (params) => {
    let targetId = Object.keys(taskMap).find(key => taskMap[key].sunburst === params.name);
    if (targetId) crossHighlight(targetId);
  });
  sunburstChart.on('mouseout', crossDownplay);

  // Bind to Top-Right Bar Chart
  barChartTasks.on('mouseover', (params) => {
    let targetId = Object.keys(taskMap).find(key => taskMap[key].barIdx === params.dataIndex);
    if (targetId) crossHighlight(targetId);
  });
  barChartTasks.on('mouseout', crossDownplay);

  // Responsive Resizing
  window.addEventListener('resize', () => {
    sunburstChart.resize();
    barChartTasks.resize();
    barChartDuration.resize();
  });
});