(function () {
    'use strict';

    // Lista de dominios de anuncios
    const adDomains = [
        'doubleclick.net', 'googlesyndication.com', 'adservice.google.com', 'youtube.com/get_video_info',
        'taboola.com', 'outbrain.com', 'revcontent.com', 'mgid.com', 'zedo.com',
        'cuevana3.io', 'repelis24.co', 'onclickperformance.com', 'animeflv.net/ads',
        'ads.netu.tv', 'hqq.to/ads', 'waaw.to/ads', 'streamtape.com/ads'
    ];

    // Dominios esenciales para reproductores
    const essentialDomains = [
        'animeflv.net', 'fembedhd.com', 'streamtape.com', 'mixdrop.co', 'mystream.to',
        'cuevana3.video', 'repelis24.live', 'hqq.to', 'waaw.to', 'netu.tv'
    ];

    // Función para verificar dominios de anuncios
    function isAdDomain(url) {
        if (essentialDomains.some(domain => url.includes(domain))) {
            return false;
        }
        return adDomains.some(domain => url.includes(domain));
    }

    // Evitar detección de ad-blockers
    const spoofAntiAdblock = () => {
        const props = ['canRunAds', 'adBlockEnabled', 'isAdBlockActive', 'adblock', 'adsBlocked',
            'canShowAds', 'isAdBlocked', 'adBlockDetected', 'adblockerDetected', 'isAdBlockerActive',
            'netuAdBlock', 'streamtapeAdBlock']; // Propiedades específicas de Netu y Streamtape
        props.forEach(prop => {
            Object.defineProperty(window, prop, {
                get: () => false,
                set: () => { },
                configurable: false
            });
        });

        // Neutralizar detección de DevTools
        Object.defineProperty(window, 'console', {
            get: () => ({ log: () => { }, error: () => { }, warn: () => { } }),
            set: () => { }
        });

        // Simular carga de anuncio falso más realista
        const fakeAd = document.createElement('div');
        fakeAd.id = 'ad-container';
        fakeAd.className = 'ad-loaded';
        fakeAd.style.width = '300px';
        fakeAd.style.height = '250px';
        fakeAd.innerHTML = '<script>window.adsLoaded = true; window.adblockDetected = false;</script>';
        document.body.appendChild(fakeAd);

        // Permitir scripts esenciales mientras bloqueamos anuncios
        window.document.createElement = new Proxy(document.createElement, {
            apply(target, thisArg, args) {
                const element = Reflect.apply(target, thisArg, args);
                if (args[0].toLowerCase() === 'script' && element.src) {
                    if (essentialDomains.some(domain => element.src.includes(domain))) {
                        console.log(`Permitido script esencial: ${element.src}`);
                        return element;
                    } else if (isAdDomain(element.src)) {
                        console.log(`Bloqueado script de anuncio: ${element.src}`);
                        element.remove();
                    }
                }
                return element;
            }
        });

        // Bloquear pop-unders
        window.open = new Proxy(window.open, {
            apply(target, thisArg, args) {
                const url = args[0];
                if (url && isAdDomain(url)) {
                    console.log(`Bloqueado pop-under: ${url}`);
                    return null;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });

        // Neutralizar detectores dinámicos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && (node.id.includes('adblock') || node.className.includes('adblock') || node.className.includes('ads'))) {
                        node.style.display = 'none';
                        console.log(`Neutralizado detector: ${node.id}.${node.className}`);
                    }
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };

    // Eliminar anuncios dinámicos del DOM
    const removeAdsFromDOM = () => {
        const adSelectors = [
            'iframe[src*="ads"]', 'div[id*="ad-"]', 'div[class*="ad-"]', 'div[class*="banner"]',
            '[data-ad-slot]', '.ad-container', '.advertisement', '.adsbygoogle',
            '.ytp-ad-module', '.video-ads', '.ytp-ad-player-overlay', // YouTube
            '.adblock-message', '.anti-adblock', '.popup-ad', // Anti-adblock y pop-ups
            '#netu-ad-overlay', '.streamtape-ad' // Netu y Streamtape
        ];

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                document.querySelectorAll(adSelectors.join(',')).forEach(el => {
                    el.style.display = 'none';
                    console.log(`Ocultado elemento: ${el.tagName}.${el.className}`);
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // Limpieza inicial
        document.querySelectorAll(adSelectors.join(',')).forEach(el => el.style.display = 'none');
    };

    // Bloquear notificaciones push
    Object.defineProperty(Notification, 'requestPermission', {
        value: () => Promise.resolve('denied'),
        writable: false
    });

    // Ejecutar funciones
    spoofAntiAdblock();
    removeAdsFromDOM();
})();