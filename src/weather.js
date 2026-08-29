// Kickoff forecast via Open-Meteo — free, keyless, CORS-open, fetched
// straight from the browser exactly like ESPN, so it fits the no-backend
// architecture (the Brewers tracker's first-pitch forecast set the
// precedent). Two calls, both fail-fast like api.js: geocode the venue's
// zip once (memoized), then read the hourly forecast nearest kickoff.
const TZ = 'America/Chicago'

// WMO weather codes → reader-friendly labels. Unlike the baseball version,
// this one knows about snow — November football in Wisconsin.
const label = (code) =>
  code === 0 ? 'clear skies' :
  code <= 2 ? 'partly cloudy' :
  code === 3 ? 'overcast' :
  code <= 48 ? 'foggy' :
  code <= 57 ? 'drizzle' :
  code <= 67 ? 'rain' :
  code <= 77 ? 'snow' :
  code <= 82 ? 'rain showers' :
  code <= 86 ? 'snow showers' :
  'thunderstorms'

// ESPN's venue zip → coordinates, via Open-Meteo's geocoder. Zips are
// unambiguous where city names aren't (two University Parks host D1
// football); filter to US because foreign postal codes collide (54304 is
// also Lunéville, France). Memoized per zip — venues don't move.
const spots = new Map()
function locate(zip) {
  if (!spots.has(zip)) {
    const promise = (async () => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(zip)}&count=5`,
      )
      if (!res.ok) throw new Error(`Open-Meteo geocoding ${res.status}`)
      const data = await res.json()
      const hit = (data.results || []).find((r) => r.country_code === 'US')
      if (!hit) throw new Error(`No US match for zip ${zip}`)
      return { lat: hit.latitude, lon: hit.longitude }
    })().catch((err) => {
      spots.delete(zip)
      throw err
    })
    spots.set(zip, promise)
  }
  return spots.get(zip)
}

// Returns { tempF, precipPct, windMph, label } for the hour of kickoff, or
// null when the game is past Open-Meteo's 16-day range or has no zip.
// Matching in Central time is exact for any venue — the timezone only
// labels the hour strings; the instant they name is the same everywhere.
export async function fetchKickoffForecast(game) {
  if (!game.venue || !game.venue.zip) return null
  const { lat, lon } = await locate(game.venue.zip)
  const local = game.date.toLocaleString('sv-SE', { timeZone: TZ }) // "2026-09-06 18:30:00"
  const hour = `${local.slice(0, 10)}T${local.slice(11, 13)}:00`
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m' +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(TZ)}&forecast_days=16`,
  )
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const { hourly } = await res.json()
  const i = hourly.time.indexOf(hour)
  if (i === -1) return null
  return {
    tempF: Math.round(hourly.temperature_2m[i]),
    precipPct: hourly.precipitation_probability[i],
    windMph: Math.round(hourly.wind_speed_10m[i]),
    label: label(hourly.weather_code[i]),
  }
}
