// -------------------------------------------- //
//          USvsIran.csvへのアクセス               //
// -------------------------------------------- //

const sheetNames = ['main'];
const csvFile = 'USvsIran.csv';
let data = {};

async function fetchData(sheetName) {
	console.log('Fetching data from', csvFile);
	try {
		const response = await fetch(csvFile);
		if (!response.ok) {
			throw new Error('Failed to fetch data');
		}
		const text = await response.text();
		const rows = text.trim().split('\n').map(row => row.split(','));
		// 最初の行を削除
		rows.shift();
		return { values: rows };
	} catch (error) {
		console.error('Error fetching data:', error);
		return null;
	}
}

// ---------------------------------------------- //
// データがすべてのシートから取得されたか確認する関数 //
// ---------------------------------------------- //
async function checkAndInit() {
	const promises = sheetNames.map(sheetName => fetchData(sheetName));
	const results = await Promise.all(promises);

	if (results.every(result => result !== null)) {
		results.forEach((result, index) => {
			data[sheetNames[index]] = result;
		});
		console.log('Data object:', data);

		// Wait for both DOM and data to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', init);
		} else {
			init();
		}
	} else {
		console.log('Failed to fetch data from some or all sheets.');
	}
}

// ---------------------------------------------- //
//            初期化関数とマーカー設置             //
// ---------------------------------------------- //
function init() {
	console.log('Initializing with data:', data);
	// map.jsの地図が読み込まれるのを待つ
	if (typeof map !== 'undefined' && map.isStyleLoaded()) {
		addCSVMarkers();
	} else {
		// 地図の読み込みを待つ
		setTimeout(() => {
			if (typeof map !== 'undefined') {
				map.on('load', addCSVMarkers);
			}
		}, 100);
	}
}

// CSVデータからマーカーを追加する関数
function addCSVMarkers() {
	if (!data.main || !data.main.values) {
		console.log('No data available for markers');
		return;
	}

	console.log('Adding CSV markers...');
	data.main.values.forEach((row, index) => {
		// CSVの列: latitude,longitude,country,month,day,year,target,description,no.
		const latStr = row[0]; // 緯度（例: "34.3142°N"）
		const lngStr = row[1]; // 経度（例: "47.0650°E"）
		const country = row[2]; // 国・地域
		const target = row[6]; // 攻撃対象
		const description = row[7]; // 説明

		// 座標の文字列を数値に変換
		const lat = parseCoordinate(latStr);
		const lng = parseCoordinate(lngStr);

		if (lat === null || lng === null) {
			console.warn(`Invalid coordinates for row ${index}:`, latStr, lngStr);
			return;
		}

		// 国・地域情報から所属を判定
		const isUSASide = isUSATerritory(country, target);
		const markerImage = isUSASide ? 'images/mp_colored_blue2.png' : 'images/mp_colored_red2.png';
		const markerColor = isUSASide ? 'アメリカ側' : 'イラン側';

		// マーカー要素を作成
		const markerElement = document.createElement('div');
		markerElement.style.backgroundImage = `url(${markerImage})`;
		markerElement.style.width = '40px';
		markerElement.style.height = '40px';
		markerElement.style.backgroundSize = 'contain';
		markerElement.style.backgroundRepeat = 'no-repeat';
		markerElement.style.backgroundPosition = 'center';
		markerElement.style.cursor = 'pointer';

		// ポップアップのテキストを作成
		const popupText = `${markerColor}\n場所: ${country}\n対象: ${target}\n詳細: ${description}`;

		// マーカーを地図に追加
		new maplibregl.Marker({ element: markerElement })
			.setLngLat([lng, lat])
			.setPopup(new maplibregl.Popup().setText(popupText))
			.addTo(map);
	});
}

// 座標文字列を数値に変換する関数
function parseCoordinate(coordStr) {
	if (!coordStr || typeof coordStr !== 'string') return null;
	
	// "34.3142°N" や "47.0650°E" の形式を想定
	const match = coordStr.match(/^([\d.]+)°([NSEW])$/);
	if (!match) return null;
	
	let value = parseFloat(match[1]);
	const direction = match[2];
	
	// 南緯と西経は負の値にする
	if (direction === 'S' || direction === 'W') {
		value = -value;
	}
	
	return value;
}

// アメリカ側の地域かどうかを判定する関数
function isUSATerritory(country, target) {
	const countryLower = (country || '').toLowerCase();
	const targetLower = (target || '').toLowerCase();
	
	// アメリカ側のキーワード
	const usaKeywords = ['米軍', '米艦船', 'イスラエル', 'アメリカ'];
	
	// イラン側のキーワード
	const iranKeywords = ['イラン', 'フーシ派', 'イラク', 'シリア', 'イエメン'];
	
	// アメリカ側のキーワードをチェック
	for (const keyword of usaKeywords) {
		if (countryLower.includes(keyword.toLowerCase()) || targetLower.includes(keyword.toLowerCase())) {
			return true;
		}
	}
	
	// デフォルトはイラン側として扱う
	return false;
}
// -------------------------------------------- //
//                さあ始めましょう               //
// -------------------------------------------- //
checkAndInit();
