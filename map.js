const CONFIG = {
  center: [44, 28],
  zoom: 3.7,
  usaLngLat: [-77.0369, 38.9072],
  iranLngLat: [51.3890, 35.6892],
  animationDuration: 1800
};

const STYLES = {
  satellite: {
    version: 8,
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
        tileSize: 256,
        attribution: 'Map data &copy; <a href="https://www.google.com/intl/en_us/help/terms_maps/" target="_blank">Google</a>',
        maxzoom: 21
      }
    },
    layers: [{ id: 'google-satellite-layer', type: 'raster', source: 'google-satellite' }]
  },
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  darkmatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

const CSV_DATES = [
  { index: 0, date: '2020/01/08', description: 'イラン革命防衛隊基地・米軍基地攻撃' },
  { index: 1, date: '2021/10/20', description: 'バグダッド・アル＝タンフ基地攻撃' },
  { index: 2, date: '2024/02/03', description: 'サアダ州・エイラット攻撃' },
  { index: 3, date: '2024/11/19', description: '紅海上攻撃' },
  { index: 4, date: '現在', description: '現在の状況' }
];

let map = new maplibregl.Map({
  container: 'map',
  style: STYLES.satellite,
  center: CONFIG.center,
  zoom: CONFIG.zoom
});

function addMarkers(mapInstance) {
  const markers = [
    { lngLat: CONFIG.usaLngLat, image: 'mp_colored_blue.png', text: 'アメリカ' },
    { lngLat: CONFIG.iranLngLat, image: 'mp_colored_red.png', text: 'イラン' }
  ];

  markers.forEach(markerData => {
    const element = document.createElement('div');
    element.style.cssText = `background-image: url(images/${markerData.image}); width: 50px; height: 50px; background-size: contain; background-repeat: no-repeat; background-position: center; cursor: pointer;`;
    
    new maplibregl.Marker({ element })
      .setLngLat(markerData.lngLat)
      .setPopup(new maplibregl.Popup().setText(markerData.text))
      .addTo(mapInstance);
  });
}

function animateRocket(start, end, size = 60, trueEnd = end, callback) {
  const rocket = document.createElement('img');
  rocket.src = 'images/missile.png';
  rocket.className = 'rocket-animation';
  rocket.style.cssText = `position: absolute; width: ${size}px; height: ${size}px; pointer-events: none; z-index: 1000; transition: none;`;
  document.body.appendChild(rocket);

  const control = [(start[0] + trueEnd[0]) / 2 + 2, (start[1] + trueEnd[1]) / 2 + 2];
  let startTime = null;

  function animate(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / CONFIG.animationDuration, 1);

    // ベジェ曲線計算
    const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
    const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];

    // 角度計算
    const dt = 0.01;
    const nextT = Math.min(t + dt, 1);
    const lng2 = (1 - nextT) * (1 - nextT) * start[0] + 2 * (1 - nextT) * nextT * control[0] + nextT * nextT * end[0];
    const lat2 = (1 - nextT) * (1 - nextT) * start[1] + 2 * (1 - nextT) * nextT * control[1] + nextT * nextT * end[1];

    const pos = map.project([lng, lat]);
    const pos2 = map.project([lng2, lat2]);
    const angle = Math.atan2(pos2.y - pos.y, pos2.x - pos.x) * 180 / Math.PI + 90;
    
    rocket.style.left = `${pos.x - size / 2}px`;
    rocket.style.top = `${pos.y - size / 2}px`;
    rocket.style.transform = `rotate(${angle}deg)`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rocket.remove();
      if (callback) callback();
    }
  }
  requestAnimationFrame(animate);
}

function showCircleAtPosition(lngLat, color = '#FFD700') {
  const circle = document.createElement('div');
  circle.className = 'event-circle';
  circle.style.cssText = `position: absolute; width: 48px; height: 48px; border: 4px solid ${color}; border-radius: 50%; z-index: 1300; pointer-events: none;`;
  circle.style.background = {
    '#FFD700': 'rgba(255,215,0,0.15)',
    '#00BFFF': 'rgba(0,191,255,0.15)',
    '#FF3333': 'rgba(255,51,51,0.15)'
  }[color] || 'rgba(255,215,0,0.15)';
  document.body.appendChild(circle);

  const updatePosition = () => {
    const screen = map.project(lngLat);
    circle.style.left = (screen.x - 24) + 'px';
    circle.style.top = (screen.y - 24) + 'px';
  };

  updatePosition();
  map.on('move', updatePosition);
  map.on('resize', updatePosition);

  setTimeout(() => {
    map.off('move', updatePosition);
    map.off('resize', updatePosition);
    circle.remove();
  }, 3000);
}

function showRedSeaCircles() {
  document.querySelectorAll('.redsea-circle').forEach(el => el.remove());
  const positions = [[38.5, 20.5], [40.0, 19.5], [41.5, 21.0]];
  
  const circles = positions.map(pos => {
    const circle = document.createElement('div');
    circle.className = 'redsea-circle';
    circle.style.cssText = 'position: absolute; width: 48px; height: 48px; border: 4px solid #00BFFF; border-radius: 50%; background: rgba(0,191,255,0.15); z-index: 1200; pointer-events: none;';
    document.body.appendChild(circle);
    return circle;
  });

  const updatePositions = () => {
    positions.forEach((pos, i) => {
      const screen = map.project(pos);
      circles[i].style.left = (screen.x - 24) + 'px';
      circles[i].style.top = (screen.y - 24) + 'px';
    });
  };

  updatePositions();
  map.on('move', updatePositions);
  map.on('resize', updatePositions);
  
  setTimeout(() => {
    map.off('move', updatePositions);
    map.off('resize', updatePositions);
    circles.forEach(el => el.remove());
  }, 3000);
}

function showRedSeaCirclesWithCallback(callback) {
  document.querySelectorAll('.redsea-impact-circle').forEach(el => el.remove());
  
  const redSeaCircles = [
    { lng: 37.5, lat: 19.0, color: '#FF3333' },
    { lng: 36.8, lat: 20.5, color: '#00BFFF' },
    { lng: 38.2, lat: 17.5, color: '#FF3333' }
  ];

  const circles = redSeaCircles.map(circleData => {
    const circle = document.createElement('div');
    circle.className = 'redsea-impact-circle';
    circle.style.cssText = `position: absolute; width: 48px; height: 48px; border: 4px solid ${circleData.color}; border-radius: 50%; z-index: 1200; pointer-events: none;`;
    circle.style.background = circleData.color === '#FF3333' ? 'rgba(255,51,51,0.15)' : 'rgba(0,191,255,0.15)';
    document.body.appendChild(circle);
    return { element: circle, position: [circleData.lng, circleData.lat] };
  });

  const updatePositions = () => {
    circles.forEach(circleObj => {
      const screen = map.project(circleObj.position);
      circleObj.element.style.left = (screen.x - 24) + 'px';
      circleObj.element.style.top = (screen.y - 24) + 'px';
    });
  };

  updatePositions();
  map.on('move', updatePositions);
  map.on('resize', updatePositions);

  setTimeout(() => {
    map.off('move', updatePositions);
    map.off('resize', updatePositions);
    circles.forEach(circleObj => circleObj.element.remove());
  }, 3000);

  if (callback) callback();
}

const EVENT_HANDLERS = {
  '2020/01/08': (callback) => {
    document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
    const start = [47.0650, 34.3142];
    const end = [42.4411, 33.7866];
    const erbil = [43.9632, 36.2381];
    let finished = 0;
    const total = 12;
    
    const onEnd = () => { 
      finished++; 
      if (finished === total) {
        showCircleAtPosition([42.4411, 33.7866], '#00BFFF');
        showCircleAtPosition([43.9632, 36.2381], '#00BFFF');
        setTimeout(callback, 300);
      }
    };
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => animateRocket(start, end, 60, end, onEnd), i * 400);
    }
    for (let i = 0; i < 2; i++) {
      setTimeout(() => animateRocket(start, erbil, 60, erbil, onEnd), 4000 + i * 400);
    }
  },

  '2021/10/20': (callback) => {
    document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
    animateRocket([44.3661, 32.9122], [38.6150, 33.4406], 80, [38.6150, 33.4406], () => {
      showCircleAtPosition([38.6150, 33.4406], '#FF3333');
      setTimeout(callback, 300);
    });
  },

  '2024/02/03': (callback) => {
    document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
    let finished = 0;
    const partial1 = [43.7631 + (34.9482 - 43.7631) * 0.55, 16.9403 + (29.5581 - 16.9403) * 0.55];
    const partial2 = [34.9482 + (43.7631 - 34.9482) * 0.55, 29.5581 + (16.9403 - 29.5581) * 0.55];
    
    const onEnd = () => {
      finished++;
      if (finished === 2) {
        showCircleAtPosition(partial1, '#00BFFF');
        showCircleAtPosition(partial2, '#FF3333');
        setTimeout(callback, 300);
      }
    };
    
    // サアダ→エイラット途中
    const start1 = [43.7631, 16.9403];
    const eilat = [34.9482, 29.5581];
    animateRocket(start1, partial1, 70, eilat, onEnd);
    
    // エイラット→サアダ途中  
    const start2 = [34.9482, 29.5581];
    const saada = [43.7631, 16.9403];
    animateRocket(start2, partial2, 70, saada, onEnd);
  },

  '2024/11/19': (callback) => {
    showRedSeaCirclesWithCallback(() => {
      setTimeout(callback, 0);
    });
  }
};

function playTimelineEventsSequentially() {
  let idx = 0;
  const timelineRange = document.getElementById('timeline-range');
  
  function playNext() {
    if (idx >= CSV_DATES.length) return;
    
    timelineRange.value = idx;
    timelineRange.dispatchEvent(new Event('input'));
    
    const currentEvent = CSV_DATES[idx];
    const handler = EVENT_HANDLERS[currentEvent.date];
    
    if (handler) {
      handler(() => { idx++; playNext(); });
    } else {
      showRedSeaCircles();
      idx++;
      playNext();
    }
  }
  playNext();
}

function initializeEventHandlers() {
  // ベースマップ切替
  document.getElementById('basemap-select').addEventListener('change', (e) => {
    const selected = e.target.value;
    map.setStyle(STYLES[selected]);
    map.once('styledata', () => {
      map.setCenter(CONFIG.center);
      map.setZoom(CONFIG.zoom);
      addMarkers(map);
      if (typeof addCSVMarkers === 'function') {
        addCSVMarkers();
      }
    });
  });

  // 時系列スライダー
  const timelineRange = document.getElementById('timeline-range');
  const timelineLabel = document.getElementById('timeline-label');

  timelineRange.addEventListener('input', () => {
    const index = parseInt(timelineRange.value);
    const currentEvent = CSV_DATES[index];
    if (currentEvent) {
      timelineLabel.textContent = currentEvent.date;
      
      const handler = EVENT_HANDLERS[currentEvent.date];
      if (handler) {
        handler(() => {});
      } else {
        showRedSeaCircles();
      }
    }
  });

  // 初期ラベル設定
  timelineLabel.textContent = CSV_DATES[4].date;
}

map.on('load', () => {
  addMarkers(map);
  if (typeof addCSVMarkers === 'function') {
    addCSVMarkers();
  }
  initializeEventHandlers();
  playTimelineEventsSequentially();
});