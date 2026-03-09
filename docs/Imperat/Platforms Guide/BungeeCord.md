---
title: "Bungeecord"
description: "The Bungeecord proxy platform for minecraft networks"
order: 2
---
# BungeeCord
The BungeeCord module integrates Imperat with BungeeCord proxy servers.

## Constructing

```java
BungeeImperat imperat = BungeeImperat.builder(plugin)
    .build();
```

The builder requires a BungeeCord `Plugin` instance.

## Default Argument Types

| Java Type         | Description                                          |
|-------------------|------------------------------------------------------|
| `ProxiedPlayer`   | Resolves an online proxied player by name.           |
| `ServerInfo`      | Resolves a registered backend server by name.        |

## Context Argument Providers

These are injected automatically when used as `@Context` parameters in command methods.

| Type                                 | Value Provided                                                                 |
|--------------------------------------|--------------------------------------------------------------------------------|
| `ExecutionContext<BungeeCommandSource>` | The current execution context.                                               |
| `CommandHelp<BungeeCommandSource>`     | The command help instance for the current context.                           |
| `Plugin`                             | The plugin instance passed to the builder.                                     |
| `ProxyServer`                        | The BungeeCord `ProxyServer` instance.                                         |
| `ServerInfo`                         | The server the source player is currently connected to; throws `ONLY_PLAYER` if console. |

## Source Providers

| Type                      | Behavior                                                                  |
|---------------------------|---------------------------------------------------------------------------|
| `AdventureCommandSource`  | Returns the source as-is.                                                 |
| `CommandSender`           | Returns the underlying BungeeCord `CommandSender`.                        |
| `ProxiedPlayer`           | Returns the `ProxiedPlayer`; throws `ONLY_PLAYER` if source is console.   |

## Custom Exceptions

No platform-specific exception classes are defined for BungeeCord.

## Pre-defined Responses

Held in `BungeeResponseKey`.

| Key                | Default Message                                                    | Placeholders |
|--------------------|--------------------------------------------------------------------|--------------|
| `ONLY_PLAYER`      | `"Only players can do this!"`                                      | —            |
| `ONLY_CONSOLE`     | `"Only console can do this!"`                                      | —            |
| `UNKNOWN_PLAYER`   | `"A player with the name '%input%' doesn't seem to be online"`     | `input`      |
| `UNKNOWN_SERVER`   | `"A server with the name '%input%' doesn't seem to exist"`         | `input`      |

