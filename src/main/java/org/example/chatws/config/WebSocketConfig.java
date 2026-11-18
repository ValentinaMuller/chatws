package org.example.chatws.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String TOPIC = "/topic";
    public static final String APP = "/app";

    private final String host;
    private final int stompPort;
    private final String username;
    private final String password;

    public WebSocketConfig(@Value("${spring.rabbitmq.host}") String host,
                           @Value("${chat.stomp.port}") int stompPort,
                           @Value("${spring.rabbitmq.username}") String username,
                           @Value("${spring.rabbitmq.password}") String password) {
        this.host = host;
        this.stompPort = stompPort;
        this.username = username;
        this.password = password;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableStompBrokerRelay(TOPIC, "/queue")
                .setRelayHost(host)
                .setRelayPort(stompPort)
                .setClientLogin(username)
                .setClientPasscode(password)
                .setSystemLogin(username)
                .setSystemPasscode(password);
        config.setApplicationDestinationPrefixes(APP);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat").withSockJS();
    }
}
