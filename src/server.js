const express = require("express");
const app = express();
const port = 3000;
const obtainToken = require("./services/getToken.js"); // Import the obtainToken function
const synchronize_Employees = require("./employees/employees.js"); // Import the obtainToken function

app.get("/getEmployees", async (req, res) => {
  try {
    /*const token = await obtainToken(); // Call the obtainToken function
    console.log(token); // Log the obtained token
    res.send(`Token: ${token}`); // Send the token as a response*/
    res.send("SINCRONIZANDO EMPLEADOS.."); 
    await synchronize_Employees();

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to obtain access token");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
