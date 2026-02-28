require('dotenv').config({ path: '../.env' }); // Load env variables from parent ACIA directory
const app = require('./src/app');
const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`[Server] ACIA MVP API listening on port ${port}`);
});
