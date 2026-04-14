# Todo App

Este monorepo contiene dos aplicaciones: una en React y otra en Vanilla JS, ambas implementan la misma funcionalidad para manejar una lista de textos.

Se incluye un paquete 'core' con la lógica compartida entre ambas aplicaciones, como la gestión de la lista de textos, selección y deshacer cambios. Esto permite mantener la lógica de negocio separada de la implementación específica de cada framework, facilitando el mantenimiento y la extensión futura.

También, dicho paquete está hecho con arquitectura hexagonal, lo que permite que la lógica de negocio sea independiente de cualquier framework o tecnología específica. Esto facilita la reutilización del código, testabilidad y la posibilidad de cambiar la implementación de la interfaz de usuario sin afectar la lógica central.

## Stack

- **pnpm workspaces** — gestión del monorepo
- **TypeScript** — en el paquete `core` y en la app de React
- **Vite** — bundler y dev server en ambas aplicaciones
- **tsup** — compilación del paquete `core` a ESM con declaraciones `.d.ts`
- **Biome** — linter y formateador unificado para todo el monorepo
- **Vitest** — tests unitarios y de componentes
- **Playwright** — tests end-to-end
- **vitest-axe / axe-core** — validación de accesibilidad automatizada

## Instalación

1. Clona el repositorio
2. Instala las dependencias con `pnpm install`
3. Para ejecutar la aplicación de React, usa `pnpm run dev:react`
4. Para ejecutar la aplicación de Vanilla JS, usa `pnpm run dev:vanilla`

### Comandos de testing

```bash
# Tests unitarios y de componentes (todas las apps)
pnpm test

# Tests E2E de la app de React
pnpm --filter react-app test:e2e

# Tests E2E de la app de Vanilla JS
pnpm --filter vanilla-app test:e2e
```

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

### Patrón Command

El deshacer se implementa mediante el patrón Command. Cada operación que modifica la lista (agregar un elemento, eliminar uno por id, eliminar los seleccionados) se encapsula en su propia clase con dos métodos: `execute()` y `undo()`. Cada comando guarda internamente el estado mínimo necesario para revertirse. Por ejemplo, `AddItemCommand` guarda el id del elemento recién creado, mientras que `DeleteSelectedCommand` guarda los elementos eliminados junto con sus índices originales para poder reinsertarlos en el orden correcto.

La clase `CommandHistory` actúa como el invoker: mantiene una pila de comandos ejecutados (con un máximo de 50 entradas para no crecer indefinidamente) y expone `execute()` para correr y apilar un comando, y `undo()` para hacer pop del último y llamar a su `undo()`. Las apps de React y Vanilla JS consumen directamente el `CommandHistory` sin saber nada de la implementación de cada comando.

Esto mantiene la lógica de deshacer completamente dentro del `core`, aislada de cualquier framework, y hace que añadir nuevas operaciones reversibles en el futuro sea trivial: basta con implementar la interfaz `Command`.

### Manejo de errores

Se implementa un manejo de errores global, para capturar cualquier error no manejado que pueda ocurrir en la aplicación. Esto se hace tanto en la aplicación de React como en la de Vanilla JS, utilizando un componente de Error Boundary en React y un manejador global de errores en Vanilla JS.

### Estilos

Los estilos se implementan utilizando CSS Modules en la aplicación de React y CSS tradicional en la aplicación de Vanilla JS. Se sigue el diseño proporcionado en el enlace de Adobe XD, adaptándolo a las necesidades de cada aplicación.

### Testing

Se aplica un enfoque de Testing Trophy, priorizando los tests de integración sin ignorar los extremos de la pirámide.

- **Tests unitarios** — cubren el dominio del `core` de forma aislada: la entidad `TextList`, los comandos y el `CommandHistory`. Son los tests más rápidos y los que garantizan que la lógica de negocio es correcta independientemente de cualquier UI.
- **Tests de componentes** — validan el comportamiento de cada componente (React y Vanilla JS) en aislamiento, usando Vitest con jsdom. Aquí se verifica que la UI reacciona correctamente a los distintos estados sin levantar un navegador real.
- **Tests E2E** — con Playwright, se ejercita la aplicación completa en un navegador real. Cubren los flujos críticos del usuario: agregar, seleccionar, eliminar, deshacer y gestión del modal.

La separación del `core` en un paquete independiente tiene un beneficio directo en testing: la lógica de negocio se puede testear sin ninguna dependencia de framework, lo que hace los tests del dominio extremadamente rápidos y estables.

### Accesibilidad

La accesibilidad no fue un afterthought sino una parte del criterio de aceptación de cada issue. Se trabajaron tres áreas principales:

- **Semántica HTML** — uso correcto de roles (`dialog`, `list`, `listitem`), atributos `aria-modal`, `aria-labelledby` y `aria-disabled` donde corresponde.
- **Gestión de foco** — al abrir el modal, el foco se mueve automáticamente al input. Al cerrar (tanto por Cancel como por Escape), el foco vuelve al botón que abrió el modal. Esto evita que el usuario con teclado pierda su posición en la página.
- **ARIA live regions** — se utiliza una región `aria-live="polite"` para anunciar cambios como "Item added. 1 item in list." o "1 item deleted." a lectores de pantalla, sin interrumpir el flujo del usuario.

Para validar todo esto de forma automatizada, se integró `axe-core` tanto en los tests de Vitest (via `vitest-axe`) como en los tests E2E de Playwright. Esto asegura que ningún cambio rompa silenciosamente la accesibilidad.