const config = require('dotenv');
const { ConnectionPool } = require('mssql');
const URLSearchParams = require('url');

const obtainToken = require("../services/getToken.js"); // Import the obtainToken function

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

async function synchronize_CdpDadesFichador() {
    const nfetch = await import("node-fetch"); // Use dynamic import

    // Create Connection Pool    
    let pool = new ConnectionPool(sqlConfig);
    pool = await pool.connect();

    // Query SQL Server Table
    let result;
    try {
        result = await pool.request().query(`select idr, tmst, accio, usuari, isnull(editor, '') editor, isnull(historial, '') historial, isnull(lloc, '') lloc, isnull(comentari, '') comentari, id from cdpDadesFichador where year(tmst)=2023 and month(tmst)=11 and day(tmst)=7 order by tmst`);
    } catch (err) {
        console.error('Error querying SQL Server', err);
        pool.close();
        return;
    }

    // Get the authentication token
    let token = await obtainToken();    

    // Loop Through Each Record in SQL Table
    for (const row of result.recordset) {
        console.log(row.idr);
        // Get CdpDadesFichador from API
        let response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/CdpDadesFichador?$filter=idr eq '${row.idr}'`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        });

        // If CdpDadesFichador Does Not Exist, Create New CdpDadesFichador
        if (response.status === 404) {
        } else if (response.ok) {
            const cdpDadesFichador = await response.json();

            if (cdpDadesFichador.value.length === 0) {
                //console.log('If cdpDadesFichador Does Not Exist, Create New cdpDadesFichador');
                response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/CdpDadesFichador`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        idr: row.idr ,
                        tmst: row.tmst,
                        accio: row.accio,
                        usuari: row.usuari,
                        editor: row.editor,
                        historial: row.historial, 
                        lloc: row.lloc, 
                        comentari: row.comentari, 
                        id: row.id,
                    }),
                });
                const responseJson = await response.json();
                //console.log(responseJson);
            }else{
                //console.log('If cdpDadesFichador Exists, Update cdpDadesFichador');

                let ifMatch = cdpDadesFichador.value[0]["@odata.etag"];

                response = await fetch(`${process.env.baseURL}/v2.0/${process.env.tenant}/production/api/v2.0/companies(${process.env.companyID})/cdpDadesFichador(${cdpDadesFichador.value[0].idr})`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'if-Match': ifMatch,
                    },
                    body: JSON.stringify({
                        idr: row.idr ,
                        tmst: row.tmst,
                        accio: row.accio,
                        usuari: row.usuari,
                        editor: row.editor,
                        historial: row.historial, 
                        lloc: row.lloc, 
                        comentari: row.comentari, 
                        id: row.id,
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

module.exports = synchronize_CdpDadesFichador;