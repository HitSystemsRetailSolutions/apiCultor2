import fetch from "node-fetch";
import { config } from "dotenv";
import pkg from "mssql";
const { ConnectionPool } = pkg;
import { URLSearchParams } from "url";

const sqlConfig = {
    user: process.env.user,
    password: process.env.password,
    server: process.env.server,
    database: process.env.database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  };
  
