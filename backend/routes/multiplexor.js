const express = require('express');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const router = express.Router();

// Path to config file - works for both deployment options
const CONFIG_PATH = process.env.MPLEX_CONFIG_PATH || '/app/multiplexor/config.yaml';
const SERVICES_PATH = path.join(__dirname, '../../multiplexor/ui/services.json');
const UI_PATH = path.join(__dirname, '../../multiplexor/ui');
// Name of the multiplexor process (default: shoes)
const MPLEX_PROCESS = process.env.MPLEX_PROCESS || 'shoes';

// Serve static files from the UI directory
router.use('/ui', express.static(UI_PATH));

// Helper function to read config
function readConfig() {
    try {
        const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
        return yaml.load(configContent) || { listen: ':443', rules: [] };
    } catch (error) {
        console.error('Error reading config:', error);
        return { listen: ':443', rules: [] };
    }
}

// Helper function to write config
function writeConfig(config) {
    try {
        const configContent = yaml.dump(config);
        fs.writeFileSync(CONFIG_PATH, configContent);
        // Restart the multiplexor process to apply changes
        require('child_process').exec(`pkill -HUP ${MPLEX_PROCESS}`);
        return true;
    } catch (error) {
        console.error('Error writing config:', error);
        return false;
    }
}

// Get multiplexor page with config
router.get('/', (req, res) => {
    const config = readConfig();
    const configYaml = fs.readFileSync(CONFIG_PATH, 'utf8');
    res.render('multiplexor', { config, configYaml });
});

// Get config as JSON
router.get('/api/config', (req, res) => {
    const config = readConfig();
    res.json(config);
});

// Get available services
router.get('/api/services', (req, res) => {
    try {
        const servicesContent = fs.readFileSync(SERVICES_PATH, 'utf8');
        const services = JSON.parse(servicesContent);
        res.json(services);
    } catch (error) {
        console.error('Error reading services:', error);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

// Update listen port
router.post('/api/listen', express.json(), (req, res) => {
    const { listen } = req.body;
    if (!listen) {
        return res.status(400).json({ success: false, message: 'Listen port is required' });
    }

    const config = readConfig();
    config.listen = listen;

    if (writeConfig(config)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, message: 'Failed to update config' });
    }
});

// Get all rules
router.get('/api/rules', (req, res) => {
    const config = readConfig();
    res.json(config.rules || []);
});

// Add a new rule
router.post('/api/rules', express.json(), (req, res) => {
    const { match, forward } = req.body;

    if (!match || !forward) {
        return res.status(400).json({
            success: false,
            message: 'Match pattern and forward destination are required'
        });
    }

    const config = readConfig();
    if (!config.rules) {
        config.rules = [];
    }

    config.rules.push({ match, forward });

    if (writeConfig(config)) {
        res.json({ success: true, rule: { match, forward } });
    } else {
        res.status(500).json({ success: false, message: 'Failed to add rule' });
    }
});

// Update a rule
router.put('/api/rules/:index', express.json(), (req, res) => {
    const index = parseInt(req.params.index);
    const { match, forward } = req.body;

    if (!match || !forward) {
        return res.status(400).json({
            success: false,
            message: 'Match pattern and forward destination are required'
        });
    }

    const config = readConfig();

    if (!config.rules || index < 0 || index >= config.rules.length) {
        return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    config.rules[index] = { match, forward };

    if (writeConfig(config)) {
        res.json({ success: true, rule: { match, forward } });
    } else {
        res.status(500).json({ success: false, message: 'Failed to update rule' });
    }
});

// Delete a rule
router.delete('/api/rules/:index', (req, res) => {
    const index = parseInt(req.params.index);

    const config = readConfig();

    if (!config.rules || index < 0 || index >= config.rules.length) {
        return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    config.rules.splice(index, 1);

    if (writeConfig(config)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false, message: 'Failed to delete rule' });
    }
});

// Save raw YAML config (for backward compatibility)
router.post('/save', express.text({ type: '*/*' }), (req, res) => {
    fs.writeFileSync(CONFIG_PATH, req.body);
    // Restart the multiplexor process to apply changes
    require('child_process').exec(`pkill -HUP ${MPLEX_PROCESS}`);
    res.redirect('/multiplexor');
});

module.exports = router;
