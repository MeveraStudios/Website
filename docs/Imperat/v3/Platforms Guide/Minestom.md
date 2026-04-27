---
title: "Minestom"
description: "The Minestom platform for Minecraft servers"
order: 4
---

# Minestom

The Minestom module integrates Imperat with Minestom servers. It natively bridges Minestom's built-in argument types into Imperat and supports Adventure components out of the box.

## Constructing

```java
MinestomImperat imperat = MinestomImperat.builder(serverProcess)
    .build();
```

The builder requires a Minestom `ServerProcess` instance.

## Default Argument Types

Minestom comes with a large set of pre-registered argument types, automatically migrated from Minestom's native argument system.

### Primitive / Common Types

| Java Type      | Minestom ArgType             | Description                     |
|----------------|------------------------------|---------------------------------|
| `String`       | `ArgumentType.String`        | A quoted or unquoted string.    |
| `Integer`      | `ArgumentType.Integer`       | An integer number.              |
| `boolean`      | `ArgumentType.Boolean`       | A boolean (`true`/`false`).     |
| `double`       | `ArgumentType.Double`        | A double-precision number.      |
| `float`        | `ArgumentType.Float`         | A float number.                 |
| `long` / `Long`| `ArgumentType.Long`          | A long number.                  |
| `Enum`         | `ArgumentType.Enum`          | Any enum constant by name.      |
| `UUID`         | `ArgumentType.UUID`          | A UUID.                         |

### Minestom-Specific Types

| Java Type             | Minestom ArgType                   | Description                        |
|-----------------------|------------------------------------|------------------------------------|
| `Color`               | `ArgumentType.Color`               | A color value.                     |
| `TimeUnit`            | `ArgumentType.Time`                | A time duration.                   |
| `Particle`            | `ArgumentType.Particle`            | A particle type.                   |
| `Block`               | `ArgumentType.BlockState`          | A block state.                     |
| `ItemStack`           | `ArgumentType.ItemStack`           | An item stack.                     |
| `Component`           | `ArgumentType.Component`           | An Adventure text component.       |
| `Entity`              | `ArgumentType.Entity`              | An entity selector.                |

### Coordinate Types

| Java Type             | Minestom ArgType                   | Description                        |
|-----------------------|------------------------------------|------------------------------------|
| `RelativeVec`         | `ArgumentType.RelativeVec3`        | A relative 3D vector.              |
| `Point`               | `ArgumentType.RelativeBlockPosition`| A block position.                  |

### NBT Types

| Java Type             | Minestom ArgType                   | Description                        |
|-----------------------|------------------------------------|------------------------------------|
| `BinaryTag`           | `ArgumentType.NBT`                 | An NBT tag.                        |
| `CompoundBinaryTag`   | `ArgumentType.NbtCompound`         | An NBT compound tag.               |

### Resource Types

| Java Type             | Minestom ArgType                   | Description                        |
|-----------------------|------------------------------------|------------------------------------|
| `Key`                 | `ArgumentType.ResourceLocation`    | A resource location (namespace:key).|

## Context Argument Providers

| Type                                    | Value Provided                            |
|-----------------------------------------|-------------------------------------------|
| `ExecutionContext<MinestomCommandSource>` | The current execution context.           |
| `CommandHelp<MinestomCommandSource>`     | The command help instance for the current context. |
| `ServerProcess`                         | The Minestom `ServerProcess` instance.    |

## Source Providers

| Type                      | Behavior                                                                   |
|---------------------------|----------------------------------------------------------------------------|
| `CommandSender`           | Returns the underlying Minestom `CommandSender`.                           |
| `AdventureCommandSource`  | Returns the source as-is.                                                  |
| `ConsoleSender`           | Returns the console sender; throws `ONLY_CONSOLE` if source is a player.   |
| `Player`                  | Returns the Minestom `Player`; throws `ONLY_PLAYER` if source is console.  |

## Custom Exceptions

| Exception Class         | Trigger                                                         |
|-------------------------|-----------------------------------------------------------------|
| `UnknownPlayerException`| Thrown when a player name cannot be resolved to an online player.|

The `UnknownPlayerException` handler is registered by default and replies with:  
`"A player with the name '<name>' is not online."`

## Pre-defined Responses

Held in `MinestomResponseKey`.

### Source Restrictions

| Key             | Default Message             |
|-----------------|-----------------------------|
| `ONLY_PLAYER`   | (registered by framework)  |
| `ONLY_CONSOLE`  | (registered by framework)  |

### Player Resolution

| Key              | Default Message             |
|------------------|-----------------------------|
| `UNKNOWN_PLAYER` | (registered by framework)  |

### Type Parsing Errors

Each registered Minestom argument type has a corresponding response key for parse failures.

| Key                        | Default Message                              | Placeholders |
|----------------------------|----------------------------------------------|--------------|
| `INVALID_STRING`           | `"Invalid string '%input%'"`                 | `input`      |
| `INVALID_INTEGER`          | `"Invalid integer '%input%'"`                | `input`      |
| `INVALID_DOUBLE`           | `"Invalid double '%input%'"`                 | `input`      |
| `INVALID_FLOAT`            | `"Invalid float '%input%'"`                  | `input`      |
| `INVALID_LONG`             | `"Invalid long '%input%'"`                   | `input`      |
| `INVALID_COLOR`            | `"Invalid color '%input%'"`                  | `input`      |
| `INVALID_TIME`             | `"Invalid time '%input%'"`                   | `input`      |
| `INVALID_PARTICLE`         | `"Invalid particle '%input%'"`               | `input`      |
| `INVALID_BLOCK_STATE`      | `"Invalid block state '%input%'"`            | `input`      |
| `INVALID_ITEM_STACK`       | `"Invalid item stack '%input%'"`             | `input`      |
| `INVALID_COMPONENT`        | `"Invalid component '%input%'"`              | `input`      |
| `INVALID_ENTITY`           | `"Invalid entity selector '%input%'"`        | `input`      |
| `INVALID_RELATIVE_VEC`     | `"Invalid relative vector '%input%'"`        | `input`      |
| `INVALID_BLOCK_POSITION`   | `"Invalid block position '%input%'"`         | `input`      |
| `INVALID_NBT`              | `"Invalid NBT '%input%'"`                    | `input`      |
| `INVALID_NBT_COMPOUND`     | `"Invalid NBT compound '%input%'"`           | `input`      |
| `INVALID_RESOURCE_LOCATION`| `"Invalid resource location '%input%'"`      | `input`      |

