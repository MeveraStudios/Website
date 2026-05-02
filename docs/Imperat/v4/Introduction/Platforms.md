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
The main differences between all platforms are the implementation of `Imperat` that represents the framework on this platform
 along with the Implementation of `CommandSource` that represents the command-sender on this platform.
They are following the naming format: `<platform>Imperat`, Same with the senders/sources : `<platform>CommandSource` (except for CLI)
as shown in the table below:

| Platform Name      | Implementation to Use         | CommandSource (Command Sender)     |
|--------------------|-------------------------------|-----------------------------|
| imperat-bukkit     | `BukkitImperat`               | `BukkitCommandSource`              |
| imperat-bungee     | `BungeeImperat`               | `BungeeCommandSource`              |
| imperat-velocity   | `VelocityImperat`             | `VelocityCommandSource`            |
| imperat-minestom   | `MinestomImperat`             | `MinestomCommandSource`            |
| imperat-jda        | `JDAImperat`                  | `JDACommandSource`                 |
| imperat-hytale     | `HytaleImperat`               | `HytaleCommandSource`              |
| imperat-cli        | `CommandLineImperat`          | `ConsoleCommandSource`             |


### BUKKIT Brigadier Integration

Brigadier integration is **automatic** in v4. The Bukkit backend selects the strongest available registration capability at runtime — modern Paper's lifecycle Brigadier API on supported servers, the legacy Brigadier path through Commodore on older Spigot/Paper builds, and a plain command-map fallback when neither is present. There's no boolean flag to toggle.

```java
BukkitImperat<BukkitCommandSource> imperat = BukkitImperat.builder(this).build();
```

On modern Paper, this gives you Brigadier-backed client-side suggestions, native argument types (`Player`, `OfflinePlayer`, `Location`, target selectors), and rich error highlighting — for free. On legacy backends you get the same Imperat features minus the Brigadier-only client-side bells.

:::danger{label="READ THIS"}
Do **NOT** register your commands within your plugin's `plugin.yml` file. Imperat handles registration dynamically and internal conflicts may occur if defined in both places.
:::