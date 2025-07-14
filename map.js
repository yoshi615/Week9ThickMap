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
// イラク周辺（アイン・アル＝アサド空軍基地付近）を中心に
// エルビル空港（イラク北部）とサアダ州（イエメン北部）が両方入る中心とズーム
const center = [44, 28];
const zoom = 3.7;

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
const usaLngLat = [-77.0369, 38.9072];  // ワシントンD.C.
const iranLngLat = [51.3890, 35.6892];  // テヘラン

// マーカー追加関数
function addMarkers(mapInstance) {
  // アメリカ（青いマーカー画像）
  const usaMarker = document.createElement('div');
  usaMarker.style.backgroundImage = 'url(images/mp_colored_blue.png)';
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
  iranMarker.style.backgroundImage = 'url(images/mp_colored_red.png)';
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
// CSV日付データとイベント管理
// ==============================

// CSVから読み取った攻撃データ
const attackEvents = [
  { date: '2020/01/08', attacks: [
    { lat: 34.3142, lng: 47.0650, attacker: 1, target: 'イラン革命防衛隊の基地' },
    { lat: 33.7866, lng: 42.4411, attacker: 2, target: '米軍基地' },
    { lat: 36.2381, lng: 43.9632, attacker: 2, target: '米軍基地' }
  ]},
  { date: '2021/10/20', attacks: [
    { lat: 33.2232, lng: 44.3168, attacker: 1, target: 'イラン系武装組織の活動拠点' },
    { lat: 33.4406, lng: 38.6150, attacker: 2, target: '米軍駐留地' }
  ]},
  { date: '2024/02/03', attacks: [
    { lat: 16.9403, lng: 43.7631, attacker: 1, target: 'フーシ派の紅海攻撃の拠点' },
    { lat: 29.5581, lng: 34.9482, attacker: 2, target: 'イスラエル領' }
  ]},
  { date: '2024/11/19', attacks: [
    { lat: 20.0, lng: 40.0, attacker: 2, target: '米艦船や商船' }
  ]}
];

// CSVから読み取った日付データ（ユニークな日付のみ）
const csvDates = [
  { index: 0, date: '2020/01/08', year: 2020, month: 1, day: 8, description: 'イラン革命防衛隊基地・米軍基地攻撃' },
  { index: 1, date: '2021/10/20', year: 2021, month: 10, day: 20, description: 'バグダッド・アル＝タンフ基地攻撃' },
  { index: 2, date: '2024/02/03', year: 2024, month: 2, day: 3, description: 'サアダ州・エイラット攻撃' },
  { index: 3, date: '2024/11/19', year: 2024, month: 11, day: 19, description: '紅海上攻撃' },
  { index: 4, date: '現在', year: 2024, month: 12, day: 1, description: '現在の状況' }
];

// ==============================
// イベントハンドラーと地図初期化
// ==============================

// 地図ロード時
map.on('load', () => {
  addMarkers(map);
  // CSVデータからのマーカーも追加（getdata.jsから呼び出される）
  if (typeof addCSVMarkers === 'function') {
    addCSVMarkers();
  }
  // 初回ロード時に時系列イベントを順番に自動再生
  playTimelineEventsSequentially();
});
// 時系列イベントを順番に自動再生
function playTimelineEventsSequentially() {
  let idx = 0;
  function playNext() {
    if (idx >= csvDates.length) return;
    timelineRange.value = idx;
    timelineRange.dispatchEvent(new Event('input'));
    const currentEvent = csvDates[idx];
    // 各イベントのアニメーション終了後に次へ
    if (currentEvent.date === '2020/01/08') {
      play20200108(() => { idx++; playNext(); });
    } else if (currentEvent.date === '2021/10/20') {
      play20211020(() => { idx++; playNext(); });
    } else if (currentEvent.date === '2024/02/03') {
      play20240203(() => { idx++; playNext(); });
    } else if (currentEvent.date === '2024/11/19') {
      play20241119(() => { idx++; playNext(); });
    } else if (currentEvent.date === '現在') {
      // 現在の時は紅海上に3つの○を永続表示
      showRedSeaCircles(true);
      idx++;
      playNext();
    } else {
      // その他は即次へ
      idx++;
      playNext();
    }
  }
  playNext();
}

// 各イベントのアニメーション完了時にコールバック
function play20200108(cb) {
  // アサド空軍基地（青）とエルビル空港（青）
  launchMultipleRocketsWithCallback(() => {
    showCircleAtPosition([42.4411, 33.7866], '#00BFFF'); // アサド空軍基地（青）
    showCircleAtPosition([43.9632, 36.2381], '#00BFFF'); // エルビル空港（青）
    setTimeout(cb, 300);
  });
}
function play20211020(cb) {
  // アル＝タンフ基地（赤）
  launchBaghdadToTanfRocketWithCallback(() => {
    showCircleAtPosition([38.6150, 33.4406], '#FF3333');
    setTimeout(cb, 300);
  });
}
function play20240203(cb) {
  // サアダ州→エイラット途中（青）、エイラット→サアダ途中（赤）
  let finished = 0;
  let partial1 = [43.7631 + (34.9482 - 43.7631) * 0.55, 16.9403 + (29.5581 - 16.9403) * 0.55];
  let partial2 = [34.9482 + (43.7631 - 34.9482) * 0.55, 29.5581 + (16.9403 - 29.5581) * 0.55];
  function onEnd() {
    finished++;
    if (finished === 2) {
      showCircleAtPosition(partial1, '#00BFFF'); // サアダ→エイラット（青）
      showCircleAtPosition(partial2, '#FF3333'); // エイラット→サアダ（赤）
      setTimeout(cb, 300);
    }
  }
  launchSaadaToEilatPartialRocketWithCallback(onEnd);
  launchEilatToSaadaPartialRocketWithCallback(onEnd);
}
function play20241119(cb) {
  // 紅海上の3点に○（既存処理）
  showRedSeaCirclesWithCallback(() => {
    setTimeout(cb, 0);
  });
}
// 指定座標に○を3秒表示
function showCircleAtPosition(lngLat) {
  // color: ピン色（青: #00BFFF, 赤: #FF3333, 金: #FFD700 など）
  const color = arguments.length >= 2 ? arguments[1] : '#FFD700';
  const circle = document.createElement('div');
  circle.className = 'event-circle';
  circle.style.position = 'absolute';
  circle.style.width = '48px';
  circle.style.height = '48px';
  circle.style.border = `4px solid ${color}`;
  circle.style.borderRadius = '50%';
  circle.style.background = color === '#FFD700' ? 'rgba(255,215,0,0.15)' : (color === '#00BFFF' ? 'rgba(0,191,255,0.15)' : 'rgba(255,51,51,0.15)');
  circle.style.zIndex = 1300;
  circle.style.pointerEvents = 'none';
  const screen = map.project(lngLat);
  circle.style.left = (screen.x - 24) + 'px';
  circle.style.top = (screen.y - 24) + 'px';
  document.body.appendChild(circle);
}

// --- アニメーション付きコールバック関数群 ---
function launchMultipleRocketsWithCallback(cb) {
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
  const start = [47.0650, 34.3142];
  const end = [42.4411, 33.7866];
  const erbil = [43.9632, 36.2381];
  let finished = 0;
  const rocketCount = 10;
  const total = 12;
  function onEnd() { finished++; if (finished === total) cb && cb(); }
  for (let i = 0; i < rocketCount; i++) {
    setTimeout(() => animateRocketWithEnd(start, end, i, 60, undefined, onEnd), i * 400);
  }
  for (let i = 0; i < 2; i++) {
    setTimeout(() => animateRocketWithEnd(start, erbil, 100 + i, 60, undefined, onEnd), rocketCount * 400 + i * 400);
  }
}
function animateRocketWithEnd(start, end, rocketIndex, rocketSize, trueEnd, cb) {
  const rocket = document.createElement('img');
  rocket.src = 'images/missile.png';
  rocket.className = 'rocket-animation';
  rocket.style.position = 'absolute';
  rocket.style.width = (rocketSize || 60) + 'px';
  rocket.style.height = (rocketSize || 60) + 'px';
  rocket.style.pointerEvents = 'none';
  rocket.style.zIndex = 1000;
  rocket.style.transition = 'none';
  rocket.style.transform = 'rotate(-90deg)';
  document.body.appendChild(rocket);
  const control = [
    (start[0] + (trueEnd || end)[0]) / 2 + 2,
    (start[1] + (trueEnd || end)[1]) / 2 + 2
  ];
  let startTime = null;
  const duration = 1800;
  function animate(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / duration, 1);
    const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
    const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
    const dt = 0.01;
    let lng2, lat2;
    if (t + dt <= 1) {
      lng2 = (1 - (t + dt)) * (1 - (t + dt)) * start[0] + 2 * (1 - (t + dt)) * (t + dt) * control[0] + (t + dt) * (t + dt) * end[0];
      lat2 = (1 - (t + dt)) * (1 - (t + dt)) * start[1] + 2 * (1 - (t + dt)) * (t + dt) * control[1] + (t + dt) * (t + dt) * end[1];
    } else {
      lng2 = (trueEnd || end)[0];
      lat2 = (trueEnd || end)[1];
    }
    const pos = map.project([lng, lat]);
    const pos2 = map.project([lng2, lat2]);
    const dx = pos2.x - pos.x;
    const dy = pos2.y - pos.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    rocket.style.left = `${pos.x - (rocketSize || 60) / 2}px`;
    rocket.style.top = `${pos.y - (rocketSize || 60) / 2}px`;
    rocket.style.transform = `rotate(${angle}deg)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rocket.remove();
      cb && cb();
    }
  }
  requestAnimationFrame(animate);
}
function launchBaghdadToTanfRocketWithCallback(cb) {
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
  const start = [44.3661, 32.9122];
  const end = [38.6150, 33.4406];
  animateRocketWithEnd(start, end, 200, 80, undefined, cb);
}
function launchSaadaToEilatPartialRocketWithCallback(cb) {
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
  const start = [43.7631, 16.9403];
  const eilat = [34.9482, 29.5581];
  const partial = [
    start[0] + (eilat[0] - start[0]) * 0.55,
    start[1] + (eilat[1] - start[1]) * 0.55
  ];
  animateRocketWithEnd(start, partial, 300, 70, eilat, cb);
}
function launchEilatToSaadaPartialRocketWithCallback(cb) {
  // 既存ロケットを消さない
  const start = [34.9482, 29.5581];
  const saada = [43.7631, 16.9403];
  const partial = [
    start[0] + (saada[0] - start[0]) * 0.55,
    start[1] + (saada[1] - start[1]) * 0.55
  ];
  animateRocketWithEnd(start, partial, 301, 70, saada, cb);
}
// 2024/11/19・現在 紅海上の3つの円を表示。isPermanent=trueなら消さずに残す
function showRedSeaCircles(isPermanent) {
  // 既存の○を消す
  document.querySelectorAll('.redsea-circle').forEach(el => el.remove());
  const positions = [
    [38.5, 20.5],
    [40.0, 19.5],
    [41.5, 21.0]
  ];
  // 既存の○を消す
  document.querySelectorAll('.redsea-circle').forEach(el => el.remove());
  // 円DOMを一度だけ作成し、地図イベント時は位置だけ更新
  const circles = positions.map(pos => {
    const circle = document.createElement('div');
    circle.className = 'redsea-circle';
    circle.style.position = 'absolute';
    circle.style.width = '48px';
    circle.style.height = '48px';
    circle.style.border = '4px solid #00BFFF';
    circle.style.borderRadius = '50%';
    circle.style.background = 'rgba(0,191,255,0.15)';
    circle.style.zIndex = 1200;
    circle.style.pointerEvents = 'none';
    document.body.appendChild(circle);
    return circle;
  });
  function updateCirclePositions() {
    positions.forEach((pos, i) => {
      const screen = map.project(pos);
      circles[i].style.left = (screen.x - 24) + 'px';
      circles[i].style.top = (screen.y - 24) + 'px';
    });
  }
  updateCirclePositions();
  if (isPermanent) {
    map.on('move', updateCirclePositions);
    map.on('resize', updateCirclePositions);
    window.__removeRedSeaCircleListeners = function() {
      map.off('move', updateCirclePositions);
      map.off('resize', updateCirclePositions);
      circles.forEach(el => el.remove());
    };
  } else {
    setTimeout(() => {
      map.off('move', updateCirclePositions);
      map.off('resize', updateCirclePositions);
      circles.forEach(el => el.remove());
    }, 3000);
  }
}

// ベースマップ切替時
document.getElementById('basemap-select').addEventListener('change', function(e) {
  const selected = e.target.value;
  map.setStyle(styles[selected]);
  map.once('styledata', () => {
    map.setCenter(center);
    map.setZoom(zoom);
    addMarkers(map);
    // CSVデータからのマーカーも再追加
    if (typeof addCSVMarkers === 'function') {
      addCSVMarkers();
    }
  });
});

// 時系列スライダーイベントハンドラー
const timelineRange = document.getElementById('timeline-range');
const timelineLabel = document.getElementById('timeline-label');
timelineRange.addEventListener('input', function() {
  const index = parseInt(timelineRange.value);
  const currentEvent = csvDates[index];
  if (currentEvent) {
    timelineLabel.textContent = currentEvent.date;
    // 2020/01/08のみロケットアニメーション
    if (currentEvent.date === '2020/01/08') {
      launchMultipleRockets();
    }
    // 2021/10/20はバグダッド南部→アル＝タンフ基地
    if (currentEvent.date === '2021/10/20') {
      launchBaghdadToTanfRocket();
    }
    // 2024/02/03はサアダ州→エイラット途中まで
    if (currentEvent.date === '2024/02/03') {
      launchSaadaToEilatPartialRocket();
      launchEilatToSaadaPartialRocket();
    }
    // 2024/11/19は紅海上に○を3つ3秒表示
    if (currentEvent.date === '2024/11/19') {
      showRedSeaCircles(false);
    } else if (currentEvent.date === '現在') {
      showRedSeaCircles(true);
    }
// 2024/11/19 紅海上に○を3つ3秒表示
function showRedSeaCircles() {
  // 既存の○を消す
  document.querySelectorAll('.redsea-circle').forEach(el => el.remove());
  // 紅海上の座標例（適宜調整）
  const positions = [
    [38.5, 20.5], // 西側
    [40.0, 19.5], // 中央
    [41.5, 21.0]  // 東側
  ];
  positions.forEach(pos => {
    const circle = document.createElement('div');
    circle.className = 'redsea-circle';
    circle.style.position = 'absolute';
    circle.style.width = '48px';
    circle.style.height = '48px';
    circle.style.border = '4px solid #00BFFF';
    circle.style.borderRadius = '50%';
    circle.style.background = 'rgba(0,191,255,0.15)';
    circle.style.zIndex = 1200;
    circle.style.pointerEvents = 'none';
    // 地図座標→画面座標
    const screen = map.project(pos);
    circle.style.left = (screen.x - 24) + 'px';
    circle.style.top = (screen.y - 24) + 'px';
    document.body.appendChild(circle);
  });
  setTimeout(() => {
    document.querySelectorAll('.redsea-circle').forEach(el => el.remove());
  }, 3000);
}
  }
});
// 2024/02/03 エイラット→サアダ州の途中までロケットアニメーション
function launchEilatToSaadaPartialRocket() {
  // 既存ロケットを消す（重複消し防止のため消さない）

  // エイラット（イスラエル南部）
  const start = [34.9482, 29.5581]; // [lng, lat]
  // サアダ州（イエメン北部、フーシ派拠点）
  const saada = [43.7631, 16.9403]; // [lng, lat]
  // 途中地点（サアダ州の55%地点）
  const partial = [
    start[0] + (saada[0] - start[0]) * 0.55,
    start[1] + (saada[1] - start[1]) * 0.55
  ];
  // ベジェ曲線の制御点をサアダ州方向に向けるためendにsaadaを渡す
  animateRocket(start, partial, 301, 70, saada);
}
// 2024/02/03 サアダ州（イエメン北部、フーシ派拠点）→エイラット（イスラエル南部）の途中までロケットアニメーション
function launchSaadaToEilatPartialRocket() {
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());
  const start = [43.7631, 16.9403];
  const eilat = [34.9482, 29.5581];
  const partial = [
    start[0] + (eilat[0] - start[0]) * 0.55,
    start[1] + (eilat[1] - start[1]) * 0.55
  ];
  window.saadaToEilatRocket = animateRocketWithReturn(start, partial, 300, 70, eilat, 'saadaToEilat');
}
// 2021/10/20 バグダッド南部（PMF拠点）→アル＝タンフ基地（シリア）ロケットアニメーション
function launchBaghdadToTanfRocket() {
  // 既存ロケットを消す
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());

  // バグダッド南部（PMF拠点）
  const start = [44.3661, 32.9122]; // [lng, lat] 例: Dora地区付近
  // アル＝タンフ基地（シリア）
  const end = [38.6150, 33.4406]; // [lng, lat] 既存データ参照

  // 1発ロケットを発射
  animateRocket(start, end, 200, 80);
}
// 初期ラベル表示
timelineLabel.textContent = csvDates[4].date;

// 攻撃ピンを全て非表示にする

// ==============================
// ロケットアニメーション
// ==============================
function launchMultipleRockets() {
  // 既存ロケットを消す
  document.querySelectorAll('.rocket-animation').forEach(el => el.remove());

  // ケルマーンシャー州（イラン）
  const start = [47.0650, 34.3142]; // [lng, lat]
  // アイン・アル＝アサド空軍基地（イラク）
  const end = [42.4411, 33.7866]; // [lng, lat]
  // エルビル空港近郊（イラク・クルド自治区）
  const erbil = [43.9632, 36.2381]; // [lng, lat]

  // アサド空軍基地へ10発
  const rocketCount = 10;
  for (let i = 0; i < rocketCount; i++) {
    setTimeout(() => animateRocket(start, end, i), i * 400); // ずらして発射
  }
  // エルビル空港近郊へ2発（アサド基地の後に発射）
  for (let i = 0; i < 2; i++) {
    setTimeout(() => animateRocket(start, erbil, 100 + i), rocketCount * 400 + i * 400);
  }
}

function animateRocket(start, end, rocketIndex) {
  // ロケット画像要素作成
  const rocket = document.createElement('img');
  rocket.src = 'images/missile.png';
  rocket.className = 'rocket-animation';
  rocket.style.position = 'absolute';
  // rocketSize: デフォルト60, 指定あればそのサイズ
  const rocketSize = arguments.length >= 4 ? arguments[3] : 60;
  rocket.style.width = rocketSize + 'px';
  rocket.style.height = rocketSize + 'px';
  // ベジェ曲線の制御点や進行方向のための本来のend座標を指定できるようにする
  const trueEnd = arguments.length >= 5 ? arguments[4] : end;
  rocket.style.pointerEvents = 'none';
  rocket.style.zIndex = 1000;
  rocket.style.transition = 'none';
  // 初期角度は進行方向に合わせて後で設定
  rocket.style.transform = 'rotate(-90deg)';
  document.body.appendChild(rocket);

  // ベジェ曲線の制御点（弧を描く）
  const control = [
    (start[0] + trueEnd[0]) / 2 + 2, // lng方向に少し膨らませる
    (start[1] + trueEnd[1]) / 2 + 2  // lat方向に少し膨らませる
  ];

  let startTime = null;
  const duration = 1800; // ms

  function animate(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / duration, 1);

    // ベジェ曲線上の点を計算
    const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
    const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];

    // 進行方向の角度を計算
    // 少し先の点を使って角度を出す
    const dt = 0.01;
    let lng2, lat2;
    if (t + dt <= 1) {
      lng2 = (1 - (t + dt)) * (1 - (t + dt)) * start[0] + 2 * (1 - (t + dt)) * (t + dt) * control[0] + (t + dt) * (t + dt) * end[0];
      lat2 = (1 - (t + dt)) * (1 - (t + dt)) * start[1] + 2 * (1 - (t + dt)) * (t + dt) * control[1] + (t + dt) * (t + dt) * end[1];
    } else {
      lng2 = trueEnd[0];
      lat2 = trueEnd[1];
    }
    const pos = map.project([lng, lat]);
    const pos2 = map.project([lng2, lat2]);
    const dx = pos2.x - pos.x;
    const dy = pos2.y - pos.y;
    // 画像の「左向き」が進行方向0度なので、+90度補正
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    rocket.style.left = `${pos.x - 30}px`;
    rocket.style.top = `${pos.y - 30}px`;
    rocket.style.transform = `rotate(${angle}deg)`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      rocket.remove();
    }
  }
  requestAnimationFrame(animate);
}

// --- 1. animateRocketWithReturnの追加（animateRocketの下などに追記） ---
function animateRocketWithReturn(start, end, rocketIndex, rocketSize, trueEnd, key) {
  const rocket = document.createElement('img');
  rocket.src = 'images/missile.png';
  rocket.className = 'rocket-animation';
  rocket.style.position = 'absolute';
  rocket.style.width = (rocketSize || 60) + 'px';
  rocket.style.height = (rocketSize || 60) + 'px';
  rocket.style.pointerEvents = 'none';
  rocket.style.zIndex = 1000;
  rocket.style.transition = 'none';
  rocket.style.transform = 'rotate(-90deg)';
  document.body.appendChild(rocket);
  const control = [
    (start[0] + (trueEnd || end)[0]) / 2 + 2,
    (start[1] + (trueEnd || end)[1]) / 2 + 2
  ];
  let startTime = null;
  const duration = 1800;
  function animate(ts) {
    if (!startTime) startTime = ts;
    const t = Math.min((ts - startTime) / duration, 1);
    const lng = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0];
    const lat = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1];
    const dt = 0.01;
    let lng2, lat2;
    if (t + dt <= 1) {
      lng2 = (1 - (t + dt)) * (1 - (t + dt)) * start[0] + 2 * (1 - (t + dt)) * (t + dt) * control[0] + (t + dt) * (t + dt) * end[0];
      lat2 = (1 - (t + dt)) * (1 - (t + dt)) * start[1] + 2 * (1 - (t + dt)) * (t + dt) * control[1] + (t + dt) * (t + dt) * end[1];
    } else {
      lng2 = (trueEnd || end)[0];
      lat2 = (trueEnd || end)[1];
    }
    const pos = map.project([lng, lat]);
    const pos2 = map.project([lng2, lat2]);
    const dx = pos2.x - pos.x;
    const dy = pos2.y - pos.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    rocket.style.left = `${pos.x - (rocketSize || 60) / 2}px`;
    rocket.style.top = `${pos.y - (rocketSize || 60) / 2}px`;
    rocket.style.transform = `rotate(${angle}deg)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      // ぶつかる位置で両方消す
      if (key === 'saadaToEilat' && window.eilatToSaadaRocket) {
        rocket.remove();
        window.eilatToSaadaRocket.remove();
        window.saadaToEilatRocket = null;
        window.eilatToSaadaRocket = null;
      } else if (key === 'eilatToSaada' && window.saadaToEilatRocket) {
        rocket.remove();
        window.saadaToEilatRocket.remove();
        window.saadaToEilatRocket = null;
        window.eilatToSaadaRocket = null;
      } else {
        rocket.remove();
      }
    }
  }
  requestAnimationFrame(animate);
  return rocket;
}

// ロケット画像の色反転フィルター適用/解除
function updateRocketImageFilter(styleKey) {
  const invert = styleKey === 'darkmatter';
  document.querySelectorAll('.rocket-animation').forEach(el => {
    el.style.filter = invert ? 'invert(1) brightness(1.2)' : '';
  });
  // 新規発射時にも反映するためグローバル変数で保持
  window.__rocketInvert = invert;
}

// 最初のスタイル適用時にフィルター更新
updateRocketImageFilter('satellite');
document.getElementById('basemap-select').addEventListener('change', function(e) {
  const selected = e.target.value;
  map.setStyle(styles[selected]);
  map.once('styledata', () => {
    map.setCenter(center);
    map.setZoom(zoom);
    addMarkers(map);
    // CSVデータからのマーカーも再追加
    if (typeof addCSVMarkers === 'function') {
      addCSVMarkers();
    }
  });
  updateRocketImageFilter(selected);
});
