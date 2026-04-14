# Todo App

Este monorepo contiene dos aplicaciones: una en React y otra en Vanilla JS, ambas implementan la misma funcionalidad para manejar una lista de textos.

Se incluye un paquete 'core' con la lógica compartida entre ambas aplicaciones, como la gestión de la lista de textos, selección y deshacer cambios. Esto permite mantener la lógica de negocio separada de la implementación específica de cada framework, facilitando el mantenimiento y la extensión futura.

También, dicho paquete está hecho con arquitectura hexagonal, lo que permite que la lógica de negocio sea independiente de cualquier framework o tecnología específica. Esto facilita la reutilización del código, testabilidad y la posibilidad de cambiar la implementación de la interfaz de usuario sin afectar la lógica central.

## Instalación

1. Clona el repositorio
2. Instala las dependencias con `pnpm install`
3. Para ejecutar la aplicación de React, usa `pnpm run start:react`
4. Para ejecutar la aplicación de Vanilla JS, usa `pnpm run start:vanilla`

## Requisitos

### Interfaz de Usuario

- Contenedor para mostrar la lista de textos
- Caja de entrada de texto para nuevas entradas
- Botón para agregar entradas
- Botón para eliminar entradas seleccionadas
- Botón para deshacer cambios

### Funcionalidades

- Agregar entradas de texto a la lista (sin permitir entradas vacías)
- Seleccionar elementos de la lista para eliminarlos
- Eliminar uno o varios elementos seleccionados (ctrl+click para selección múltiple)
- Doble click para eliminar un elemento directamente
- Deshacer el último cambio realizado

## Estrategia de Desarrollo

### Análisis de los requisitos

Una vez revisados los requisitos, se expanden en un spec funcional y técnico detallado, para establecer un cuadro claro de cada decisión técnica durante la implementación de la feature.

En esta fase se decide el tooling a usar, la arquitectura del proyecto y se establecen los criterios de aceptación para la funcionalidad.

Escogí encapsular en el módulo 'core' toda la lógica de negocio, ya que como parte del objetivo era crear la misma aplicación en dos tecnologías distintas, me parecía interesante reutilizar la lógica de negocio sin duplicarla.

Para el styling pude realizar algo similar, pero debido al scope, decidí mantenerlo dentro de cada aplicación, para no complicar la estructura del proyecto.

## Creación de issues

A partir del spec funcional y técnico, se crean issues específicos para cada tarea a realizar, con el objetivo de mantener un seguimiento claro del progreso y facilitar el consumo de cada tarea para la IA.

Al crear una separación clara, cada objetivo es independiente, de tal forma que la IA puede testear, desarrollar e implementar cada issue de manera eficiente.

## Desarrollo

Cada issue se taclea mediante un flujo agentico, donde se convocan dos sub-agentes, uno encargado de desarrollar los tests y otro encargado de desarrollar la funcionalidad. De esta manera se aplica TDD y la IA recibe feedback inmediato sobre la calidad de su código, lo que le permite mejorar iterativamente junto con herramientas como linters y formateadores. Antes de continuar con el siguiente issue, se revisa manualmente el código generado.

### Gestión de lista de texto

La gestión de la lista de texto se implementa en el módulo 'core', con una arquitectura hexagonal. Para este proyecto se creó una implementación de repositorio que utiliza localStorage (pero podría ser fácilmente extendida para usar cualquier otra forma de almacenamiento).

En el dominio se aloja la gestión de la lista, con métodos para agregar, eliminar, seleccionar y deshacer cambios, todo encapsulado en entidades, interfaces y servicios. Dentro de la capa de aplicación, se ofrecen los casos de uso para interactuar con el dominio, que es directamente consumida por las aplicaciones de React y Vanilla JS. Finalmente, en la capa de infraestructura se implementa el repositorio específico para localStorage.

### Manejo de errores

Se implementa un manejo de errores global, para capturar cualquier error no manejado que pueda ocurrir en la aplicación. Esto se hace tanto en la aplicación de React como en la de Vanilla JS, utilizando un componente de Error Boundary en React y un manejador global de errores en Vanilla JS.

### Estilos

Los estilos se implementan utilizando CSS Modules en la aplicación de React y CSS tradicional en la aplicación de Vanilla JS. Se sigue el diseño proporcionado en el enlace de Adobe XD, adaptándolo a las necesidades de cada aplicación.