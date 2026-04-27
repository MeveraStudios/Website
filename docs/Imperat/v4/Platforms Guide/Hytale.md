---
title: "Hytale"
description: "The platform for Hytale"
order: 5
---

# Hytale

The Hytale module integrates Imperat with Hytale dedicated servers. It bridges Hytale's native argument types into Imperat and supports a large set of game-specific types.

## Constructing

```java
HytaleImperat imperat = HytaleImperat.builder(plugin)
    .build();
```

The builder requires a Hytale `JavaPlugin` instance.

## Platform-Specific Annotations

| Annotation              | Target          | Description                                                     |
|-------------------------|-----------------|-----------------------------------------------------------------|
| `@RequireConfirmation`  | Type or Method  | Requires the user to confirm the action before command execution.|

## Default Argument Types

### Core Types

| Java Type      | Description                                  |
|----------------|----------------------------------------------|
| `PlayerRef`    | Resolves a player reference by name.         |
| `World`        | Resolves a world by name.                    |
| `Location`     | Parses a Hytale location.                    |

### Coordinate Types

| Java Type               | Hytale ArgType                 | Description                       |
|-------------------------|--------------------------------|-----------------------------------|
| `Coord`                 | `ArgTypes.RELATIVE_DOUBLE_COORD`| A relative double coordinate.    |
| `IntCoord`              | `ArgTypes.RELATIVE_INT_COORD`  | A relative integer coordinate.    |
| `RelativeInteger`       | `ArgTypes.RELATIVE_INTEGER`    | A relative integer value.         |
| `RelativeFloat`         | `ArgTypes.RELATIVE_FLOAT`      | A relative float value.           |

### Vector Types

| Java Type               | Hytale ArgType                 | Description                       |
|-------------------------|--------------------------------|-----------------------------------|
| `Vector2i`              | `ArgTypes.VECTOR2I`            | A 2D integer vector.              |
| `Vector3i`              | `ArgTypes.VECTOR3I`            | A 3D integer vector.              |
| `RelativeVector3i`      | `ArgTypes.RELATIVE_VECTOR3I`   | A relative 3D integer vector.     |

### Position Types

| Java Type                | Hytale ArgType                    | Description                     |
|--------------------------|-----------------------------------|---------------------------------|
| `RelativeIntPosition`    | `ArgTypes.RELATIVE_BLOCK_POSITION`| A relative block position.      |
| `RelativeDoublePosition` | `ArgTypes.RELATIVE_POSITION`      | A relative double position.     |
| `RelativeChunkPosition`  | `ArgTypes.RELATIVE_CHUNK_POSITION`| A relative chunk position.      |
| `Vector3f`               | `ArgTypes.ROTATION`               | A rotation (pitch/yaw/roll).    |

### Asset Types

| Java Type               | Hytale ArgType                    | Description                     |
|-------------------------|-----------------------------------|---------------------------------|
| `ModelAsset`            | `ArgTypes.MODEL_ASSET`            | A model asset.                  |
| `Weather`               | `ArgTypes.WEATHER_ASSET`          | A weather asset.                |
| `Interaction`           | `ArgTypes.INTERACTION_ASSET`      | An interaction asset.           |
| `RootInteraction`       | `ArgTypes.ROOT_INTERACTION_ASSET` | A root interaction asset.       |
| `EntityEffect`          | `ArgTypes.EFFECT_ASSET`           | An entity effect asset.         |
| `Environment`           | `ArgTypes.ENVIRONMENT_ASSET`      | An environment asset.           |
| `Item`                  | `ArgTypes.ITEM_ASSET`             | An item asset.                  |
| `BlockType`             | `ArgTypes.BLOCK_TYPE_ASSET`       | A block type asset.             |
| `ParticleSystem`        | `ArgTypes.PARTICLE_SYSTEM`        | A particle system.              |
| `HitboxCollisionConfig` | `ArgTypes.HITBOX_COLLISION_CONFIG` | A hitbox collision config.     |
| `RepulsionConfig`       | `ArgTypes.REPULSION_CONFIG`       | A repulsion config.             |
| `SoundEvent`            | `ArgTypes.SOUND_EVENT_ASSET`      | A sound event asset.            |
| `AmbienceFX`            | `ArgTypes.AMBIENCE_FX_ASSET`      | An ambience FX asset.           |

### Enum / Game Types

| Java Type               | Hytale ArgType                          | Description                  |
|-------------------------|-----------------------------------------|------------------------------|
| `SoundCategory`         | `ArgTypes.SOUND_CATEGORY`               | A sound category.            |
| `GameMode`              | `ArgTypes.GAME_MODE`                    | A game mode.                 |

### Selection Types

| Java Type               | Hytale ArgType                          | Description                  |
|-------------------------|-----------------------------------------|------------------------------|
| `BlockMask`             | `ArgTypes.BLOCK_MASK`                   | A block mask.                |
| `BlockPattern`          | `ArgTypes.BLOCK_PATTERN`                | A block pattern.             |

### Operator Types

| Java Type                          | Hytale ArgType                         | Description                       |
|------------------------------------|----------------------------------------|-----------------------------------|
| `ArgTypes.IntegerComparisonOperator`| `ArgTypes.INTEGER_COMPARISON_OPERATOR` | An integer comparison operator.   |
| `ArgTypes.IntegerOperation`        | `ArgTypes.INTEGER_OPERATION`           | An integer operation.             |

## Context Argument Providers

| Type                                   | Value Provided                                     |
|----------------------------------------|----------------------------------------------------|
| `ExecutionContext<HytaleCommandSource>` | The current execution context.                     |
| `CommandHelp<HytaleCommandSource>`     | The command help instance for the current context. |
| `JavaPlugin`                           | The plugin instance passed to the builder.         |

## Source Providers

| Type             | Behavior                                                                 |
|------------------|--------------------------------------------------------------------------|
| `CommandSender`  | Returns the underlying Hytale `CommandSender`.                           |
| `ConsoleSender`  | Returns the console sender; throws `ONLY_CONSOLE` if source is a player. |
| `Player`         | Returns the Hytale `Player`; throws `ONLY_PLAYER` if source is console.  |
| `PlayerRef`      | Returns the `PlayerRef` for the source; throws `ONLY_PLAYER` if console. |

## Custom Exceptions

| Exception Class                 | Trigger                                                   |
|---------------------------------|-----------------------------------------------------------|
| `UnknownPlayerException`        | Thrown when a player name cannot be resolved.             |
| `UnknownWorldException`         | Thrown when a world name cannot be resolved.              |
| `InvalidLocationFormatException`| Thrown when a location string fails to parse.             |

## Pre-defined Responses

Held in `HytaleResponseKey`.

### Source Restrictions

| Key            | Default Message                    |
|----------------|------------------------------------|
| `ONLY_PLAYER`  | `"Only players can do this!"`      |
| `ONLY_CONSOLE` | `"Only console can do this!"`      |

### Entity / World Resolution

| Key              | Default Message                                                   | Placeholders        |
|------------------|-------------------------------------------------------------------|---------------------|
| `UNKNOWN_PLAYER` | `"Player '%input%' not found"`                                    | `input`             |
| `UNKNOWN_WORLD`  | `"World '%input%' not found"`                                     | `input`             |
| `INVALID_LOCATION`| `"Failed to parse location '%input%' due to: %message%"`         | `input`, `message`  |

### Coordinate Parsing Errors

| Key                              | Default Message                                      | Placeholders |
|----------------------------------|------------------------------------------------------|--------------|
| `INVALID_RELATIVE_DOUBLE_COORD`  | `"Invalid relative double coordinate: '%input%'"`    | `input`      |
| `INVALID_RELATIVE_INT_COORD`     | `"Invalid relative integer coordinate: '%input%'"`   | `input`      |
| `INVALID_RELATIVE_INTEGER`       | `"Invalid relative integer: '%input%'"`              | `input`      |
| `INVALID_RELATIVE_FLOAT`         | `"Invalid relative float: '%input%'"`                | `input`      |

### Vector Parsing Errors

| Key                          | Default Message                              | Placeholders |
|------------------------------|----------------------------------------------|--------------|
| `INVALID_VECTOR2I`           | `"Invalid 2D vector: '%input%'"`             | `input`      |
| `INVALID_VECTOR3I`           | `"Invalid 3D vector: '%input%'"`             | `input`      |
| `INVALID_RELATIVE_VECTOR3I`  | `"Invalid relative 3D vector: '%input%'"`    | `input`      |

### Position Parsing Errors

| Key                               | Default Message                                  | Placeholders |
|-----------------------------------|--------------------------------------------------|--------------|
| `INVALID_RELATIVE_BLOCK_POSITION` | `"Invalid relative block position: '%input%'"`   | `input`      |
| `INVALID_RELATIVE_POSITION`       | `"Invalid relative position: '%input%'"`         | `input`      |
| `INVALID_RELATIVE_CHUNK_POSITION` | `"Invalid relative chunk position: '%input%'"`   | `input`      |

### Rotation Parsing Errors

| Key                 | Default Message                        | Placeholders |
|---------------------|----------------------------------------|--------------|
| `INVALID_ROTATION`  | `"Invalid rotation: '%input%'"`        | `input`      |

### Asset Parsing Errors

| Key                              | Default Message                                  | Placeholders |
|----------------------------------|--------------------------------------------------|--------------|
| `INVALID_MODEL_ASSET`            | `"Invalid model asset: '%input%'"`               | `input`      |
| `INVALID_WEATHER_ASSET`          | `"Invalid weather asset: '%input%'"`             | `input`      |
| `INVALID_INTERACTION_ASSET`      | `"Invalid interaction asset: '%input%'"`         | `input`      |
| `INVALID_ROOT_INTERACTION_ASSET` | `"Invalid root interaction asset: '%input%'"`    | `input`      |
| `INVALID_EFFECT_ASSET`           | `"Invalid effect asset: '%input%'"`              | `input`      |
| `INVALID_ENVIRONMENT_ASSET`      | `"Invalid environment asset: '%input%'"`         | `input`      |
| `INVALID_ITEM_ASSET`             | `"Invalid item asset: '%input%'"`                | `input`      |
| `INVALID_BLOCK_TYPE_ASSET`       | `"Invalid block type asset: '%input%'"`          | `input`      |
| `INVALID_PARTICLE_SYSTEM`        | `"Invalid particle system: '%input%'"`           | `input`      |
| `INVALID_HITBOX_COLLISION_CONFIG` | `"Invalid hitbox collision config: '%input%'"`  | `input`      |
| `INVALID_REPULSION_CONFIG`       | `"Invalid repulsion config: '%input%'"`          | `input`      |
| `INVALID_SOUND_EVENT_ASSET`      | `"Invalid sound event asset: '%input%'"`         | `input`      |
| `INVALID_AMBIENCE_FX_ASSET`      | `"Invalid ambience FX asset: '%input%'"`         | `input`      |

### Enum Parsing Errors

| Key                      | Default Message                              | Placeholders |
|--------------------------|----------------------------------------------|--------------|
| `INVALID_SOUND_CATEGORY` | `"Invalid sound category: '%input%'"`        | `input`      |
| `INVALID_GAME_MODE`      | `"Invalid game mode: '%input%'"`             | `input`      |

### Selection Parsing Errors

| Key                      | Default Message                              | Placeholders |
|--------------------------|----------------------------------------------|--------------|
| `INVALID_BLOCK_MASK`     | `"Invalid block mask: '%input%'"`            | `input`      |
| `INVALID_BLOCK_PATTERN`  | `"Invalid block pattern: '%input%'"`         | `input`      |

### Operator Parsing Errors

| Key                                  | Default Message                                        | Placeholders |
|--------------------------------------|--------------------------------------------------------|--------------|
| `INVALID_INTEGER_COMPARISON_OPERATOR`| `"Invalid integer comparison operator: '%input%'"`     | `input`      |
| `INVALID_INTEGER_OPERATION`          | `"Invalid integer operation: '%input%'"`               | `input`      |

