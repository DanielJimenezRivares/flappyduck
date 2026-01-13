# Flappy Duck

Un clon del clásico Flappy Bird desarrollado desde cero con **Vanilla JavaScript** y **HTML5 Canvas**.

## Arquitectura

El código sigue el paradigma de programación orientada a objetos (OOP) y aplica el Principio de Responsabilidad Única, con responsabilidades claramente definidas para cada componente.

### 1. Clase `Game` (The Engine)
Actúa como el controlador principal y gestor del estado del juego, e implementa el **patrón Game Loop** para controlar el flujo de ejecución, actualización y renderizado.

### 2. Clase `Bird` (The Player)
Encapsula la física y el comportamiento del personaje.

### 3. Clase `Pipe` (The Obstacle)
Entidad autónoma que gestiona su posición y renderizado.

## Estructura del Proyecto

```text
/
├── index.html      # Estructura y contenedor Canvas
├── script.js       # Lógica del juego (Game, Bird, Pipe)
├── assets/         # Recursos
│   ├── duck.png    # Sprite del pato
│   ├── flap.mp3    # Sonido de salto
│   ├── point.mp3   # Sonido de puntuación
│   └── crash.mp3   # Sonido de choque
└── README.md       # Documentación
```