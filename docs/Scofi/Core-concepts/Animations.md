---
title: Animations
description: Animations are a sequence of changes that happen to a scoreboard entity
order: 2
---

# Animations
Animations are a sequence of changes that happens to a scoreboard entity, 
the entity could be a title or even a line (from the body).

There are 2 types of built-in animations:
- Scrolling
- Highlighting

:::caution
Scrolling and Highlighting were designed to be available ONLY for Legacy users.
They will arrive soon to be available for adventure/modern users.
:::

## Scrolling animation
You can easily set an entity to move and animate an infinite-like cycle of a text-scroll.
Scrolling has 2 main options, the `width` and the `spaceBetween`.

The `width`: Specifies how many characters of the text are visible at once during the scroll animation. It determines the "window" size of the scrolling text.

The `spaceBetween`: Defines the number of spaces inserted between repetitions of the scrolling text, creating a gap before the text starts scrolling again.

Here's an example
```java
public class CustomBoard implements LegacyBoardAdapter {
    
    @Override
    public @NotNull Title<String> getTitle(Player player) {
        return Title.legacy()
                .ofText("&9&lScofi");
    }
    
    @Override
    public @NotNull Body<String> getBody(Player player) {
        Body<String> body = Body.legacy();
        body.addLine("&7&m----------------");
        body.addLine(
                Line.legacy("&eHello world !")
                        .withScroll(25, 2)
                        .build()
        );
        body.addLine("&aThis is a simple board");
        body.addLine("&7&m----------------");
        return body;
    }
    
}
```

This will be displayed in-game as the following:

<img src="../../assets/scofi-scroll.gif" alt="Scofi-scroll" width="250" />

:::note[NOTICE]
You can also create lines without the need of creating a `Line` object,
but this will only create a line with no animations, to have animations you must use
`Line#legacy` to build the line object manually while including options like scroll animations or any other animations.
:::


## Highlighting animation
Highlighting is simple, A letter is highlighted, letter by letter and it keeps going on.
There are 2 options for this, the `primary-highlight-color` and the `secondary-highlight-color`

`primary-highlight-color`: The default color at which the letter goes back to when
it finishes getting highlighted (went onto the next letter).
It resembles the default/fallback color of the content itself.

`secondary-highlight-color`: The color that the letters are highlighted by during the animation itself.

Here's a simple example:
```java
@Override
public @NotNull Body<String> getBody(Player player) {
    Body<String> body = Body.legacy();
    body.addLine("&7&m----------------");
    body.addLine(
            Line.legacy("Hello world !")
                    .withHighlight("&6", "&e")
                    .build()
    );
    body.addLine("&aThis is a simple board");
    body.addLine("&7&m----------------");
    return body;
}
```

This will be displayed in-game as the following:
<img src="../../assets/scofi-highlight.gif" alt="Scofi-highlight" width="250" />


## Custom animations
Custom animations can be easily created by defining a list of changes representing 
the frames for the animations.
Here's an example:
```java
public class CustomBoard implements LegacyBoardAdapter {
    
    @Override
    public @NotNull Title<String> getTitle(Player player) {
        return Title.legacy()
                .withAnimation("&dScofi &7| &fA lib", //original content of title
                        "&dScofi ",
                        "&5Scofi ",
                        "&dScofi ",
                        
                        // Type-in: "The #1 Lib"
                        "&dScofi &fT",
                        "&dScofi &fTh",
                        "&dScofi &fThe",
                        "&dScofi &fThe &6#",
                        "&dScofi &fThe &6#1",
                        "&dScofi &fThe &6#1 &aL",
                        "&dScofi &fThe &6#1 &aLi",
                        "&dScofi &fThe &6#1 &aLib",
                        
                        // Hold the full message briefly
                        "&dScofi &fThe &6#1 &aLib",
                        "&dScofi &fThe &6#1 &aLib",
                        
                        // Backspace out
                        "&dScofi &fThe &6#1 &aLi",
                        "&dScofi &fThe &6#1 &aL",
                        "&dScofi &fThe &6#1",
                        "&dScofi &fThe &6#",
                        "&dScofi &fThe",
                        "&dScofi &fTh",
                        "&dScofi &fT",
                        "&dScofi ",
                        
                        // Outro pulse
                        "&5Scofi ",
                        "&dScofi "
                );
    }
    
    @Override
    public @NotNull Body<String> getBody(Player player) {
        Body<String> body = Body.legacy();
        body.addLine("&7&m----------------");
        body.addLine(
                Line.legacy("Hello world !")
                        .withHighlight("&6", "&e")
                        .build()
        );
        body.addLine("&aThis is a simple board");
        body.addLine("&7&m----------------");
        return body;
    }
    
}
```       
   
The example above should create a nice looking animation for the title
In-game it should look like the following:

<img src="../../assets/scofi-custom.gif" alt="Scofi-custom" width="250" />

:::info
1- Custom animations can be created for both the modern and the legacy scoreboards.

2- When Creating a title, its either a title with text **OR** with animation and **NOT** both.
:::
