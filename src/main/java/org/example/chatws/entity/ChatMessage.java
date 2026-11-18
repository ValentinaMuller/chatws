package org.example.chatws.entity;

import com.fasterxml.jackson.annotation.JsonAlias;

public record ChatMessage(String tipo, @JsonAlias("ususario") String usuario, String contenido) {
}
