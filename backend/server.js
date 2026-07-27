require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./src/config/database");
const apiRoutes = require("./src/routes");
const errorHandler = require("./src/middleware/errorHandler");
const { errorResponse } = require("./src/utils/apiResponse");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student Result Management Node.js API is running",
  });
});

app.get("/test-db", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT 1 AS result");

    res.json({
      success: true,
      message: "MySQL connected successfully through Node.js",
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", apiRoutes);

app.use((req, res) => {
  return errorResponse(res, "Route not found", 404);
});

app.use(errorHandler);

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 20;

const startServer = (port, attempts = 0) => {
  const server = app.listen(port, () => {
    console.log(`Node.js server running on http://localhost:${port}`);
    console.log(`MySQL database: ${process.env.DB_NAME}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && attempts < MAX_PORT_ATTEMPTS) {
      const nextPort = port + 1;
      console.log(`Port ${port} is busy, trying http://localhost:${nextPort}`);
      return startServer(nextPort, attempts + 1);
    }

    if (error.code === "EADDRINUSE") {
      console.error(`Ports ${DEFAULT_PORT}-${port} are busy. Please stop an old server process.`);
      process.exit(1);
    }

    console.error("SERVER ERROR:", error);
    process.exit(1);
  });
};

startServer(DEFAULT_PORT);
