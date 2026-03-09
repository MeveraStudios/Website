---
title: "Bukkit/Spigot/Paper"
description: "The Bukkit/Spigot/Paper Platform for minecraft servers"
order: 1
---

# Bukkit

The Bukkit module integrates Imperat with Bukkit/Spigot/Paper servers.

## Constructing

```java
BukkitImperat imperat = BukkitImperat.builder(plugin)
    .build();
```

The builder requires a `Plugin` instance.

## Platform-Specific Options

| Method                            | Description                                                                                       |
|-----------------------------------|---------------------------------------------------------------------------------------------------|
| `applyBrigadier(boolean)`         | Enables Brigadier integration for Paper servers (1.13+). Provides improved client-side suggestions and argument types. |
| `setAdventureProvider(provider)`  | Overrides the auto-detected Adventure provider with a custom one.                                 |

When `applyBrigadier(true)` is set, Imperat registers commands through Brigadier for richer client-side tab completion.  
When it is **not** set, Imperat falls back to an async tab listener on Paper (if supported).

## Default Argument Types

| Java Type         | Description                                         |
|-------------------|-----------------------------------------------------|
| `Player`          | Resolves an online player by name.                  |
| `OfflinePlayer`   | Resolves an offline player by name.                 |
| `Location`        | Parses a world location (x, y, z, yaw, pitch).     |
| `TargetSelector`  | Parses entity selectors (`@p`, `@a`, `@e`, `@r`).  |

## Context Argument Providers

These are injected automatically when used as `@Context` parameters in command methods.

| Type                               | Value Provided                              |
|------------------------------------|---------------------------------------------|
| `ExecutionContext<BukkitCommandSource>` | The current execution context.          |
| `CommandHelp<BukkitCommandSource>`     | The command help instance for the current context. |
| `Plugin`                           | The plugin instance passed to the builder.  |
| `Server`                           | The Bukkit `Server` instance.               |

## Source Providers

These are injected automatically when used as the first (source) parameter in command methods.

| Type                      | Behavior                                                                 |
|---------------------------|--------------------------------------------------------------------------|
| `AdventureCommandSource`  | Returns the source as-is (it implements `AdventureCommandSource`).       |
| `CommandSender`           | Returns the underlying Bukkit `CommandSender`.                           |
| `ConsoleCommandSender`    | Returns the console sender; throws `ONLY_CONSOLE` if source is a player.|
| `Player`                  | Returns the Bukkit `Player`; throws `ONLY_PLAYER` if source is console.  |

## Custom Exceptions

| Exception Class                  | Trigger                                      |
|----------------------------------|----------------------------------------------|
| `BrigadierUnsupportedException`  | Thrown when Brigadier is not available on the server version. |

## Pre-defined Responses

Held in `BukkitResponseKey`.

| Key                        | Default Message                                                              | Placeholders                                                      |
|----------------------------|------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `ONLY_PLAYER`              | `"Only players can do this!"`                                                | —                                                                 |
| `ONLY_CONSOLE`             | `"Only console can do this!"`                                                | —                                                                 |
| `UNKNOWN_PLAYER`           | `"A player with the name '%input%' doesn't seem to be online"`               | `input`                                                           |
| `UNKNOWN_OFFLINE_PLAYER`   | `"A player with the name '%input%' doesn't seem to exist"`                   | `input`                                                           |
| `UNKNOWN_WORLD`            | `"A world with the name '%input%' doesn't seem to exist"`                    | `input`                                                           |
| `INVALID_LOCATION`         | `"Failed to parse location '%input%' due to: %cause%"`                       | `input`, `inputX`, `inputY`, `inputZ`, `inputYaw`, `inputPitch`, `cause` |
| `INVALID_SELECTOR_FIELD`   | `"Invalid field-criteria format '%criteria_entered%'"`                        | `input`, `criteria_expression`                                    |
| `UNKNOWN_SELECTOR_FIELD`   | `"Unknown selection field '%field_entered%'"`                                 | `input`, `field_entered`                                          |
| `UNKNOWN_SELECTION_TYPE`   | `"Unknown selection type '%type_entered%'"`                                   | `input`, `type_entered`                                           |

