API escrita en Node.js para extraer datos de la base de datos de Oracle.

Crear el archivo config.json a partir del archivo config.json.new poniendo los valores en los parámetros.

Hay que tener creados los certificados .crt y .key para el servidor con el DNS correspondiente. Si no se tienen los certificados y no se
desea levantar el servidor HTTPS, comentar el bloque indicado en index.js

Para levantar la app se lanza desde la consola:

node index.js

Los servicios se consumen con la url:

https://servidor.dominio:10443/metodo

o

http://servidor.dominio:3000/metodo

dependiendo de si se está corriendo el servidor con https o http

Los métodos están descritos en el archivo metodos.api
