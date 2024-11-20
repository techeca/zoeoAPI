import { startServer } from "./server.js";
import { connectDB } from "./database.js";

const PORT = process.env.PORT || 3000;

async function init() {
  try {
    await connectDB()
    startServer(PORT)
  } catch (error) {
    console.error("Error initializing the application:", error);
    process.exit(1);
  }
}

init()