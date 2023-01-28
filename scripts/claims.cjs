/**
 * This script enables viewing and updating a user's claims.
 * It's a bit clumsy, but there is no Firebase console support for this,
 * so it's what we've got. Run it with `node claims.cjs`
 */
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

// If there aren't any arguments, bail.
if (process.argv.length <= 2) {
    console.log('usage:');
    console.log('node claims.cjs [email] [dev|prod] [+|-] [publisher|admin]');
    return;
}

// Get the requested email and bail if none was provided.
const email = process.argv[2];
if (email === undefined) {
    console.log('No email provided.');
    return;
}

// Get the project, either "dev" or "prod"
const project = process.argv[3];
if (project !== 'dev' && project !== 'prod') {
    console.log(
        `Expected 'dev' or 'prod' after email, but received ${project}`
    );
    return;
}

// Get the operation and bail if there wasn't one.
const operation = process.argv[4];
if (operation !== undefined && operation !== '+' && operation !== '-') {
    console.log('Expected an + or - operation');
    return;
}

// Get the field
const privilege = process.argv[5];
if (
    privilege !== undefined &&
    privilege !== 'publisher' &&
    privilege !== 'admin'
) {
    console.log("Expected 'publisher' or 'admin' after the operation");
    return;
}

console.log('Reading service key...');

const serviceKeyPath = `../firebase-${project}-service-key.json`;

// Log in with the secret service key generated in the Firebase service accounts console.
const serviceAccount = require(`../bookish-${project}-firebase-service-key.json`);

if (serviceAccount === undefined) {
    console.log(`Couldn't find service key at ${serviceKeyPath}`);
    return;
}

console.log('Connecting to Firebase with key...');

// Initialize the SDK with the service account.
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Add the publisher claim to the email address.
getAuth()
    .getUserByEmail(email)
    .then((user) => {
        // Add incremental custom claim without overwriting existing claims.
        let currentCustomClaims = user.customClaims;

        // Reading? Just print.
        if (operation === undefined) {
            console.log(`${email}'s privileges are...`);
            console.log(currentCustomClaims);
        }
        // Otherwise, update.
        else {
            if (currentCustomClaims === undefined) currentCustomClaims = {};
            currentCustomClaims[privilege] = operation === '+';
            // Add custom claims for additional privileges.
            getAuth()
                .setCustomUserClaims(user.uid, currentCustomClaims)
                .then(() => {
                    console.log(
                        `Successfully ${
                            operation === '+' ? 'added' : 'removed'
                        } '${privilege}' privilege`
                    );
                });
        }
    })
    .catch((error) => {
        console.log(error);
    });
