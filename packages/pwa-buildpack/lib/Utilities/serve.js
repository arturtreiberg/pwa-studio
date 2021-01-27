const loadEnvironment = require('../Utilities/loadEnvironment');
const path = require('path');
const fs = require('fs');

module.exports = async function serve(dirname, options = {}) {
    const config = await loadEnvironment(dirname);
    if (config.error) {
        // loadEnvironment takes care of logging it
        throw new Error('Can not load environment config!');
    }

    const prettyLogger = require('../util/pretty-logger');
    const addImgOptMiddleware = require('./addImgOptMiddleware');
    const stagingServerSettings = config.section('stagingServer');
    const customHttpsSettings = config.section('customHttps');

    process.chdir(path.join(dirname, options.webroot || 'dist'));

    const upwardServerOptions = Object.assign(
        // defaults
        {
            bindLocal: true,
            logUrl: true
        },
        config.section('upwardJs'),
        stagingServerSettings, // overrides upward options
        {
            env: process.env,
            before(app) {
                addImgOptMiddleware(app, {
                    ...config.section('imageOptimizing'),
                    ...config.section('imageService')
                });
            }
        }
    );

    if (customHttpsSettings.key && customHttpsSettings.cert) {
        const { key, cert } = customHttpsSettings;
        if (fs.existsSync(key) && fs.existsSync(cert)) {
            prettyLogger.info(
                'Custom key and cert paths provided, creating HTTPS server.'
            );
            const ssl = {
                key: fs.readFileSync(key, 'utf8'),
                cert: fs.readFileSync(cert, 'utf8')
            };
            upwardServerOptions.https = ssl;
        } else {
            prettyLogger.warn(
                'Custom key and cert paths provided but files not found, creating HTTP server.'
            );
        }
    }

    let envPort;
    if (process.env.PORT) {
        prettyLogger.info(`PORT is set in environment: ${process.env.PORT}`);
        envPort = process.env.PORT;
    } else if (stagingServerSettings.port) {
        prettyLogger.info(
            `STAGING_SERVER_PORT is configured: ${stagingServerSettings.port}`
        );
        envPort = stagingServerSettings.port;
    }

    if (config.isProd) {
        prettyLogger.info(
            `NODE_ENV=production, will not attempt to use custom host or port`
        );

        if (envPort) {
            upwardServerOptions.port = envPort;
        } else {
            prettyLogger.warn(`No port set. Binding to OS-assigned port`);
            upwardServerOptions.port = 0;
        }
    } else {
        const customOrigin = config.section('customOrigin');
        if (customOrigin.enabled) {
            try {
                // don't require configureHost until you need to, since loading
                // the devcert library can have side effects.
                const configureHost = require('./configureHost');

                const { hostname, ports, ssl } = await configureHost(
                    Object.assign(customOrigin, {
                        dir: dirname,
                        interactive: false
                    })
                );
                upwardServerOptions.host = hostname;
                upwardServerOptions.https = ssl;
                upwardServerOptions.port = envPort || ports.staging || 0;
            } catch (e) {
                prettyLogger.error(
                    'Could not configure or access custom host. Using loopback...',
                    e.message
                );
            }
        }
    }

    const { createUpwardServer } = require('@magento/upward-js');
    prettyLogger.info('Launching UPWARD server\n');
    const server = await createUpwardServer(upwardServerOptions);
    prettyLogger.success('\nUPWARD server running.');
    return server;
};
