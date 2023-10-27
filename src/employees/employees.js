const config = require('dotenv');
const { ConnectionPool } = require('mssql');
const URLSearchParams = require('url');

const obtainToken = require("../services/getToken.js"); // Import the obtainToken function

const sqlConfig = {
    user:'sa',
    password:'LOperas93786',
    server:'silema.hiterp.com',
    database:'Fac_Tena',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
        }
    };


async function synchronize_Employees() {
    const nfetch = await import("node-fetch"); // Use dynamic import

    // Create Connection Pool    
    let pool = new ConnectionPool(sqlConfig);
    pool = await pool.connect();

    // Query SQL Server Table
    let result;
    try {
        result = await pool.request().query(`SELECT cast(Codi as nvarchar) Codi, left(Nom, 30) Nom from dependentes order by nom`);
    } catch (err) {
        console.error('Error querying SQL Server', err);
        pool.close();
        return;
    }

    // Get the authentication token
    let token = await obtainToken();    

    // Loop Through Each Record in SQL Table
    for (const row of result.recordset) {
        console.log(row.Nom);
        // Get Employees from API
        let response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/employees?$filter=number eq '${row.Codi}'`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        });

        // If Employees Does Not Exist, Create New Employees
        if (response.status === 404) {
        } else if (response.ok) {
            const employees = await response.json();

            if (employees.value.length === 0) {
                //console.log('If employees Does Not Exist, Create New employees');
                response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/employees`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        number: row.Codi ,
                        givenName: row.Nom,
                        middleName: "",
                        surname: row.Nom,                        
                    }),
                });
                const responseJson = await response.json();
                //console.log(responseJson);
            }else{
                //console.log('If employees Exists, Update employees ' + employees.value[0].id);

                let ifMatch = employees.value[0]["@odata.etag"];

                response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/employees(${employees.value[0].id})`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'if-Match': ifMatch,
                    },
                    body: JSON.stringify({
                        givenName: row.Nom,
                        middleName: "",
                        surname: row.Nom,
                        // Update additional fields as necessary...
                    }),
                });
                const responseJson = await response.json();
                //console.log(responseJson);
            }
        } else {
            console.error('Error communicating with API', await response.text());
        }
    }

    pool.close();
}

module.exports = synchronize_Employees;