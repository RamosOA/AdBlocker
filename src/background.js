// Lista inicial de dominios de anuncios (respaldo)
const adDomains = [
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google.com',
    'adnxs.com', 'pubmatic.com', 'rubiconproject.com', 'openx.com', 'criteo.com', 'taboola.com',
    'outbrain.com', 'revcontent.com', 'mgid.com', 'zedo.com', 'adblade.com', 'adroll.com',
    'cuevana3.io', 'repelis24.co', 'onclickperformance.com', 'animeflv.net/ads',
    'ads.netu.tv', 'hqq.to/ads', 'waaw.to/ads', 'streamtape.com/ads' // Anuncios específicos de Netu y Streamtape
];

// Lista dinámica de dominios cargada desde múltiples fuentes
let dynamicAdDomains = [];

// Fuentes de listas de filtros
const filterLists = [
    'https://easylist.to/easylist/easylist.txt',
    'https://easylist.to/easylist/easyprivacy.txt',
    'https://fanboy.co.nz/fanboy-annoyance.txt',
    'https://raw.githubusercontent.com/reek/anti-adblock-killer/master/aak-list.txt'
];

// Dominios esenciales para reproductores (no bloquear)
const essentialDomains = [
    'animeflv.net', 'fembedhd.com', 'streamtape.com', 'mixdrop.co', 'mystream.to',
    'cuevana3.video', 'repelis24.live', 'hqq.to', 'waaw.to', 'netu.tv' // Netu y Streamtape
];

// Función para verificar si una URL pertenece a un dominio de anuncios
function isAdDomain(url) {
    if (essentialDomains.some(domain => url.includes(domain))) {
        return false;
    }
    return adDomains.some(domain => url.includes(domain)) ||
        dynamicAdDomains.some(domain => url.includes(domain));
}

// Función para cargar listas externas
function loadExternalAdLists() {
    dynamicAdDomains = [];
    const fetchPromises = filterLists.map(url =>
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
                return response.text();
            })
            .then(data => {
                const lines = data.split('\n');
                const domains = lines
                    .filter(line => line.startsWith('||') && !line.includes('$') && !line.includes('!'))
                    .map(line => line.replace('||', '').replace('^', '').trim())
                    .filter(domain => domain.length > 0);
                return domains;
            })
            .catch(error => {
                console.error(`Error al cargar ${url}:`, error);
                return [];
            })
    );

    Promise.all(fetchPromises)
        .then(results => {
            dynamicAdDomains = [...new Set([].concat(...results))];
            console.log(`Cargados ${dynamicAdDomains.length} dominios desde listas externas`);
        });
}

// Bloqueo de solicitudes sospechosas
chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if ((details.type === 'sub_frame' || details.type === 'popup' || details.type === 'script' || details.type === 'xmlhttprequest') && isAdDomain(details.url)) {
            console.log(`Bloqueada solicitud: ${details.url}`);
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);

// Detección y cierre de pestañas sospechosas
chrome.tabs.onCreated.addListener((tab) => {
    if (tab.url && isAdDomain(tab.url)) {
        console.log(`Cerrando pestaña de pop-under: ${tab.url}`);
        chrome.tabs.remove(tab.id, () => {
            if (chrome.runtime.lastError) {
                console.log(`Error al cerrar pestaña: ${chrome.runtime.lastError.message}`);
            }
        });
    }
});

// Registro al instalar y carga inicial
chrome.runtime.onInstalled.addListener(() => {
    console.log('Super Ad-Blocker instalado');
    loadExternalAdLists();
});

// Actualizar cada 24 horas
setInterval(loadExternalAdLists, 24 * 60 * 60 * 1000);