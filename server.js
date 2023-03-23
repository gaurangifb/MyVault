const express = require('express');
const app = express();

const mainRouter = require('./routes/index');
const PORT = process.env.PORT || 3000;

//nunjucks.configure('views', { express: app})
app.set("view engine", "ejs");
app.use(mainRouter);


app.listen(PORT, () => {
    console.log("Running on port 3000");
});