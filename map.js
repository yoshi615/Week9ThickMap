// ==============================
// 地図設定とベースマップスタイル
// ==============================

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

// 初期中心・ズーム設定
const center = [-30, 40];
const zoom = 2.2;

// マップ初期化
let map = new maplibregl.Map({
  container: 'map',
  style: styles.satellite,
  center: center,
  zoom: zoom
});

// ==============================
// マーカーとイベント座標の設定
// ==============================

// アメリカとイランの座標（グローバルに定義）
const usaLngLat = [-100, 40];
const iranLngLat = [53, 32];

// マーカー追加関数
function addMarkers(mapInstance) {
  // アメリカ（青いマーカー画像）
  const usaMarker = document.createElement('div');
  usaMarker.style.backgroundImage = 'url(images/mp_colored_blue2.png)';
  usaMarker.style.width = '50px';
  usaMarker.style.height = '50px';
  usaMarker.style.backgroundSize = 'contain';
  usaMarker.style.backgroundRepeat = 'no-repeat';
  usaMarker.style.backgroundPosition = 'center';
  usaMarker.style.cursor = 'pointer';
  
  new maplibregl.Marker({ element: usaMarker })
    .setLngLat(usaLngLat)
    .setPopup(new maplibregl.Popup().setText('アメリカ'))
    .addTo(mapInstance);

  // イラン（赤いマーカー画像）
  const iranMarker = document.createElement('div');
  iranMarker.style.backgroundImage = 'url(images/mp_colored_red2.png)';
  iranMarker.style.width = '50px';
  iranMarker.style.height = '50px';
  iranMarker.style.backgroundSize = 'contain';
  iranMarker.style.backgroundRepeat = 'no-repeat';
  iranMarker.style.backgroundPosition = 'center';
  iranMarker.style.cursor = 'pointer';
  
  new maplibregl.Marker({ element: iranMarker })
    .setLngLat(iranLngLat)
    .setPopup(new maplibregl.Popup().setText('イラン'))
    .addTo(mapInstance);
}

// ==============================
// B2爆撃機アニメーション（2005年イベント）
// ==============================

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
      if (t <= 0) {
        t = 0;
        plane.style.display = 'none';
        return;
      }
      // イージングでなめらかに（帰還時はイラン→アメリカなので座標を逆算）
      const tt = easeInOutSine(t);
      const x = mid.x + (start.x - mid.x) * (1 - tt);
      const y = mid.y + (start.y - mid.y) * (1 - tt);
      // 帰還時の角度計算を修正（アメリカ方向を向く）
      angle = getAngle({ x, y }, start);
      plane.style.left = (x - 24) + 'px';
      plane.style.top = (y - 24) + 'px';
      plane.style.transform = `rotate(${angle}deg)`;
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// ==============================
// ロケットアニメーション（2025年イベント）
// ==============================

// ロケットアニメーション関数
function flyRocket() {
  // 既存のロケット画像を非表示
  document.getElementById('rocket').style.display = 'none';

  // 既存の複製ロケットを削除
  document.querySelectorAll('.rocket-clone').forEach(e => e.remove());

  // 6個のロケットを発射
  const rocketCount = 6;
  const angleStep = 40; // 弧の角度のずらし幅（度数、調整可）
  const baseOffset = -100; // 弧の高さの基準（調整可）

  for (let i = 0; i < rocketCount; i++) {
    // クローンを作成
    const rocket = document.getElementById('rocket').cloneNode(true);
    rocket.classList.add('rocket-clone');
    rocket.style.display = 'block';
    rocket.style.opacity = '1';
    rocket.style.position = 'absolute';
    rocket.style.pointerEvents = 'none';
    rocket.style.zIndex = 11;
    rocket.id = ''; // id重複防止
    document.body.appendChild(rocket);

    // 角度ずらし（-100〜+100pxの範囲で弧の高さを変える）
    const angleOffset = (i - (rocketCount - 1) / 2) * angleStep;
    const rad = angleOffset * Math.PI / 180;

    function lngLatToScreen(lngLat) {
      const p = map.project(lngLat);
      return { x: p.x, y: p.y };
    }
    function getAngle(from, to) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      // 画像の「下が進行方向」なら+90度
      return Math.atan2(dy, dx) * 180 / Math.PI + 90;
    }

    // イラン→アメリカ
    let start = lngLatToScreen(iranLngLat);
    let end = lngLatToScreen(usaLngLat);

    // 弧のコントロールポイント（中間点を上方向にずらす）
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    // 垂直方向の単位ベクトル
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    // コントロールポイントを中心から垂直方向にずらす
    const control = {
      x: midX,
      y: midY - Math.abs(baseOffset + 60 * Math.sin(rad)) // 上方向にずらす（マイナスで上）
    };

    let t = 0;
    function easeInOutSine(x) {
      return -(Math.cos(Math.PI * x) - 1) / 2;
    }
    function getBezierPoint(t) {
      // 2次ベジェ曲線
      const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
      const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
      return { x, y };
    }
    function getBezierAngle(t) {
      // ベジェ曲線の接線方向
      const dx = 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x);
      const dy = 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y);
      return Math.atan2(dy, dx) * 180 / Math.PI + 90;
    }
    function animate() {
      t += 0.008;
      if (t > 1) {
        t = 1;
        // アニメーション終了時の処理
        rocket.remove();
        return;
      }
      const tt = easeInOutSine(t);
      const pos = getBezierPoint(tt);
      const bezierAngle = getBezierAngle(tt);
      rocket.style.left = (pos.x - 30) + 'px';
      rocket.style.top = (pos.y - 30) + 'px';
      rocket.style.transform = `rotate(${bezierAngle}deg)`;
      // フェードアウトをゴール直前から始める
      if (t > 0.85) {
        rocket.style.opacity = String(1 - (t - 0.85) / 0.15);
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
}

// ==============================
// イベントハンドラーと地図初期化
// ==============================

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

// 時系列スライダーイベントハンドラー
// 2005年でB2爆撃機、2025年でロケット発射
const timelineRange = document.getElementById('timeline-range');
const timelineLabel = document.getElementById('timeline-label');
timelineRange.addEventListener('input', function() {
  timelineLabel.textContent = timelineRange.value;
  if (timelineRange.value === "2005") {
    flyB2Plane();
  } else {
    document.getElementById('b2-plane').style.display = 'none';
  }
  if (timelineRange.value === "2025") {
    flyRocket();
  } else {
    document.getElementById('rocket').style.display = 'none';
  }
});
