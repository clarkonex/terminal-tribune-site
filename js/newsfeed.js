// Terminal Tribune — Nachrichten-Ticker (RSS)
// Feeds aus der Telegraph App

const RSS_FEEDS = [
    'https://www.tagesschau.de/index~rss2.xml',
    'https://www.spiegel.de/schlagzeilen/index.rss',
    'https://newsfeed.zeit.de/index',
    'https://www.deutschlandfunk.de/nachrichten-100.rss',
    'https://rss.dw.com/xml/rss-de-all',
];

// RSS-to-JSON Proxy (kostenlos, CORS-frei)
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

const MAX_ITEMS = 25;

async function fetchFeed(url) {
    try {
        const res = await fetch(RSS_PROXY + encodeURIComponent(url));
        const data = await res.json();
        if (data.status === 'ok' && data.items) {
            return data.items.map(item => ({
                title: item.title,
                source: data.feed?.title || '',
                link: item.link,
                date: item.pubDate || ''
            }));
        }
    } catch (e) {
        console.warn('Feed-Fehler:', url, e);
    }
    return [];
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + ' Min.';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + ' Std.';
    return Math.floor(hrs / 24) + ' T.';
}

function renderNewsfeed(items) {
    const container = document.getElementById('newsfeed-items');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <a href="${item.link}" target="_blank" rel="noopener" class="news-item">
            <span class="news-source">${item.source}</span>
            <span class="news-title">${item.title}</span>
            <span class="news-time">${formatTimeAgo(item.date)}</span>
        </a>
    `).join('');
}

// Fallback Schlagzeilen falls RSS nicht erreichbar
const FALLBACK_NEWS = [
    { title: 'Verbindung zum Telegraphen unterbrochen', source: 'TELEGRAPH', link: '#', date: '' },
    { title: 'Morrison wartet auf Nachrichten...', source: 'Büro 404', link: '#', date: '' },
];

async function loadNewsfeed() {
    const results = await Promise.all(RSS_FEEDS.map(fetchFeed));
    let allItems = results.flat();

    // Nach Datum sortieren, neueste zuerst
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allItems.length > 0) {
        renderNewsfeed(allItems.slice(0, MAX_ITEMS));
    } else {
        renderNewsfeed(FALLBACK_NEWS);
    }
}

document.addEventListener('DOMContentLoaded', loadNewsfeed);

// Alle 10 Minuten aktualisieren
setInterval(loadNewsfeed, 10 * 60 * 1000);
