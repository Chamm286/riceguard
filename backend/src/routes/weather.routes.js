const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map();

const WEATHER_LABELS = {
  0: 'Trời quang',
  1: 'Ít mây',
  2: 'Có mây',
  3: 'Nhiều mây',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn',
  55: 'Mưa phùn nặng',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  71: 'Mưa tuyết nhẹ',
  73: 'Mưa tuyết',
  75: 'Mưa tuyết dày',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào',
  82: 'Mưa rào rất to',
  95: 'Dông',
  96: 'Dông kèm mưa đá',
  99: 'Dông kèm mưa đá lớn',
};

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function riskScore(humidity, temperature, rain) {
  let score = 0;
  if (humidity >= 85) score += 40;
  else if (humidity >= 80) score += 30;
  else if (humidity >= 70) score += 15;

  if (temperature >= 24 && temperature <= 30) score += 30;
  else if (temperature > 30 && temperature <= 34) score += 15;
  else score += 5;

  if (rain >= 10) score += 30;
  else if (rain >= 5) score += 20;
  else if (rain > 0) score += 10;

  return score;
}

function levelFor(score) {
  if (score >= 75) return { level: 'cao', color: 'danger' };
  if (score >= 45) return { level: 'trung bình', color: 'warning' };
  return { level: 'thấp', color: 'success' };
}

function buildDiseaseRisks(humidity, temperature, rain) {
  const base = riskScore(humidity, temperature, rain);
  const definitions = [
    { name: 'Đạo ôn (Blast)', bonus: humidity >= 85 && temperature >= 24 && temperature <= 28 ? 10 : 0 },
    { name: 'Đốm nâu', bonus: rain >= 5 ? 8 : 0 },
    { name: 'Khô vằn', bonus: humidity >= 85 ? 6 : 0 },
    { name: 'Bạc lá', bonus: rain >= 10 ? 10 : 0 },
  ];

  return definitions
    .map((item) => {
      const risk = clamp(base + item.bonus);
      return { name: item.name, risk, ...levelFor(risk) };
    })
    .sort((a, b) => b.risk - a.risk);
}

function averageHumidityByDate(hourly) {
  const grouped = new Map();
  if (!hourly?.time || !hourly?.relative_humidity_2m) return grouped;

  hourly.time.forEach((time, index) => {
    const date = time.slice(0, 10);
    const value = hourly.relative_humidity_2m[index];
    if (value == null) return;
    const current = grouped.get(date) || { sum: 0, count: 0 };
    current.sum += value;
    current.count += 1;
    grouped.set(date, current);
  });

  const result = new Map();
  grouped.forEach((value, key) => result.set(key, value.sum / value.count));
  return result;
}

router.get('/', verifyToken, async (req, res) => {
  const lat = Number(req.query.lat) || 10.493;
  const lng = Number(req.query.lng) || 105.688;
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
    return res.json({ success: true, data: cached.data, cached: true });
  }

  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
      hourly: 'relative_humidity_2m',
      timezone: 'Asia/Bangkok',
      forecast_days: '5',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Không lấy được dữ liệu thời tiết' });
    }

    const raw = await response.json();
    const humidityByDate = averageHumidityByDate(raw.hourly);
    const current = raw.current || {};
    const currentHumidity = current.relative_humidity_2m ?? 0;
    const currentTemp = current.temperature_2m ?? 0;
    const currentRain = current.precipitation ?? 0;

    const daily = (raw.daily?.time || []).map((date, index) => ({
      date,
      weatherCode: raw.daily.weather_code?.[index] ?? null,
      weather: WEATHER_LABELS[raw.daily.weather_code?.[index]] || 'Không xác định',
      tempMax: raw.daily.temperature_2m_max?.[index] ?? null,
      tempMin: raw.daily.temperature_2m_min?.[index] ?? null,
      rain: raw.daily.precipitation_sum?.[index] ?? 0,
      rainProbability: raw.daily.precipitation_probability_max?.[index] ?? 0,
      humidity: Math.round(humidityByDate.get(date) ?? currentHumidity),
    }));

    const data = {
      source: 'Open-Meteo',
      location: { latitude: raw.latitude, longitude: raw.longitude, timezone: raw.timezone },
      current: {
        temperature: currentTemp,
        humidity: currentHumidity,
        precipitation: currentRain,
        windSpeed: current.wind_speed_10m ?? 0,
        weatherCode: current.weather_code ?? null,
        weather: WEATHER_LABELS[current.weather_code] || 'Không xác định',
        time: current.time,
      },
      daily,
      diseaseRisks: buildDiseaseRisks(currentHumidity, currentTemp, currentRain),
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data, createdAt: Date.now() });
    res.json({ success: true, data });
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(503).json({ success: false, message: 'Không kết nối được dịch vụ thời tiết' });
  }
});

module.exports = router;
