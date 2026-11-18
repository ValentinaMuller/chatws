# ChatWS · Migración a RabbitMQ

Chat en tiempo real para Programación IV. Dos personas pueden abrir el chat en instancias distintas de Spring Boot y conversar porque ambas comparten el mismo RabbitMQ.

## Ejecutar el proyecto

Se necesitan Docker con Docker Compose, un JDK 26 con `JAVA_HOME` configurada y acceso a Internet para la primera descarga. El cliente web carga SockJS y StompJS desde jsDelivr. Los comandos se ejecutan desde la raíz del repositorio.

1. Iniciá Docker Desktop o el motor de Docker. Comprobá que `docker version` muestre tanto el cliente como el servidor.
2. Descargá la imagen de la guía y levantá RabbitMQ. El último comando debe mostrar el servicio como `healthy`.

   ```sh
   docker compose pull rabbitmq
   docker compose up -d --wait rabbitmq
   docker compose ps
   ```

3. Abrí el [panel de RabbitMQ](http://localhost:15672). Para esta práctica, el usuario es `chatws` y la contraseña es `chatws-demo`. En **Overview → Ports and contexts** podés identificar los puertos que escucha el broker.

   | Puerto local | Uso |
   | --- | --- |
   | 15672 | Panel web de administración |
   | 5672 | AMQP, configurado en `spring.rabbitmq.port` |
   | 61613 | STOMP sobre TCP, utilizado por el relay del chat |

4. Compilá, ejecutá las pruebas y arrancá la aplicación. En Windows PowerShell:

   ```powershell
   .\mvnw.cmd verify
   java -jar target/chatws-0.0.1-SNAPSHOT.jar
   ```

   En Linux o macOS usá `./mvnw verify` y el mismo comando `java -jar`.

## Demostración para la clase

1. Abrí el [chat](http://localhost:8080) en dos pestañas. Escribí un nombre distinto en cada una y presioná **Conectar**. Ambas deben mostrar **Conectado**.
2. Enviá un mensaje desde la primera pestaña y respondé desde la segunda. En ambas deben aparecer el nombre y el texto de cada mensaje.
3. Con las pestañas conectadas, abrí **Connections** en el panel de RabbitMQ. Podés ver las conexiones STOMP del relay. En **Queues and Streams** aparecen las colas temporales de los suscriptores al tema público.
4. Para demostrar la comunicación entre **dos servidores**, dejá abierta la primera aplicación. Desde otra terminal, en la misma carpeta, ejecutá:

   ```sh
   java -jar target/chatws-0.0.1-SNAPSHOT.jar --server.port=8081
   ```

   Conectá una pestaña al [primer servidor](http://localhost:8080) y otra al [segundo](http://localhost:8081). Volvé a enviar un mensaje en cada sentido. Cada navegador habla con su propia instancia de Spring y RabbitMQ distribuye los mensajes a ambas.

**Resultado de la prueba de entrega.** Con Java 26 y RabbitMQ 3.13.7 en Docker, dos sesiones de Chrome conectadas a instancias distintas de Spring recibieron los dos mensajes enviados, uno en cada sentido. En las dos pantallas coincidieron el remitente y el texto. El panel de administración también registró las dos suscripciones a la clave `public` del exchange `amq.topic`.

## Recorrido de un mensaje

1. El navegador se conecta al endpoint SockJS `/chat` y se suscribe por STOMP a `/topic/public`.
2. Al enviar, publica un JSON con `tipo`, `usuario` y `contenido` en `/app/chat.sendMessage`.
3. Spring dirige el prefijo `/app` al controlador. `ChatController` devuelve el mensaje a `/topic/public` con `@SendTo`.
4. `WebSocketConfig` delega los destinos `/topic` y `/queue` al broker externo mediante `enableStompBrokerRelay`. Reactor Netty mantiene las conexiones TCP con RabbitMQ. La aplicación configura las credenciales tanto para la conexión del sistema como para las conexiones de los clientes.
5. RabbitMQ distribuye el mensaje a las suscripciones activas. Spring lo entrega a los navegadores, que muestran el nombre del remitente y el contenido.

## Cómo se aplicó la guía Docker

Compose usa la imagen `rabbitmq:3-management` de la guía. El archivo `docker/enabled_plugins` activa el panel y el complemento `rabbitmq_stomp` desde el arranque. Los tres puertos se publican en la interfaz local y el servicio usa una cuenta de demostración propia. El volumen `rabbitmq-data` conserva los datos del broker entre arranques. Las suscripciones al chat público son temporales y los mensajes se entregan en vivo. Una pestaña que se conecta después empieza a recibir mensajes desde ese momento.

El host, las credenciales y los puertos se configuran en `src/main/resources/application.yaml`. Podés definir `RABBITMQ_HOST`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_AMQP_PORT` y `RABBITMQ_STOMP_PORT` en el entorno. Si personalizás los valores, usá el mismo entorno al iniciar Compose y Java. RabbitMQ crea la cuenta inicial cuando arranca con un volumen vacío.

Para diagnosticar el arranque:

```sh
docker compose logs rabbitmq
docker compose exec rabbitmq rabbitmq-plugins list -e
docker compose exec rabbitmq rabbitmq-diagnostics listeners
```

Para terminar la demostración, detené cada proceso Java con `Ctrl+C` y ejecutá `docker compose down`. El volumen queda disponible para la siguiente clase.

## Referencias

- [Guía Docker de la consigna, Juan Esteban Angulo](https://medium.com/@devtygers/crear-un-servidor-rabittmq-en-docker-a7c79a4bc144)
- [RabbitMQ · Complemento STOMP, destinos y suscripciones](https://www.rabbitmq.com/docs/stomp)
- [Spring Framework · Relay STOMP con un broker externo](https://docs.spring.io/spring-framework/reference/web/websocket/stomp/handle-broker-relay.html)
