---
title: Getting Started
description: Starting on Scofi
order: 1
---

Scofi is a modern packet-based high performant scoreboard library
designed to be ensure smooth development experience when creating scoreboards using paper/spigot.

## Installation
Scofi is hosted on **maven-central**, so no need to add any specific repository.



<LatestVersionBlock 
    owner="MeveraStudios" 
    repo="scofi"
    group="studio.mevera" 
    id="scofi" 
/>


## Integrating Scofi
To use scofi, you need to initialize a `Scofi` instance in your `onEnable` method.
Here is a simple example:
```java
public class YourMain extends JavaPlugin {

    private Scofi scofi;

    @Override
    public void onEnable() {
        scofi = Scofi.load(this);
    }
}
```

### Creating boards
You need to create a `BoardAdapter`, now there are 2 types of adapters:
- `LegacyBoardAdapter` for **1.8-1.16.5**
- `ModernBoardAdapter` for **1.17 and above**.

First you need to determine what minecraft-version are you going to depend on,
in order to decide which adapter you're going to use.

Each adapter decides what every part of the scoreboard is based on, for example,
the `LegacyBoardAdapter` decides  that the scoreboard content is based on `String` as its type of contents, while the `ModernBoardAdapter` uses [Kyori's Adventure](https://docs.advntr.dev/) `Component` as the type of contents, that the scoreboard will be based on.

#### LegacyBoardAdapter Example
```java
public class CustomBoard implements LegacyBoardAdapter {
    
    @Override
    public @NotNull Title<String> getTitle(Player player) {
        return Title.legacy()
                .ofText("Scofi");
    }
    
    @Override
    public @NotNull Body<String> getBody(Player player) {
        Body<String> body = Body.legacy();
        body.addLine(
            Line.legacy("&cHi")
                .build()
        );
        
        return body;
    }
    
}
```

As you can see in the example above, the scoreboard adapter has 2 main methods,
which dynamically loads the contents of the scoreboard  you're creating,
The `getTitle(Player)` method loads the `Title` of the scoreboard, while the `Body`
represents the lines of the scoreboard.

:::note
You can create scoreboard titles for `LegacyBoardAdapter` through calling `Title#legacy`
while for `ModernBoardAdapter`, use `Title#adventure`.
You can do exactly the same for creating the `Body`.
:::

### Setting up Scofi
Firstly, let's set the period of the update
:::tip
An update period is the tick interval for the automated update task,
**AFTER** the loading your `Scofi` instance, just call `Scofi#setUpdateInterval(X)`, where the scoreboard will get updated every `X` ticks.
:::

Then we should call `Scofi#startBoardUpdaters` to start running the update task.

```java
public class YourMain extends JavaPlugin {

    private Scofi scofi;

    @Override
    public void onEnable() {
        scofi = Scofi.load(this);
        scofi.setUpdateInterval(4L); //updates all visible scoreboards every 4 ticks
        scofi.startBoardUpdaters(); //schedules the task responsible for updating boards
    }
}
```

### Displaying to players
Firstly, we need to create a listener for `PlayerJoinEvent`, because that's when we should display the scoreboard to the player, when he joins the server.

```java
@EventHandler
public void onJoin(PlayerJoinEvent event) {
    Player player = event.getPlayer();
    scofi.setupNewBoard(player, new CustomBoard());
}
```

and let's not forget to destroy that board when the player quits to prevent any possibility for memory leaks.
```java
@EventHandler
public void onQuit(PlayerQuitEvent event) {
    Player player = event.getPlayer();
    scofi.removeBoard(player);
}
```

:::danger
DO NOT FORGET TO call `Scofi#removeBoard` when the player quits the server,
 which is happens when the `PlayerQuitEvent` gets triggered.
:::

### How it works ?
**General scoreboards concept:** Any scoreboard entity (Whether a title or a line) are either **static** or **dynamic**

:::info
A static scoreboard entity is an entity whose content is fixed (doesn't change on updates), while A dynamic entity is whose content must be loaded on demand everytime, as its content is changeable by time, e.g: A line containing player kills
:::

Scofi uses the methods of the adapter you create, and reloads the title and body on demand
every x tick interval in an automated asynchronous task.
Therefore, you can correctly deduce that Scofi entities are designed to be dynamic by nature.

Now that explains why there's always the `Player` parameter
in the two main methods for the body and the title, they change their contents by time **depending** on the state of the player receiving this scoreboard.

Scofi is packet-based, meaning it uses packets to display scoreboards without worrying
about any overhead that came from using the old plain bukkit api for scoreboards and teams.


