---
title: Platforms
description: Explore the different platforms supported by Imperat
category: Introduction
order: 2
---

# Supported platforms
Imperat supports various platforms as shown in the table below:

| Platform Name            | Compatible Platforms           | Supported Versions           |
|-------------------|-------------------------------|-----------------------------|
| imperat-bukkit    | Bukkit / Spigot / Paper        | 1.8.8 - 1.21.11             |
| imperat-bungee    | BungeeCord / Waterfall         | 1.21-R0.2                   |
| imperat-velocity  | Velocity                      | 3.5.0                       |
| imperat-minestom  | Minestom                      | 1.21.11                     |
| imperat-jda       | JDA (Java Discord API)         | 6.1.1                       |
| imperat-hytale    | Hytale Game                    | 2026.02.18-f3b8fff95        |
| imperat-cli       | Any OS / Console               | Any version                 |


## Platform Differences
The main differences between all platforms is the implementation of `Imperat` that represents the framework on this platform
 along with the Implementation of `CommandSource` that represents the command-sender on this platform.
They are following the naming format: `<platform>Imperat`, Same with the senders/sources : `<platform>CommandSource` (except for CLI)
as shown in the table below:

| Platform Name      | Implementation to Use         | CommandSource (Command Sender)     |
|--------------------|-------------------------------|-----------------------------|
| imperat-bukkit     | `BukkitImperat`               | `BukkitCommandCommandSource`              |
| imperat-bungee     | `BungeeImperat`               | `BungeeCommandSource`              |
| imperat-velocity   | `VelocityImperat`             | `VelocityCommandSource`            |
| imperat-minestom   | `MinestomImperat`             | `MinestomCommandSource`            |
| imperat-jda        | `JDAImperat`                  | `JDACommandSource`                 |
| imperat-hytale     | `HytaleImperat`               | `HytaleCommandSource`              |
| imperat-cli        | `CommandLineImperat`          | `ConsoleCommandSource`             |


### BUKKIT Brigadier Integration

You can integrate Imperat with Mojang's Brigadier for enhanced command features (like suggestions and argument types) on compatible servers (Minecraft 1.13+).
Call the `applyBrigadier(true)` method while configuring your Imperat instance. This method must be the **FIRST** one called in the builder chain:

```java
BukkitImperat imperat = BukkitImperat.builder(this)
    .applyBrigadier(true)
    .build();
```

:::danger{label="READ THIS"}
Do **NOT** register your commands within your plugin's `plugin.yml` file. Imperat handles registration dynamically and internal conflicts may occur if defined in both places.
:::