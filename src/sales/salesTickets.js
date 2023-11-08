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

async function synchronize_SalesTickets(tabVenut, tabMoviments, botiga) {
    const nfetch = await import("node-fetch"); // Use dynamic import

    // Create Connection Pool    
    let pool = new ConnectionPool(sqlConfig);
    pool = await pool.connect();

    // Query SQL Server Table
    let result;
    try {
        let sql;
        sql = "select num_tick nTickHit, convert(varchar, v.Data, 23) Data, concat(upper(c.nom), '_', num_tick) Num_tick, case isnull(m.motiu, 'CAJA') when 'CAJA' then 'CAJA' else 'TARJETA' end FormaPago, isnull(c2.codi, '1314') Client, sum(v.import) Total ";
        sql = sql + "From " + tabVenut + " v  ";
        sql = sql + "left join " + tabMoviments + " m on m.botiga=v.botiga and concat('Pagat Targeta: ', v.num_tick) = m.motiu ";
        sql = sql + "left join clients c on v.botiga=c.codi  ";
        sql = sql + "left join ClientsFinals cf on concat('[Id:', cf.id, ']') = v.otros ";
        sql = sql + "left join clients c2 on case charindex('AbonarEn:',altres) when 0 then '' else substring(cf.altres, charindex('AbonarEn:', cf.altres)+9, charindex(']', cf.altres, charindex('AbonarEn:', cf.altres)+9)-charindex('AbonarEn:', cf.altres)-9) end =c2.codi ";
        sql = sql + "where v.botiga=" + botiga + " and day(v.data)>=4 and num_tick>=574714 ";
        sql = sql + "group by v.data, num_tick, concat(upper(c.nom), '_', num_tick), case isnull(m.motiu, 'CAJA') when 'CAJA' then 'CAJA' else 'TARJETA' end, isnull(c2.codi, '1314') ";
        sql = sql + "order by v.data";
        result = await pool.request().query(sql);
    } catch (err) {
        console.error('Error querying SQL Server', err);
        pool.close();
        return;
    }

    // Get the authentication token
    let token = await obtainToken();

    // Loop Through Each Record in SQL Table
    for (const row of result.recordset) {
console.log(row.Num_tick);
        // Get Sale from API
        let response = await fetch(`${apiConfig.baseURL}/v2.0/ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96/production/api/v2.0/companies(${apiConfig.companyID})/salesInvoices?$filter=externalDocumentNumber eq '${row.Num_tick}'`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        });

        // If Sale Does Not Exist, Create New Sale
        if (response.status === 404) {
        } else if (response.ok) {
            const sale = await response.json();

            if (sale.value.length === 0) {
console.log('If Sale Does Not Exist, Create New Sale');
                // Get Customer from API
                const customerId = await getCustomerFromAPI(row.Client);

                if (customerId != ""){
                    response = await fetch(`${apiConfig.baseURL}/v2.0/ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96/production/api/v2.0/companies(${apiConfig.companyID})/salesInvoices`, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            externalDocumentNumber: row.Num_tick,
                            invoiceDate: row.Data,
                            postingDate: row.Data,
                            customerId: customerId,

                            // Add additional fields as necessary...
                        }),
                    });
                }
                const responseJson = await response.json();
                console.log(responseJson);

                console.log("AÑADIR LINEAS DEL TIQUET: "+ responseJson.id);
                await synchronizeTableWithAPI_SalesTiquetsLines(tabVenut, botiga, row.nTickHit, responseJson.id).catch(console.error);
            }
            else{
                console.log(sale);
            }

        } else {
            console.error('Error communicating with API', await response.text());
        }
    }

    pool.close();
}

//-----------------------------------------------------------------------------------------------------------------------------------------------
//Tiquets Lineas --------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------
async function synchronize_SalesTiquetsLines(tabVenut, botiga, nTickHit, id365) {
    // Create Connection Pool
    let pool = new ConnectionPool(sqlConfig);
    pool = await pool.connect();

    console.log("SALE LINES " + id365 + "---------------------------------------------");
    // Query SQL Server Table
    let result;
    try {
        let sql;
        sql = "select concat(upper(c.nom), '_', num_tick) Num_tick, v.Quantitat, CAST(v.Plu as varchar) Plu ";
        sql = sql + "From " + tabVenut + " v ";
        sql = sql + "left join clients c on v.botiga=c.codi  ";
        sql = sql + "where v.botiga=" + botiga + " and num_tick='" + nTickHit + "'";
        result = await pool.request().query(sql);
    } catch (err) {
        console.error('Error querying SQL Server', err);
        pool.close();
        return;
    }

    // Get the authentication token
    let token = await obtainToken();

    // Loop Through Each Record in SQL Table
    for (const row of result.recordset) {
        console.log(row.Num_tick);
        // Get Sale from API
        let response = await fetch(`${apiConfig.baseURL}/v2.0/ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96/production/api/v2.0/companies(${apiConfig.companyID})/salesInvoices(${id365})/salesInvoiceLines?$filter=lineObjectNumber eq 'CODI-${row.Plu}'`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
            },
        });

        // If Sale Does Not Exist, Create New Sale
        if (response.status === 404) {
        } else if (response.ok) {
            const sale = await response.json();

            if (sale.value.length === 0) {
                console.log('If Sale Does Not Exist, Create New Sale');
                // Get Item from API
                const itemId = await getItemFromAPI(row.Plu);

                if (itemId != ""){
                    response = await fetch(`${apiConfig.baseURL}/v2.0/ace8eb1f-b96c-4ab5-91ae-4a66ffd58c96/production/api/v2.0/companies(${apiConfig.companyID})/salesInvoices(${id365})/salesInvoiceLines`, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            documentId: id365,
                            itemId: itemId,
                            quantity: row.Quantitat,

                            // Add additional fields as necessary...
                        }),
                    });
                }
                const responseJson = await response.json();
                console.log(responseJson);
            }
            else{
                console.log(sale);
            }

        } else {
            console.error('Error communicating with API', await response.text());
        }
    }

    pool.close();
}


module.exports = synchronize_SalesTickets;