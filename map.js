// ベースマップスタイル定義
const styles = {
  satellite: {
    version: 8,
    sources: {
      'google-satellite': {
        type: 'raster',
        tiles: [
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        ],
        tileSize: 256,
        attribution: 'Map data &copy; <a href="https://www.google.com/intl/en_us/help/terms_maps/" target="_blank">Google</a>',
        maxzoom: 21
      }
    },
    layers: [
      {
        id: 'google-satellite-layer',
        type: 'raster',
        source: 'google-satellite'
      }
    ]
  },
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  darkmatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

// 初期中心・ズーム
const center = [-30, 40];
const zoom = 2.2;

// マップ初期化
let map = new maplibregl.Map({
  container: 'map',
  style: styles.satellite,
  center: center,
  zoom: zoom
});

// マーカー追加関数
function addMarkers(mapInstance) {
  // アメリカ
  new maplibregl.Marker({ color: 'blue' })
    .setLngLat([-100, 40])
    .setPopup(new maplibregl.Popup().setText('アメリカ'))
    .addTo(mapInstance);
  // イラン
  new maplibregl.Marker({ color: 'red' })
    .setLngLat([53, 32])
    .setPopup(new maplibregl.Popup().setText('イラン'))
    .addTo(mapInstance);
}

// アメリカとイランの座標（グローバルに定義）
const usaLngLat = [-100, 40];
const iranLngLat = [53, 32];

// B2飛行機アニメーション関数
function flyB2Plane() {
  const plane = document.getElementById('b2-plane');
  plane.style.display = 'block';
  plane.style.opacity = '1';

  function lngLatToScreen(lngLat) {
    const p = map.project(lngLat);
    return { x: p.x, y: p.y };
  }
  function getAngle(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // 画像の「左が上、右が下」なので進行方向-180度
    return Math.atan2(dy, dx) * 180 / Math.PI - 180;
  }

  // スタート・ゴールの画面座標
  let start = lngLatToScreen(usaLngLat);   // アメリカ
  let mid = lngLatToScreen(iranLngLat);    // イラン

  // 直線移動→旋回→直線移動
  let t = 0;
  let phase = 0; // 0:アメリカ→イラン, 1:旋回, 2:イラン→アメリカ

  // 旋回用パラメータ
  const turnSteps = 120; // ←大きくするとより滑らか
  let turnCount = 0;
  let turnCenter = { x: mid.x, y: mid.y }; // イラン上空で旋回
  let turnRadius = 60;
  let turnStartAngle = getAngle(start, mid) * Math.PI / 180;
  let turnEndAngle = turnStartAngle + Math.PI; // 半円旋回

  let angle = getAngle(start, mid);

  function easeInOutSine(x) {
    // 0～1の値をなめらかに補間
    return -(Math.cos(Math.PI * x) - 1) / 2;
  }

  function animate() {
    if (phase === 0) {
      t += 0.008; // ゆっくり
      if (t > 1) {
        t = 1;
        phase = 1;
      }
      // イージングでなめらかに
      const tt = easeInOutSine(t);
      const x = start.x + (mid.x - start.x) * tt;
      const y = start.y + (mid.y - start.y) * tt;
      angle = getAngle({ x, y }, mid);
      plane.style.left = (x - 24) + 'px';
      plane.style.top = (y - 24) + 'px';
      plane.style.transform = `rotate(${angle}deg)`;
    } else if (phase === 1) {
      turnCount++;
      if (turnCount > turnSteps) {
        turnCount = turnSteps;
        phase = 2;
        t = 1;
      }
      // イージングでなめらかに
      const tt = easeInOutSine(turnCount / turnSteps);
      const theta = turnStartAngle + (Math.PI * tt);
      const x = turnCenter.x + turnRadius * Math.cos(theta);
      const y = turnCenter.y + turnRadius * Math.sin(theta);
      angle = theta * 180 / Math.PI - 45;
      plane.style.left = (x - 24) + 'px';
      plane.style.top = (y - 24) + 'px';
      plane.style.transform = `rotate(${angle}deg)`;
    } else if (phase === 2) {
      t -= 0.008;
      if (t < 0) {
        t = 0;
        plane.style.display = 'none';
        return;
      }
      // イージングでなめらかに
      const tt = easeInOutSine(1 - t);
      const x = mid.x + (start.x - mid.x) * tt;
      const y = mid.y + (start.y - mid.y) * tt;
      angle = getAngle({ x, y }, start);
      plane.style.left = (x - 24) + 'px';
      plane.style.top = (y - 24) + 'px';
      plane.style.transform = `rotate(${angle}deg)`;
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// 地図ロード時
map.on('load', () => {
  addMarkers(map);
});

// ベースマップ切替時
document.getElementById('basemap-select').addEventListener('change', function(e) {
  const selected = e.target.value;
  map.setStyle(styles[selected]);
  map.once('styledata', () => {
    map.setCenter(center);
    map.setZoom(zoom);
    addMarkers(map);
  });
});

// 2005年に合わせたら飛行機を飛ばす
const timelineRange = document.getElementById('timeline-range');
const timelineLabel = document.getElementById('timeline-label');
timelineRange.addEventListener('input', function() {
  timelineLabel.textContent = timelineRange.value;
  if (timelineRange.value === "2005") {
    flyB2Plane();
  } else {
    document.getElementById('b2-plane').style.display = 'none';
  }
});
