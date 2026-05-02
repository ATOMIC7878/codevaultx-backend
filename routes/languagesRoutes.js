const express = require('express');
const router = express.Router();
const languages = require('../config/languages.json');

router.get('/', (req, res) => {
    res.json(languages);
});

module.exports = router;
