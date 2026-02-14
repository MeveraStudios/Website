---
title: Platforms
description: Explore the different platforms supported by Imperat
category: Introduction
order: 2
---

# Platforms

Imperat is designed to be platform-agnostic at its core, allowing it to run on various environments beyond just Minecraft servers. Below you can find details for each supported platform.

## Bukkit

Implementation for Bukkit-based Minecraft servers such as Spigot and Paper.

- **Imperat Class**: `BukkitImperat`
- **Command Source**: `BukkitSource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-bukkit" 
/>

### Initialization

To initialize Imperat on Bukkit, use the `BukkitImperat.builder()` method, passing your plugin instance.

```java
BukkitImperat imperat = BukkitImperat.builder(this)
    .build();
```

### Brigadier Integration

You can integrate Imperat with Mojang's Brigadier for enhanced command features (like suggestions and argument types) on compatible servers (Minecraft 1.13+).
Call the `applyBrigadier(true)` method while configuring your Imperat instance. This method must be the **FIRST** one called in the builder chain:

```java
BukkitImperat imperat = BukkitImperat.builder(this)
    .applyBrigadier(true)
    .build();
```

:::danger[Important]
Do **NOT** register your commands within your plugin's `plugin.yml` file. Imperat handles registration dynamically and internal conflicts may occur if defined in both places.
:::

## BungeeCord

Implementation for BungeeCord Minecraft proxies.

- **Imperat Class**: `BungeeImperat`
- **Command Source**: `BungeeSource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-bungee" 
/>

### Initialization

To initialize Imperat on BungeeCord, use the `BungeeImperat.builder()` method, passing your plugin instance.

```java
BungeeImperat imperat = BungeeImperat.builder(this)
    .build();
```

## Velocity

Implementation for modern Velocity Minecraft proxies.

- **Imperat Class**: `VelocityImperat`
- **Command Source**: `VelocitySource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-velocity" 
/>

### Initialization

To initialize Imperat on Velocity, use the `VelocityImperat.builder()` method, passing your plugin instance and the proxy server.

```java
VelocityImperat imperat = VelocityImperat.builder(plugin, proxy)
    .build();
```

## Minestom

Implementation for Minestom, a 100% open-source Minecraft server implementation without any Mojang code.

- **Imperat Class**: `MinestomImperat`
- **Command Source**: `MinestomSource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-minestom" 
/>

### Initialization

To initialize Imperat on Minestom, use the `MinestomImperat.builder()` method.

```java
MinestomImperat imperat = MinestomImperat.builder()
    .build();
```

## JDA (Discord)

Implementation for Discord bots using the Java Discord API (JDA). This module allows you to create rich Discord command systems using Imperat's annotation-based API.

- **Imperat Class**: `JDAImperat`
- **Command Source**: `JDASource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-jda" 
/>

### Initialization

To initialize Imperat for JDA, use the `JDAImperat.builder()` method, passing your JDA instance.

```java
JDAImperat imperat = JDAImperat.builder(jda)
    .build();
```

## Hytale

Implementation for Hytale servers, bringing powerful command management to the next generation of block-based games.

- **Imperat Class**: `HytaleImperat`
- **Command Source**: `HytaleSource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-hytale" 
/>

### Initialization

To initialize Imperat on Hytale, use the `HytaleImperat.builder()` method, passing your plugin instance.

```java
HytaleImperat imperat = HytaleImperat.builder(this)
    .build();
```

:::tip
Its strongly advised to treat the imperat instance as a field in your main class.
:::

## CLI (Command Line Interface)

Implementation for standalone console applications. This module provides a basic loop to read input from the console and dispatch commands.

- **Imperat Class**: `CommandLineImperat`
- **Command Source**: `ConsoleSource`

### Installation

<LatestVersionBlock 
  owner="MeveraStudios" 
  repo="Imperat" 
  group="studio.mevera" 
  id="imperat-cli" 
/>

### Initialization

To initialize Imperat for a CLI application, use the `CommandLineImperat.builder()` method.

```java
CommandLineImperat imperat = CommandLineImperat.builder()
    .build();
```
