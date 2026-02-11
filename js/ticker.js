// Terminal Tribune — Börsenticker (Finnhub API)
// Kostenloser API-Key von https://finnhub.io
// Strategie: Sofort Demo-Daten zeigen, dann schrittweise echte Kurse einblenden

const FINNHUB_API_KEY = 'd65qq39r01qiish0nvm0d65qq39r01qiish0nvmg';

// Symbole die zu Morrisons Welt passen — echte Ticker, Retro-Namen
const SYMBOLS = [
    { symbol: 'GLD',     display: 'Gold' },
    { symbol: 'SLV',     display: 'Silber' },
    { symbol: 'X',       display: 'US Steel' },
    { symbol: 'XOM',     display: 'Standard Oil' },
    { symbol: 'F',       display: 'Ford' },
    { symbol: 'KO',      display: 'Coca-Cola' },
    { symbol: 'PM',      display: 'Philip Morris' },
    { symbol: 'GE',      display: 'General Electric' },
    { symbol: 'BA',      display: 'Boeing' },
    { symbol: 'JPM',     display: 'JP Morgan' },
    { symbol: 'FCX',     display: 'Kupfer' },
    { symbol: 'WEAT',    display: 'Weizen' },
    { symbol: 'JO',      display: 'Kaffee' },
    { symbol: 'RGR',     display: 'Ruger' },
    { symbol: 'BRK.B',   display: 'Berkshire' },
];

// Fallback Demo-Daten: Morrison's Markt, 1937
// Preise aus der Terminal Tribune App
const TICKER_1937 = [
    { symbol: 'Gold',         low: 35.00,  high: 35.50 },
    { symbol: 'Silber',       low: 0.43,   high: 0.47 },
    { symbol: 'Bourbon',      low: 2.40,   high: 2.80 },
    { symbol: 'Lucky Strike', low: 0.13,   high: 0.16 },
    { symbol: 'Ford V8',      low: 7.50,   high: 8.20 },
    { symbol: 'US Steel',     low: 60.00,  high: 65.00 },
    { symbol: 'Standard Oil', low: 1.15,   high: 1.25 },
    { symbol: 'Kupfer',       low: 0.12,   high: 0.14 },
    { symbol: 'Weizen/bu',    low: 1.00,   high: 1.15 },
    { symbol: 'Colt .45',     low: 0.02,   high: 0.03 },
    { symbol: 'Pomade',       low: 0.30,   high: 0.40 },
    { symbol: 'Fedora',       low: 4.25,   high: 5.00 },
    { symbol: 'Remington',    low: 22.00,  high: 25.00 },
    { symbol: 'Rindfleisch',  low: 0.18,   high: 0.22 },
    { symbol: 'Kaffee/lb',    low: 0.21,   high: 0.26 },
];

// Aktueller Ticker-Zustand
let currentDemoItems = [];
let currentLiveItems = [];
let liveAvailable = false;

function generateDemoData() {
    return TICKER_1937.map(item => {
        const price = item.low + Math.random() * (item.high - item.low);
        const change = (Math.random() * 5 - 2.5);
        return {
            symbol: item.symbol,
            price: '$' + price.toFixed(2),
            change: (change >= 0 ? '+' : '') + change.toFixed(1) + '%',
            up: change >= 0,
            live: false
        };
    });
}

function renderTicker(data) {
    const track = document.getElementById('ticker-track');
    if (!track || data.length === 0) return;

    function renderItems() {
        return data.map(item => `
            <span class="ticker-item">
                <span class="ticker-symbol">${item.symbol}</span>
                <span class="ticker-price">${item.price}</span>
                <span class="ticker-change ${item.up ? 'ticker-up' : 'ticker-down'}">
                    ${item.up ? '\u25B2' : '\u25BC'} ${item.change}
                </span>
            </span>
            <span class="ticker-sep">\u2022</span>
        `).join('');
    }

    // Doppelt für nahtlose Endlosschleife
    track.innerHTML = renderItems() + renderItems();
}

// Mischt Demo- und Live-Daten: Live-Items ersetzen schrittweise Demo-Items
function buildMixedTicker() {
    if (currentLiveItems.length === 0) {
        return currentDemoItems;
    }

    // Live-Daten durchmischen mit verbleibenden Demo-Daten
    const liveCount = currentLiveItems.length;
    const demoCount = Math.max(0, currentDemoItems.length - liveCount);
    const demoSlice = currentDemoItems.slice(0, demoCount);

    // Abwechselnd mischen: Live, Demo, Live, Demo...
    const mixed = [];
    let li = 0, di = 0;
    while (li < currentLiveItems.length || di < demoSlice.length) {
        if (li < currentLiveItems.length) mixed.push(currentLiveItems[li++]);
        if (di < demoSlice.length) mixed.push(demoSlice[di++]);
    }

    return mixed;
}

async function fetchQuote(symbol) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const res = await fetch(url);
    return res.json();
}

async function loadLiveData() {
    if (FINNHUB_API_KEY === 'DEIN_API_KEY_HIER') {
        return;
    }

    try {
        const results = [];

        // Sequentiell laden um Rate-Limit (60/min) einzuhalten
        for (const { symbol, display } of SYMBOLS) {
            try {
                const data = await fetchQuote(symbol);

                if (data.c && data.c > 0) {
                    const changePercent = data.dp || 0;
                    results.push({
                        symbol: display,
                        price: '$' + data.c.toFixed(2),
                        change: (changePercent >= 0 ? '+' : '') + changePercent.toFixed(1) + '%',
                        up: changePercent >= 0,
                        live: true
                    });

                    // Nach jedem geladenen Kurs sofort den Ticker aktualisieren
                    currentLiveItems = results.slice();
                    renderTicker(buildMixedTicker());
                }
            } catch (e) {
                console.warn(`Ticker: Fehler bei ${symbol}`, e);
            }
        }

        if (results.length > 0) {
            liveAvailable = true;
            currentLiveItems = results;
        } else {
            // API liefert nichts — zurück zu Demo
            liveAvailable = false;
            currentLiveItems = [];
        }

        renderTicker(buildMixedTicker());

    } catch (e) {
        console.warn('Ticker: API nicht erreichbar, falle zurück auf Demo', e);
        liveAvailable = false;
        currentLiveItems = [];
        renderTicker(buildMixedTicker());
    }
}

// Sofort mit Demo-Daten starten
document.addEventListener('DOMContentLoaded', () => {
    currentDemoItems = generateDemoData();
    renderTicker(currentDemoItems);

    // Dann im Hintergrund echte Daten laden
    loadLiveData();
});

// Alle 5 Minuten aktualisieren
setInterval(() => {
    currentDemoItems = generateDemoData();
    loadLiveData();
}, 5 * 60 * 1000);
