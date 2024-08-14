const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const https = require('https');

// Parametros de configuracion
const config = require("./config.json");

// Conexión a la bbdd Oracle
const INSTANTCLIENT = config.instantclient;
const CONNECT_STRING = config.connect_string;
const DB_USER = config.db_user;
const DB_PASS = config.db_pass;

// Validación de usuario/password para poder acceder a los webservices
const WS_USER = config.ws_user;
const WS_PASS = config.ws_pass;

// Puerto para HTTPS
const HTTPS_PUERTO = config.https_puerto;

// Puerto para HTTP
const HTTP_PUERTO = config.http_puerto;

// Certificados CRT y KEY
const CERT_CRT = config.certificado_crt;
const CERT_KEY = config.certificado_key;

oracledb.initOracleClient({libDir: INSTANTCLIENT});

// Creamos una aplicación Express
const app = express();

// En caso de no querer lanzar el servidor HTTPS, comentar este bloque
https.createServer({
   cert: fs.readFileSync(config.certificado_crt),
   key: fs.readFileSync(config.certificado_key)
 },app).listen(HTTPS_PUERTO, function(){
	console.log('Servidor https corriendo en el puerto 10443');
});

app.get('/', function(req, res){
	res.send('Hola, estas en la pagina inicial de la API');
	console.log('Se recibio una petición get a través de https o http');
});

// Configuración de la conexión a Oracle
const dbConfig = {
  user: DB_USER,
  password: DB_PASS,
  connectString: CONNECT_STRING
};

// Usamos body-parser para decodificar JSON
app.use(bodyParser.json());

// Rutas para obtener datos

// ListaEsperaCirugia metodo post
app.post('/listaesperacirugia', async (req, res) => {
    // Obtenemos los datos JSON del cuerpo de la solicitud
    const datos = req.body;
 
    if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
        console.log('Error al autenticar el webservice');
        res.status(500).send('Error al autenticar el webservice');
    } else {

        // Ahora procesamos la consulta con la respuesta
        let connection;
        try {
          // Conectamos a la base de datos
          connection = await oracledb.getConnection(dbConfig);

          // Ejecutamos una consulta SQL
          const query = `SELECT * FROM pnl_v_lista_qui@dbl_ticares.world`;
          const result = await connection.execute(query);

          // Enviamos los datos como respuesta
          res.json(result.rows);
        } catch (err) {
          // Manejamos errores de conexión o consulta
          console.error(err);
          res.status(500).send('Error al obtener datos');
        } finally {
          // Cerramos la conexión
          if (connection) {
            await connection.close();
          }
        }
    }
});

// LeCirugia -> Recibe como parametro el codigo del centro y el user/pass para consumir el WS 
// devuelve la lista de espera de cirugia
app.post('/lecirugia', async (req, res) => {
    // Obtenemos los datos JSON del cuerpo de la solicitud
    const datos = req.body;
 
    if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
        console.log('Error al autenticar el webservice');
        res.status(500).send('Error al autenticar el webservice');
    } else {

        // Ahora procesamos la consulta con la respuesta
        let connection;
        try {
            // Conectamos a la base de datos
            connection = await oracledb.getConnection(dbConfig);
        
            // Ejecutamos una consulta SQL
            const query = `SELECT * FROM pnl_v_le_qui@dbl_ticares.world where centro = :centro `;
            // El  parámetro pasado por JSON se mete en la variable para la consulta
            const bindVars = {
                centro: datos.centro
            };
        
            const result = await connection.execute(query, bindVars);
        
            // Enviamos los datos como respuesta
            res.json(result.rows);
        } catch (err) {
            // Manejamos errores de conexión o consulta
            console.error(err);
            res.status(500).send('Error al obtener datos');
        } finally {
            // Cerramos la conexión
            if (connection) {
                await connection.close();
            }
        }  
    }
  });
  
// ticketscirugia -> Recibe como parametro el codigo del centro y el user/pass para consumir el WS 
// devuelve la lista de espera de cirugia
app.post('/ticketscirugia', async (req, res) => {
  // Obtenemos los datos JSON del cuerpo de la solicitud
  const datos = req.body;

  if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
      console.log('Error al autenticar el webservice');
      res.status(500).send('Error al autenticar el webservice');
  } else {

      // Ahora procesamos la consulta con la respuesta
      let connection;
      try {
      // Conectamos a la base de datos
      connection = await oracledb.getConnection(dbConfig);
  
      // Ejecutamos una consulta SQL
      const query = `SELECT identificador, nhc, paciente, hora, description as servicio, cama FROM pnl_v_le_qui@dbl_ticares.world le join com_services@dbl_ticares.world cser on cser.xkey = le.servicio where centro = :centro order by paciente`;

      // El  parámetro pasado por JSON se mete en la variable para la consulta
      const bindVars = {
          centro: datos.centro
      };
  
      const result = await connection.execute(query, bindVars);
  
      // Enviamos los datos como respuesta
      res.json(result.rows);
      } catch (err) {
      // Manejamos errores de conexión o consulta
      console.error(err);
      res.status(500).send('Error al obtener datos');
      } finally {
      // Cerramos la conexión
      if (connection) {
          await connection.close();
      }
      }  
  }
});

  // sms_vistas -> Recibe como parametro el codigo del centro y el user/pass para consumir el WS 
// devuelve la lista de vistas sobre las que hay que lanzar los sms
app.post('/sms_vistas', async (req, res) => {
    // Obtenemos los datos JSON del cuerpo de la solicitud
    const datos = req.body;

    // Obtener la fecha y hora actual
    const fecha = new Date();
    const fechaHoraActual = fecha.toLocaleString();

    console.log('Petición recibida ' + fechaHoraActual);
 
    if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
        console.log('Error al autenticar el webservice');
        res.status(500).send('Error al autenticar el webservice');
    } else {

        // Ahora procesamos la consulta con la respuesta
        let connection;
        try {
        // Conectamos a la base de datos
        connection = await oracledb.getConnection(dbConfig);
    
        // Ejecutamos una consulta SQL
        const query = `SELECT * FROM sms_vistas@dbl_ticares.world`; 
        // El  parámetro pasado por JSON se mete en la variable para la consulta
        const bindVars = {
            centro: datos.centro
        };
    
        const result = await connection.execute(query); 
    
        // Enviamos los datos como respuesta
        res.json(result.rows);
        } catch (err) {
        // Manejamos errores de conexión o consulta
        console.error(err);
        res.status(500).send('Error al obtener datos');
        } finally {
        // Cerramos la conexión
        if (connection) {
            await connection.close();
        }
        }  
    }
  });
    
// sms_cait_acogida -> Recibe como parametro el codigo del centro y el user/pass para consumir el WS 
// devuelve la lista de niños que tienen acogida programada para el dia siguiente
app.post('/sms_cait_acogida', async (req, res) => {
  // Obtenemos los datos JSON del cuerpo de la solicitud
  const datos = req.body;

  // Obtener la fecha y hora actual
  const fecha = new Date();
  const fechaHoraActual = fecha.toLocaleString();

  console.log('Petición recibida ' + fechaHoraActual);

  if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
      console.log('Error al autenticar el webservice');
      res.status(500).send('Error al autenticar el webservice');
  } else {

      // Ahora procesamos la consulta con la respuesta
      let connection;
      try {
      // Conectamos a la base de datos
      connection = await oracledb.getConnection(dbConfig);
  
      // Ejecutamos una consulta SQL
      const query = `SELECT * FROM v14_sms_cait_acogida@dbl_ticares.world`; 
      // El  parámetro pasado por JSON se mete en la variable para la consulta
      const bindVars = {
          centro: datos.centro
      };
  
      const result = await connection.execute(query); 
  
      // Enviamos los datos como respuesta
      res.json(result.rows);
      } catch (err) {
      // Manejamos errores de conexión o consulta
      console.error(err);
      res.status(500).send('Error al obtener datos');
      } finally {
      // Cerramos la conexión
      if (connection) {
          await connection.close();
      }
      }  
  }
});
  
// sms_cait_acogida -> Recibe como parametro el codigo del centro y el user/pass para consumir el WS 
// devuelve la lista de niños que tienen acogida programada para el dia siguiente
app.post('/sms_a_enviar', async (req, res) => {
  // Obtenemos los datos JSON del cuerpo de la solicitud
  const datos = req.body;
  const vista = datos.vista;

  // Obtener la fecha y hora actual
  const fecha = new Date();
  const fechaHoraActual = fecha.toLocaleString();

  console.log('Petición recibida ' + fechaHoraActual);

  if (!(datos.username === WS_USER && datos.password === WS_PASS)) {
      console.log('Error al autenticar el webservice');
      res.status(500).send('Error al autenticar el webservice');
  } else {

      // Ahora procesamos la consulta con la respuesta
      let connection;
      try {
      // Conectamos a la base de datos
      connection = await oracledb.getConnection(dbConfig);
  
      // Ejecutamos una consulta SQL
      const query = 'SELECT * FROM '+vista+'@dbl_ticares.world'; 
      // El  parámetro pasado por JSON se mete en la variable para la consulta
      const bindVars = {
          centro: datos.centro
      };
  
      const result = await connection.execute(query); 
  
      // Enviamos los datos como respuesta
      res.json(result.rows);
      } catch (err) {
      // Manejamos errores de conexión o consulta
      console.error(err);
      res.status(500).send('Error al obtener datos');
      } finally {
      // Cerramos la conexión
      if (connection) {
          await connection.close();
      }
      }  
  }
});
  
app.get('/final', async (req, res) => {
    let connection;
    try {
      // Conectamos a la base de datos
      connection = await oracledb.getConnection(dbConfig);
  
      // Ejecutamos una consulta SQL
      const query = `SELECT * FROM GFH_FINAL`;
      const result = await connection.execute(query);
  
      // Enviamos los datos como respuesta
      res.json(result.rows);
    } catch (err) {
      // Manejamos errores de conexión o consulta
      console.error(err);
      res.status(500).send('Error al obtener datos');
    } finally {
      // Cerramos la conexión
      if (connection) {
        await connection.close();
      }
    }
  });
  

// Ruta GET para obtener datos
app.get('/intermedio', async (req, res) => {
    let connection;
    try {
      // Conectamos a la base de datos
      connection = await oracledb.getConnection(dbConfig);
  
      // Ejecutamos una consulta SQL
      const query = `SELECT * FROM GFH_INTERMEDIO`;
      const result = await connection.execute(query);
  
      // Enviamos los datos como respuesta
      res.json(result.rows);
    } catch (err) {
      // Manejamos errores de conexión o consulta
      console.error(err);
      res.status(500).send('Error al obtener datos');
    } finally {
      // Cerramos la conexión
      if (connection) {
        await connection.close();
      }
    }
  });
  
// Iniciamos el servidor
app.listen(HTTP_PUERTO, () => {
  console.log('Servidor API escuchando en el puerto 3000');
});