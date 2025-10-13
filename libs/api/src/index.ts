import app from "./app.js";

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), "0.0.0.0", () =>
  console.log(`API running on http://127.0.0.1:${PORT}`)
);
