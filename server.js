const instana = require('@instana/collector');

// Initialize tracing before loading other modules
instana({
    tracing: {
        enabled: true
    }
});

const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

// Configure application logging
const logger = pino({
    level: 'info',
    prettyPrint: false,
    useLevelLabels: true
});

const expLogger = expPino({
    logger: logger
});

// MongoDB
let db;
let collection;
let mongoConnected = false;

const app = express();

app.use(expLogger);

// Configure response headers
app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

// Instana tracing
app.use((req, res, next) => {
    const dcs = [
        'asia-northeast2',
        'asia-south1',
        'europe-west3',
        'us-east1',
        'us-west1'
    ];

    const span = instana.currentSpan();

    if (span) {
        span.annotate(
            'custom.sdk.tags.datacenter',
            dcs[Math.floor(Math.random() * dcs.length)]
        );
    }

    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Health endpoint - Startup and Liveness probes
app.get('/health', (req, res) => {
    res.status(200).json({
        app: 'OK',
        mongo: mongoConnected
    });
});

// Readiness endpoint - Verify MongoDB connectivity
app.get('/ready', async (req, res) => {
    try {
        if (!mongoConnected || !db) {
            return res.status(503).json({
                app: 'NOT READY',
                mongo: false
            });
        }

        await db.command({ ping: 1 });

        res.status(200).json({
            app: 'READY',
            mongo: true
        });
    } catch (error) {
        res.status(503).json({
            app: 'NOT READY',
            mongo: false
        });
    }
});

// Retrieve all products
app.get('/products', (req, res) => {
    if (mongoConnected) {
        collection.find({}).toArray().then((products) => {
            res.json(products);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send('Internal server error');
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// Retrieve product by SKU
app.get('/product/:sku', (req, res) => {
    if (mongoConnected) {
        const delay = process.env.GO_SLOW || 0;

        setTimeout(() => {
            collection.findOne({
                sku: req.params.sku
            }).then((product) => {
                req.log.info('product', product);

                if (product) {
                    res.json(product);
                } else {
                    res.status(404).send('SKU not found');
                }
            }).catch((e) => {
                req.log.error('ERROR', e);
                res.status(500).send('Internal server error');
            });
        }, delay);
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// Retrieve products by category
app.get('/products/:cat', (req, res) => {
    if (mongoConnected) {
        collection.find({
            categories: req.params.cat
        }).sort({
            name: 1
        }).toArray().then((products) => {
            if (products) {
                res.json(products);
            } else {
                res.status(404).send(
                    'No products for ' + req.params.cat
                );
            }
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send('Internal server error');
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// Retrieve all categories
app.get('/categories', (req, res) => {
    if (mongoConnected) {
        collection.distinct('categories').then((categories) => {
            res.json(categories);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send('Internal server error');
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// Search products by name and description
app.get('/search/:text', (req, res) => {
    if (mongoConnected) {
        collection.find({
            '$text': {
                '$search': req.params.text
            }
        }).toArray().then((hits) => {
            res.json(hits);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send('Internal server error');
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// Establish MongoDB connection
async function mongoConnect() {
    try {
        const mongoURL = process.env.MONGO_URL;

        if (!mongoURL) {
            throw new Error('MONGO_URL is not configured');
        }

        const client = await MongoClient.connect(mongoURL, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });

        db = client.db('catalogue');
        collection = db.collection('products');

        mongoConnected = true;

        logger.info('MongoDB connected successfully');

    } catch (error) {
        mongoConnected = false;

        logger.error('MongoDB connection failed: ' + error.name);

        setTimeout(mongoLoop, 2000);
    }
}

// MongoDB connection retry loop
function mongoLoop() {
    mongoConnect().catch((e) => {
        logger.error('MongoDB connection error: ' + e.name);
        setTimeout(mongoLoop, 2000);
    });
}

// Initialize MongoDB connection
mongoLoop();

// Start Catalogue application
const port = process.env.CATALOGUE_SERVER_PORT || '8080';

app.listen(port, () => {
    logger.info('Catalogue application started on port ' + port);
});