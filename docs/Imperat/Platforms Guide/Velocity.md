---
title: "Velocity"
description: "Velocity proxy platform for minecraft networks"
order: 3
---

# Velocity

The Velocity module integrates Imperat with Velocity proxy servers.

## Constructing

```java
VelocityImperat<MyPlugin> imperat = VelocityImperat.builder(plugin, proxyServer)
    .build();
```

The builder requires **two** parameters:
- Your **plugin instance** (generic type `P`).
- The Velocity **`ProxyServer`** instance.

## Default Argument Types

| Java Type      | Description                                    |
|----------------|------------------------------------------------|
| `Player`       | Resolves an online Velocity player by name.    |
| `ServerInfo`   | Resolves a registered backend server by name.  |

## Context Argument Providers

These are injected automatically when used as `@Context` parameters in command methods.

| Type                                   | Value Provided                                                                            |
|----------------------------------------|-------------------------------------------------------------------------------------------|
| `ExecutionContext<VelocityCommandSource>` | The current execution context.                                                          |
| `CommandHelp<VelocityCommandSource>`     | The command help instance for the current context.                                      |
| `ProxyConfig`                          | The Velocity proxy configuration.                                                         |
| `ProxyVersion`                         | The Velocity proxy version.                                                               |
| `ServerInfo`                           | The server the source player is currently connected to; throws `ONLY_PLAYER` if console.  |
| `PluginContainer`                      | The `PluginContainer` of the owning plugin.                                               |

## Source Providers

| Type                      | Behavior                                                                    |
|---------------------------|-----------------------------------------------------------------------------|
| `AdventureCommandSource`  | Returns the source as-is.                                                   |
| `CommandSource`           | Returns the underlying Velocity `CommandSource`.                            |
| `ConsoleCommandSource`    | Returns the console source; throws `ONLY_CONSOLE` if source is a player.    |
| `Player`                  | Returns the Velocity `Player`; throws `ONLY_PLAYER` if source is console.   |

## Custom Exceptions

No platform-specific exception classes are defined for Velocity.

## Pre-defined Responses

Held in `VelocityResponseKey`.

| Key                | Default Message                                                    | Placeholders |
|--------------------|--------------------------------------------------------------------|--------------|
| `ONLY_PLAYER`      | `"Only players can do this!"`                                      | —            |
| `ONLY_CONSOLE`     | `"Only console can do this!"`                                      | —            |
| `UNKNOWN_PLAYER`   | `"A player with the name '%input%' doesn't seem to be online"`     | `input`      |
| `UNKNOWN_SERVER`   | `"A server with the name '%input%' doesn't seem to exist"`         | `input`      |

