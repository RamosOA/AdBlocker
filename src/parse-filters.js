const fs = require('fs').promises;
const path = require('path');

async function generateRules() {
    const rules = [];
    let id = 1;

    try {
        const filterData = await fs.readFile('filters/easylist.txt', 'utf8');
        const lines = filterData.split('\n');

        for (const line of lines) {
            if (line.startsWith('||') && !line.includes('!') && !line.includes('$')) {
                const domain = line.replace('||', '').replace('^', '').trim();
                rules.push({
                    id: id++,
                    priority: 1,
                    action: { type: "block" },
                    condition: {
                        urlFilter: `||${domain}`,
                        resourceTypes: [
                            "main_frame", "sub_frame", "stylesheet", "script", "image",
                            "font", "object", "xmlhttprequest", "ping", "media", "websocket"
                        ]
                    }
                });
            }
        }

        await fs.writeFile(
            'filters/rules.json',
            JSON.stringify(rules, null, 2),
            'utf8'
        );
        console.log(`Generadas ${rules.length} reglas con éxito`);
    } catch (error) {
        console.error('Error generando reglas:', error);
    }
}

generateRules();