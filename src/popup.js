document.getElementById('toggle').addEventListener('click', () => {
    chrome.storage.local.get(['enabled'], (result) => {
        const isEnabled = !result.enabled;
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: isEnabled ? [] : ['ruleset_main'],
            enableRulesetIds: isEnabled ? ['ruleset_main'] : []
        }, () => {
            chrome.storage.local.set({ enabled: isEnabled });
            alert(`Ad-Blocker ${isEnabled ? 'activado' : 'desactivado'}`);
        });
    });
});